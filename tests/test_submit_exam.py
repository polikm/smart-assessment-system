#!/usr/bin/env python3
"""
模拟测评提交，验证修复后的数据流
"""

import requests
import json
import time

BASE_URL = "http://localhost:3001"

def login():
    """登录获取token"""
    try:
        import sqlite3
        conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
        cursor = conn.cursor()
        cursor.execute("SELECT u.username FROM users u JOIN students_info s ON u.id = s.user_id WHERE u.role = 'student' LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        if not row:
            print("没有找到学生用户")
            return None

        username = row[0]
        print(f"尝试登录: {username}/123456")

        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": username,
            "password": "123456"
        }, timeout=10)
        print(f"登录状态: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ 登录成功: {username}")
            return data.get("token")
        else:
            print(f"❌ 登录失败: {resp.text[:200]}")
    except Exception as e:
        print(f"登录异常: {e}")
    return None

def get_exams(token):
    """获取试卷列表"""
    try:
        resp = requests.get(f"{BASE_URL}/api/exams", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        if resp.status_code == 200:
            exams = resp.json()
            for exam in exams:
                detail = requests.get(f"{BASE_URL}/api/exams/{exam['id']}", headers={"Authorization": f"Bearer {token}"}, timeout=10)
                if detail.status_code == 200:
                    data = detail.json()
                    if data.get("questions") and len(data["questions"]) > 0:
                        return exam["id"], data["questions"]
    except Exception as e:
        print(f"获取试卷失败: {e}")
    return None, None

def submit_exam(token, exam_id, questions):
    """提交测评"""
    answers = {}
    for q in questions:
        seq = q.get("sequence", q.get("id"))
        options_raw = q.get("options", "[]")
        try:
            options = json.loads(options_raw) if isinstance(options_raw, str) else options_raw
        except:
            options = []

        if options and isinstance(options, list) and len(options) > 0:
            first_opt = options[0]
            if isinstance(first_opt, dict):
                answers[str(seq)] = first_opt.get("value", "A")
            else:
                answers[str(seq)] = str(first_opt)
        else:
            answers[str(seq)] = "A"

    try:
        print(f"提交测评: exam_id={exam_id}, 答案数={len(answers)}")
        resp = requests.post(
            f"{BASE_URL}/api/exams/{exam_id}/submit",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "answers": answers,
                "duration": 300,
                "tab_switch_count": 0,
                "question_times": {}
            },
            timeout=120
        )
        print(f"提交状态: {resp.status_code}")
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"提交失败: {resp.text[:500]}")
    except Exception as e:
        print(f"提交异常: {e}")
    return None

def check_record(record_id):
    """检查测评记录的AI分析"""
    import sqlite3
    conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT er.id, er.score, er.level, er.recommendations, er.created_at,
               e.name as exam_name
        FROM exam_records er
        JOIN exams e ON er.exam_id = e.id
        WHERE er.id = ?
    """, [record_id])
    record = cursor.fetchone()

    if not record:
        print("记录不存在")
        return False

    recs = json.loads(record['recommendations']) if record['recommendations'] else {}
    has_ai = 'aiAnalysis' in recs and recs['aiAnalysis'] and any(recs['aiAnalysis'].values())

    print(f"\n记录ID={record['id']}, {record['exam_name']}, 时间={record['created_at']}")
    print(f"  分数={record['score']}, 等级={record['level']}")
    print(f"  包含aiAnalysis: {has_ai}")

    if has_ai:
        ai_keys = [k for k, v in recs['aiAnalysis'].items() if v]
        print(f"  AI分析字段: {ai_keys}")
        print(f"  ✅ AI分析正常")
    else:
        print(f"  ❌ 缺少AI分析")
        print(f"  recommendations字段: {list(recs.keys())}")

    cursor.execute("SELECT scores FROM student_growth_history WHERE exam_record_id = ?", [record_id])
    gh = cursor.fetchone()
    if gh:
        scores = json.loads(gh['scores']) if gh['scores'] else {}
        print(f"\n  成长历史scores: {json.dumps(scores, ensure_ascii=False)}")
        all_zero = all(v == 0 for v in scores.values())
        if all_zero:
            print(f"  ❌ 成长趋势图分数全为0")
        else:
            print(f"  ✅ 成长趋势图分数正常")
    else:
        print(f"\n  ⚠️ 没有成长历史记录")

    conn.close()
    return has_ai

if __name__ == '__main__':
    print("=" * 60)
    print("测评提交测试")
    print("=" * 60)

    token = login()
    if not token:
        print("登录失败，无法继续测试")
        exit(1)

    exam_id, questions = get_exams(token)
    if not exam_id:
        print("没有可用的试卷")
        exit(1)
    print(f"✅ 获取试卷: exam_id={exam_id}, 题目数={len(questions)}")

    result = submit_exam(token, exam_id, questions)
    if not result:
        print("提交失败")
        exit(1)

    print(f"✅ 提交成功: recordId={result.get('recordId')}")
    recs = result.get('recommendations', {})
    print(f"返回的recommendations字段: {list(recs.keys())}")
    if 'aiAnalysis' in recs:
        ai_keys = [k for k, v in recs['aiAnalysis'].items() if v] if recs['aiAnalysis'] else []
        print(f"返回的aiAnalysis字段: {ai_keys}")

    print("\n等待数据写入数据库...")
    time.sleep(3)

    record_id = result.get('recordId')
    success = check_record(record_id)

    if success:
        print("\n✅ 测试通过")
        exit(0)
    else:
        print("\n❌ 测试失败")
        exit(1)
