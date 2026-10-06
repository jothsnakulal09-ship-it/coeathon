import sys
import urllib.request
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(endpoint: str, method: str = "GET", data: dict = None, token: str = None):
    url = f"{BASE_URL}{endpoint}"
    body = json.dumps(data).encode("utf-8") if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise Exception(f"HTTP {e.code} Error: {err_msg}")

def test_ai_scheduling_cases():
    print("==========================================================================")
    print("TESTING AI STUDY COACH INTENT CLASSIFICATION & ADAPTIVE SCHEDULING")
    print("==========================================================================\n")

    # Login demo user
    login_res = make_req("/auth/login", "POST", {
        "email": "student@aiplanner.edu",
        "password": "password123"
    })
    token = login_res["access_token"]
    print(f"[OK] Authenticated demo student: student@aiplanner.edu\n")

    # Case 0: The user's exact issue: 'i have to add database system to my schedule'
    print("--- Testing Issue Case: 'i have to add database system to my schedule' ---")
    res0 = make_req("/ai/chat", "POST", {
        "messages": [{"role": "user", "content": "i have to add database system to my schedule"}]
    }, token)
    print(f"Intent: {res0.get('intent')}")
    print(f"Action Taken: {res0.get('action_taken')}")
    print(f"Reply:\n{res0['reply']}\n")
    assert res0.get("intent") == "SCHEDULE", f"Expected SCHEDULE, got {res0.get('intent')}"
    assert "added to your study plan" in res0["reply"], "Expected added to study plan in reply"
    assert "Database Management Systems" in res0["reply"], "Expected DBMS in reply"
    assert "Found in your uploaded notes" not in res0["reply"], "Should NOT search notes for scheduling"
    print("[PASS] Case 0 passed: Natural language scheduling detected and executed without note search!\n")

    # Case 1: 'Add DBMS to my schedule'
    print("--- Testing Case 1: 'Add DBMS to my schedule' ---")
    res1 = make_req("/ai/chat", "POST", {
        "messages": [{"role": "user", "content": "Add DBMS to my schedule"}]
    }, token)
    print(f"Intent: {res1.get('intent')}")
    print(f"Reply:\n{res1['reply']}\n")
    assert res1.get("intent") == "SCHEDULE"
    assert "DBMS has been added to your study plan" in res1["reply"] or "Database Management Systems" in res1["reply"]
    assert "Found in your uploaded notes" not in res1["reply"]
    print("[PASS] Case 1 passed!\n")

    # Case 2: 'Schedule DBMS for 2 hours today'
    print("--- Testing Case 2: 'Schedule DBMS for 2 hours today' ---")
    res2 = make_req("/ai/chat", "POST", {
        "messages": [{"role": "user", "content": "Schedule DBMS for 2 hours today"}]
    }, token)
    print(f"Intent: {res2.get('intent')}")
    print(f"Duration: {res2.get('scheduled_task', {}).get('duration_minutes')} minutes")
    print(f"Reply:\n{res2['reply']}\n")
    assert res2.get("intent") == "SCHEDULE"
    assert "2 hours" in res2["reply"]
    assert res2.get("scheduled_task", {}).get("duration_minutes") == 120
    print("[PASS] Case 2 passed!\n")

    # Case 3: 'Explain normalization from my notes'
    print("--- Testing Case 3: 'Explain normalization from my notes' ---")
    res3 = make_req("/ai/chat", "POST", {
        "messages": [{"role": "user", "content": "Explain normalization from my notes"}]
    }, token)
    print(f"Intent: {res3.get('intent')}")
    print(f"Reply snippet:\n{res3['reply'][:250]}...\n")
    assert res3.get("intent") == "NOTES_QUERY"
    assert "Found in your uploaded notes" in res3["reply"] or "Normalization" in res3["reply"]
    print("[PASS] Case 3 passed: RAG properly invoked for notes query!\n")

    # Case 4: 'What should I study today?'
    print("--- Testing Case 4: 'What should I study today?' ---")
    res4 = make_req("/ai/chat", "POST", {
        "messages": [{"role": "user", "content": "What should I study today?"}]
    }, token)
    print(f"Intent: {res4.get('intent')}")
    print(f"Reply snippet:\n{res4['reply'][:250]}...\n")
    assert res4.get("intent") == "GENERAL_CHAT"
    assert "Recommended Study Strategy for Today" in res4["reply"]
    print("[PASS] Case 4 passed!\n")

    # Case 5: 'Reschedule my missed DBMS task'
    print("--- Testing Case 5: 'Reschedule my missed DBMS task' ---")
    # First, mark a DBMS task as missed to simulate a missed task
    tasks = make_req("/tasks", "GET", token=token)
    dbms_task = next((t for t in tasks if "DBMS" in t["title"] or "Database" in t["title"]), None)
    if dbms_task:
        make_req(f"/tasks/{dbms_task['id']}/status?status=Missed", "PUT", token=token)
    
    res5 = make_req("/ai/chat", "POST", {
        "messages": [{"role": "user", "content": "Reschedule my missed DBMS task"}]
    }, token)
    print(f"Intent: {res5.get('intent')}")
    print(f"Action Taken: {res5.get('action_taken')}")
    print(f"Reply:\n{res5['reply']}\n")
    assert res5.get("intent") == "RESCHEDULE"
    print("[PASS] Case 5 passed: Missed task adaptively rescheduled!\n")

    # Case 6: Non-existent subject
    print("--- Testing Non-Existent Subject: 'Schedule Quantum Computing tomorrow' ---")
    res6 = make_req("/ai/chat", "POST", {
        "messages": [{"role": "user", "content": "Schedule Quantum Computing tomorrow"}]
    }, token)
    print(f"Intent: {res6.get('intent')}")
    print(f"Action Taken: {res6.get('action_taken')}")
    print(f"Reply:\n{res6['reply']}\n")
    assert res6.get("intent") == "SCHEDULE"
    assert "I couldn't find Quantum Computing in your subjects. Would you like me to add it as a new subject?" in res6["reply"]
    print("[PASS] Case 6 passed: Unknown subject asks user to add it!\n")

    print("==========================================================================")
    print("ALL TEST CASES PASSED SUCCESSFULLY!")
    print("==========================================================================")

if __name__ == "__main__":
    test_ai_scheduling_cases()
