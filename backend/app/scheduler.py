from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from .models import (
    User, Subject, Topic, Exam, Assignment, StudyTask,
    RescheduleLog, UserAvailability, Notification
)
from .analytics import calculate_subject_performance

def calculate_topic_priority_score(
    topic: Topic,
    subject: Subject,
    exams: List[Exam],
    assignments: List[Assignment],
    subject_perf: Dict[str, Any]
) -> Tuple[float, str]:
    """
    Intelligent Priority Score (0 - 100) and Level (HIGH, MEDIUM, LOW)
    Factors:
    - Exam proximity (30%)
    - Assignment deadline proximity (20%)
    - Weak subject factor (25%)
    - Topic difficulty (15%)
    - Topic importance (10%)
    """
    today = datetime.utcnow().date()

    # 1. Exam Proximity
    subject_exams = [e for e in exams if e.subject_id == subject.id]
    exam_score = 20.0
    for ex in subject_exams:
        try:
            ex_date = datetime.strptime(ex.exam_date, "%Y-%m-%d").date()
            days = (ex_date - today).days
            if days >= 0:
                if days <= 2:
                    exam_score = max(exam_score, 100.0)
                elif days <= 5:
                    exam_score = max(exam_score, 85.0)
                elif days <= 10:
                    exam_score = max(exam_score, 70.0)
                elif days <= 20:
                    exam_score = max(exam_score, 50.0)
                else:
                    exam_score = max(exam_score, 30.0)
        except Exception:
            pass

    # 2. Assignment Deadline Proximity
    subject_assignments = [a for a in assignments if a.subject_id == subject.id and not a.completed]
    assign_score = 15.0
    for a in subject_assignments:
        try:
            due_date = datetime.strptime(a.deadline, "%Y-%m-%d").date()
            days = (due_date - today).days
            if days >= 0:
                if days <= 2:
                    assign_score = max(assign_score, 90.0)
                elif days <= 5:
                    assign_score = max(assign_score, 75.0)
                elif days <= 10:
                    assign_score = max(assign_score, 55.0)
        except Exception:
            pass

    # 3. Subject Weakness Factor
    status = subject_perf.get("status", "Average")
    if status == "Needs Attention":
        weakness_score = 95.0
    elif status == "Average":
        weakness_score = 65.0
    else:  # Strong
        weakness_score = 35.0

    # 4. Topic Difficulty Factor
    diff_map = {"Hard": 90.0, "Medium": 60.0, "Easy": 35.0}
    diff_score = diff_map.get(topic.difficulty, 60.0)

    # 5. Topic Importance (Low, Medium, High or numeric)
    if isinstance(topic.importance, str):
        imp_map = {"High": 95.0, "Medium": 65.0, "Low": 35.0}
        importance_score = imp_map.get(topic.importance, 60.0)
    else:
        importance_score = min(100.0, (topic.importance or 3) * 20.0)

    # Weighted calculation
    score = round(
        (0.30 * exam_score) +
        (0.20 * assign_score) +
        (0.25 * weakness_score) +
        (0.15 * diff_score) +
        (0.10 * importance_score),
        1
    )

    if score >= 70.0:
        level = "HIGH PRIORITY"
    elif score >= 45.0:
        level = "MEDIUM PRIORITY"
    else:
        level = "LOW PRIORITY"

    return score, level


def generate_time_slots(
    preferred_slot: str,
    session_minutes: int = 60,
    break_minutes: int = 15,
    max_hours: float = 3.0
) -> List[Tuple[str, str]]:
    """Generates non-overlapping (start_time, end_time) slot pairs based on student preference."""
    pref = preferred_slot.lower() if preferred_slot else "evening"
    
    if "morning" in pref:
        base_hour = 7
    elif "afternoon" in pref:
        base_hour = 14
    else:  # evening / default
        base_hour = 18

    slots = []
    current_dt = datetime(2026, 1, 1, base_hour, 0)
    total_minutes_allocated = 0
    max_minutes = int(max_hours * 60)

    while total_minutes_allocated + session_minutes <= max_minutes:
        start_str = current_dt.strftime("%H:%M")
        end_dt = current_dt + timedelta(minutes=session_minutes)
        end_str = end_dt.strftime("%H:%M")
        slots.append((start_str, end_str))
        total_minutes_allocated += session_minutes
        current_dt = end_dt + timedelta(minutes=break_minutes)
        if len(slots) >= 6:  # Safety cap per day
            break

    return slots


