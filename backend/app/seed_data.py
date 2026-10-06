import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, Subject, Topic, Exam, Assignment, StudyTask,
    RescheduleLog, UserAvailability, Note, DailyGoal, Notification
)
from .auth import hash_password

def seed_demo_data(db: Session, force_reset: bool = False):
    """Populates realistic student data for Code-A-Thon demonstration."""
    existing_user = db.query(User).filter(User.email == "student@aiplanner.edu").first()
    
    if existing_user:
        if not force_reset:
            return existing_user
        # Clean existing user data
        db.query(Notification).filter(Notification.user_id == existing_user.id).delete()
        db.query(DailyGoal).filter(DailyGoal.user_id == existing_user.id).delete()
        db.query(Note).filter(Note.user_id == existing_user.id).delete()
        db.query(UserAvailability).filter(UserAvailability.user_id == existing_user.id).delete()
        db.query(RescheduleLog).filter(RescheduleLog.user_id == existing_user.id).delete()
        db.query(StudyTask).filter(StudyTask.user_id == existing_user.id).delete()
        db.query(Assignment).filter(Assignment.user_id == existing_user.id).delete()
        db.query(Exam).filter(Exam.user_id == existing_user.id).delete()
        db.query(Topic).filter(Topic.subject_id.in_([s.id for s in existing_user.subjects])).delete()
        db.query(Subject).filter(Subject.user_id == existing_user.id).delete()
        db.query(User).filter(User.id == existing_user.id).delete()
        db.commit()

    # 1. Create Demo User
    user = User(
        name="Alex Chen",
        email="student@aiplanner.edu",
        hashed_password=hash_password("password123"),
        college="National Institute of Technology",
        major="Computer Science & Engineering",
        daily_study_hours=3.0,
        preferred_slot="Evening (6 PM - 10 PM)",
        study_streak=5,
        last_active_date=datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(user)
    db.flush()

    # 2. Daily Availability Schedule (Section 7)
    availabilities = [
        UserAvailability(user_id=user.id, day_of_week="Monday", available_hours=3.0),
        UserAvailability(user_id=user.id, day_of_week="Tuesday", available_hours=2.5),
        UserAvailability(user_id=user.id, day_of_week="Wednesday", available_hours=3.0),
        UserAvailability(user_id=user.id, day_of_week="Thursday", available_hours=2.0),
        UserAvailability(user_id=user.id, day_of_week="Friday", available_hours=3.5),
        UserAvailability(user_id=user.id, day_of_week="Saturday", available_hours=4.0),
        UserAvailability(user_id=user.id, day_of_week="Sunday", available_hours=2.0),
    ]
    db.add_all(availabilities)

    # 3. Subjects
    sub_dbms = Subject(user_id=user.id, name="Database Management Systems", code="DBMS", description="Relational databases, indexing, concurrency, and SQL", color="#6366f1", icon="database")
    sub_os = Subject(user_id=user.id, name="Operating Systems", code="OS", description="Processes, threads, memory management, and file systems", color="#06b6d4", icon="cpu")
    sub_ml = Subject(user_id=user.id, name="Python & Machine Learning", code="PY-ML", description="Python algorithms, regression, and neural networks", color="#10b981", icon="terminal")
    sub_math = Subject(user_id=user.id, name="Applied Mathematics", code="MATH", description="Calculus, linear algebra, and discrete structures", color="#f59e0b", icon="calculator")
    sub_cn = Subject(user_id=user.id, name="Computer Networks", code="CN", description="OSI model, TCP/IP, routing, and sockets", color="#8b5cf6", icon="network")

    db.add_all([sub_dbms, sub_os, sub_ml, sub_math, sub_cn])
    db.flush()

    # 4. Topics under each subject
    # DBMS
    t_sql = Topic(subject_id=sub_dbms.id, name="SQL Queries & Joins", difficulty="Medium", importance="High", status="Completed", estimated_minutes=60, completed=True)
    t_norm = Topic(subject_id=sub_dbms.id, name="Normalization (1NF, 2NF, 3NF, BCNF)", difficulty="Hard", importance="High", status="In Progress", estimated_minutes=90, completed=False)
    t_trans = Topic(subject_id=sub_dbms.id, name="Transactions & Concurrency Control", difficulty="Hard", importance="High", status="Not Started", estimated_minutes=75, completed=False)
    t_idx = Topic(subject_id=sub_dbms.id, name="Indexing & B+ Trees", difficulty="Medium", importance="Medium", status="Not Started", estimated_minutes=60, completed=False)
    t_er = Topic(subject_id=sub_dbms.id, name="ER Modeling & Relational Schema", difficulty="Easy", importance="Medium", status="Completed", estimated_minutes=45, completed=True)

    # OS
    t_proc = Topic(subject_id=sub_os.id, name="Processes, Threads & IPC", difficulty="Medium", importance="High", status="Completed", estimated_minutes=60, completed=True)
    t_cpu = Topic(subject_id=sub_os.id, name="CPU Scheduling Algorithms", difficulty="Medium", importance="Medium", status="Completed", estimated_minutes=60, completed=True)
    t_vmem = Topic(subject_id=sub_os.id, name="Virtual Memory & Paging", difficulty="Hard", importance="High", status="In Progress", estimated_minutes=90, completed=False)
    t_dead = Topic(subject_id=sub_os.id, name="Deadlocks & Banker's Algorithm", difficulty="Hard", importance="High", status="Not Started", estimated_minutes=75, completed=False)

    # Python & ML (Mostly completed -> Strong)
    t_py_func = Topic(subject_id=sub_ml.id, name="Python Functions & OOP", difficulty="Easy", importance="Medium", status="Completed", estimated_minutes=45, completed=True)
    t_numpy = Topic(subject_id=sub_ml.id, name="NumPy & Vectorized Arrays", difficulty="Easy", importance="Medium", status="Completed", estimated_minutes=45, completed=True)
    t_linreg = Topic(subject_id=sub_ml.id, name="Linear Regression & Cost Function", difficulty="Medium", importance="High", status="Completed", estimated_minutes=60, completed=True)
    t_logreg = Topic(subject_id=sub_ml.id, name="Logistic Regression & Classification", difficulty="Medium", importance="High", status="Completed", estimated_minutes=60, completed=True)
    t_trees = Topic(subject_id=sub_ml.id, name="Decision Trees & Random Forests", difficulty="Medium", importance="Medium", status="Not Started", estimated_minutes=60, completed=False)

    # Mathematics
    t_diff = Topic(subject_id=sub_math.id, name="Partial Differentiation", difficulty="Medium", importance="Medium", status="Completed", estimated_minutes=60, completed=True)
    t_integ = Topic(subject_id=sub_math.id, name="Multiple Integrals & Vector Calc", difficulty="Hard", importance="High", status="Not Started", estimated_minutes=90, completed=False)
    t_eigen = Topic(subject_id=sub_math.id, name="Eigenvalues & Eigenvectors", difficulty="Medium", importance="High", status="Completed", estimated_minutes=60, completed=True)
    t_matrix = Topic(subject_id=sub_math.id, name="Matrix Decompositions (SVD)", difficulty="Hard", importance="Medium", status="Not Started", estimated_minutes=75, completed=False)

    # Computer Networks
    t_osi = Topic(subject_id=sub_cn.id, name="OSI & TCP/IP Model Layers", difficulty="Easy", importance="High", status="Completed", estimated_minutes=45, completed=True)
    t_tcp = Topic(subject_id=sub_cn.id, name="TCP 3-Way Handshake & Flow Control", difficulty="Medium", importance="High", status="In Progress", estimated_minutes=60, completed=False)
    t_dns = Topic(subject_id=sub_cn.id, name="DNS, HTTP/2 & Web Sockets", difficulty="Medium", importance="Low", status="Completed", estimated_minutes=45, completed=True)

    db.add_all([
        t_sql, t_norm, t_trans, t_idx, t_er,
        t_proc, t_cpu, t_vmem, t_dead,
        t_py_func, t_numpy, t_linreg, t_logreg, t_trees,
        t_diff, t_integ, t_eigen, t_matrix,
        t_osi, t_tcp, t_dns
    ])
    db.flush()

    # 5. Exams
    today = datetime.utcnow().date()
    exam_dbms_date = (today + timedelta(days=5)).strftime("%Y-%m-%d")
    exam_os_date = (today + timedelta(days=12)).strftime("%Y-%m-%d")
    exam_math_date = (today + timedelta(days=22)).strftime("%Y-%m-%d")

    ex_dbms = Exam(
        user_id=user.id,
        subject_id=sub_dbms.id,
        name="DBMS Mid-Semester Exam",
        exam_date=exam_dbms_date,
        syllabus="Covers Normalization (1NF, 2NF, 3NF, BCNF), Transactions & ACID properties, Indexing and B+ Trees.",
        weight_percentage=40,
        notes="Room 304. Bring calculator."
    )
    ex_os = Exam(
        user_id=user.id,
        subject_id=sub_os.id,
        name="Operating Systems Final",
        exam_date=exam_os_date,
        syllabus="Processes, CPU Scheduling, Virtual Memory, Deadlocks.",
        weight_percentage=50,
        notes="Main Auditorium."
    )
    ex_math = Exam(
        user_id=user.id,
        subject_id=sub_math.id,
        name="Applied Mathematics Term Test",
        exam_date=exam_math_date,
        syllabus="Calculus, Linear Algebra, Matrix Decompositions.",
        weight_percentage=30,
        notes="Calculators allowed."
    )
    db.add_all([ex_dbms, ex_os, ex_math])

    # 6. Assignments
    assign_dbms = Assignment(
        user_id=user.id,
        subject_id=sub_dbms.id,
        title="SQL Complex Joins & Schema Design",
        deadline=(today + timedelta(days=2)).strftime("%Y-%m-%d"),
        priority="HIGH",
        status="Pending",
        completed=False
    )
    assign_ml = Assignment(
        user_id=user.id,
        subject_id=sub_ml.id,
        title="Mini-Project: House Price Predictor",
        deadline=(today + timedelta(days=7)).strftime("%Y-%m-%d"),
        priority="MEDIUM",
        status="Pending",
        completed=False
    )
    assign_os = Assignment(
        user_id=user.id,
        subject_id=sub_os.id,
        title="Producer-Consumer Semaphore Lab",
        deadline=(today + timedelta(days=10)).strftime("%Y-%m-%d"),
        priority="HIGH",
        status="Pending",
        completed=False
    )
    db.add_all([assign_dbms, assign_ml, assign_os])

    # 7. Study Tasks
    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    tomorrow_str = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    day_after_str = (today + timedelta(days=2)).strftime("%Y-%m-%d")
    missed_date_str = (today - timedelta(days=2)).strftime("%Y-%m-%d")

    task_y1 = StudyTask(
        user_id=user.id,
        subject_id=sub_ml.id,
        topic_id=t_linreg.id,
        title="Python & ML: Linear Regression & Cost Function",
        scheduled_date=yesterday_str,
        start_time="18:00",
        end_time="19:00",
        duration_minutes=60,
        status="Completed",
        priority_level="HIGH PRIORITY",
        priority_score=78.0,
        completed_at=datetime.utcnow() - timedelta(days=1)
    )

    task_t1 = StudyTask(
        user_id=user.id,
        subject_id=sub_dbms.id,
        topic_id=t_norm.id,
        title="DBMS: Normalization (1NF, 2NF, 3NF, BCNF)",
        scheduled_date=today_str,
        start_time="18:00",
        end_time="19:00",
        duration_minutes=60,
        status="Pending",
        priority_level="HIGH PRIORITY",
        priority_score=94.5
    )
    task_t2 = StudyTask(
        user_id=user.id,
        subject_id=sub_ml.id,
        topic_id=t_trees.id,
        title="Python & ML: Decision Trees & Random Forests",
        scheduled_date=today_str,
        start_time="19:15",
        end_time="20:15",
        duration_minutes=60,
        status="Pending",
        priority_level="MEDIUM PRIORITY",
        priority_score=62.0
    )
    task_t3 = StudyTask(
        user_id=user.id,
        subject_id=sub_os.id,
        topic_id=t_vmem.id,
        title="Operating Systems: Virtual Memory & Paging",
        scheduled_date=today_str,
        start_time="20:30",
        end_time="21:30",
        duration_minutes=60,
        status="Pending",
        priority_level="HIGH PRIORITY",
        priority_score=86.0
    )

    # Missed task from 2 days ago
    task_missed = StudyTask(
        user_id=user.id,
        subject_id=sub_dbms.id,
        topic_id=t_trans.id,
        title="DBMS: Transactions & Concurrency Control",
        scheduled_date=missed_date_str,
        start_time="18:00",
        end_time="19:00",
        duration_minutes=60,
        status="Missed",
        priority_level="HIGH PRIORITY",
        priority_score=92.0,
        is_rescheduled=True,
        reschedule_reason=f"Auto-rescheduled because session on {missed_date_str} was missed."
    )
    db.add(task_missed)
    db.flush()

    # The resulting rescheduled task placed into tomorrow
    task_rescheduled = StudyTask(
        user_id=user.id,
        subject_id=sub_dbms.id,
        topic_id=t_trans.id,
        title="DBMS: Transactions & Concurrency Control (Rescheduled)",
        scheduled_date=tomorrow_str,
        start_time="18:00",
        end_time="19:15",
        duration_minutes=75,
        status="Pending",
        priority_level="HIGH PRIORITY",
        priority_score=97.0,
        is_rescheduled=True,
        original_date=missed_date_str,
        reschedule_reason=f"Moved from {missed_date_str} (18:00) due to missed task. Exam proximity prioritized."
    )
    db.add(task_rescheduled)
    db.flush()

    task_future1 = StudyTask(
        user_id=user.id,
        subject_id=sub_math.id,
        topic_id=t_integ.id,
        title="Applied Mathematics: Multiple Integrals & Vector Calc",
        scheduled_date=day_after_str,
        start_time="18:00",
        end_time="19:30",
        duration_minutes=90,
        status="Pending",
        priority_level="HIGH PRIORITY",
        priority_score=74.0
    )

    db.add_all([task_y1, task_t1, task_t2, task_t3, task_future1])

    # Reschedule Log
    log1 = RescheduleLog(
        user_id=user.id,
        task_id=task_rescheduled.id,
        task_title="DBMS: Transactions & Concurrency Control",
        old_slot=f"{missed_date_str} (18:00 - 19:00)",
        new_slot=f"{tomorrow_str} (18:00 - 19:15)",
        reason="Your study plan has been automatically updated because you missed 1 task."
    )
    db.add(log1)

    # 8. Daily Goals (Section 12)
    goals = [
        DailyGoal(user_id=user.id, title="Complete DBMS Normalization (1NF & 2NF)", target_date=today_str, completed=True),
        DailyGoal(user_id=user.id, title="Practice 5 Operating System CPU Scheduling questions", target_date=today_str, completed=False),
        DailyGoal(user_id=user.id, title="Revise Python Decision Trees syntax", target_date=today_str, completed=False),
    ]
    db.add_all(goals)

    # 9. In-App Notifications (Section 20)
    notifs = [
        Notification(user_id=user.id, title="Exam Reminder", message="DBMS Mid-Semester Exam is in 5 days. High-yield topics scheduled.", type="exam", is_read=False),
        Notification(user_id=user.id, title="Adaptive Rescheduling", message="Your study plan has been automatically updated because you missed 1 task.", type="reschedule", is_read=False),
        Notification(user_id=user.id, title="Weak Subject Alert", message="Database Management Systems is at 12.5% mastery. Extra hours allocated.", type="weak_subject", is_read=False),
        Notification(user_id=user.id, title="Assignment Due Soon", message="SQL Complex Joins assignment deadline is in 2 days.", type="assignment", is_read=True),
    ]
    db.add_all(notifs)

    # 10. Sample Notes Document for RAG (Section 17)
    notes_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "uploads")
    os.makedirs(notes_dir, exist_ok=True)
    sample_file_path = os.path.join(notes_dir, "DBMS_Unit3_Normalization_Notes.txt")

    sample_note_content = """Database Management Systems - Unit 3: Normalization & Schema Refinement
Instructor: Dr. Sarah Jenkins | National Institute of Technology

1. Introduction to Relational Decomposition
Normalization is the systematic approach of decomposing relational schemas to eliminate insertion anomalies, update anomalies, and deletion anomalies.

2. First Normal Form (1NF)
A relation R is in 1NF if and only if all underlying domains contain exclusively atomic (indivisible) values.
Violation example: A table where PhoneNumbers contains comma-separated values like '9876543210, 8765432109'.
Fix: Decompose into individual rows with single atomic phone numbers.

3. Second Normal Form (2NF)
A relation R is in 2NF if it is in 1NF and no non-prime attribute is partially dependent on any candidate key.
Partial dependency occurs when a non-prime attribute depends only on a proper subset of a composite primary key.
Example: R(StudentID, CourseID, Grade, CourseName) where Primary Key is (StudentID, CourseID).
CourseName depends solely on CourseID, which is a partial key.
Fix: Split into Enrollment(StudentID, CourseID, Grade) and Courses(CourseID, CourseName).

4. Third Normal Form (3NF)
A relation R is in 3NF if for every functional dependency X -> Y:
- Either X is a superkey, OR
- Y is a prime attribute (part of a candidate key).
Eliminates transitive dependencies where a non-prime attribute determines another non-prime attribute (X -> Z through Y).

5. Boyce-Codd Normal Form (BCNF)
A stricter version of 3NF where for EVERY functional dependency X -> Y, X MUST be a superkey.
All BCNF tables are in 3NF, but not all 3NF tables are in BCNF.
"""
    with open(sample_file_path, "w", encoding="utf-8") as f:
        f.write(sample_note_content)

    note = Note(
        user_id=user.id,
        subject_id=sub_dbms.id,
        title="DBMS Unit 3: Normalization & Schema Refinement",
        filename="DBMS_Unit3_Normalization_Notes.txt",
        file_path=sample_file_path,
        file_size_bytes=len(sample_note_content.encode("utf-8")),
        extracted_text=sample_note_content
    )
    db.add(note)

    db.commit()
    return user
