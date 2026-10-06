import os
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from .models import User, Subject, Topic, Exam, StudyTask, Note, Assignment, RescheduleLog, Notification
from .analytics import calculate_subject_performance, get_all_subjects_performance
from .rag import search_notes_rag
from .scheduler import (
    schedule_single_study_session,
    automatic_reschedule_missed_task,
    format_time_12h
)

KNOWLEDGE_BASE = {
    "normalization": {
        "title": "DBMS Normalization (1NF, 2NF, 3NF, BCNF)",
        "summary": "Normalization is the process of organizing database tables to reduce data redundancy and eliminate update/delete anomalies.",
        "key_points": [
            "**1NF (First Normal Form)**: Atomic values per cell, no repeating groups or composite columns.",
            "**2NF (Second Normal Form)**: Must be in 1NF and have NO partial dependencies (non-prime attributes must depend on entire primary key).",
            "**3NF (Third Normal Form)**: Must be in 2NF and have NO transitive dependencies (non-prime attribute determining another non-prime).",
            "**BCNF (Boyce-Codd Normal Form)**: Strict 3NF where every determinant X in X -> Y must be a candidate superkey."
        ],
        "example": "Student_Course(StudentID, CourseID, Professor, Office) has Professor -> Office transitive dependency. Decompose into Course_Prof and Prof_Office!"
    },
    "transactions": {
        "title": "ACID Properties & Concurrency Control",
        "summary": "Transactions in DBMS ensure database integrity during concurrent operations or server crashes.",
        "key_points": [
            "**Atomicity**: Entire transaction completes or none does (Recovery Manager / WAL).",
            "**Consistency**: Database moves from one valid state to another, satisfying integrity constraints.",
            "**Isolation**: Concurrent execution results match serial execution (2-Phase Locking or MVCC).",
            "**Durability**: Committed data is never lost, even across catastrophic power failures."
        ],
        "example": "Bank transfer: Deducting $100 from Account A and crediting $100 to Account B must execute atomically."
    },
    "virtual_memory": {
        "title": "OS Virtual Memory, Paging & TLB",
        "summary": "Virtual memory provides each process the illusion of contiguous memory by swapping pages between RAM and disk storage.",
        "key_points": [
            "**Paging**: Logical memory divided into Pages; physical memory divided into Frames.",
            "**Page Table & TLB**: Translates virtual to physical addresses. TLB is a fast hardware cache.",
            "**Page Fault**: Interrupt triggered when an address refers to a page not currently residing in RAM.",
            "**Replacement Algorithms**: FIFO, LRU (Least Recently Used), Optimal (Belady's Algorithm)."
        ],
        "example": "Thrashing occurs when the OS spends more time swapping pages between RAM and disk than executing user instructions."
    },
    "tcp_ip": {
        "title": "Computer Networks: TCP vs UDP & Handshake",
        "summary": "Transport layer protocols dictate reliability, order guarantee, and latency.",
        "key_points": [
            "**TCP**: Connection-oriented, guaranteed in-order delivery, flow & congestion control.",
            "**3-Way Handshake**: SYN -> SYN-ACK -> ACK establishes sequence numbers before payload transmission.",
            "**UDP**: Connectionless, lightweight, zero retransmissions. Ideal for real-time video, gaming, DNS."
        ],
        "example": "HTTP/1.1 and HTTP/2 rely on TCP, while modern HTTP/3 (QUIC) builds reliability directly over UDP."
    }
}

