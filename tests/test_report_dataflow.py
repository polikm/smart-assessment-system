#!/usr/bin/env python3
"""
测试脚本：验证测评报告数据流
1. 成长趋势图数据流 - 检查 student_growth_history 表中的 scores 字段
2. AI分析数据流 - 检查 exam_records 表中的 recommendations 字段是否包含 aiAnalysis
"""

import sqlite3
import json
import sys

def test_growth_history_data():
    """测试成长趋势图数据：检查 student_growth_history 表的 scores 字段"""
    print("=" * 60)
    print("测试1: 成长趋势图数据流")
    print("=" * 60)

    conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 获取所有成长历史记录
    cursor.execute("""
        SELECT sgh.id, sgh.student_id, sgh.course_type, sgh.scores, sgh.comparison,
               sgh.created_at, e.name as exam_name
        FROM student_growth_history sgh
        JOIN exam_records er ON sgh.exam_record_id = er.id
        JOIN exams e ON er.exam_id = e.id
        ORDER BY sgh.created_at DESC
        LIMIT 10
    """)
    records = cursor.fetchall()

    if not records:
        print("❌ 没有找到成长历史记录")
        return False

    print(f"找到 {len(records)} 条成长历史记录\n")

    all_valid = True
    for r in records:
        scores_str = r['scores']
        student_id = r['student_id']
        course_type = r['course_type']
        created_at = r['created_at']

        print(f"记录ID={r['id']}, 学生ID={student_id}, 课程={course_type}, 时间={created_at}")

        # 解析 scores
        try:
            if isinstance(scores_str, str):
                scores = json.loads(scores_str)
            else:
                scores = scores_str
        except Exception as e:
            print(f"  ❌ scores 解析失败: {e}")
            all_valid = False
            continue

        if not isinstance(scores, dict):
            print(f"  ❌ scores 不是字典类型，而是 {type(scores)}")
            all_valid = False
            continue

        # 检查6大维度分数
        dimensions = ['cognitive', 'skill', 'quality', 'innovation', 'collaboration', 'ethics']
        dim_scores = {d: scores.get(d, 0) for d in dimensions}

        print(f"  维度分数: {dim_scores}")

        # 检查是否全为0
        all_zero = all(v == 0 for v in dim_scores.values())
        if all_zero:
            print(f"  ❌ 所有维度分数都是0！")
            all_valid = False

            # 诊断：检查原始 scores 内容
            print(f"  原始scores内容: {json.dumps(scores, ensure_ascii=False)[:200]}")
        else:
            total = sum(dim_scores.values())
            avg = total / 6
            print(f"  ✅ 平均分数: {avg:.1f}")

        print()

    conn.close()

    if all_valid:
        print("✅ 所有成长历史记录的维度分数都正常\n")
    else:
        print("❌ 发现维度分数为0的记录，需要修复\n")

    return all_valid


