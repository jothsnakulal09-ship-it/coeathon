from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import User, Subject, Topic, Exam, Assignment, StudyTask

def calculate_subject_performance(subject: Subject, db: Session) -> Dict[str, Any]:
    """
    Unique Feature: Weak Subject Detection
    Calculates subject performance based on:
    - Completed topics
    - Missed tasks
    - Progress percentage
    - Topic difficulty
    - Task completion history
    Classifies as: 🟢 Strong, 🟡 Average, 🔴 Needs Attention
    """
    topics = db.query(Topic).filter(Topic.subject_id == subject.id).all()
    tasks = db.query(StudyTask).filter(StudyTask.subject_id == subject.id).all()
    exams = db.query(Exam).filter(Exam.subject_id == subject.id).all()
    
    total_topics = len(topics)
    completed_topics = sum(1 for t in topics if t.completed)
    progress_pct = (completed_topics / total_topics * 100) if total_topics > 0 else 0.0

    completed_tasks = sum(1 for t in tasks if t.status == "Completed")
    missed_tasks = sum(1 for t in tasks if t.status == "Missed")
    
    # Task success reliability
    total_attempted = completed_tasks + missed_tasks
    if total_attempted > 0:
        task_success_rate = (completed_tasks / total_attempted) * 100.0
    else:
        task_success_rate = 70.0  # Baseline neutral

    # Difficulty of remaining uncompleted topics
    uncompleted_topics = [t for t in topics if not t.completed]
    hard_count = sum(1 for t in uncompleted_topics if t.difficulty == "Hard")
    medium_count = sum(1 for t in uncompleted_topics if t.difficulty == "Medium")
    easy_count = sum(1 for t in uncompleted_topics if t.difficulty == "Easy")

    # Difficulty penalty: high remaining difficulty lowers current mastery score
    difficulty_score = (hard_count * 3 + medium_count * 1.5 + easy_count * 0.5)
    
    # Upcoming exam proximity
    today = datetime.utcnow().date()
    days_to_next_exam = None
    for ex in exams:
        try:
            ex_date = datetime.strptime(ex.exam_date, "%Y-%m-%d").date()
            diff = (ex_date - today).days
            if diff >= 0:
                if days_to_next_exam is None or diff < days_to_next_exam:
                    days_to_next_exam = diff
        except Exception:
            pass

    # Weighted Composite Formula:
    # 50% Topic Progress + 35% Task Success Rate - Penalty for missed tasks and pending hard topics
    raw_score = (0.50 * progress_pct) + (0.35 * task_success_rate) - (missed_tasks * 3.5) - (hard_count * 2.0)
    
    # If exam is within 5 days and progress is below 60%, subject needs critical attention
    if days_to_next_exam is not None and days_to_next_exam <= 5 and progress_pct < 60:
        raw_score = min(raw_score, 45.0)

    performance_score = round(max(5.0, min(100.0, raw_score)), 1)

    # Classification
    if performance_score >= 75.0:
        status = "Strong"
        status_icon = "🟢"
        recommended_hours = 2.5
    elif performance_score >= 50.0:
        status = "Average"
        status_icon = "🟡"
        recommended_hours = 4.5
    else:
        status = "Needs Attention"
        status_icon = "🔴"
        recommended_hours = 7.0

    return {
        "id": subject.id,
        "name": subject.name,
        "code": subject.code or subject.name[:4].upper(),
        "color": subject.color or "#4f46e5",
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "progress_percentage": round(progress_pct, 1),
        "missed_tasks_count": missed_tasks,
        "difficulty_score": round(difficulty_score, 1),
        "performance_score": performance_score,
        "status": status,
        "status_icon": status_icon,
        "recommended_hours_per_week": recommended_hours,
        "days_to_next_exam": days_to_next_exam
    }


def get_all_subjects_performance(user_id: int, db: Session) -> List[Dict[str, Any]]:
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    results = [calculate_subject_performance(s, db) for s in subjects]
    # Sort with "Needs Attention" first
    priority_order = {"Needs Attention": 0, "Average": 1, "Strong": 2}
    results.sort(key=lambda x: (priority_order.get(x["status"], 1), x["performance_score"]))
    return results


def calculate_study_streak(user: User, db: Session) -> int:
    """Calculates active streak based on dates tasks were completed."""
    today = datetime.utcnow().date()
    # Get distinct dates of completed tasks
    completed_tasks = (
        db.query(StudyTask.scheduled_date)
        .filter(StudyTask.user_id == user.id, StudyTask.status == "Completed")
        .distinct()
        .all()
    )
    completed_dates = set()
    for row in completed_tasks:
        try:
            completed_dates.add(datetime.strptime(row[0], "%Y-%m-%d").date())
        except Exception:
            pass

    if not completed_dates:
        return user.study_streak or 0

    streak = 0
    check_date = today
    # If nothing done today yet, check if done yesterday to preserve streak
    if check_date not in completed_dates:
        check_date = today - timedelta(days=1)

    while check_date in completed_dates:
        streak += 1
        check_date -= timedelta(days=1)

    # Base on user's seeded minimum streak if higher
    effective_streak = max(streak, user.study_streak or 0)
    return effective_streak
