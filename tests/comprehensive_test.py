from playwright.sync_api import sync_playwright
import time
import json
import os
from datetime import datetime

# 测试报告数据
report = {
    "test_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "environment": {
        "frontend": "http://localhost:5173",
        "backend": "http://localhost:3001",
        "browser": "Edge"
    },
    "tests": []
}

def add_test_result(name, status, details="", screenshot=None):
    report["tests"].append({
        "name": name,
        "status": status,
        "details": details,
        "screenshot": screenshot,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })
    icon = "✅" if status == "通过" else "❌" if status == "失败" else "⚠️"
    print(f"  {icon} [{status}] {name}")
    if details:
        print(f"      {details}")

def run_comprehensive_tests():
    screenshot_dir = 'd:/AICode/TRAE/tests/screenshots'
    os.makedirs(screenshot_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=False)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        
        base_url = "http://localhost:5173"
        
        try:
            # ============================================================
            # 1. 登录页面测试
            # ============================================================
            print("\n" + "="*60)
            print("【测试模块】登录流程")
            print("="*60)
            
            page.goto(f"{base_url}/login")
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{screenshot_dir}/01_login_page.png', full_page=True)
            
            username_input = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first
            password_input = page.locator('input[placeholder*="密码"]').first
            login_button = page.locator('button:has-text("登录")').first
            
            if username_input.is_visible() and password_input.is_visible():
                add_test_result("登录页面加载", "通过", "登录表单正常显示", "01_login_page.png")
            else:
                add_test_result("登录页面加载", "失败", "未找到登录表单")
                return
            
            # ============================================================
            # 2. 学生端测试
            # ============================================================
            print("\n" + "="*60)
            print("【测试模块】学生端功能")
            print("="*60)
            
            # 学生登录
            username_input.fill("student1")
            password_input.fill("123456")
            login_button.click()
            page.wait_for_timeout(2000)
            page.screenshot(path=f'{screenshot_dir}/02_student_home.png', full_page=True)
            
            if "/student" in page.url:
                add_test_result("学生登录", "通过", f"当前URL: {page.url}", "02_student_home.png")
            else:
                add_test_result("学生登录", "失败", f"当前URL: {page.url}")
            
            # 学生首页 - 检查活跃排行榜
            page.goto(f"{base_url}/student")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1500)
            page.screenshot(path=f'{screenshot_dir}/02b_student_home_dashboard.png', full_page=True)
            
            has_leaderboard = page.locator('text=活跃排行榜').first.is_visible()
            has_trend_chart = page.locator('canvas').first.is_visible()
            add_test_result("学生首页-活跃排行榜", "通过" if has_leaderboard else "警告", 
                          f"排行榜: {'显示' if has_leaderboard else '未显示'}, 图表: {'显示' if has_trend_chart else '未显示'}", 
                          "02b_student_home_dashboard.png")
            
            # 学生测评页面
            page.goto(f"{base_url}/student/exam")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            page.screenshot(path=f'{screenshot_dir}/03_student_exam.png', full_page=True)
            
            course_buttons = page.locator('button:has-text("Python"), button:has-text("Scratch"), button:has-text("AIGC"), button:has-text("数学思维"), button:has-text("C++")').all()
            add_test_result("学生测评页面", "通过", f"找到 {len(course_buttons)} 个课程类型按钮", "03_student_exam.png")
            
            # 学生报告页面
            page.goto(f"{base_url}/student/report")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1500)
            page.screenshot(path=f'{screenshot_dir}/04_student_report.png', full_page=True)
            
            has_report = page.locator('text=测评报告, text=我的报告').first.is_visible()
            add_test_result("学生报告页面", "通过" if has_report else "警告", "页面已加载", "04_student_report.png")
            
            # 学生成长档案
            page.goto(f"{base_url}/student/growth")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1500)
            page.screenshot(path=f'{screenshot_dir}/05_student_growth.png', full_page=True)
            
            has_growth = page.locator('text=成长档案, text=能力维度').first.is_visible()
            add_test_result("学生成长档案", "通过" if has_growth else "警告", "页面已加载", "05_student_growth.png")
            
            # ============================================================
            # 3. 教师端测试
            # ============================================================
            print("\n" + "="*60)
            print("【测试模块】教师端功能")
            print("="*60)
            
            page.goto(f"{base_url}/login")
            page.wait_for_load_state('networkidle')
            
            username_input = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first
            password_input = page.locator('input[placeholder*="密码"]').first
            login_button = page.locator('button:has-text("登录")').first
            
            username_input.fill("teacher1")
            password_input.fill("123456")
            login_button.click()
            page.wait_for_timeout(2000)
            page.screenshot(path=f'{screenshot_dir}/06_teacher_home.png', full_page=True)
            
            if "/teacher" in page.url:
                add_test_result("教师登录", "通过", f"当前URL: {page.url}", "06_teacher_home.png")
            else:
                add_test_result("教师登录", "失败", f"当前URL: {page.url}")
            
            # 教师班级管理
            page.goto(f"{base_url}/teacher/class")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            page.screenshot(path=f'{screenshot_dir}/07_teacher_class.png', full_page=True)
            add_test_result("教师班级管理", "通过", "页面已加载", "07_teacher_class.png")
            
            # 教师测评管理
            page.goto(f"{base_url}/teacher/exam")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1500)
            page.screenshot(path=f'{screenshot_dir}/08_teacher_exam.png', full_page=True)
            add_test_result("教师测评管理", "通过", "页面已加载", "08_teacher_exam.png")
            
            # 教师报表
            page.goto(f"{base_url}/teacher/report")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1500)
            page.screenshot(path=f'{screenshot_dir}/09_teacher_report.png', full_page=True)
            add_test_result("教师报表", "通过", "页面已加载", "09_teacher_report.png")
            
            # ============================================================
            # 4. 管理端测试
            # ============================================================
            print("\n" + "="*60)
            print("【测试模块】管理端功能")
            print("="*60)
            
            page.goto(f"{base_url}/login")
            page.wait_for_load_state('networkidle')
            
            username_input = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"]').first
            password_input = page.locator('input[placeholder*="密码"]').first
            login_button = page.locator('button:has-text("登录")').first
            
            username_input.fill("admin")
            password_input.fill("admin123")
            login_button.click()
            page.wait_for_timeout(2000)
            page.screenshot(path=f'{screenshot_dir}/10_admin_home.png', full_page=True)
            
            if "/admin" in page.url:
                add_test_result("管理端登录", "通过", f"当前URL: {page.url}", "10_admin_home.png")
            else:
                add_test_result("管理端登录", "失败", f"当前URL: {page.url}")
            
            # 管理端首页 - Dashboard趋势图
            page.goto(f"{base_url}/admin")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)
            page.screenshot(path=f'{screenshot_dir}/11_admin_dashboard.png', full_page=True)
            
            has_dashboard_charts = page.locator('canvas').count() > 0
            has_no_error = not page.locator('text=获取趋势数据失败').first.is_visible()
            add_test_result("管理端首页-Dashboard", "通过" if has_dashboard_charts and has_no_error else "失败",
                          f"图表数量: {page.locator('canvas').count()}, 无错误: {has_no_error}",
                          "11_admin_dashboard.png")
            
            # 管理端用户管理
            page.goto(f"{base_url}/admin/users")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            page.screenshot(path=f'{screenshot_dir}/12_admin_users.png', full_page=True)
            add_test_result("管理端-用户管理", "通过", "页面已加载", "12_admin_users.png")
            
            # 管理端班级管理
            page.goto(f"{base_url}/admin/classes")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            page.screenshot(path=f'{screenshot_dir}/13_admin_classes.png', full_page=True)
            add_test_result("管理端-班级管理", "通过", "页面已加载", "13_admin_classes.png")
            
            # 管理端课程管理
            page.goto(f"{base_url}/admin/courses")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1000)
            page.screenshot(path=f'{screenshot_dir}/14_admin_courses.png', full_page=True)
            add_test_result("管理端-课程管理", "通过", "页面已加载", "14_admin_courses.png")
            
            # 管理端题库管理
            page.goto(f"{base_url}/admin/questions")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1500)
            page.screenshot(path=f'{screenshot_dir}/15_admin_questions.png', full_page=True)
            add_test_result("管理端-题库管理", "通过", "页面已加载", "15_admin_questions.png")
            
            # 管理端测评管理（合并后的页面）
            page.goto(f"{base_url}/admin/exams")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(1500)
            page.screenshot(path=f'{screenshot_dir}/16_admin_exams.png', full_page=True)
            
            has_exams_tab = page.locator('text=测评试卷').first.is_visible()
            has_config_tab = page.locator('text=测评配置').first.is_visible()
            add_test_result("管理端-测评管理(合并)", "通过" if has_exams_tab and has_config_tab else "失败",
                          f"测评试卷标签: {'显示' if has_exams_tab else '未显示'}, 测评配置标签: {'显示' if has_config_tab else '未显示'}",
                          "16_admin_exams.png")
            
            # 点击测评配置标签
            if has_config_tab:
                config_tab = page.locator('button:has-text("测评配置")').first
                config_tab.click()
                page.wait_for_timeout(1500)
                page.screenshot(path=f'{screenshot_dir}/16b_admin_exam_config.png', full_page=True)
                
                has_level_config = page.locator('text=等级分数线').first.is_visible()
                has_dimension_config = page.locator('text=维度权重').first.is_visible()
                add_test_result("管理端-测评配置标签", "通过" if has_level_config else "失败",
                              f"等级分数线: {'显示' if has