QUIZ_BANKS = {
    "dbms": [
        {
            "id": 1,
            "topic": "DBMS - Normalization",
            "question": "A table is in 2NF if it is in 1NF and contains no:",
            "options": ["Transitive dependencies", "Partial dependencies", "Multi-valued dependencies", "Foreign keys"],
            "correct_index": 1,
            "explanation": "2NF requires eliminating partial dependencies where a non-prime attribute depends only on a subset of a composite primary key."
        },
        {
            "id": 2,
            "topic": "DBMS - Transactions",
            "question": "Which ACID property guarantees that committed changes persist even after a sudden server crash?",
            "options": ["Atomicity", "Consistency", "Isolation", "Durability"],
            "correct_index": 3,
            "explanation": "Durability guarantees that once a transaction has committed, its updates survive power failures through Write-Ahead Logging (WAL)."
        },
        {
            "id": 3,
            "topic": "DBMS - Indexing",
            "question": "Why are B+ Trees preferred over regular Binary Search Trees for disk storage in relational databases?",
            "options": ["They have a smaller fan-out", "They minimize disk I/O operations by storing multiple keys per node", "They do not support range queries", "They use recursion"],
            "correct_index": 1,
            "explanation": "B+ Trees have high fan-out, matching disk block sizes to minimize expensive disk head seek operations."
        },
        {
            "id": 4,
            "topic": "DBMS - SQL",
            "question": "What is the difference between WHERE and HAVING clauses in SQL?",
            "options": [
                "WHERE filters groups after aggregation, HAVING filters rows before",
                "WHERE filters rows before GROUP BY aggregation, HAVING filters aggregated groups",
                "HAVING is only for JOIN operations",
                "There is no difference"
            ],
            "correct_index": 1,
            "explanation": "WHERE filters individual rows prior to grouping, whereas HAVING evaluates aggregate conditions like COUNT() or AVG() on the resulting groups."
        },
        {
            "id": 5,
            "topic": "DBMS - Concurrency",
            "question": "The Strict Two-Phase Locking (Strict 2PL) protocol prevents which anomaly?",
            "options": ["Deadlocks entirely", "Cascading rollbacks", "Slow queries", "Table fragmentation"],
            "correct_index": 1,
            "explanation": "Strict 2PL holds all exclusive (X) locks until the end of transaction (Commit/Abort), completely eliminating cascading aborts."
        }
    ],
    "os": [
        {
            "id": 101,
            "topic": "Operating Systems - Virtual Memory",
            "question": "Belady's Anomaly states that increasing the number of page frames can result in:",
            "options": ["Fewer page faults in FIFO", "More page faults in FIFO", "Deadlocks in round-robin", "Faster swap speeds"],
            "correct_index": 1,
            "explanation": "Belady's Anomaly is a counter-intuitive phenomenon where increasing page frames can increase the total page faults under the FIFO algorithm."
        },
        {
            "id": 102,
            "topic": "Operating Systems - CPU Scheduling",
            "question": "Which CPU scheduling algorithm is mathematically proven to achieve the minimal average waiting time?",
            "options": ["First-Come-First-Served (FCFS)", "Round Robin (RR)", "Shortest Job First (SJF / SRTF)", "Priority Scheduling"],
            "correct_index": 2,
            "explanation": "Shortest Job First (SJF) is provably optimal because scheduling short bursts earlier minimizes the cumulative waiting time of waiting processes."
        },
        {
            "id": 103,
            "topic": "Operating Systems - Synchronization",
            "question": "Which of the following is NOT one of the 4 Coffman conditions required for Deadlock?",
            "options": ["Mutual Exclusion", "Hold and Wait", "Preemption allowed", "Circular Wait"],
            "correct_index": 2,
            "explanation": "The condition is 'No Preemption'. If preemption is allowed, deadlocks can be broken by forcibly confiscating resources."
        },
        {
            "id": 104,
            "topic": "Operating Systems - Memory Management",
            "question": "What is the primary function of the Translation Lookaside Buffer (TLB)?",
            "options": ["Disk cache for files", "High-speed hardware cache for page table translations", "Store process control blocks", "Interrupt vector table"],
            "correct_index": 1,
            "explanation": "The TLB is an associative cache located close to the CPU that caches recent virtual-to-physical address mappings."
        },
        {
            "id": 105,
            "topic": "Operating Systems - File Systems",
            "question": "In Unix-like file systems, an inode stores:",
            "options": ["Only the file name", "File metadata, permissions, and direct/indirect block pointers", "The full contents in plain text", "User passwords"],
            "correct_index": 1,
            "explanation": "An inode stores all file attributes, timestamps, ownership, and block pointers, while directory entries map file names to inode numbers."
        }
    ]
}


