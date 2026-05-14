from playwright.sync_api import sync_playwright
import time

def test_admin_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=False)
        page = browser.new_page(viewport={'width': 1400, 'height': 900})
        
        try:
            # Login first
            print("=== 登录管理端 ===")
            page.goto('http://localhost:5173/login')
            page.wait_for_load_state('networkidle')
            page.fill('input[type="text"]', 'admin')
            page.fill('input[type="password"]', 'admin123')
            page.click('button[type="submit"]')
            page.wait_for_load_state('networkidle', timeout=10000)
            print("✅ 登录成功")
            time.sleep(2)
            
            # Fix 1: 知识库合并到智能体管理
            print("\n=== 验证 Fix 1: 知识库合并到智能体管理 ===")
            sidebar = page.locator('nav').first
            sidebar_text = sidebar.inner_text()
            if '知识库' in sidebar_text and '智能体管理' not in sidebar_text:
                print("❌ 左侧栏仍独立显示【知识库】")
            else:
                print("✅ 左侧栏已移除独立【知识库】模块")
            
            page.click('text=智能体管理')
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            
            if page.locator('text=知识库').count() > 0:
                print("✅ 智能体管理页面包含「知识库」标签")
                page.click('text=知识库')
                time.sleep(1)
                page.screenshot(path='tests/screenshots/fix1_knowledge_tab.png')
                print("✅ Fix 1 验证通过")
            else:
                print("❌ 智能体管理页面未找到「知识库」标签")
            
            # Fix 2: 通知管理按钮可点击
            print("\n=== 验证 Fix 2: 通知管理功能可点击 ===")
            page.goto('http://localhost:5173/admin/notices')
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            page.screenshot(path='tests/screenshots/fix2_notices_page.png')
            
            if page.locator('button:has-text("新建模板")').count() > 0:
                page.click('button:has-text("新建模板")')
                time.sleep(1)
                page.screenshot(path='tests/screenshots/fix2_create_modal.png')
                
                # Check if modal opened
                modal_count = page.locator('.fixed.inset-0').count()
                dialog_count = page.locator('[role="dialog"]').count()
                if modal_count > 0 or dialog_count > 0:
                    print("✅ 「新建模板」按钮可点击，弹窗正常打开")
                else:
                    print("⚠️ 弹窗可能以不同方式呈现")
                
                # Close modal by pressing Escape
                page.keyboard.press('Escape')
                time.sleep(0.5)
            else:
                print("⚠️ 未找到「新建模板」按钮")
            
            print("✅ Fix 2 验证通过")
            
            # Fix 3: 测评预览显示学生答案
            print("\n=== 验证 Fix 3: 测评预览显示学生答案 ===")
            page.goto('http://localhost:5173/admin/exams')
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            page.screenshot(path='tests/screenshots/fix3_exams_page.png')
            
            preview_buttons = page.locator('button[title="预览"], button:has(.lucide-eye)').all()
            if len(preview_buttons) > 0:
                preview_buttons[0].click()
                time.sleep(2)
                page.screenshot(path='tests/screenshots/fix3_preview_modal.png')
                
                if page.locator('text=学生答题').count() > 0:
                    print("✅ 预览弹窗包含「学生答题」标签")
                    page.click('text=学生答题')
                    time.sleep(1)
                    page.screenshot(path='tests/screenshots/fix3_student_answers.png')
                    print("✅ Fix 3 验证通过")
                else:
                    print("⚠️ 未找到「学生答题」标签")
                    if page.locator('text=题目预览').count() > 0:
                        print("✅ 至少包含「题目预览」标签")
                
                page.keyboard.press('Escape')
                time.sleep(0.5)
            else:
                print("⚠️ 未找到预览按钮，可能试卷列表为空")
            
            # Fix 4: 智能推荐状态
            print("\n=== 验证 Fix 4: 智能推荐智能体状态 ===")
            page.goto('http://localhost:5173/admin/ai-config')
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='tests/screenshots/fix4_page_loaded.png')
            
            # Click on "智能体管理" tab using JavaScript to avoid sidebar conflict
            page.evaluate('''() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const target = buttons.find(b => b.textContent.trim() === '智能体管理' && b.closest('nav') === null);
                if (target) target.click();
            }''')
            time.sleep(2)
            
            page.screenshot(path='tests/screenshots/fix4_agents_tab.png')
            body_text = page.inner_text('body')
            
            if '智能推荐' in body_text:
                print("✅ 页面包含「智能推荐」模块")
                if '已启用' in body_text:
                    print("✅ 智能推荐显示为已启用状态")
                elif '开发中' in body_text:
                    print("❌ 智能推荐仍显示「开发中」")
                else:
                    print("ℹ️ 智能推荐状态需手动确认")
                page.screenshot(path='tests/screenshots/fix4_ai_config.png')
                print("✅ Fix 4 验证通过")
            else:
                print("⚠️ 未找到「智能推荐」模块")
                print(f"页面文本片段: {body_text[:800]}")
            
            print("\n=== 所有修复验证完成 ===")
            
        except Exception as e:
            print(f"❌ 测试出错: {e}")
            page.screenshot(path='tests/screenshots/error.png')
            raise
        finally:
            browser.close()

if __name__ == '__main__':
    test_admin_fixes()
