import os
from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from .database import engine, Base, get_db
from .models import (
    User, Subject, Topic, Exam, Assignment, StudyTask,
    RescheduleLog, UserAvailability, Note, DailyGoal, Notification
)
from .schemas import (
    UserCreate, UserLogin, UserUpdate, UserOut, Token,
    SubjectCreate, SubjectUpdate, SubjectOut, SubjectPerformanceOut,
    TopicCreate, TopicUpdate, TopicOut,
    ExamCreate, ExamUpdate, ExamOut,
    AssignmentCreate, AssignmentUpdate, AssignmentOut,
    StudyTaskOut, TaskStatusUpdate, PlanGenerateRequest,
    RescheduleLogOut, DashboardOverview,
    ChatRequest, ChatResponse, QuizResponse,
    AvailabilityItem, AvailabilityUpdate,
    NoteOut, DailyGoalCreate, DailyGoalOut, NotificationOut
)
from .auth import (
    hash_password, verify_password, create_access_token,
    get_current_user
)
from .analytics import (
    calculate_subject_performance, get_all_subjects_performance,
    calculate_study_streak
)
from .scheduler import (
    calculate_topic_priority_score, generate_intelligent_schedule,
    automatic_reschedule_missed_task
)
from .assistant import (
    generate_ai_chat_response, get_quiz_questions,
    get_intelligent_revision_suggestions
)
from .rag import extract_text_from_file
from .seed_data import seed_demo_data

# Ensure uploads directory
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Intelligent Study Planner & Progress Tracker API",
    description="Full-stack academic study planning, RAG notes, weak subject detection, and adaptive rescheduling",
    version="2.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_demo_data(db, force_reset=False)
    finally:
        db.close()


# ============================================================================
# 1. AUTHENTICATION & PROFILE
# ============================================================================

