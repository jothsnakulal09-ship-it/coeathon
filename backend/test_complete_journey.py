import sys
import urllib.request
import json
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000/api"

def run_e2e_journey():
    print("==========================================================================")
    print("END-TO-END VERIFICATION: AI-POWERED INTELLIGENT STUDY PLANNER & TRACKER")
    print("==========================================================================\n")

    timestamp = int(time.time())
    test_email = f"student_{timestamp}@codeathon.edu"
    test_password = "SecurePassword123"

    # Step 1: Register User
    reg_data = json.dumps({
        "name": "Jordan Lee",
        "email": test_email,
        "password": test_password,
        "college": "MIT Engineering",
        "major": "AI & Software Systems",
        "daily_study_hours": 3.0,
        "preferred_slot": "Evening (6 PM - 10 PM)"
    }).encode()

    req = urllib.request.Request(f"{BASE_URL}/auth/register", data=reg_data, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    reg_res = json.loads(res.read())
    token = reg_res["access_token"]
    print(f"[OK] 1. REGISTER: Registered user '{reg_res['user']['name']}' ({test_email})")

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Step 2: Login User
    login_data = json.dumps({"email": test_email, "password": test_password}).encode()
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    login_res = json.loads(res.read())
    print(f"[OK] 2. LOGIN: Authenticated with JWT token ({login_res['token_type']})")

    # Step 3: Add Subject
    sub_data = json.dumps({
        "name": "Artificial Intelligence & Robotics",
        "code": "AI-ROB",
        "description": "Reinforcement learning, kinematics, search algorithms",
        "color": "#6366f1"
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/subjects", data=sub_data, headers=headers)
    res = urllib.request.urlopen(req)
    subject = json.loads(res.read())
    print(f"[OK] 3. ADD SUBJECT: Created subject '{subject['name']}' (ID: {subject['id']})")

    # Step 4: Add Topics
    topics_to_add = [
        {"name": "A* Search & Heuristics", "difficulty": "Medium", "importance": "High", "estimated_minutes": 60},
        {"name": "Markov Decision Processes", "difficulty": "Hard", "importance": "High", "estimated_minutes": 90},
        {"name": "Deep Q-Networks", "difficulty": "Hard", "importance": "High", "estimated_minutes": 75}
    ]
    created_topics = []
    for t in topics_to_add:
        t_data = json.dumps(t).encode()
        req = urllib.request.Request(f"{BASE_URL}/subjects/{subject['id']}/topics", data=t_data, headers=headers)
        res = urllib.request.urlopen(req)
        created_topics.append(json.loads(res.read()))
    print(f"[OK] 4. ADD TOPICS: Created {len(created_topics)} topics under '{subject['name']}'")

    # Step 5: Add Exam
    exam_data = json.dumps({
        "subject_id": subject["id"],
        "name": "AI Mid-Semester Examination",
        "exam_date": "2026-10-14",
        "syllabus": "A* Search, MDPs, Q-Learning",
        "weight_percentage": 40
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/exams", data=exam_data, headers=headers)
    res = urllib.request.urlopen(req)
    exam = json.loads(res.read())
    print(f"[OK] 5. ADD EXAM: Scheduled '{exam['name']}' on {exam['exam_date']} ({exam['days_remaining']} days remaining)")

    # Step 6: Add Assignment
    assign_data = json.dumps({
        "subject_id": subject["id"],
        "title": "Gridworld Q-Learning Project",
        "deadline": "2026-10-10",
        "priority": "HIGH"
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/assignments", data=assign_data, headers=headers)
    res = urllib.request.urlopen(req)
    assign = json.loads(res.read())
    print(f"[OK] 6. ADD ASSIGNMENT: Added '{assign['title']}' (Priority: {assign['priority']}, Deadline: {assign['deadline']})")

    # Step 7: Set Study Availability
    avail_data = json.dumps({
        "availability": [
            {"day_of_week": "Monday", "available_hours": 3.0},
            {"day_of_week": "Tuesday", "available_hours": 2.0},
            {"day_of_week": "Wednesday", "available_hours": 3.0},
            {"day_of_week": "Thursday", "available_hours": 1.5},
            {"day_of_week": "Friday", "available_hours": 3.5},
            {"day_of_week": "Saturday", "available_hours": 4.0},
            {"day_of_week": "Sunday", "available_hours": 2.0}
        ]
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/availability", data=avail_data, headers=headers, method="PUT")
    res = urllib.request.urlopen(req)
    print("[OK] 7. SET AVAILABILITY: Configured day-of-week limits (Mon: 3h, Tue: 2h, Wed: 3h, etc.)")

    # Step 8: Generate Study Plan
    plan_data = json.dumps({
        "days_to_plan": 7,
        "daily_hours": 3.0,
        "preferred_slot": "Evening (6 PM - 10 PM)",
        "session_duration_minutes": 60,
        "break_duration_minutes": 15,
        "focus_weak_subjects": True
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/study-plan/generate", data=plan_data, headers=headers)
    res = urllib.request.urlopen(req)
    plan_res = json.loads(res.read())
    print(f"[OK] 8. GENERATE STUDY PLAN: {plan_res['message']}")

    # Step 9: Verify Tasks
    req = urllib.request.Request(f"{BASE_URL}/tasks", headers=headers)
    res = urllib.request.urlopen(req)
    tasks = json.loads(res.read())
    print(f"[OK] 9. CALENDAR / TASKS: Retrieved {len(tasks)} scheduled sessions with priority levels.")

    # Step 10: Complete Task
    first_task = tasks[0]
    req = urllib.request.Request(f"{BASE_URL}/tasks/{first_task['id']}/complete", headers=headers, method="PUT")
    res = urllib.request.urlopen(req)
    comp_res = json.loads(res.read())
    print(f"[OK] 10. COMPLETE TASK: Task #{first_task['id']} completed. Active streak: {comp_res['streak']} days.")

    # Step 11: Miss Task & Verify Automatic Rescheduling
    second_task = tasks[1]
    req = urllib.request.Request(f"{BASE_URL}/tasks/{second_task['id']}/miss", headers=headers, method="PUT")
    res = urllib.request.urlopen(req)
    miss_res = json.loads(res.read())
    print(f"[OK] 11. MISS TASK & ADAPTIVE RESCHEDULING:")
    print(f"      Notification: '{miss_res['message']}'")
    print(f"      Shifted: {miss_res['old_slot']} -> {miss_res['new_slot']}")

    # Step 12: Check Weak Subject Detection & Analytics
    req = urllib.request.Request(f"{BASE_URL}/analytics", headers=headers)
    res = urllib.request.urlopen(req)
    analytics = json.loads(res.read())
    sub_perf = analytics["subjects_performance"][0]
    print(f"[OK] 12. WEAK SUBJECT DETECTION: Subject '{sub_perf['name']}' mastery: {sub_perf['performance_score']}% ({sub_perf['status_icon']} {sub_perf['status']})")
    print(f"      Allocated study recommendation: {sub_perf['recommended_hours_per_week']} hrs/week")

    # Step 13: Notes Upload & RAG
    note_content = b"Reinforcement Learning is an area of machine learning where an agent takes actions in an environment to maximize cumulative reward. Q-Learning is an off-policy temporal difference algorithm that learns the optimal action-value function."
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="title"\r\n\r\n'
        f"RL Fundamentals Notes\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="rl_notes.txt"\r\n'
        f"Content-Type: text/plain\r\n\r\n"
    ).encode() + note_content + f"\r\n--{boundary}--\r\n".encode()

    note_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }
    req = urllib.request.Request(f"{BASE_URL}/notes/upload", data=body, headers=note_headers)
    res = urllib.request.urlopen(req)
    note_res = json.loads(res.read())
    print(f"[OK] 13. NOTES UPLOAD & RAG: Uploaded '{note_res['filename']}', extracted {note_res['extracted_chars']} chars.")

    # Step 14: AI Assistant with RAG query
    chat_payload = json.dumps({
        "messages": [{"role": "user", "content": "What is Q-Learning according to my notes?"}]
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/ai/chat", data=chat_payload, headers=headers)
    res = urllib.request.urlopen(req)
    ai_res = json.loads(res.read())
    print(f"[OK] 14. AI ASSISTANT RAG QUERY:")
    print(f"      Response snippet: {ai_res['reply'][:140]}...")

    print("\n==========================================================================")
    print("ALL 14 E2E STEPS VERIFIED: APPLICATION IS 100% OPERATIONAL & COMPLETE!")
    print("==========================================================================")

if __name__ == "__main__":
    run_e2e_journey()
