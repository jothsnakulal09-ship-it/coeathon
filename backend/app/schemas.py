from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    college: Optional[str] = "Engineering Institute"
    major: Optional[str] = "Computer Science & Engineering"
    daily_study_hours: Optional[float] = 3.0
    preferred_slot: Optional[str] = "Evening (6 PM - 10 PM)"

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    major: Optional[str] = None
    daily_study_hours: Optional[float] = None
    preferred_slot: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    college: Optional[str]
    major: Optional[str]
    daily_study_hours: float
    preferred_slot: Optional[str]
    study_streak: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- User Availability (Per Day of Week) ---
class AvailabilityItem(BaseModel):
    day_of_week: str  # Monday, Tuesday, ... Sunday
    available_hours: float

class AvailabilityUpdate(BaseModel):
    availability: List[AvailabilityItem]

# --- Topics ---
class TopicBase(BaseModel):
    name: str
    difficulty: str = "Medium"  # Easy, Medium, Hard
    importance: str = "Medium"  # Low, Medium, High
    status: str = "Not Started"  # Not Started, In Progress, Completed
    estimated_minutes: int = Field(default=60, ge=15, le=360)
    completed: bool = False
    notes: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class TopicUpdate(BaseModel):
    name: Optional[str] = None
    difficulty: Optional[str] = None
    importance: Optional[str] = None
    status: Optional[str] = None
    estimated_minutes: Optional[int] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class TopicOut(TopicBase):
    id: int
    subject_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Subjects ---
class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = ""
    description: Optional[str] = ""
    color: Optional[str] = "#4f46e5"
    icon: Optional[str] = "book"

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class SubjectOut(SubjectBase):
    id: int
    user_id: int
    topics: List[TopicOut] = []
    created_at: datetime

    class Config:
        from_attributes = True

class SubjectPerformanceOut(BaseModel):
    id: int
    name: str
    code: str
    color: str
    total_topics: int
    completed_topics: int
    progress_percentage: float
    missed_tasks_count: int
    difficulty_score: float
    performance_score: float
    status: str  # "Strong", "Average", "Needs Attention"
    status_icon: str  # 🟢, 🟡, 🔴
    recommended_hours_per_week: float
    days_to_next_exam: Optional[int] = None

# --- Exams ---
class ExamBase(BaseModel):
    subject_id: int
    name: str
    exam_date: str  # YYYY-MM-DD
    syllabus: Optional[str] = None
    weight_percentage: Optional[int] = 40
    notes: Optional[str] = None

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    subject_id: Optional[int] = None
    name: Optional[str] = None
    exam_date: Optional[str] = None
    syllabus: Optional[str] = None
    weight_percentage: Optional[int] = None
    notes: Optional[str] = None

class ExamOut(ExamBase):
    id: int
    user_id: int
    days_remaining: int
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Assignments ---
class AssignmentBase(BaseModel):
    subject_id: int
    title: str
    deadline: str  # YYYY-MM-DD
    priority: str = "HIGH"  # HIGH, MEDIUM, LOW
    status: str = "Pending"  # Pending, Completed
    completed: bool = False

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    subject_id: Optional[int] = None
    title: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    completed: Optional[bool] = None

class AssignmentOut(AssignmentBase):
    id: int
    user_id: int
    days_remaining: int
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Study Tasks & Scheduling ---
class StudyTaskOut(BaseModel):
    id: int
    user_id: int
    subject_id: int
    topic_id: Optional[int] = None
    title: str
    scheduled_date: str
    start_time: str
    end_time: str
    duration_minutes: int
    status: str
    priority_level: str
    priority_score: float
    is_rescheduled: bool
    original_date: Optional[str] = None
    reschedule_reason: Optional[str] = None
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    topic_name: Optional[str] = None
    difficulty: Optional[str] = None

    class Config:
        from_attributes = True

class TaskStatusUpdate(BaseModel):
    status: str  # "Completed", "Missed", "In Progress", "Pending"

class PlanGenerateRequest(BaseModel):
    start_date: Optional[str] = None  # YYYY-MM-DD
    days_to_plan: int = Field(default=7, ge=1, le=30)
    daily_hours: Optional[float] = None
    preferred_slot: Optional[str] = "Evening (6 PM - 10 PM)"
    session_duration_minutes: int = Field(default=60, ge=30, le=120)
    break_duration_minutes: int = Field(default=15, ge=5, le=30)
    focus_weak_subjects: bool = True

class RescheduleLogOut(BaseModel):
    id: int
    task_id: Optional[int]
    task_title: str
    old_slot: str
    new_slot: str
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Notes (RAG) ---
class NoteOut(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    title: str
    filename: str
    file_size_bytes: int
    extracted_text_preview: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Daily Goals ---
class DailyGoalCreate(BaseModel):
    title: str
    target_date: Optional[str] = None

class DailyGoalOut(BaseModel):
    id: int
    user_id: int
    title: str
    target_date: str
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Notifications ---
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI & Analytics ---
class DashboardOverview(BaseModel):
    user: UserOut
    today_study_hours_planned: float
    today_study_hours_completed: float
    today_tasks_total: int
    today_tasks_completed: int
    today_tasks_pending: int
    today_tasks_missed: int
    overall_progress_percentage: float
    study_streak: int
    upcoming_exam: Optional[ExamOut] = None
    upcoming_assignment: Optional[AssignmentOut] = None
    weakest_subject: Optional[SubjectPerformanceOut] = None
    recent_reschedule_alert: Optional[str] = None
    recent_reschedule_count: int = 0
    today_tasks: List[StudyTaskOut] = []
    unread_notifications_count: int = 0
    today_goals: List[DailyGoalOut] = []

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context_subject_id: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    intent: Optional[str] = None
    action_taken: Optional[str] = None
    scheduled_task: Optional[Dict[str, Any]] = None

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    topic: str

class QuizResponse(BaseModel):
    subject_name: str
    topic_name: str
    questions: List[QuizQuestion]