def call_gemini_llm(prompt: str) -> Optional[str]:
    """Call Google Gemini API if GEMINI_API_KEY environment variable is configured."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception:
        return None


def classify_intent(message: str) -> str:
    """
    Multi-class intent classification:
    - SCHEDULE: Intent to create or allocate study sessions on timetable/calendar
    - RESCHEDULE: Intent to reschedule missed study sessions
    - COMPLETE_TASK: Intent to mark tasks finished
    - NOTES_QUERY: Specific questions referencing user's uploaded notes
    - EXPLAIN_TOPIC: Conceptual explanation requests
    - GENERAL_CHAT: Strategy, greetings, and guidance
    """
    msg = message.lower().strip()

    # 1. SCHEDULE INTENT
    schedule_keywords = [
        "to my schedule", "to the schedule", "to schedule",
        "to my timetable", "to the timetable", "to timetable",
        "to my study plan", "to study plan", "to my calendar",
        "add to schedule", "add to timetable", "to schedule"
    ]
    if any(k in msg for k in schedule_keywords):
        return "SCHEDULE"

    if re.search(r"\b(i have to add|i need to add|add)\b.+\b(to (?:my )?(?:schedule|timetable|study plan|calendar))\b", msg):
        return "SCHEDULE"

    if re.search(r"\b(schedule|plan)\b\s+([a-zA-Z0-9\s&]+?)\s+(?:for\s+\d+|today|tomorrow|on\s+[a-z]+|next\s+[a-z]+)", msg):
        return "SCHEDULE"

    if re.search(r"\b(schedule|allocate|book|slot)\b\s+([a-zA-Z0-9\s&]+)", msg) and not any(w in msg for w in ["quiz", "test", "exam date"]):
        return "SCHEDULE"

    if re.search(r"\b(give me|allocate|need)\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)\s+for\s+", msg):
        return "SCHEDULE"

    if re.search(r"\bi\s+(?:need|want)\s+to\s+study\s+", msg):
        return "SCHEDULE"

    if re.search(r"\badd\s+\d+\s*(?:hour|hours|hr|hrs|minutes?|mins?)\s+(?:for|of)\s+", msg):
        return "SCHEDULE"

    # 2. RESCHEDULE INTENT
    if "reschedule" in msg or "re-schedule" in msg or "move missed" in msg or "shift missed" in msg or "missed task" in msg:
        return "RESCHEDULE"

    # 3. COMPLETE_TASK INTENT
    if re.search(r"\b(completed?|finish(?:ed)?|done with|mark.+completed?)\b.*\btask\b", msg):
        return "COMPLETE_TASK"

    # 4. NOTES_QUERY INTENT
    if re.search(r"\b(?:from\s+my\s+notes|in\s+my\s+notes|my\s+notes|uploaded\s+notes|notes?\s+on|summarize\s+(?:\w+\s+)?notes?)\b", msg) or re.search(r"\bnotes?\b", msg):
        return "NOTES_QUERY"

    # 5. EXPLAIN_TOPIC INTENT
    explain_cues = ["explain", "what is", "what are", "how does", "how do", "define", "describe", "difference between", "tell me about"]
    if any(msg.startswith(c) or f" {c} " in msg for c in explain_cues):
        return "EXPLAIN_TOPIC"
    for term in ["normalization", "1nf", "2nf", "3nf", "bcnf", "acid", "transaction", "virtual memory", "tlb", "paging", "tcp", "udp", "concurrency", "deadlock"]:
        if term in msg:
            return "EXPLAIN_TOPIC"

    # 6. GENERAL_CHAT
    return "GENERAL_CHAT"


def extract_target_subject_phrase(msg: str) -> str:
    """Extracts candidate subject query phrase from user message."""
    cleaned = msg.strip()
    patterns = [
        r"^(?:please\s+)?(?:i\s+have\s+to\s+add|i\s+need\s+to\s+add|add)\s+",
        r"^(?:please\s+)?(?:i\s+need\s+to\s+study|i\s+want\s+to\s+study)\s+",
        r"^(?:please\s+)?(?:schedule|plan\s+to\s+study|plan)\s+",
        r"^(?:please\s+)?(?:give\s+me|allocate|book|slot)\s+\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?)\s+(?:for|of)\s+",
        r"^(?:please\s+)?(?:add\s+)?\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?)\s+(?:for|of)\s+",
        r"^(?:please\s+)?reschedule(?:\s+my)?\s+missed\s+",
    ]
    for p in patterns:
        cleaned = re.sub(p, "", cleaned, flags=re.IGNORECASE)

    trailing = [
        r"\s+(?:to\s+(?:my\s+)?(?:schedule|timetable|study\s+plan|calendar))$",
        r"\s+(?:on\s+my\s+(?:schedule|timetable|study\s+plan|calendar))$",
        r"\s+(?:for\s+\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?)(?:\s+today|\s+tomorrow)?)$",
        r"\s+(?:for\s+today|for\s+tomorrow|today|tomorrow)$",
        r"\s+(?:in\s+(?:my\s+)?(?:schedule|timetable))$",
        r"\s+task$"
    ]
    for t in trailing:
        cleaned = re.sub(t, "", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r"^[,\.\s\?!]+|[,\.\s\?!]+$", "", cleaned)
    return cleaned


def match_user_subject(query: str, subjects_list: List[Subject]) -> Optional[Subject]:
    """Matches candidate subject string against the user's registered subjects."""
    q = query.lower().strip()
    if not q:
        return None

    # 1. Exact or substring match
    for s in subjects_list:
        s_lower = s.name.lower()
        if q == s_lower or q in s_lower or s_lower in q:
            return s
        if s.code and q == s.code.lower():
            return s

    # 2. Acronym match (dbms -> Database Management Systems)
    for s in subjects_list:
        words = re.findall(r"[a-zA-Z]+", s.name)
        acronym = "".join(w[0] for w in words).lower()
        if q == acronym or f"({q})" in s.name.lower():
            return s

    # 3. Token overlap match (e.g. 'database system' -> 'Database Management Systems')
    q_tokens = set(re.findall(r"[a-zA-Z]{3,}", q))
    q_stems = {t[:-1] if t.endswith("s") else t for t in q_tokens}

    best_match = None
    best_overlap = 0
    for s in subjects_list:
        s_tokens = set(re.findall(r"[a-zA-Z]{3,}", s.name.lower()))
        s_stems = {t[:-1] if t.endswith("s") else t for t in s_tokens}
        overlap = len(q_stems & s_stems)
        if overlap > best_overlap:
            best_overlap = overlap
            best_match = s

    if best_overlap > 0:
        return best_match

    return None