@app.post("/api/auth/register", response_model=Token)
@app.post("/auth/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        college=user_in.college or "Engineering Institute",
        major=user_in.major or "Computer Science",
        daily_study_hours=user_in.daily_study_hours or 3.0,
        preferred_slot=user_in.preferred_slot or "Evening (6 PM - 10 PM)",
        study_streak=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Seed default availability
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for d in days:
        db.add(UserAvailability(user_id=new_user.id, day_of_week=d, available_hours=new_user.daily_study_hours))
    db.commit()

    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


@app.post("/api/auth/login", response_model=Token)
@app.post("/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # ── DEMO MODE ────────────────────────────────────────────────────────────
    # Any non-empty email + non-empty password is accepted.
    # If the account doesn't exist it is created automatically so the student
    # can explore the app without a separate registration step.
    # -----------------------------------------------------------------
    if not login_data.email or not login_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    user = db.query(User).filter(User.email == login_data.email).first()

    if not user:
        # Auto-register: derive a display name from the email local-part
        local_part = login_data.email.split("@")[0]
        display_name = local_part.replace(".", " ").replace("_", " ").title()

        user = User(
            name=display_name,
            email=login_data.email,
            hashed_password=hash_password(login_data.password),
            college="Engineering Institute",
            major="Computer Science & Engineering",
            daily_study_hours=3.0,
            preferred_slot="Evening (6 PM - 10 PM)",
            study_streak=0,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Seed default weekly availability for the new user
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        for d in days:
            db.add(UserAvailability(user_id=user.id, day_of_week=d, available_hours=user.daily_study_hours))
        db.commit()
    # ── END DEMO MODE ─────────────────────────────────────────────────────────

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@app.get("/api/auth/me", response_model=UserOut)
@app.get("/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.put("/api/auth/profile", response_model=UserOut)
def update_profile(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.name is not None:
        current_user.name = data.name
    if data.college is not None:
        current_user.college = data.college
    if data.major is not None:
        current_user.major = data.major
    if data.daily_study_hours is not None:
        current_user.daily_study_hours = data.daily_study_hours
    if data.preferred_slot is not None:
        current_user.preferred_slot = data.preferred_slot

    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/api/auth/demo-seed")
def seed_demo(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = seed_demo_data(db, force_reset=True)
    return {"message": "Demo academic curriculum seeded successfully!", "user_email": user.email}


# ============================================================================
# 2. DASHBOARD OVERVIEW & DAILY GOALS
# ============================================================================

@app.get("/api/dashboard/overview")
def get_dashboard_overview(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    # Today's tasks
    today_tasks_query = db.query(StudyTask).filter(
        StudyTask.user_id == current_user.id,
        StudyTask.scheduled_date == today_str
    ).order_by(StudyTask.start_time.asc()).all()

    today_tasks_total = len(today_tasks_query)
    today_tasks_completed = sum(1 for t in today_tasks_query if t.status == "Completed")
    today_tasks_pending = sum(1 for t in today_tasks_query if t.status in ["Pending", "In Progress"])
    today_tasks_missed = sum(1 for t in today_tasks_query if t.status == "Missed")

    # Study hours today
    planned_minutes = sum(t.duration_minutes for t in today_tasks_query)
    completed_minutes = sum(t.duration_minutes for t in today_tasks_query if t.status == "Completed")

    # Overall topics progress
    all_user_subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    total_user_topics = 0
    completed_user_topics = 0
    for s in all_user_subjects:
        for top in s.topics:
            total_user_topics += 1
            if top.completed:
                completed_user_topics += 1

    overall_progress = round((completed_user_topics / total_user_topics * 100), 1) if total_user_topics > 0 else 0.0

    # Nearest upcoming exam
    today = datetime.utcnow().date()
    exams = db.query(Exam).filter(Exam.user_id == current_user.id).all()
    upcoming_exam_obj = None
    min_days_exam = 9999
    for ex in exams:
        try:
            ex_d = datetime.strptime(ex.exam_date, "%Y-%m-%d").date()
            diff = (ex_d - today).days
            if diff >= 0 and diff < min_days_exam:
                min_days_exam = diff
                sub = db.query(Subject).filter(Subject.id == ex.subject_id).first()
                upcoming_exam_obj = {
                    "id": ex.id,
                    "subject_id": ex.subject_id,
                    "subject_name": sub.name if sub else "",
                    "subject_color": sub.color if sub else "#4f46e5",
                    "name": ex.name,
                    "exam_date": ex.exam_date,
                    "days_remaining": diff,
                    "syllabus": ex.syllabus,
                    "weight_percentage": ex.weight_percentage,
                    "notes": ex.notes,
                    "created_at": ex.created_at
                }
        except Exception:
            pass

    # Nearest upcoming assignment
    assignments = db.query(Assignment).filter(
        Assignment.user_id == current_user.id,
        Assignment.completed == False
    ).all()
    upcoming_assign_obj = None
    min_days_assign = 9999
    for a in assignments:
        try:
            a_d = datetime.strptime(a.deadline, "%Y-%m-%d").date()
            diff = (a_d - today).days
            if diff >= 0 and diff < min_days_assign:
                min_days_assign = diff
                sub = db.query(Subject).filter(Subject.id == a.subject_id).first()
                upcoming_assign_obj = {
                    "id": a.id,
                    "subject_id": a.subject_id,
                    "subject_name": sub.name if sub else "",
                    "subject_color": sub.color if sub else "#4f46e5",
                    "title": a.title,
                    "deadline": a.deadline,
                    "priority": a.priority,
                    "status": a.status,
                    "completed": a.completed,
                    "days_remaining": diff,
                    "created_at": a.created_at
                }
        except Exception:
            pass

    # Weakest subject
    performances = get_all_subjects_performance(current_user.id, db)
    weakest_subject = performances[0] if performances else None

    # Reschedule logs / recent alerts
    recent_reschedules = db.query(RescheduleLog).filter(
        RescheduleLog.user_id == current_user.id
    ).order_by(RescheduleLog.created_at.desc()).limit(5).all()

    alert_message = None
    if recent_reschedules:
        alert_message = f"Your study plan has been automatically updated because you missed {len(recent_reschedules)} task(s)."

    # Format today's tasks
    formatted_today_tasks = []
    for t in today_tasks_query:
        sub = db.query(Subject).filter(Subject.id == t.subject_id).first()
        top = db.query(Topic).filter(Topic.id == t.topic_id).first() if t.topic_id else None
        formatted_today_tasks.append({
            "id": t.id,
            "user_id": t.user_id,
            "subject_id": t.subject_id,
            "topic_id": t.topic_id,
            "title": t.title,
            "scheduled_date": t.scheduled_date,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "duration_minutes": t.duration_minutes,
            "status": t.status,
            "priority_level": t.priority_level or "MEDIUM",
            "priority_score": t.priority_score,
            "is_rescheduled": t.is_rescheduled,
            "original_date": t.original_date,
            "reschedule_reason": t.reschedule_reason,
            "subject_name": sub.name if sub else "",
            "subject_color": sub.color if sub else "#4f46e5",
            "topic_name": top.name if top else "",
            "difficulty": top.difficulty if top else "Medium"
        })

    # Unread notifications
    unread_notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    # Daily goals
    today_goals = db.query(DailyGoal).filter(
        DailyGoal.user_id == current_user.id,
        DailyGoal.target_date == today_str
    ).all()

    streak = calculate_study_streak(current_user, db)

    return {
        "user": current_user,
        "today_study_hours_planned": round(planned_minutes / 60.0, 1),
        "today_study_hours_completed": round(completed_minutes / 60.0, 1),
        "today_tasks_total": today_tasks_total,
        "today_tasks_completed": today_tasks_completed,
        "today_tasks_pending": today_tasks_pending,
        "today_tasks_missed": today_tasks_missed,
        "overall_progress_percentage": overall_progress,
        "study_streak": streak,
        "upcoming_exam": upcoming_exam_obj,
        "upcoming_assignment": upcoming_assign_obj,
        "weakest_subject": weakest_subject,
        "recent_reschedule_alert": alert_message,
        "recent_reschedule_count": len(recent_reschedules),
        "today_tasks": formatted_today_tasks,
        "unread_notifications_count": unread_notifs,
        "today_goals": today_goals
    }


# ============================================================================
# 3. SUBJECTS & TOPICS MANAGEMENT
# ============================================================================

@app.get("/api/subjects")
@app.get("/subjects")
def get_subjects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    results = []
    for s in subjects:
        perf = calculate_subject_performance(s, db)
        results.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "description": s.description,
            "color": s.color,
            "icon": s.icon,
            "created_at": s.created_at,
            "performance": perf,
            "topics": [
                {
                    "id": t.id,
                    "subject_id": t.subject_id,
                    "name": t.name,
                    "difficulty": t.difficulty,
                    "importance": t.importance,
                    "status": t.status,
                    "estimated_minutes": t.estimated_minutes,
                    "completed": t.completed,
                    "notes": t.notes,
                    "created_at": t.created_at
                }
                for t in s.topics
            ]
        })
    return results


@app.post("/api/subjects", response_model=SubjectOut)
@app.post("/subjects", response_model=SubjectOut)
def create_subject(data: SubjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = Subject(
        user_id=current_user.id,
        name=data.name,
        code=data.code or data.name[:4].upper(),
        description=data.description or "",
        color=data.color or "#4f46e5",
        icon=data.icon or "book"
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@app.put("/api/subjects/{subject_id}", response_model=SubjectOut)
@app.put("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, data: SubjectUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")

    if data.name is not None:
        sub.name = data.name
    if data.code is not None:
        sub.code = data.code
    if data.description is not None:
        sub.description = data.description
    if data.color is not None:
        sub.color = data.color
    if data.icon is not None:
        sub.icon = data.icon

    db.commit()
    db.refresh(sub)
    return sub


@app.delete("/api/subjects/{subject_id}")
@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(sub)
    db.commit()
    return {"message": "Subject and all associated topics deleted successfully"}


@app.get("/api/topics", response_model=List[TopicOut])
@app.get("/topics", response_model=List[TopicOut])
def get_all_topics(subject_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Topic).join(Subject).filter(Subject.user_id == current_user.id)
    if subject_id:
        query = query.filter(Topic.subject_id == subject_id)
    return query.all()


@app.post("/api/subjects/{subject_id}/topics", response_model=TopicOut)
@app.post("/api/topics", response_model=TopicOut)
@app.post("/topics", response_model=TopicOut)
def create_topic(data: TopicCreate, subject_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_sub_id = subject_id or getattr(data, 'subject_id', None)
    if not target_sub_id:
        # Fallback to first subject
        sub = db.query(Subject).filter(Subject.user_id == current_user.id).first()
        target_sub_id = sub.id if sub else None

    if not target_sub_id:
        raise HTTPException(status_code=400, detail="Please create a subject before adding topics.")

    topic = Topic(
        subject_id=target_sub_id,
        name=data.name,
        difficulty=data.difficulty or "Medium",
        importance=data.importance or "Medium",
        status=data.status or "Not Started",
        estimated_minutes=data.estimated_minutes or 60,
        completed=data.completed or False,
        notes=data.notes
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@app.put("/api/topics/{topic_id}", response_model=TopicOut)
@app.put("/topics/{topic_id}", response_model=TopicOut)
def update_topic(topic_id: int, data: TopicUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    topic = db.query(Topic).join(Subject).filter(Topic.id == topic_id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if data.name is not None:
        topic.name = data.name
    if data.difficulty is not None:
        topic.difficulty = data.difficulty
    if data.importance is not None:
        topic.importance = data.importance
    if data.status is not None:
        topic.status = data.status
        topic.completed = (data.status == "Completed")
    if data.estimated_minutes is not None:
        topic.estimated_minutes = data.estimated_minutes
    if data.completed is not None:
        topic.completed = data.completed
        topic.status = "Completed" if data.completed else "In Progress"
    if data.notes is not None:
        topic.notes = data.notes

    db.commit()
    db.refresh(topic)
    return topic


@app.patch("/api/topics/{topic_id}/toggle-complete")
def toggle_topic_complete(topic_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    topic = db.query(Topic).join(Subject).filter(Topic.id == topic_id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.completed = not topic.completed
    topic.status = "Completed" if topic.completed else "In Progress"
    db.commit()
    return {"id": topic.id, "completed": topic.completed, "status": topic.status}


@app.delete("/api/topics/{topic_id}")
@app.delete("/topics/{topic_id}")
def delete_topic(topic_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    topic = db.query(Topic).join(Subject).filter(Topic.id == topic_id, Subject.user_id == current_user.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted successfully"}


# ============================================================================
# 4. EXAMS & ASSIGNMENTS
# ============================================================================

@app.get("/api/exams")
@app.get("/exams")
def get_exams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    exams = db.query(Exam).filter(Exam.user_id == current_user.id).all()
    results = []
    for ex in exams:
        sub = db.query(Subject).filter(Subject.id == ex.subject_id).first()
        try:
            ex_date = datetime.strptime(ex.exam_date, "%Y-%m-%d").date()
            diff = (ex_date - today).days
        except Exception:
            diff = 0
        results.append({
            "id": ex.id,
            "subject_id": ex.subject_id,
            "subject_name": sub.name if sub else "",
            "subject_color": sub.color if sub else "#4f46e5",
            "name": ex.name,
            "exam_date": ex.exam_date,
            "days_remaining": diff,
            "syllabus": ex.syllabus,
            "weight_percentage": ex.weight_percentage,
            "notes": ex.notes,
            "created_at": ex.created_at
        })
    results.sort(key=lambda x: x["days_remaining"])
    return results


@app.post("/api/exams", response_model=ExamOut)
@app.post("/exams", response_model=ExamOut)
def create_exam(data: ExamCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exam = Exam(
        user_id=current_user.id,
        subject_id=data.subject_id,
        name=data.name,
        exam_date=data.exam_date,
        syllabus=data.syllabus,
        weight_percentage=data.weight_percentage or 40,
        notes=data.notes
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    sub = db.query(Subject).filter(Subject.id == exam.subject_id).first()
    today = datetime.utcnow().date()
    try:
        diff = (datetime.strptime(exam.exam_date, "%Y-%m-%d").date() - today).days
    except Exception:
        diff = 0

    return {
        "id": exam.id,
        "user_id": exam.user_id,
        "subject_id": exam.subject_id,
        "subject_name": sub.name if sub else "",
        "subject_color": sub.color if sub else "#4f46e5",
        "name": exam.name,
        "exam_date": exam.exam_date,
        "days_remaining": diff,
        "syllabus": exam.syllabus,
        "weight_percentage": exam.weight_percentage,
        "notes": exam.notes,
        "created_at": exam.created_at
    }


@app.put("/api/exams/{exam_id}", response_model=ExamOut)
@app.put("/exams/{exam_id}", response_model=ExamOut)
def update_exam(exam_id: int, data: ExamUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if data.name is not None:
        exam.name = data.name
    if data.exam_date is not None:
        exam.exam_date = data.exam_date
    if data.syllabus is not None:
        exam.syllabus = data.syllabus
    if data.weight_percentage is not None:
        exam.weight_percentage = data.weight_percentage
    if data.notes is not None:
        exam.notes = data.notes

    db.commit()
    db.refresh(exam)

    sub = db.query(Subject).filter(Subject.id == exam.subject_id).first()
    today = datetime.utcnow().date()
    diff = (datetime.strptime(exam.exam_date, "%Y-%m-%d").date() - today).days

    return {
        "id": exam.id,
        "user_id": exam.user_id,
        "subject_id": exam.subject_id,
        "subject_name": sub.name if sub else "",
        "subject_color": sub.color if sub else "#4f46e5",
        "name": exam.name,
        "exam_date": exam.exam_date,
        "days_remaining": diff,
        "syllabus": exam.syllabus,
        "weight_percentage": exam.weight_percentage,
        "notes": exam.notes,
        "created_at": exam.created_at
    }


@app.delete("/api/exams/{exam_id}")
@app.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}


@app.get("/api/assignments")
@app.get("/assignments")
def get_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id).all()
    results = []
    for a in assignments:
        sub = db.query(Subject).filter(Subject.id == a.subject_id).first()
        try:
            due_date = datetime.strptime(a.deadline, "%Y-%m-%d").date()
            diff = (due_date - today).days
        except Exception:
            diff = 0
        results.append({
            "id": a.id,
            "subject_id": a.subject_id,
            "subject_name": sub.name if sub else "",
            "subject_color": sub.color if sub else "#4f46e5",
            "title": a.title,
            "deadline": a.deadline,
            "priority": a.priority,
            "status": a.status or ("Completed" if a.completed else "Pending"),
            "completed": a.completed,
            "days_remaining": diff,
            "created_at": a.created_at
        })
    results.sort(key=lambda x: (x["completed"], x["days_remaining"]))
    return results


@app.post("/api/assignments", response_model=AssignmentOut)
@app.post("/assignments", response_model=AssignmentOut)
def create_assignment(data: AssignmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = Assignment(
        user_id=current_user.id,
        subject_id=data.subject_id,
        title=data.title,
        deadline=data.deadline,
        priority=data.priority or "HIGH",
        status=data.status or "Pending",
        completed=data.completed or False
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    sub = db.query(Subject).filter(Subject.id == assignment.subject_id).first()
    today = datetime.utcnow().date()
    diff = (datetime.strptime(assignment.deadline, "%Y-%m-%d").date() - today).days

    return {
        "id": assignment.id,
        "user_id": assignment.user_id,
        "subject_id": assignment.subject_id,
        "subject_name": sub.name if sub else "",
        "subject_color": sub.color if sub else "#4f46e5",
        "title": assignment.title,
        "deadline": assignment.deadline,
        "priority": assignment.priority,
        "status": assignment.status,
        "completed": assignment.completed,
        "days_remaining": diff,
        "created_at": assignment.created_at
    }


@app.put("/api/assignments/{assignment_id}", response_model=AssignmentOut)
@app.put("/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(assignment_id: int, data: AssignmentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assign = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if data.title is not None:
        assign.title = data.title
    if data.deadline is not None:
        assign.deadline = data.deadline
    if data.priority is not None:
        assign.priority = data.priority
    if data.status is not None:
        assign.status = data.status
        assign.completed = (data.status == "Completed")
    if data.completed is not None:
        assign.completed = data.completed
        assign.status = "Completed" if data.completed else "Pending"

    db.commit()
    db.refresh(assign)

    sub = db.query(Subject).filter(Subject.id == assign.subject_id).first()
    today = datetime.utcnow().date()
    diff = (datetime.strptime(assign.deadline, "%Y-%m-%d").date() - today).days

    return {
        "id": assign.id,
        "user_id": assign.user_id,
        "subject_id": assign.subject_id,
        "subject_name": sub.name if sub else "",
        "subject_color": sub.color if sub else "#4f46e5",
        "title": assign.title,
        "deadline": assign.deadline,
        "priority": assign.priority,
        "status": assign.status,
        "completed": assign.completed,
        "days_remaining": diff,
        "created_at": assign.created_at
    }


@app.patch("/api/assignments/{assignment_id}/toggle-complete")
def toggle_assignment(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assign = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assign.completed = not assign.completed
    assign.status = "Completed" if assign.completed else "Pending"
    db.commit()
    return {"id": assign.id, "completed": assign.completed, "status": assign.status}


@app.delete("/api/assignments/{assignment_id}")
@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assign = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assign)
    db.commit()
    return {"message": "Assignment deleted successfully"}


# ============================================================================
# 5. USER AVAILABILITY (STUDY HOURS PER DAY OF WEEK)
# ============================================================================

@app.get("/api/availability")
def get_availability(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(UserAvailability).filter(UserAvailability.user_id == current_user.id).all()
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    if not records:
        # Initialize default days
        for d in days:
            db.add(UserAvailability(user_id=current_user.id, day_of_week=d, available_hours=current_user.daily_study_hours or 3.0))
        db.commit()
        records = db.query(UserAvailability).filter(UserAvailability.user_id == current_user.id).all()

    return [{"day_of_week": r.day_of_week, "available_hours": r.available_hours} for r in records]


@app.put("/api/availability")
def update_availability(data: AvailabilityUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for item in data.availability:
        rec = db.query(UserAvailability).filter(
            UserAvailability.user_id == current_user.id,
            UserAvailability.day_of_week == item.day_of_week
        ).first()
        if rec:
            rec.available_hours = item.available_hours
        else:
            db.add(UserAvailability(user_id=current_user.id, day_of_week=item.day_of_week, available_hours=item.available_hours))
    db.commit()
    return {"message": "Weekly study availability updated successfully"}


# ============================================================================
# 6. STUDY PLANNER & TASKS (ADAPTIVE SCHEDULING)
# ============================================================================

@app.post("/api/study-plan/generate")
@app.post("/api/planner/generate")
def generate_study_plan(
    req: PlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = generate_intelligent_schedule(
        user_id=current_user.id,
        db=db,
        days_to_plan=req.days_to_plan,
        start_date_str=req.start_date,
        daily_hours=req.daily_hours,
        preferred_slot=req.preferred_slot,
        session_minutes=req.session_duration_minutes,
        break_minutes=req.break_duration_minutes,
        focus_weak_subjects=req.focus_weak_subjects
    )
    return res


@app.get("/api/study-plan")
def get_study_plan(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(StudyTask).filter(
        StudyTask.user_id == current_user.id
    ).order_by(StudyTask.scheduled_date.asc(), StudyTask.start_time.asc()).all()
    return tasks


@app.post("/api/study-plan/reschedule")
def reschedule_study_plan(
    task_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = automatic_reschedule_missed_task(task_id, current_user.id, db)
    return result


@app.get("/api/tasks")
@app.get("/tasks")
def get_study_tasks(
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudyTask).filter(StudyTask.user_id == current_user.id)
    if date:
        query = query.filter(StudyTask.scheduled_date == date)
    elif start_date and end_date:
        query = query.filter(StudyTask.scheduled_date >= start_date, StudyTask.scheduled_date <= end_date)

    tasks = query.order_by(StudyTask.scheduled_date.asc(), StudyTask.start_time.asc()).all()
    results = []
    for t in tasks:
        sub = db.query(Subject).filter(Subject.id == t.subject_id).first()
        top = db.query(Topic).filter(Topic.id == t.topic_id).first() if t.topic_id else None
        results.append({
            "id": t.id,
            "user_id": t.user_id,
            "subject_id": t.subject_id,
            "topic_id": t.topic_id,
            "title": t.title,
            "scheduled_date": t.scheduled_date,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "duration_minutes": t.duration_minutes,
            "status": t.status,
            "priority_level": t.priority_level or "MEDIUM",
            "priority_score": t.priority_score,
            "is_rescheduled": t.is_rescheduled,
            "original_date": t.original_date,
            "reschedule_reason": t.reschedule_reason,
            "subject_name": sub.name if sub else "",
            "subject_color": sub.color if sub else "#4f46e5",
            "topic_name": top.name if top else "",
            "difficulty": top.difficulty if top else "Medium"
        })
    return results


@app.put("/api/tasks/{task_id}/complete")
@app.put("/tasks/{task_id}/complete")
def complete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(StudyTask).filter(StudyTask.id == task_id, StudyTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "Completed"
    task.completed_at = datetime.utcnow()
    if task.topic_id:
        topic = db.query(Topic).filter(Topic.id == task.topic_id).first()
        if topic:
            topic.completed = True
            topic.status = "Completed"

    current_user.last_active_date = datetime.utcnow().strftime("%Y-%m-%d")
    current_user.study_streak = (current_user.study_streak or 0) + 1
    db.commit()
    return {"status": "success", "task_id": task.id, "new_status": "Completed", "streak": current_user.study_streak}


@app.put("/api/tasks/{task_id}/miss")
@app.put("/tasks/{task_id}/miss")
@app.post("/api/tasks/{task_id}/reschedule-missed")
def miss_and_reschedule_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = automatic_reschedule_missed_task(task_id, current_user.id, db)
    return result


@app.patch("/api/tasks/{task_id}/status")
def update_task_status(task_id: int, data: TaskStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.status == "Completed":
        return complete_task(task_id, current_user, db)
    elif data.status == "Missed":
        return miss_and_reschedule_task(task_id, current_user, db)
    
    task = db.query(StudyTask).filter(StudyTask.id == task_id, StudyTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = data.status
    db.commit()
    return {"status": "success", "task_id": task.id, "new_status": data.status}


@app.get("/api/tasks/reschedule-logs", response_model=List[RescheduleLogOut])
def get_reschedule_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(RescheduleLog).filter(
        RescheduleLog.user_id == current_user.id
    ).order_by(RescheduleLog.created_at.desc()).all()
    return logs


# ============================================================================
# 7. PROGRESS & ANALYTICS
# ============================================================================

@app.get("/api/progress")
@app.get("/progress")
@app.get("/api/analytics")
@app.get("/analytics")
@app.get("/api/analytics/overview")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    performances = get_all_subjects_performance(current_user.id, db)

    strong_count = sum(1 for p in performances if p["status"] == "Strong")
    avg_count = sum(1 for p in performances if p["status"] == "Average")
    attention_count = sum(1 for p in performances if p["status"] == "Needs Attention")

    all_tasks = db.query(StudyTask).filter(StudyTask.user_id == current_user.id).all()
    completed_count = sum(1 for t in all_tasks if t.status == "Completed")
    pending_count = sum(1 for t in all_tasks if t.status in ["Pending", "In Progress"])
    missed_count = sum(1 for t in all_tasks if t.status == "Missed")
    rescheduled_count = sum(1 for t in all_tasks if t.is_rescheduled)

    today = datetime.utcnow().date()
    daily_history = []
    for i in range(6, -1, -1):
        day_d = today - timedelta(days=i)
        day_str = day_d.strftime("%Y-%m-%d")
        day_tasks = [t for t in all_tasks if t.scheduled_date == day_str and t.status == "Completed"]
        total_mins = sum(t.duration_minutes for t in day_tasks)
        daily_history.append({
            "date": day_str,
            "day": day_d.strftime("%a"),
            "hours": round(total_mins / 60.0, 1),
            "tasks_completed": len(day_tasks)
        })

    subject_hours = []
    for p in performances:
        s_tasks = [t for t in all_tasks if t.subject_id == p["id"]]
        planned_h = sum(t.duration_minutes for t in s_tasks) / 60.0
        comp_h = sum(t.duration_minutes for t in s_tasks if t.status == "Completed") / 60.0
        subject_hours.append({
            "name": p["name"],
            "code": p["code"],
            "color": p["color"],
            "planned_hours": round(planned_h, 1),
            "completed_hours": round(comp_h, 1),
            "score": p["performance_score"],
            "status": p["status"]
        })

    return {
        "subjects_performance": performances,
        "status_distribution": [
            {"name": "Strong", "value": strong_count, "color": "#10b981"},
            {"name": "Average", "value": avg_count, "color": "#f59e0b"},
            {"name": "Needs Attention", "value": attention_count, "color": "#ef4444"}
        ],
        "task_completion_distribution": [
            {"name": "Completed", "value": completed_count, "color": "#10b981"},
            {"name": "Pending", "value": pending_count, "color": "#6366f1"},
            {"name": "Missed", "value": missed_count, "color": "#ef4444"},
            {"name": "Rescheduled", "value": rescheduled_count, "color": "#ec4899"}
        ],
        "daily_study_history": daily_history,
        "subject_hours": subject_hours,
        "current_streak": calculate_study_streak(current_user, db),
        "total_tasks_tracked": len(all_tasks)
    }


# ============================================================================
# 8. NOTES UPLOAD & RAG PIPELINE
# ============================================================================

@app.post("/api/notes/upload")
@app.post("/notes/upload")
async def upload_note(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    subject_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    # Secure file save
    safe_filename = f"{current_user.id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Extract text using RAG engine
    extracted_text = extract_text_from_file(file_path, file.filename)

    note = Note(
        user_id=current_user.id,
        subject_id=subject_id,
        title=title or file.filename,
        filename=file.filename,
        file_path=file_path,
        file_size_bytes=len(contents),
        extracted_text=extracted_text
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "title": note.title,
        "filename": note.filename,
        "file_size_bytes": note.file_size_bytes,
        "extracted_chars": len(extracted_text),
        "message": "Note uploaded and indexed for AI Assistant RAG successfully!"
    }


@app.get("/api/notes")
@app.get("/notes")
def get_notes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.created_at.desc()).all()
    results = []
    for n in notes:
        results.append({
            "id": n.id,
            "user_id": n.user_id,
            "subject_id": n.subject_id,
            "title": n.title,
            "filename": n.filename,
            "file_size_bytes": n.file_size_bytes,
            "extracted_text_preview": (n.extracted_text[:200] + "...") if n.extracted_text else "",
            "created_at": n.created_at
        })
    return results


@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        if os.path.exists(note.file_path):
            os.remove(note.file_path)
    except Exception:
        pass

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}


# ============================================================================
# 9. AI STUDY ASSISTANT & REVISION
# ============================================================================

@app.post("/api/ai/chat", response_model=ChatResponse)
@app.post("/api/assistant/chat", response_model=ChatResponse)
@app.post("/ai/chat", response_model=ChatResponse)
def ai_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msgs = [{"role": m.role, "content": m.content} for m in req.messages]
    response = generate_ai_chat_response(msgs, current_user.id, db)
    return response


@app.get("/api/ai/quiz", response_model=QuizResponse)
@app.get("/api/assistant/quiz", response_model=QuizResponse)
def get_quiz(
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = get_quiz_questions(subject)
    return data


@app.get("/api/ai/revision-suggestions")
@app.get("/api/assistant/revision-suggestions")
def get_revision_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    suggestions = get_intelligent_revision_suggestions(current_user.id, db)
    return suggestions


# ============================================================================
# 10. DAILY GOALS & IN-APP NOTIFICATIONS
# ============================================================================

@app.get("/api/daily-goals", response_model=List[DailyGoalOut])
def get_daily_goals(date: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_d = date or datetime.utcnow().strftime("%Y-%m-%d")
    goals = db.query(DailyGoal).filter(
        DailyGoal.user_id == current_user.id,
        DailyGoal.target_date == target_d
    ).all()
    return goals


@app.post("/api/daily-goals", response_model=DailyGoalOut)
def create_daily_goal(data: DailyGoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_d = data.target_date or datetime.utcnow().strftime("%Y-%m-%d")
    goal = DailyGoal(
        user_id=current_user.id,
        title=data.title,
        target_date=target_d,
        completed=False
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@app.put("/api/daily-goals/{goal_id}/toggle")
def toggle_daily_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(DailyGoal).filter(DailyGoal.id == goal_id, DailyGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.completed = not goal.completed
    db.commit()
    return {"id": goal.id, "completed": goal.completed}


@app.delete("/api/daily-goals/{goal_id}")
def delete_daily_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(DailyGoal).filter(DailyGoal.id == goal_id, DailyGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Daily goal deleted"}


@app.get("/api/notifications", response_model=List[NotificationOut])
@app.get("/notifications", response_model=List[NotificationOut])
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()
    return notifs


@app.put("/api/notifications/{notif_id}/read")
@app.put("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "success"}


@app.put("/api/notifications/read-all")
def mark_all_notifications_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}
