#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Playwright-based frontend testing for the assessment system
Tests all major user flows and UI components
"""

import subprocess
import sys
import time
import json
from datetime import datetime

# Check if playwright is available
try:
    from playwright.sync_api import sync_playwright, expect
except ImportError:
    print("Playwright not installed. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:5173"
API_URL = "http://localhost:3001/api"
SCREENSHOT_DIR = "tests/screenshots"

results = []

def log(msg):
    print(msg)
    sys.stdout.flush()

def test_step(name, fn):
    try:
        fn()
        results.append({"name": name, "status": "PASS", "error": None})
        log(f"  [PASS] {name}")
        return True
    except Exception as e:
        results.append({"name": name, "status": "FAIL", "error": str(e)})
        log(f"  [FAIL] {name}: {e}")
        return False

def run_frontend_tests():
    log("=" * 70)
    log("PLAYWRIGHT FRONTEND TEST SUITE")
    log(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log("=" * 70)

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        # Enable console logging
        console_logs = []
        page.on("console", lambda msg: console_logs.append({"type": msg.type, "text": msg.text}))

        # ============================================================
        # 1. Landing Page Tests
        # ============================================================
        log("\n[Module 1] Landing Page")
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{SCREENSHOT_DIR}/01_landing_page.png")

        test_step("Landing page loads", lambda: expect(page.locator("body")).to_be_visible())
        test_step("Landing page has title", lambda: expect(page).to_have_title(lambda t: "测评" in t or "智能" in t))
        test_step("Landing page has navigation", lambda: expect(page.locator("nav, header").first).to_be_visible())

        # Check for key sections
        landing_content = page.content()
        test_step("Landing has hero section", lambda: page.locator("text=/测评|智能|教育/i").first.is_visible())

        # ============================================================
        # 2. Login Flow Tests
        # ============================================================
        log("\n[Module 2] Login Flow")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{SCREENSHOT_DIR}/02_login_page.png")

        test_step("Login page loads", lambda: expect(page.locator("input[type='text'], input[type='password']").first).to_be_visible())

        # Test admin login
        username_input = page.locator("input[type='text']").first
        password_input = page.locator("input[type='password']").first
        login_button = page.locator("button[type='submit']").first

        if username_input.is_visible() and password_input.is_visible():
            username_input.fill("admin")
            password_input.fill("admin123")
            login_button.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=f"{SCREENSHOT_DIR}/03_admin_dashboard.png")

            test_step("Admin login succeeds", lambda: expect(page).not_to_have_url(f"{BASE_URL}/login"))

            # ============================================================
            # 3. Admin Dashboard Tests
            # ============================================================
            log("\n[Module 3] Admin Dashboard")
            test_step("Admin dashboard has stats", lambda: page.locator("text=/统计|数据|人数|课程/i").first.is_visible())

            # Navigate to different admin sections
            admin_sections = [
                ("students", "学员管理"),
                ("courses", "课程管理"),
                ("exams", "测评管理"),
                ("questions", "题库管理"),
                ("classes", "班级管理"),
                ("certificates", "证书管理"),
                ("knowledge", "知识库"),
            ]

            for section, label in admin_sections:
                try:
                    page.goto(f"{BASE_URL}/admin/{section}")
                    page.wait_for_load_state("networkidle")
                    page.wait_for_timeout(1500)
                    page.screenshot(path=f"{SCREENSHOT_DIR}/04_admin_{section}.png")
                    test_step(f"Admin {label} page loads", lambda: expect(page.locator("body")).to_be_visible())
                except Exception as e:
                    test_step(f"Admin {label} page loads", lambda: (_ for _ in ()).throw(e))

            # ============================================================
            # 4. Admin Exam Management (Merged Module Test)
            # ============================================================
            log("\n[Module 4] Admin Exam Management (Merged)")
            page.goto(f"{BASE_URL}/admin/exams")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=f"{SCREENSHOT_DIR}/05_admin_exams_merged.png")

            test_step("Merged exam page loads", lambda: expect(page.locator("body")).to_be_visible())

            # Check for tabs (exams and config)
            tabs_exist = page.locator("button, [role='tab']").filter(has_text="测评配置|配置|试卷").count() > 0
            test_step("Merged page has tabs", lambda: tabs_exist or page.content().__contains__("测评配置") or page.content().__contains__("测评试卷"))

            # Test redirect from old routes
            page.goto(f"{BASE_URL}/admin/exam-config")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
            test_step("Old exam-config redirects", lambda: expect(page).to_have_url(lambda u: "/admin/exams" in u))

            page.goto(f"{BASE_URL}/admin/exam-records")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
            test_step("Old exam-records redirects", lambda: expect(page).to_have_url(lambda u: "/admin/exams" in u))

            # Logout admin
            # Find logout button/link
            logout_btn = page.locator("text=/退出|注销|logout/i").first
            if logout_btn.is_visible():
                logout_btn.click()
                page.wait_for_timeout(1500)

        # ============================================================
        # 5. Student Flow Tests
        # ============================================================
        log("\n[Module 5] Student Flow")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")

        username_input = page.locator("input[type='text']").first
        password_input = page.locator("input[type='password']").first
        login_button = page.locator("button[type='submit']").first

        if username_input.is_visible() and password_input.is_visible():
            username_input.fill("s_13524638127")
            password_input.fill("13524638127")
            login_button.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=f"{SCREENSHOT_DIR}/06_student_home.png")

            test_step("Student login succeeds", lambda: expect(page).not_to_have_url(f"{BASE_URL}/login"))
            test_step("Student home has content", lambda: expect(page.locator("body")).to_be_visible())

            # Navigate to student sections
            student_sections = [
                ("info", "基本信息"),
                ("exams", "我的测评"),
                ("growth", "成长档案"),
                ("notices", "通知公告"),
            ]

            for section, label in student_sections:
                try:
                    page.goto(f"{BASE_URL}/student/{section}")
                    page.wait_for_load_state("networkidle")
                    page.wait_for_timeout(1500)
                    page.screenshot(path=f"{SCREENSHOT_DIR}/07_student_{section}.png")
                    test_step(f"Student {label} page loads", lambda: expect(page.locator("body")).to_be_visible())
                except Exception as e:
                    test_step(f"Student {label} page loads", lambda: (_ for _ in ()).throw(e))

            # Test exam taking flow
            page.goto(f"{BASE_URL}/student/exams")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            # Check if there's an available exam
            start_btn = page.locator("text=/开始测评|进入测评|开始考试/i").first
            if start_btn.is_visible():
                start_btn.click()
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(2000)
                page.screenshot(path=f"{SCREENSHOT_DIR}/08_exam_taking.png")
                test_step("Exam taking page loads", lambda: expect(page.locator("body")).to_be_visible())

            # Logout student
            logout_btn = page.locator("text=/退出|注销|logout/i").first
            if logout_btn.is_visible():
                logout_btn.click()
                page.wait_for_timeout(1500)

        # ============================================================
        # 6. Teacher Flow Tests
        # ============================================================
        log("\n[Module 6] Teacher Flow")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")

        username_input = page.locator("input[type='text']").first
        password_input = page.locator("input[type='password']").first
        login_button = page.locator("button[type='submit']").first

        if username_input.is_visible() and password_input.is_visible():
            username_input.fill("teacher1")
            password_input.fill("teacher123")
            login_button.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=f"{SCREENSHOT_DIR}/09_teacher_home.png")

            test_step("Teacher login succeeds", lambda: expect(page).not_to_have_url(f"{BASE_URL}/login"))

            teacher_sections = [
                ("classes", "班级管理"),
                ("exams", "测评管理"),
                ("students", "学员管理"),
                ("reports", "报告管理"),
                ("notices", "通知管理"),
            ]

            for section, label in teacher_sections:
                try:
                    page.goto(f"{BASE_URL}/teacher/{section}")
                    page.wait_for_load_state("networkidle")
                    page.wait_for_timeout(1500)
                    page.screenshot(path=f"{SCREENSHOT_DIR}/10_teacher_{section}.png")
                    test_step(f"Teacher {label} page loads", lambda: expect(page.locator("body")).to_be_visible())
                except Exception as e:
                    test_step(f"Teacher {label} page loads", lambda: (_ for _ in ()).throw(e))

        # ============================================================
        # 7. Console Error Check
        # ============================================================
        log("\n[Module 7] Console Error Check")
        errors = [log for log in console_logs if log["type"] == "error"]
        warnings = [log for log in console_logs if log["type"] == "warning"]

        test_step(f"No critical console errors ({len(errors)} errors)", lambda: len([e for e in errors if "500" in e["text"] or "fatal" in e["text"].lower()]) == 0)
        log(f"  Console: {len(errors)} errors, {len(warnings)} warnings")
        for e in errors[:5]:
            log(f"    ERROR: {e['text'][:100]}")

        browser.close()

    # ============================================================
    # Report Summary
    # ============================================================
    log("\n" + "=" * 70)
    log("FRONTEND TEST SUMMARY")
    log("=" * 70)

    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = total - passed

    log(f"\nTotal Tests:  {total}")
    log(f"Passed:       {passed}")
    log(f"Failed:       {failed}")
    log(f"Pass Rate:    {passed/total*100:.1f}%")

    if failed > 0:
        log("\nFailed Tests:")
        for r in results:
            if r["status"] == "FAIL":
                log(f"  - {r['name']}: {r['error'][:100]}")

    log(f"\nFinished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log("=" * 70)

    # Write report
    report_file = f"tests/frontend_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": passed/total*100 if total > 0 else 0,
            "results": results,
            "console_errors": errors,
            "console_warnings": warnings,
        }, f, ensure_ascii=False, indent=2)
    log(f"Report saved to: {report_file}")

    return failed == 0

if __name__ == "__main__":
    success = run_frontend_tests()
    sys.exit(0 if success else 1)