def extract_requested_duration(msg: str) -> int:
    """Extracts duration in minutes from prompt (default: 60)."""
    m_hr = re.search(r"(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)", msg, flags=re.IGNORECASE)
    if m_hr:
        try:
            return int(float(m_hr.group(1)) * 60)
        except Exception:
            pass
    m_min = re.search(r"(\d+)\s*(?:minutes?|mins?)", msg, flags=re.IGNORECASE)
    if m_min:
        try:
            return int(m_min.group(1))
        except Exception:
            pass
    return 60


def extract_requested_date(msg: str) -> date:
    """Extracts target date from prompt (today, tomorrow, or weekday)."""
    today = datetime.utcnow().date()
    msg_l = msg.lower()
    if "tomorrow" in msg_l:
        return today + timedelta(days=1)

    weekdays = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }
    for day_str, day_num in weekdays.items():
        if day_str in msg_l:
            days_ahead = (day_num - today.weekday() + 7) % 7
            if days_ahead == 0:
                days_ahead = 7
            return today + timedelta(days=days_ahead)

    return today


def get_subject_display_short(subject: Subject, user_query: str) -> str:
    """Generates clean short identifier e.g. DBMS, OS, Python."""
    m = re.search(r"\(([A-Za-z0-9]+)\)", subject.name)
    if m:
        return m.group(1)
    s_low = subject.name.lower()
    if "database" in s_low or "dbms" in s_low:
        return "DBMS"
    if "operating" in s_low or "os" in s_low:
        return "OS"
    if "machine learning" in s_low or "python" in s_low:
        return "Python & ML"
    if "network" in s_low:
        return "Computer Networks"
    if "algebra" in s_low or "math" in s_low:
        return "Maths"
    return subject.name.split()[0]