def test_ai_analysis_data():
    """测试AI分析数据：检查 exam_records 表的 recommendations 字段"""
    print("=" * 60)
    print("测试2: AI分析数据流")
    print("=" * 60)

    conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 获取最新的测评记录
    cursor.execute("""
        SELECT er.id, er.student_id, er.score, er.level, er.recommendations,
               er.created_at, e.name as exam_name, e.course_type
        FROM exam_records er
        JOIN exams e ON er.exam_id = e.id
        ORDER BY er.created_at DESC
        LIMIT 10
    """)
    records = cursor.fetchall()

    if not records:
        print("❌ 没有找到测评记录")
        return False

    print(f"找到 {len(records)} 条测评记录\n")

    all_valid = True
    for r in records:
        rec_id = r['id']
        recommendations_str = r['recommendations']
        exam_name = r['exam_name']
        created_at = r['created_at']

        print(f"记录ID={rec_id}, 测评={exam_name}, 时间={created_at}")

        if not recommendations_str:
            print(f"  ❌ recommendations 字段为空")
            all_valid = False
            continue

        # 解析 recommendations
        try:
            if isinstance(recommendations_str, str):
                recs = json.loads(recommendations_str)
            else:
                recs = recommendations_str
        except Exception as e:
            print(f"  ❌ recommendations 解析失败: {e}")
            all_valid = False
            continue

        if not isinstance(recs, dict):
            print(f"  ❌ recommendations 不是字典类型，而是 {type(recs)}")
            all_valid = False
            continue

        # 检查是否包含 AI 分析
        has_ai_analysis = 'aiAnalysis' in recs and recs['aiAnalysis'] and isinstance(recs['aiAnalysis'], dict)
        has_learning_plan = 'learningPlan' in recs and recs['learningPlan']
        has_class_rec = 'classRecommendation' in recs and recs['classRecommendation']

        print(f"  包含 aiAnalysis: {has_ai_analysis}")
        print(f"  包含 learningPlan: {has_learning_plan}")
        print(f"  包含 classRecommendation: {has_class_rec}")

        if has_ai_analysis:
            ai_keys = list(recs['aiAnalysis'].keys())
            print(f"  AI分析字段: {ai_keys}")
            # 检查是否有内容
            has_content = any(recs['aiAnalysis'].get(k) for k in ai_keys if k != 'resources')
            if has_content:
                print(f"  ✅ AI分析有内容")
            else:
                print(f"  ⚠️ AI分析字段存在但内容为空")
        else:
            print(f"  ❌ 缺少 aiAnalysis 字段！")
            all_valid = False

        # 显示原始内容的前200字符用于诊断
        raw_str = json.dumps(recs, ensure_ascii=False)
        if len(raw_str) < 100:
            print(f"  原始内容: {raw_str}")
        print()

    conn.close()

    if all_valid:
        print("✅ 所有测评记录都包含AI分析\n")
    else:
        print("❌ 发现缺少AI分析的测评记录\n")

    return all_valid


def test_student_growth_api_response():
    """模拟前端API返回的数据格式"""
    print("=" * 60)
    print("测试3: 模拟前端接收到的 studentGrowth API 数据")
    print("=" * 60)

    conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 模拟 knowledge.ts 中的查询和解析逻辑
    cursor.execute("""
        SELECT sgh.*, e.name as exam_name, e.course_type
        FROM student_growth_history sgh
        JOIN exam_records er ON sgh.exam_record_id = er.id
        JOIN exams e ON er.exam_id = e.id
        ORDER BY sgh.created_at DESC
        LIMIT 3
    """)
    records = cursor.fetchall()

    print(f"模拟API返回 {len(records)} 条记录\n")

    for r in records:
        scores_raw = r['scores']
        comparison_raw = r['comparison']

        # 模拟 knowledge.ts 第193-196行的解析逻辑
        try:
            if isinstance(scores_raw, str):
                scores_parsed = json.loads(scores_raw or '{}')
            else:
                scores_parsed = scores_raw or {}
        except:
            scores_parsed = {}

        print(f"记录ID={r['id']}, 学生ID={r['student_id']}")
        print(f"  原始scores类型: {type(scores_raw)}")
        print(f"  解析后scores类型: {type(scores_parsed)}")
        print(f"  解析后scores内容: {json.dumps(scores_parsed, ensure_ascii=False)}")

        # 模拟前端 parseScores 函数
        def parseScores(scores):
            if scores and isinstance(scores, dict):
                return scores
            if isinstance(scores, str):
                try:
                    return json.loads(scores)
                except:
                    return {}
            return {}

        parsed = parseScores(scores_parsed)
        print(f"  前端parseScores结果: {json.dumps(parsed, ensure_ascii=False)}")
        print(f"  cognitive={parsed.get('cognitive', 'N/A')}, skill={parsed.get('skill', 'N/A')}")
        print()

    conn.close()
    return True


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("测评报告数据流测试脚本")
    print("=" * 60 + "\n")

    result1 = test_growth_history_data()
    result2 = test_ai_analysis_data()
    result3 = test_student_growth_api_response()

    print("=" * 60)
    print("测试总结")
    print("=" * 60)
    print(f"成长趋势图数据: {'✅ 通过' if result1 else '❌ 失败'}")
    print(f"AI分析数据: {'✅ 通过' if result2 else '❌ 失败'}")
    print(f"API数据格式: {'✅ 通过' if result3 else '❌ 失败'}")

    if not result1 or not result2:
        sys.exit(1)
    sys.exit(0)
