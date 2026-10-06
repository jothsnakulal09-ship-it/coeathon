from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    college = Column(String(150), default="Engineering Institute")
    major = Column(String(150), default="Computer Science & Engineering")
    daily_study_hours = Column(Float, default=3.0)
    preferred_slot = Column(String(50), default="Evening (6 PM - 10 PM)")
    study_streak = Column(Integer, default=0)
    last_active_date = Column(String(20), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    created_at = Column(DateTime, default=datetime.utcnow)

    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="user", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("StudyTask", back_populates="user", cascade="all, delete-orphan")
    reschedule_logs = relationship("RescheduleLog", back_populates="user", cascade="all, delete-orphan")
    availability = relationship("UserAvailability", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    daily_goals = relationship("DailyGoal", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserAvailability(Base):
    __tablename__ = "user_availability"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(String(20), nullable=False)  # Monday, Tuesday, ... Sunday
    available_hours = Column(Float, default=3.0)

    user = relationship("User", back_populates="availability")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), default="")
    description = Column(String(255), default="")
    color = Column(String(30), default="#4f46e5")
    icon = Column(String(30), default="book")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    tasks = relationship("StudyTask", back_populates="subject", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="subject")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    name = Column(String(150), nullable=False)
    difficulty = Column(String(20), default="Medium")  # Easy, Medium, Hard
    importance = Column(String(20), default="Medium")  # Low, Medium, High
    status = Column(String(30), default="Not Started")  # Not Started, In Progress, Completed
    estimated_minutes = Column(Integer, default=60)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="topics")
    tasks = relationship("StudyTask", back_populates="topic", cascade="all, delete-orphan")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    name = Column(String(150), nullable=False)
    exam_date = Column(String(30), nullable=False)  # ISO Date YYYY-MM-DD
    syllabus = Column(Text, nullable=True)
    weight_percentage = Column(Integer, default=40)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String(150), nullable=False)
    deadline = Column(String(30), nullable=False)  # ISO Date YYYY-MM-DD
    priority = Column(String(20), default="HIGH")  # HIGH, MEDIUM, LOW
    status = Column(String(20), default="Pending")  # Pending, Completed
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")


class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    
    title = Column(String(200), nullable=False)
    scheduled_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    start_time = Column(String(20), nullable=False)      # e.g. "18:00"
    end_time = Column(String(20), nullable=False)        # e.g. "19:00"
    duration_minutes = Column(Integer, default=60)
    
    # Status: 'Pending', 'In Progress', 'Completed', 'Missed', 'Rescheduled'
    status = Column(String(30), default="Pending")
    priority_level = Column(String(20), default="MEDIUM")  # HIGH PRIORITY, MEDIUM PRIORITY, LOW PRIORITY
    priority_score = Column(Float, default=50.0)
    
    # Automatic Rescheduling Tracking
    is_rescheduled = Column(Boolean, default=False)
    original_date = Column(String(20), nullable=True)
    reschedule_reason = Column(String(255), nullable=True)
    
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tasks")
    subject = relationship("Subject", back_populates="tasks")
    topic = relationship("Topic", back_populates="tasks")


class RescheduleLog(Base):
    __tablename__ = "reschedule_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("study_tasks.id", ondelete="SET NULL"), nullable=True)
    task_title = Column(String(200), nullable=False)
    old_slot = Column(String(100), nullable=False)
    new_slot = Column(String(100), nullable=False)
    reason = Column(String(255), default="Task marked missed or auto-rebalanced")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reschedule_logs")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String(200), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notes")
    subject = relationship("Subject", back_populates="notes")


class DailyGoal(Base):
    __tablename__ = "daily_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    target_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="daily_goals")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # exam, task, reschedule, weak_subject, info
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