def generate_ai_chat_response(messages: List[Dict[str, str]], user_id: int, db: Session) -> Dict[str, Any]:
    """
    Intelligent AI Study Coach with multi-intent classification:
    - SCHEDULE: Detects scheduling intent, matches subject, and adds session directly to timetable
    - RESCHEDULE: Triggers adaptive rescheduling for missed study tasks
    - COMPLETE_TASK: Marks tasks completed and updates study streaks
    - NOTES_QUERY: Performs RAG search over user's uploaded study notes
    - EXPLAIN_TOPIC: Answers academic questions via knowledge base or Gemini LLM
    - GENERAL_CHAT: Provides daily recommendations, weak subject guidance, and exam prep
    """
    raw_message = messages[-1]["content"] if messages else ""
    last_user_message = raw_message.lower().strip()

    user = db.query(User).filter(User.id == user_id).first()
    subjects = db.query(Subject).filter(Subject.user_id == user_id).all()
    exams = db.query(Exam).filter(Exam.user_id == user_id).all()
    tasks = db.query(StudyTask).filter(StudyTask.user_id == user_id).all()
    performances = get_all_subjects_performance(user_id, db)
    weakest = performances[0] if performances else None

    # Step 1: Intent Classification
    intent = classify_intent(last_user_message)

    # =========================================================================
    # INTENT: SCHEDULE
    # =========================================================================
    if intent == "SCHEDULE":
        # Extract target subject phrase
        subject_phrase = extract_target_subject_phrase(raw_message)
        matched_subject = match_user_subject(subject_phrase or raw_message, subjects)

        # Subject does not exist in student curriculum
        if not matched_subject:
            display_name = subject_phrase.title() if subject_phrase else "that subject"
            reply = f"I couldn't find {display_name} in your subjects. Would you like me to add it as a new subject?"
            return {
                "reply": reply,
                "suggested_actions": ["Add New Subject", "View My Subjects", "Generate Full Study Plan"],
                "intent": "SCHEDULE",
                "action_taken": "SUBJECT_NOT_FOUND"
            }

        # Subject found: schedule using existing scheduler logic
        duration_minutes = extract_requested_duration(raw_message)
        target_date = extract_requested_date(raw_message)

        sched_res = schedule_single_study_session(
            user_id=user_id,
            subject_id=matched_subject.id,
            duration_minutes=duration_minutes,
            target_date=target_date,
            db=db
        )

        if not sched_res.get("success"):
            return {
                "reply": f"⚠️ Could not schedule session for {matched_subject.name}: {sched_res.get('error', 'Unknown error')}",
                "suggested_actions": ["View Calendar", "Set Availability"],
                "intent": "SCHEDULE"
            }

        short_name = get_subject_display_short(matched_subject, raw_message)
        reply = (
            f"✅ {short_name} has been added to your study plan.\n"
            f"📚 Subject: {matched_subject.name}\n"
            f"⏱️ Duration: {sched_res['duration_display']}\n"
            f"📅 Scheduled: {sched_res['date_display']}, {sched_res['time_display']}\n"
            f"🎯 Priority: {sched_res['priority_reason']}"
        )

        return {
            "reply": reply,
            "suggested_actions": ["View in Calendar", "View Daily Tasks", "Take Diagnostic Quiz"],
            "intent": "SCHEDULE",
            "action_taken": "SCHEDULED",
            "scheduled_task": sched_res
        }

    # =========================================================================
    # INTENT: RESCHEDULE
    # =========================================================================
    if intent == "RESCHEDULE":
        subject_phrase = extract_target_subject_phrase(raw_message)
        matched_subject = match_user_subject(subject_phrase or raw_message, subjects)

        missed_query = db.query(StudyTask).filter(
            StudyTask.user_id == user_id,
            StudyTask.status == "Missed"
        )
        if matched_subject:
            missed_task = missed_query.filter(StudyTask.subject_id == matched_subject.id).first()
        else:
            missed_task = missed_query.first()

        if not missed_task:
            sub_name = f" for {matched_subject.name}" if matched_subject else ""
            return {
                "reply": f"You don't have any missed tasks{sub_name} right now! Your study plan is on track.",
                "suggested_actions": ["View in Calendar", "What should I study today?", "Take Quiz"],
                "intent": "RESCHEDULE",
                "action_taken": "NO_MISSED_TASKS"
            }

        resched = automatic_reschedule_missed_task(missed_task.id, user_id, db)
        reply = (
            f"🔄 **Missed Task Rescheduled Successfully!**\n\n"
            f"- **Task**: {missed_task.title}\n"
            f"- **New Scheduled Slot**: {resched['new_slot']}\n"
            f"- **Priority**: Boosted to HIGH PRIORITY\n\n"
            f"Your study timetable and progress tracking have been adaptively updated."
        )

        return {
            "reply": reply,
            "suggested_actions": ["View in Calendar", "View Daily Tasks"],
            "intent": "RESCHEDULE",
            "action_taken": "RESCHEDULED"
        }

    # =========================================================================
    # INTENT: COMPLETE_TASK
    # =========================================================================
    if intent == "COMPLETE_TASK":
        subject_phrase = extract_target_subject_phrase(raw_message)
        matched_subject = match_user_subject(subject_phrase or raw_message, subjects)

        pending_query = db.query(StudyTask).filter(
            StudyTask.user_id == user_id,
            StudyTask.status.in_(["Pending", "In Progress"])
        )
        if matched_subject:
            target_task = pending_query.filter(StudyTask.subject_id == matched_subject.id).first()
        else:
            target_task = pending_query.first()

        if target_task:
            target_task.status = "Completed"
            db.commit()
            return {
                "reply": f"🎉 Great job! Marked **{target_task.title}** as completed. Your study progress has been updated!",
                "suggested_actions": ["View Progress & Analytics", "Start Next Task", "Take Quiz"],
                "intent": "COMPLETE_TASK",
                "action_taken": "COMPLETED_TASK"
            }
        else:
            return {
                "reply": "You have no active pending tasks to complete right now! Head to 'Study Plan' to generate your next sprint.",
                "suggested_actions": ["Generate Study Plan", "View Calendar"],
                "intent": "COMPLETE_TASK"
            }

    # =========================================================================
    # INTENT: NOTES_QUERY (RAG search explicitly prioritized)
    # =========================================================================
    if intent == "NOTES_QUERY":
        rag_results = search_notes_rag(user_id, raw_message, db, top_k=2)
        reply = ""
        if rag_results:
            reply += f"📄 **Found in your uploaded notes ({rag_results[0]['filename']}):**\n\n"
            reply += f"> *\"{rag_results[0]['chunk'][:400]}...\"*\n\n"
            reply += "Here is the key breakdown from your course materials:\n\n"
        else:
            reply += f"I searched your uploaded notes, but could not find sections matching that query. (Upload your lecture notes in the **Notes (RAG)** tab!)\n\n"

        # Check knowledge base lookup
        for key, item in KNOWLEDGE_BASE.items():
            if key in last_user_message or any(w in last_user_message for w in key.split("_")):
                reply += f"### 💡 Master Concept: {item['title']}\n\n{item['summary']}\n\n"
                reply += "#### 📌 Core Principles to Remember:\n"
                for pt in item["key_points"]:
                    reply += f"- {pt}\n"
                reply += f"\n#### 🎯 Real-World Exam Example:\n> {item['example']}\n\n"
                return {
                    "reply": reply,
                    "suggested_actions": ["Take Diagnostic Quiz", "Schedule Revision Slot", "View Notes"],
                    "intent": "NOTES_QUERY"
                }

        # If Gemini configured
        if os.getenv("GEMINI_API_KEY"):
            gemini_reply = call_gemini_llm(f"Explain the following concept for a student based on notes: {raw_message}")
            if gemini_reply:
                reply += gemini_reply
                return {
                    "reply": reply,
                    "suggested_actions": ["View Notes", "Take Diagnostic Quiz"],
                    "intent": "NOTES_QUERY"
                }

        reply += "Would you like to review relevant topics under Subjects or test your knowledge with a diagnostic quiz?"
        return {
            "reply": reply,
            "suggested_actions": ["Start 5-min Quiz", "View Notes", "View Timetable"],
            "intent": "NOTES_QUERY"
        }

    # =========================================================================
    # INTENT: EXPLAIN_TOPIC
    # =========================================================================
    if intent == "EXPLAIN_TOPIC":
        # Search notes if relevant
        rag_results = search_notes_rag(user_id, raw_message, db, top_k=1)
        reply = ""
        if rag_results:
            reply += f"📄 **Found in your uploaded notes ({rag_results[0]['filename']}):**\n\n"
            reply += f"> *\"{rag_results[0]['chunk'][:350]}...\"*\n\n"

        # Check knowledge base
        for key, item in KNOWLEDGE_BASE.items():
            if key in last_user_message or any(w in last_user_message for w in key.split("_")):
                reply += f"### 💡 Master Concept: {item['title']}\n\n{item['summary']}\n\n"
                reply += "#### 📌 Core Principles to Remember:\n"
                for pt in item["key_points"]:
                    reply += f"- {pt}\n"
                reply += f"\n#### 🎯 Real-World Exam Example:\n> {item['example']}\n\n"
                reply += "Would you like to take a 5-minute diagnostic quiz on this topic to test your recall?"
                return {
                    "reply": reply,
                    "suggested_actions": ["Start 5-min Quiz", "Schedule Revision Slot", "Explain with Diagram"],
                    "intent": "EXPLAIN_TOPIC"
                }

        if os.getenv("GEMINI_API_KEY"):
            gemini_reply = call_gemini_llm(f"Explain this academic engineering topic clearly with formulas, examples, and bullet points: {raw_message}")
            if gemini_reply:
                reply += gemini_reply
                return {
                    "reply": reply,
                    "suggested_actions": ["Take Diagnostic Quiz", "Schedule Revision"],
                    "intent": "EXPLAIN_TOPIC"
                }

        reply += f"### 📚 Academic Guidance: {raw_message.title()}\n\n"
        reply += "For this concept, focus on:\n"
        reply += "- Understanding core mathematical and logical foundations\n"
        reply += "- Identifying standard exam question patterns\n"
        reply += "- Doing active recall practice questions\n"
        return {
            "reply": reply,
            "suggested_actions": ["Take Diagnostic Quiz", "Schedule Revision Slot"],
            "intent": "EXPLAIN_TOPIC"
        }

    # =========================================================================
    # INTENT: GENERAL_CHAT (Daily Strategy, Weak Subjects, Exam Cram, Greetings)
    # =========================================================================
    reply = ""

    # "What should I study today?" / "I have 2 hours today"
    if "today" in last_user_message or "hours" in last_user_message or "study" in last_user_message:
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        today_tasks = [t for t in tasks if t.scheduled_date == today_str and t.status != "Completed"]

        reply += "### 📅 Recommended Study Strategy for Today\n\n"
        if today_tasks:
            reply += f"You have **{len(today_tasks)} high-priority session(s)** on your timetable today:\n"
            for t in today_tasks[:3]:
                start_12 = format_time_12h(t.start_time)
                end_12 = format_time_12h(t.end_time)
                reply += f"- **{start_12} - {end_12}**: {t.title} ({t.priority_level or 'HIGH PRIORITY'})\n"
            reply += "\n💡 **Pro Tip**: Use 25-minute Pomodoro intervals with 5-minute active recovery breaks."
        else:
            if weakest:
                reply += f"You have no pending tasks today! I recommend spending 1-2 hours on your weakest subject: **{weakest['name']}**.\n"
                reply += f"- Review high-difficulty uncompleted topics\n- Solve 5 practice problems\n"
            else:
                reply += "Your today's schedule is clean! Head to 'Create Study Plan' to generate your weekly schedule.\n"

        return {
            "reply": reply,
            "suggested_actions": ["Start Pomodoro Timer", "Generate Study Plan", "Take Quiz"],
            "intent": "GENERAL_CHAT"
        }

    # "Weak subject" guidance
    if "weak" in last_user_message or "attention" in last_user_message or "improve" in last_user_message:
        if weakest:
            reply += f"### 📊 Adaptive Analysis for Weakest Subject: **{weakest['name']}**\n\n"
            reply += f"- **Current Mastery**: {weakest['performance_score']}% ({weakest['status_icon']} {weakest['status']})\n"
            reply += f"- **Topic Progress**: {weakest['completed_topics']}/{weakest['total_topics']} ({weakest['progress_percentage']}%)\n"
            reply += f"- **Missed Tasks**: {weakest['missed_tasks_count']}\n"
            reply += f"- **Recommended Weekly Hours**: {weakest['recommended_hours_per_week']} hrs/week\n\n"
            reply += "#### 🚀 3-Step Strategy to Turn This Subject Strong:\n"
            reply += "1. **Tackle Hard Topics First**: High-difficulty topics drop your mastery score the most if neglected.\n"
            reply += "2. **Active Recall & Spaced Repetition**: Spend the first 15 mins reviewing yesterday's formulas.\n"
            reply += "3. **Clear Missed Backlog**: Auto-reschedule missed sessions to avoid pre-exam crunch."
            return {
                "reply": reply,
                "suggested_actions": ["Schedule " + weakest["name"], "Start Practice Quiz", "View Analytics"],
                "intent": "GENERAL_CHAT"
            }

    # Exam Cram or preparation
    if "exam" in last_user_message or "prepare" in last_user_message or "test" in last_user_message:
        today = datetime.utcnow().date()
        exam_text = ""
        for ex in exams:
            try:
                ed = datetime.strptime(ex.exam_date, "%Y-%m-%d").date()
                days = (ed - today).days
                if days >= 0:
                    exam_text += f"- **{ex.name}**: in {days} day(s) ({ex.exam_date})\n"
            except Exception:
                pass

        reply += "### 🎯 Exam Preparation Roadmap\n\n"
        if exam_text:
            reply += f"Upcoming target exams:\n{exam_text}\n"
        else:
            reply += "You don't have any immediate exams listed. Make sure to add your midterm/final dates under **Exams**!\n\n"

        reply += "#### ⏱ High-Yield Study Protocol:\n"
        reply += "- **Days T-7 to T-4**: Review high-importance topics + past year questions.\n"
        reply += "- **Days T-3 to T-2**: Timed mock exam in test conditions.\n"
        reply += "- **Day T-1**: Light formula sheet review and adequate sleep."
        return {
            "reply": reply,
            "suggested_actions": ["Add Exam Date", "Generate Study Plan", "Focus Session"],
            "intent": "GENERAL_CHAT"
        }

    # General AI Study Coach Greeting
    coach_name = user.name if user else "Student"
    reply += f"Hello {coach_name}! I'm your **AI-Powered Adaptive Study Coach** 🎓\n\n"
    reply += "I track your study velocity, missed tasks, upcoming deadlines, topic difficulties, and uploaded notes.\n\n"

    if weakest and weakest["status"] == "Needs Attention":
        reply += f"⚠️ **Attention Alert**: Your subject **{weakest['name']}** is at {weakest['performance_score']}% ({weakest['status']}). Would you like me to schedule a revision slot?\n\n"

    reply += "Here are things you can ask me:\n"
    reply += "- 🗓️ *'Add DBMS to my schedule'* or *'Schedule DBMS for 2 hours today'*\n"
    reply += "- 🔄 *'Reschedule my missed DBMS task'*\n"
    reply += "- 🧠 *'What should I study today?'*\n"
    reply += "- 📚 *'Explain Normalization / Transactions / Virtual Memory'*\n"
    reply += "- 📄 *'Explain normalization from my notes'*\n"
    reply += "- 📝 *'Start 5-min diagnostic quiz'*"

    return {
        "reply": reply,
        "suggested_actions": ["Add DBMS to my schedule", "What should I study today?", "Explain Normalization", "Take Quiz"],
        "intent": "GENERAL_CHAT"
    }


