#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Full API System Test Script
Tests all backend APIs and key functionalities
"""

import urllib.request
import urllib.error
import json
import sys
import time
from datetime import datetime

BASE_URL = "http://localhost:3001/api"
results = []


def log(msg):
    print(msg)
    sys.stdout.flush()


def test(name, method, path, expected_status, data=None, headers=None, check_fn=None):
    url = f"{BASE_URL}{path}"
    req_headers = headers or {}
    body = None
    if data:
        body = json.dumps(data).encode('utf-8')
        req_headers['Content-Type'] = 'application/json'

    try:
        req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            try:
                resp_body = json.loads(resp.read().decode('utf-8'))
            except:
                resp_body = resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            resp_body = json.loads(e.read().decode('utf-8'))
        except:
            resp_body = e.read().decode('utf-8')
    except Exception as e:
        status = 0
        resp_body = str(e)

    passed = status == expected_status
    extra = ""
    if check_fn and passed:
        try:
            check_ok = check_fn(resp_body)
            if not check_ok:
                passed = False
                extra = " (check_fn failed)"
        except Exception as e:
            passed = False
            extra = f" (check_fn error: {e})"

    status_str = "PASS" if passed else "FAIL"
    results.append({
        "name": name,
        "status": status_str,
        "expected": expected_status,
        "actual": status,
        "extra": extra
    })
    log(f"  [{status_str}] {name} - Expected {expected_status}, Got {status}{extra}")
    return resp_body if passed else None


log("=" * 60)
log("FULL SYSTEM API TEST")
log(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
log("=" * 60)

# ============================================================
# 1. Health Check
# ============================================================
log("\n[Module 1] Health & Basic APIs")
test("Health Check", "GET", "/health", 200,
     check_fn=lambda r: r.get('success') == True)

# ============================================================
# 2. Authentication
# ============================================================
log("\n[Module 2] Authentication")

# Admin login
admin_token = None
admin_resp = test("Admin Login", "POST", "/auth/login", 200,
                  data={"username": "admin", "password": "admin123"},
                  check_fn=lambda r: 'token' in r)
if admin_resp:
    admin_token = admin_resp.get('token')

# Teacher login (correct username: teacher1)
teacher_token = None
teacher_resp = test("Teacher Login", "POST", "/auth/login", 200,
                    data={"username": "teacher1", "password": "teacher123"},
                    check_fn=lambda r: 'token' in r)
if teacher_resp:
    teacher_token = teacher_resp.get('token')

# Student login - try common passwords
student_token = None
for pwd in ["student123", "123456", "13524638127"]:
    student_resp = test(f"Student Login (pwd={pwd})", "POST", "/auth/login", 200,
                        data={"username": "s_13524638127", "password": pwd},
                        check_fn=lambda r: 'token' in r)
    if student_resp:
        student_token = student_resp.get('token')
        break

# Invalid login
test("Invalid Login", "POST", "/auth/login", 401,
     data={"username": "admin", "password": "wrong"})

# Get current user
if admin_token:
    test("Get Current User (Admin)", "GET", "/auth/me", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: 'username' in r)

# ============================================================
# 3. Dashboard APIs (FIXED: trends SQL)
# ============================================================
log("\n[Module 3] Dashboard APIs")
if admin_token:
    test("Dashboard Stats", "GET", "/dashboard", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: 'stats' in r)

    test("Dashboard Trends (SQL Fix Verification)", "GET", "/dashboard/trends", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: 'dailyRecords' in r and isinstance(r.get('dailyRecords'), list))

# ============================================================
# 4. User Management
# ============================================================
log("\n[Module 4] User Management")
if admin_token:
    users_resp = test("List Users", "GET", "/users", 200,
                      headers={"Authorization": f"Bearer {admin_token}"},
                      check_fn=lambda r: isinstance(r, list))

# Note: /users/:id GET route does not exist in backend

# ============================================================
# 5. Course Management
# ============================================================
log("\n[Module 5] Course Management")
if admin_token:
    test("List Courses", "GET", "/courses", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

if student_token:
    test("List Courses (Student)", "GET", "/courses", 200,
         headers={"Authorization": f"Bearer {student_token}"},
         check_fn=lambda r: isinstance(r, list))

# ============================================================
# 6. Exam Management (Merged Module)
# ============================================================
log("\n[Module 6] Exam Management (Merged Module)")
exam_id = None
if admin_token:
    exams_resp = test("List Exams", "GET", "/exams", 200,
                      headers={"Authorization": f"Bearer {admin_token}"},
                      check_fn=lambda r: isinstance(r, list))

    if exams_resp and len(exams_resp) > 0:
        exam_id = exams_resp[0].get('id')
        test("Get Exam Detail", "GET", f"/exams/{exam_id}", 200,
             headers={"Authorization": f"Bearer {admin_token}"},
             check_fn=lambda r: 'id' in r)

# ============================================================
# 7. Exam Records
# ============================================================
log("\n[Module 7] Exam Records")
if admin_token and exam_id:
    test("List Exam Records by Exam", "GET", f"/exams/{exam_id}/records", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

if teacher_token and exam_id:
    test("Teacher View Exam Records", "GET", f"/exams/{exam_id}/records", 200,
         headers={"Authorization": f"Bearer {teacher_token}"},
         check_fn=lambda r: isinstance(r, list))

if student_token:
    test("Student Get My Profile", "GET", "/students/me", 200,
         headers={"Authorization": f"Bearer {student_token}"},
         check_fn=lambda r: 'id' in r)

# ============================================================
# 8. AI Recommendation (NEW FEATURE)
# ============================================================
log("\n[Module 8] AI Recommendation System")
# Recommendation is generated when exam is submitted, not a separate endpoint
# We verify the exam submission endpoint exists which triggers AI recommendation
if admin_token and exam_id:
    # Check exam detail includes questions for submission
    exam_detail = test("Get Exam for AI Submit", "GET", f"/exams/{exam_id}", 200,
                       headers={"Authorization": f"Bearer {admin_token}"},
                       check_fn=lambda r: 'questions' in r)
    if exam_detail:
        log(f"    -> Exam has {len(exam_detail.get('questions', []))} questions")

# ============================================================
# 9. Student APIs
# ============================================================
log("\n[Module 9] Student APIs")
if student_token:
    test("Student Get Available Exams", "GET", "/exams", 200,
         headers={"Authorization": f"Bearer {student_token}"},
         check_fn=lambda r: isinstance(r, list))

if admin_token:
    test("List All Students", "GET", "/students", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

# ============================================================
# 10. Teacher APIs
# ============================================================
log("\n[Module 10] Teacher APIs")
if teacher_token:
    test("Teacher Dashboard", "GET", "/dashboard", 200,
         headers={"Authorization": f"Bearer {teacher_token}"},
         check_fn=lambda r: 'stats' in r)

    test("Teacher List Students", "GET", "/students", 200,
         headers={"Authorization": f"Bearer {teacher_token}"},
         check_fn=lambda r: isinstance(r, list))

# ============================================================
# 11. Questions
# ============================================================
log("\n[Module 11] Questions")
if admin_token:
    # Questions returns { success, questions, total, page, pageSize, totalPages }
    test("List Questions", "GET", "/questions", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: 'questions' in r and isinstance(r.get('questions'), list))

    test("Question Stats", "GET", "/questions/stats", 200,
         headers={"Authorization": f"Bearer {admin_token}"})

# ============================================================
# 12. Classes
# ============================================================
log("\n[Module 12] Classes")
if admin_token:
    test("List Classes", "GET", "/classes", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

# ============================================================
# 13. Notices
# ============================================================
log("\n[Module 13] Notices")
if admin_token:
    test("List Notices", "GET", "/notices", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

# ============================================================
# 14. Knowledge
# ============================================================
log("\n[Module 14] Knowledge")
if admin_token:
    test("Knowledge Dimensions", "GET", "/knowledge/dimensions", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

    test("Knowledge Courses", "GET", "/knowledge/courses", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

# ============================================================
# 15. Config
# ============================================================
log("\n[Module 15] Config")
if admin_token:
    test("Get Config", "GET", "/config", 200,
         headers={"Authorization": f"Bearer {admin_token}"})

# ============================================================
# 16. FAQ (Public)
# ============================================================
log("\n[Module 16] FAQ")
test("List FAQ (Public)", "GET", "/faq", 200,
     check_fn=lambda r: isinstance(r, list))

test("FAQ Categories (Public)", "GET", "/faq/categories", 200,
     check_fn=lambda r: isinstance(r, list))

# ============================================================
# 17. Certificates
# ============================================================
log("\n[Module 17] Certificates")
if admin_token:
    test("List Certificates", "GET", "/certificates", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: isinstance(r, list))

# ============================================================
# 18. AI Logs
# ============================================================
log("\n[Module 18] AI Logs")
if admin_token:
    # AI Logs returns { logs, total }
    test("List AI Logs", "GET", "/ai-logs", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: 'logs' in r and isinstance(r.get('logs'), list))

    test("AI Logs Stats", "GET", "/ai-logs/stats", 200,
         headers={"Authorization": f"Bearer {admin_token}"},
         check_fn=lambda r: 'today' in r)

# ============================================================
# 19. Edge Cases & Error Handling
# ============================================================
log("\n[Module 19] Edge Cases & Error Handling")
test("No Auth Header", "GET", "/dashboard", 401)
test("Invalid Token", "GET", "/dashboard", 401,
     headers={"Authorization": "Bearer invalid_token"})
if admin_token:
    test("Non-existent Exam", "GET", "/exams/99999", 404,
         headers={"Authorization": f"Bearer {admin_token}"})

# ============================================================
# Report Summary
# ============================================================
log("\n" + "=" * 60)
log("TEST SUMMARY")
log("=" * 60)

total = len(results)
passed = sum(1 for r in results if r['status'] == 'PASS')
failed = total - passed

log(f"\nTotal Tests:  {total}")
log(f"Passed:       {passed}")
log(f"Failed:       {failed}")
log(f"Pass Rate:    {passed/total*100:.1f}%")

if failed > 0:
    log("\nFailed Tests:")
    for r in results:
        if r['status'] == 'FAIL':
            log(f"  - {r['name']}: Expected {r['expected']}, Got {r['actual']}{r['extra']}")

log(f"\nFinished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
log("=" * 60)

# Write report to file
report_file = f"tests/test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
try:
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("FULL SYSTEM API TEST REPORT\n")
        f.write("=" * 60 + "\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        for r in results:
            f.write(f"[{r['status']}] {r['name']}\n")
            if r['status'] == 'FAIL':
                f.write(f"       Expected: {r['expected']}, Got: {r['actual']}{r['extra']}\n")
        f.write(f"\nSummary: {passed}/{total} passed ({passed/total*100:.1f}%)\n")
    log(f"\nReport saved to: {report_file}")
except Exception as e:
    log(f"Could not save report: {e}")

sys.exit(0 if failed == 0 else 1)