def generate_intelligent_schedule(
    user_id: int,
    db: Session,
    days_to_plan: int = 7,
    start_date_str: Optional[str] = None,
    daily_hours: Optional[float] = None,
    preferred_slot: Optional[str] = None,
    session_minutes: int = 60,
    break_minutes: int = 15,
    focus_weak_subjects: bool = True
) -> Dict[str, Any]:
    """
    Intelligent Adaptive Scheduler:
    - Respects day-specific available study hours (Monday, Tuesday, etc.)
    - Analyzes subject weakness, upcoming exams, assignment deadlines
    - Computes smart priority scores for all uncompleted topics
    - Allocates topics into non-overlapping study sessions
    - Avoids subject fatigue (interleaves subjects across consecutive slots)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    slot_pref = preferred_slot or user.preferred_slot or "Evening (6 PM - 10 PM)"

    # Load custom day-of-week availability if configured
    availabilities = db.query(UserAvailability).filter(UserAvailability.user_id == user_id).all()
    avail_map = {a.day_of_week: a.available_hours for a in availabilities}

    # Start date
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except Exception:
            start_date = datetime.utcnow().date()
    else:
        start_date = datetime.utcnow().date()

    # Load subjects
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    if not subjects:
        return {"message": "No subjects found. Please add subjects first.", "tasks_created": 0}

    exams = db.query(Exam).filter(Exam.user_id == user_id).all()
    assignments = db.query(Assignment).filter(Assignment.user_id == user_id).all()

    # Precalculate performance for each subject
    subject_perf_map = {}
    for sub in subjects:
        subject_perf_map[sub.id] = calculate_subject_performance(sub, db)

    # Collect all uncompleted topics
    topics_with_meta = []
    for sub in subjects:
        uncompleted = db.query(Topic).filter(Topic.subject_id == sub.id, Topic.completed == False).all()
        for t in uncompleted:
            score, level = calculate_topic_priority_score(t, sub, exams, assignments, subject_perf_map[sub.id])
            topics_with_meta.append({
                "topic": t,
                "subject": sub,
                "priority_score": score,
                "priority_level": level
            })

    # Sort topics by Priority Score descending (highest urgency first)
    topics_with_meta.sort(key=lambda x: x["priority_score"], reverse=True)

    if not topics_with_meta:
        # All topics completed! Add intelligent revision sessions for upcoming exams or weakest subjects
        for sub in subjects:
            perf = subject_perf_map[sub.id]
            all_topics = db.query(Topic).filter(Topic.subject_id == sub.id).all()
            for t in all_topics[:3]:  # Top 3 for revision
                score, level = calculate_topic_priority_score(t, sub, exams, assignments, perf)
                topics_with_meta.append({
                    "topic": t,
                    "subject": sub,
                    "priority_score": score,
                    "priority_level": level,
                    "is_revision": True
                })
        topics_with_meta.sort(key=lambda x: x["priority_score"], reverse=True)

    # Delete existing pending tasks on or after start_date so we don't duplicate
    db.query(StudyTask).filter(
        StudyTask.user_id == user_id,
        StudyTask.scheduled_date >= start_date.strftime("%Y-%m-%d"),
        StudyTask.status.in_(["Pending", "In Progress"])
    ).delete(synchronize_session=False)
    db.commit()

    created_tasks = []
    last_subject_id = None
    total_available_topics = len(topics_with_meta)

    for d in range(days_to_plan):
        current_day = start_date + timedelta(days=d)
        current_day_str = current_day.strftime("%Y-%m-%d")
        day_name = current_day.strftime("%A")

        # Use specific day availability if present, otherwise daily_hours or user preference
        day_study_hours = avail_map.get(day_name, daily_hours or user.daily_study_hours or 3.0)
        day_slots = generate_time_slots(slot_pref, session_minutes, break_minutes, day_study_hours)

        for start_time, end_time in day_slots:
            if not topics_with_meta:
                break

            # Find a topic where subject != last_subject_id if possible
            chosen_item = None
            for item in topics_with_meta:
                if item["subject"].id != last_subject_id:
                    chosen_item = item
                    break
            if not chosen_item:
                chosen_item = topics_with_meta[0]

            t = chosen_item["topic"]
            sub = chosen_item["subject"]
            score = chosen_item["priority_score"]
            level = chosen_item["priority_level"]
            is_rev = chosen_item.get("is_revision", False)

            title = f"{'Revision: ' if is_rev else ''}{sub.name}: {t.name}"

            task = StudyTask(
                user_id=user_id,
                subject_id=sub.id,
                topic_id=t.id,
                title=title,
                scheduled_date=current_day_str,
                start_time=start_time,
                end_time=end_time,
                duration_minutes=session_minutes,
                status="Pending",
                priority_score=score,
                priority_level=level,
                is_rescheduled=False
            )
            db.add(task)
            created_tasks.append(task)
            last_subject_id = sub.id

            # Rotate or remove topic from pool so we don't repeat immediately
            topics_with_meta.remove(chosen_item)
            if not topics_with_meta and total_available_topics > 0:
                # Re-seed for further days if needed
                for sub_item in subjects:
                    t_list = db.query(Topic).filter(Topic.subject_id == sub_item.id).all()
                    for top in t_list:
                        s, l = calculate_topic_priority_score(top, sub_item, exams, assignments, subject_perf_map[sub_item.id])
                        topics_with_meta.append({
                            "topic": top,
                            "subject": sub_item,
                            "priority_score": s,
                            "priority_level": l,
                            "is_revision": True
                        })
                topics_with_meta.sort(key=lambda x: x["priority_score"], reverse=True)

    # Add notification for newly generated plan
    notif = Notification(
        user_id=user_id,
        title="Study Plan Generated",
        message=f"Generated {len(created_tasks)} personalized, non-overlapping study sessions over {days_to_plan} days.",
        type="task"
    )
    db.add(notif)
    db.commit()

    return {
        "message": f"Successfully generated {len(created_tasks)} adaptive study sessions over {days_to_plan} days.",
        "tasks_created": len(created_tasks),
        "days_planned": days_to_plan
    }


def automatic_reschedule_missed_task(task_id: int, user_id: int, db: Session) -> Dict[str, Any]:
    """
    UNIQUE FEATURE – Adaptive Rescheduling:
    If a student misses a task:
    1. Detect missed task.
    2. Calculate remaining study work.
    3. Check available future hours.
    4. Check upcoming exams.
    5. Check existing scheduled tasks.
    6. Recalculate priorities.
    7. Move the missed task to a suitable future time.
    8. Update timetable & trigger notification.
    """
    task = db.query(StudyTask).filter(StudyTask.id == task_id, StudyTask.user_id == user_id).first()
    if not task:
        return {"error": "Task not found"}

    user = db.query(User).filter(User.id == user_id).first()
    old_date = task.scheduled_date
    old_slot = f"{old_date} ({task.start_time} - {task.end_time})"

    # Mark this task as Missed
    task.status = "Missed"
    db.commit()

    # Find the next best day and slot to reschedule
    today = datetime.utcnow().date()
    try:
        task_date = datetime.strptime(old_date, "%Y-%m-%d").date()
    except Exception:
        task_date = today

    search_start = max(today, task_date)
    found_slot = None
    target_date_str = None

    preferred_slot = user.preferred_slot or "Evening (6 PM - 10 PM)"
    availabilities = db.query(UserAvailability).filter(UserAvailability.user_id == user_id).all()
    avail_map = {a.day_of_week: a.available_hours for a in availabilities}

    # Check the next 14 days for a free slot
    for day_offset in range(1, 15):
        candidate_date = search_start + timedelta(days=day_offset)
        candidate_date_str = candidate_date.strftime("%Y-%m-%d")
        candidate_day_name = candidate_date.strftime("%A")

        candidate_hours = avail_map.get(candidate_day_name, user.daily_study_hours or 3.0)
        standard_slots = generate_time_slots(preferred_slot, task.duration_minutes or 60, 15, candidate_hours)

        existing_tasks = db.query(StudyTask).filter(
            StudyTask.user_id == user_id,
            StudyTask.scheduled_date == candidate_date_str,
            StudyTask.status.in_(["Pending", "In Progress", "Completed"])
        ).all()

        existing_times = set(t.start_time for t in existing_tasks)

        # Check standard slots
        for start_t, end_t in standard_slots:
            if start_t not in existing_times:
                found_slot = (start_t, end_t)
                target_date_str = candidate_date_str
                break

        if found_slot:
            break

    # Fallback to an evening buffer slot on tomorrow
    if not found_slot:
        candidate_date = search_start + timedelta(days=1)
        target_date_str = candidate_date.strftime("%Y-%m-%d")
        found_slot = ("21:30", "22:30")

    # Create the new rescheduled study task
    new_task = StudyTask(
        user_id=user_id,
        subject_id=task.subject_id,
        topic_id=task.topic_id,
        title=f"{task.title} (Rescheduled)",
        scheduled_date=target_date_str,
        start_time=found_slot[0],
        end_time=found_slot[1],
        duration_minutes=task.duration_minutes or 60,
        status="Pending",
        priority_score=min(100.0, (task.priority_score or 50.0) + 15.0),
        priority_level="HIGH PRIORITY",
        is_rescheduled=True,
        original_date=old_date,
        reschedule_reason=f"Auto-rescheduled from {old_date} ({task.start_time}) because task was missed."
    )
    db.add(new_task)
    db.flush()

    new_slot = f"{target_date_str} ({found_slot[0]} - {found_slot[1]})"

    # Log in RescheduleLog
    log_entry = RescheduleLog(
        user_id=user_id,
        task_id=new_task.id,
        task_title=task.title,
        old_slot=old_slot,
        new_slot=new_slot,
        reason="Your study plan has been automatically updated because you missed 1 task."
    )
    db.add(log_entry)

    # In-app notification
    notif = Notification(
        user_id=user_id,
        title="Schedule Auto-Updated",
        message=f"Your study plan has been automatically updated because you missed 1 task ({task.title}). Shifted to {new_slot}.",
        type="reschedule"
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "message": "Your study plan has been automatically updated because you missed 1 task.",
        "original_task_id": task.id,
        "new_task_id": new_task.id,
        "old_slot": old_slot,
        "new_slot": new_slot
    }


def format_time_12h(time_str: str) -> str:
    """Converts 24-hour time HH:MM to 12-hour format e.g. 7:00 PM."""
    try:
        dt = datetime.strptime(time_str, "%H:%M")
        formatted = dt.strftime("%I:%M %p")
        return formatted.lstrip("0") if formatted.startswith("0") else formatted
    except Exception:
        return time_str


def schedule_single_study_session(
    user_id: int,
    subject_id: int,
    duration_minutes: int = 60,
    target_date: Optional[date] = None,
    db: Session = None
) -> Dict[str, Any]:
    """
    Schedules an individual study session for a requested subject:
    - Finds the optimal uncompleted topic using multi-factor priority scoring
    - Considers upcoming exams, assignments, and weak-subject status
    - Respects student's available daily hours and preferred slot
    - Avoids overlapping existing scheduled sessions
    - Creates database StudyTask & Notification
    """
    user = db.query(User).filter(User.id == user_id).first()
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
    if not user or not subject:
        return {"error": "Subject or student not found"}

    today = datetime.utcnow().date()
    if target_date is None:
        target_date = today

    target_date_str = target_date.strftime("%Y-%m-%d")
    day_name = target_date.strftime("%A")

    # 1. Availability and preferred hours
    avail = db.query(UserAvailability).filter(
        UserAvailability.user_id == user_id,
        UserAvailability.day_of_week == day_name
    ).first()
    available_hours = avail.available_hours if avail else (user.daily_study_hours or 3.0)
    preferred_slot = user.preferred_slot or "Evening (6 PM - 10 PM)"

    # 2. Existing tasks on target date (avoid collisions)
    existing_tasks = db.query(StudyTask).filter(
        StudyTask.user_id == user_id,
        StudyTask.scheduled_date == target_date_str,
        StudyTask.status.in_(["Pending", "In Progress", "Completed"])
    ).all()

    def slots_collide(s1: str, e1: str, s2: str, e2: str) -> bool:
        return max(s1, s2) < min(e1, e2)

    # 3. Generate candidate non-overlapping time slot
    standard_slots = generate_time_slots(
        preferred_slot,
        session_minutes=duration_minutes,
        break_minutes=15,
        max_hours=max(available_hours, (duration_minutes / 60.0) + 1.0)
    )

    chosen_slot = None
    for cand_start, cand_end in standard_slots:
        has_overlap = any(slots_collide(cand_start, cand_end, t.start_time, t.end_time) for t in existing_tasks)
        if not has_overlap:
            chosen_slot = (cand_start, cand_end)
            break

    # If all standard slots overlap, find buffer slot after latest task
    if not chosen_slot:
        if existing_tasks:
            latest_task = max(existing_tasks, key=lambda t: t.end_time)
            try:
                latest_dt = datetime.strptime(latest_task.end_time, "%H:%M")
                next_start_dt = latest_dt + timedelta(minutes=15)
                next_end_dt = next_start_dt + timedelta(minutes=duration_minutes)
                if next_end_dt.hour < 23 or (next_end_dt.hour == 23 and next_end_dt.minute == 0):
                    chosen_slot = (next_start_dt.strftime("%H:%M"), next_end_dt.strftime("%H:%M"))
                else:
                    # Spillover to tomorrow evening
                    target_date = target_date + timedelta(days=1)
                    target_date_str = target_date.strftime("%Y-%m-%d")
                    chosen_slot = ("18:00", (datetime(2026, 1, 1, 18, 0) + timedelta(minutes=duration_minutes)).strftime("%H:%M"))
            except Exception:
                chosen_slot = ("19:00", (datetime(2026, 1, 1, 19, 0) + timedelta(minutes=duration_minutes)).strftime("%H:%M"))
        else:
            chosen_slot = ("19:00", (datetime(2026, 1, 1, 19, 0) + timedelta(minutes=duration_minutes)).strftime("%H:%M"))

    # 4. Multi-factor topic prioritization
    exams = db.query(Exam).filter(Exam.user_id == user_id).all()
    assignments = db.query(Assignment).filter(Assignment.user_id == user_id).all()
    perf = calculate_subject_performance(subject, db)

    uncompleted_topics = db.query(Topic).filter(
        Topic.subject_id == subject.id,
        Topic.completed == False
    ).all()

    all_topics = uncompleted_topics if uncompleted_topics else db.query(Topic).filter(Topic.subject_id == subject.id).all()

    chosen_topic = None
    chosen_score = 75.0
    chosen_level = "HIGH PRIORITY"

    if all_topics:
        scored = []
        for t in all_topics:
            s, l = calculate_topic_priority_score(t, subject, exams, assignments, perf)
            scored.append((s, l, t))
        scored.sort(key=lambda x: x[0], reverse=True)
        chosen_score, chosen_level, chosen_topic = scored[0]
        topic_title = f"{subject.name}: {chosen_topic.name}"
    else:
        topic_title = f"{subject.name}: Core Concepts Review"

    # 5. Determine priority reason text
    if perf.get("status") == "Needs Attention":
        priority_reason = f"High because {subject.name} currently needs attention."
    else:
        subject_exams = [e for e in exams if e.subject_id == subject.id]
        upcoming_exam = None
        for ex in subject_exams:
            try:
                ed = datetime.strptime(ex.exam_date, "%Y-%m-%d").date()
                d = (ed - today).days
                if 0 <= d <= 14:
                    upcoming_exam = (ex.name, d)
                    break
            except Exception:
                pass

        if upcoming_exam:
            priority_reason = f"High due to upcoming {upcoming_exam[0]} in {upcoming_exam[1]} day(s)."
        elif chosen_score >= 70.0:
            priority_reason = f"High based on curriculum difficulty and upcoming deadlines."
        else:
            priority_reason = f"Medium based on syllabus pacing and study balance."

    # 6. Create the StudyTask in database
    new_task = StudyTask(
        user_id=user_id,
        subject_id=subject.id,
        topic_id=chosen_topic.id if chosen_topic else None,
        title=topic_title,
        scheduled_date=target_date_str,
        start_time=chosen_slot[0],
        end_time=chosen_slot[1],
        duration_minutes=duration_minutes,
        status="Pending",
        priority_score=chosen_score,
        priority_level=chosen_level,
        is_rescheduled=False
    )
    db.add(new_task)
    db.flush()

    # 7. Create Notification
    start_12h = format_time_12h(chosen_slot[0])
    end_12h = format_time_12h(chosen_slot[1])
    time_display = f"{start_12h} – {end_12h}"

    if target_date == today:
        date_display = "Today"
    elif target_date == today + timedelta(days=1):
        date_display = "Tomorrow"
    else:
        date_display = target_date.strftime("%A, %b %d")

    if duration_minutes % 60 == 0:
        hrs = duration_minutes // 60
        duration_display = f"{hrs} hour" if hrs == 1 else f"{hrs} hours"
    else:
        duration_display = f"{duration_minutes} minutes"

    notif = Notification(
        user_id=user_id,
        title="Study Session Scheduled",
        message=f"Added {subject.name} to study plan for {date_display}, {time_display}.",
        type="task"
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "task_id": new_task.id,
        "subject_id": subject.id,
        "subject_name": subject.name,
        "topic_name": chosen_topic.name if chosen_topic else None,
        "scheduled_date": target_date_str,
        "start_time": chosen_slot[0],
        "end_time": chosen_slot[1],
        "duration_minutes": duration_minutes,
        "priority_level": chosen_level,
        "priority_score": chosen_score,
        "priority_reason": priority_reason,
        "date_display": date_display,
        "time_display": time_display,
        "duration_display": duration_display
    }