def get_quiz_questions(subject_name: Optional[str] = None) -> Dict[str, Any]:
    """Returns interactive diagnostic questions with immediate scoring and explanations."""
    sub_key = "dbms"
    if subject_name:
        s_lower = subject_name.lower()
        if "os" in s_lower or "operating" in s_lower:
            sub_key = "os"
        elif "dbms" in s_lower or "database" in s_lower:
            sub_key = "dbms"

    questions = QUIZ_BANKS.get(sub_key, QUIZ_BANKS["dbms"])
    return {
        "subject_name": "Database Management Systems (DBMS)" if sub_key == "dbms" else "Operating Systems (OS)",
        "topic_name": "Core Technical Assessment",
        "questions": questions
    }


def get_intelligent_revision_suggestions(user_id: int, db: Session) -> List[Dict[str, Any]]:
    """Generates spaced repetition revision suggestions (Day 1, Day 3, Day 7)."""
    performances = get_all_subjects_performance(user_id, db)
    suggestions = []

    for p in performances:
        if p["status"] == "Needs Attention":
            suggestions.append({
                "type": "Urgent Revision",
                "subject": p["name"],
                "badge": "🔴 High Priority",
                "title": f"Reinforce {p['name']} Core Concepts",
                "reason": f"Mastery is at {p['performance_score']}%. You have {p['missed_tasks_count']} missed sessions.",
                "action": "Schedule 45m Focused Review"
            })
        elif p["days_to_next_exam"] is not None and p["days_to_next_exam"] <= 7:
            suggestions.append({
                "type": "Exam Impending",
                "subject": p["name"],
                "badge": "⏳ Exam Proximity",
                "title": f"Formula & Theory Polish for {p['name']}",
                "reason": f"Exam is in {p['days_to_next_exam']} days. Active recall test recommended.",
                "action": "Generate Mock Test"
            })

    suggestions.append({
        "type": "Spaced Repetition",
        "subject": "All Subjects",
        "badge": "🧠 Memory Retention",
        "title": "Evening 15-Minute Flash Recall",
        "reason": "Reviewing concepts 24 hours after first study increases 30-day retention by 60%.",
        "action": "Start Quick Quiz"
    })

    return suggestions
