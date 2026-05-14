#!/usr/bin/env python3
"""
深度诊断脚本：模拟后端计算过程，找出问题根因
"""

import sqlite3
import json

def diagnose_growth_history_calc():
    """诊断成长历史分数计算过程"""
    print("=" * 70)
    print("诊断1: 模拟 saveGrowthHistory 计算过程")
    print("=" * 70)

    conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 获取最新的测评记录
    cursor.execute("""
        SELECT er.id, er.exam_id, er.answers, e.course_type, er.created_at
        FROM exam_records er
        JOIN exams e ON er.exam_id = e.id
        ORDER BY er.created_at DESC
        LIMIT 1
    """)
    record = cursor.fetchone()

    if not record:
        print("没有找到测评记录")
        return

    exam_id = record['exam_id']
    answers_json = record['answers']
    course_type = record['course_type']

    print(f"测评记录ID: {record['id']}, 课程类型: {course_type}")
    print(f"时间: {record['created_at']}")

    # 解析答题答案
    try:
        answers = json.loads(answers_json) if isinstance(answers_json, str) else answers_json
    except:
        answers = []

    print(f"答题数量: {len(answers)}")

    # 获取题目信息
    cursor.execute("""
        SELECT eq.sequence, eq.score as exam_score, q.dimension_code, q.knowledge_point, q.answer
        FROM exam_questions eq
        JOIN questions q ON eq.question_id = q.id
        WHERE eq.exam_id = ?
        ORDER BY eq.sequence
    """, [exam_id])
    questions = cursor.fetchall()

    print(f"试卷题目数量: {len(questions)}")

    # 模拟 inferDimensionFromKnowledgePoint
    def infer_dimension(kp):
        kp_lower = (kp or '').lower()
        if '理解' in kp_lower or '分析' in kp_lower or '问题' in kp_lower: return 'COG_UNDERSTANDING'
        if '推理' in kp_lower or '逻辑' in kp_lower or '判断' in kp_lower: return 'COG_REASONING'
        if '迁移' in kp_lower or '应用' in kp_lower: return 'COG_TRANSFER'
        if '基础' in kp_lower or '操作' in kp_lower or '工具' in kp_lower: return 'SKL_BASIC'
        if '进阶' in kp_lower or '综合' in kp_lower or '解决' in kp_lower: return 'SKL_APPLICATION'
        if '效率' in kp_lower or '质量' in kp_lower or '速度' in kp_lower: return 'SKL_EFFICIENCY'
        if '专注' in kp_lower or '细心' in kp_lower or '注意' in kp_lower: return 'QLT_ATTENTION'
        if '表达' in kp_lower or '创意' in kp_lower or '沟通' in kp_lower: return 'QLT_EXPRESSION'
        if '态度' in kp_lower or '潜力' in kp_lower or '积极性' in kp_lower: return 'QLT_ATTITUDE'
        if '创新' in kp_lower or '创造' in kp_lower: return 'INN_CREATIVITY'
        if '探索' in kp_lower or '好奇' in kp_lower: return 'INN_EXPLORATION'
        if '设计' in kp_lower or '迭代' in kp_lower or '优化' in kp_lower: return 'INN_DESIGN'
        if '团队' in kp_lower or '协作' in kp_lower or '合作' in kp_lower: return 'COL_TEAMWORK'
        if '分享' in kp_lower or '互助' in kp_lower: return 'COL_SHARING'
        if '伦理' in kp_lower or '道德' in kp_lower: return 'ETH_AWARENESS'
        if '安全' in kp_lower or '责任' in kp_lower or '隐私' in kp_lower: return 'ETH_RESPONSIBILITY'
        if '人文' in kp_lower or '价值' in kp_lower: return 'ETH_HUMANISTIC'
        return 'COG_UNDERSTANDING'

    # 构建 dimensionScoresByCode
    dimension_scores_by_code = {}
    for q in questions:
        dim_code = q['dimension_code'] or infer_dimension(q['knowledge_point'])
        if dim_code not in dimension_scores_by_code:
            dimension_scores_by_code[dim_code] = {'correct': 0, 'total': 0}
        dimension_scores_by_code[dim_code]['total'] += 1

        # 查找学生答案
        student_ans = None
        for ans in answers:
            if ans.get('sequence') == q['sequence']:
                student_ans = ans.get('studentAnswer')
                break

        if student_ans == q['answer']:
            dimension_scores_by_code[dim_code]['correct'] += 1

    print(f"\n维度分数统计（按维度代码）:")
    for code, scores in sorted(dimension_scores_by_code.items()):
        rate = scores['correct'] / scores['total'] * 100 if scores['total'] > 0 else 0
        print(f"  {code}: {scores['correct']}/{scores['total']} = {rate:.1f}%")

    # 模拟 aggregateCategoryScores
    fallback_map = {
        'COG_UNDERSTANDING': 'cognitive', 'COG_REASONING': 'cognitive', 'COG_TRANSFER': 'cognitive',
        'SKL_BASIC': 'skill', 'SKL_APPLICATION': 'skill', 'SKL_EFFICIENCY': 'skill',
        'QLT_ATTENTION': 'quality', 'QLT_EXPRESSION': 'quality', 'QLT_ATTITUDE': 'quality',
        'INN_CREATIVITY': 'innovation', 'INN_EXPLORATION': 'innovation', 'INN_DESIGN': 'innovation',
        'COL_EXPRESSION': 'collaboration', 'COL_TEAMWORK': 'collaboration', 'COL_SHARING': 'collaboration',
        'ETH_AWARENESS': 'ethics', 'ETH_RESPONSIBILITY': 'ethics', 'ETH_HUMANISTIC': 'ethics',
    }

    def aggregate_category(scores, category, dim_map):
        codes = [code for code, cat in dim_map.items() if cat == category]
        total = 0
        max_score = 0
        for code in codes:
            if code in scores:
                total += scores[code]['correct']
                max_score += scores[code]['total']
        return {'total': total, 'max': max_score}

    cognitive = aggregate_category(dimension_scores_by_code, 'cognitive', fallback_map)
    skill = aggregate_category(dimension_scores_by_code, 'skill', fallback_map)
    quality = aggregate_category(dimension_scores_by_code, 'quality', fallback_map)
    innovation = aggregate_category(dimension_scores_by_code, 'innovation', fallback_map)
    collaboration = aggregate_category(dimension_scores_by_code, 'collaboration', fallback_map)
    ethics = aggregate_category(dimension_scores_by_code, 'ethics', fallback_map)

    print(f"\n聚合后的6大维度:")
    print(f"  cognitive: {cognitive['total']}/{cognitive['max']}")
    print(f"  skill: {skill['total']}/{skill['max']}")
    print(f"  quality: {quality['total']}/{quality['max']}")
    print(f"  innovation: {innovation['total']}/{innovation['max']}")
    print(f"  collaboration: {collaboration['total']}/{collaboration['max']}")
    print(f"  ethics: {ethics['total']}/{ethics['max']}")

    cognitive_score = round(cognitive['total'] / cognitive['max'] * 100) if cognitive['max'] > 0 else 0
    skill_score = round(skill['total'] / skill['max'] * 100) if skill['max'] > 0 else 0
    quality_score = round(quality['total'] / quality['max'] * 100) if quality['max'] > 0 else 0
    innovation_score = round(innovation['total'] / innovation['max'] * 100) if innovation['max'] > 0 else 0
    collaboration_score = round(collaboration['total'] / collaboration['max'] * 100) if collaboration['max'] > 0 else 0
    ethics_score = round(ethics['total'] / ethics['max'] * 100) if ethics['max'] > 0 else 0

    print(f"\n计算出的6大维度分数:")
    print(f"  cognitive={cognitive_score}, skill={skill_score}, quality={quality_score}")
    print(f"  innovation={innovation_score}, collaboration={collaboration_score}, ethics={ethics_score}")

    # 检查数据库中实际存储的值
    cursor.execute("SELECT scores FROM student_growth_history WHERE exam_record_id = ?", [record['id']])
    gh = cursor.fetchone()
    if gh:
        stored_scores = json.loads(gh['scores']) if isinstance(gh['scores'], str) else gh['scores']
        print(f"\n数据库中实际存储的scores: {json.dumps(stored_scores, ensure_ascii=False)}")

        # 对比
        expected = {
            'cognitive': cognitive_score, 'skill': skill_score, 'quality': quality_score,
            'innovation': innovation_score, 'collaboration': collaboration_score, 'ethics': ethics_score
        }
        if stored_scores == expected:
            print("✅ 数据库中的值与计算结果一致")
        else:
            print("❌ 数据库中的值与计算结果不一致！")
            print(f"  期望值: {json.dumps(expected, ensure_ascii=False)}")
    else:
        print("\n⚠️ 没有找到对应的成长历史记录")

    conn.close()


def diagnose_ai_analysis():
    """诊断AI分析数据"""
    print("\n" + "=" * 70)
    print("诊断2: AI分析数据检查")
    print("=" * 70)

    conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 获取最新的4条记录（应该是没有AI分析的）
    cursor.execute("""
        SELECT er.id, er.score, er.level, er.recommendations, er.created_at,
               e.name as exam_name, e.course_type
        FROM exam_records er
        JOIN exams e ON er.exam_id = e.id
        ORDER BY er.created_at DESC
        LIMIT 4
    """)
    records = cursor.fetchall()

    for r in records:
        recs = json.loads(r['recommendations']) if isinstance(r['recommendations'], str) else r['recommendations']
        has_ai = 'aiAnalysis' in recs and recs['aiAnalysis'] and any(recs['aiAnalysis'].values())

        print(f"\n记录ID={r['id']}, {r['exam_name']}, {r['created_at']}")
        print(f"  分数={r['score']}, 等级={r['level']}")
        print(f"  包含aiAnalysis字段: {'aiAnalysis' in recs}")

        if 'aiAnalysis' in recs:
            ai = recs['aiAnalysis']
            if isinstance(ai, dict):
                content_keys = [k for k, v in ai.items() if v]
                print(f"  AI分析有内容的字段: {content_keys}")
                if not content_keys:
                    print(f"  ❌ AI分析字段存在但全部为空！")
                    print(f"  AI分析原始内容: {json.dumps(ai, ensure_ascii=False)[:200]}")
            else:
                print(f"  ❌ aiAnalysis不是字典: {type(ai)}")
        else:
            print(f"  ❌ 缺少aiAnalysis字段")
            print(f"  recommendations中的字段: {list(recs.keys())}")

    conn.close()


if __name__ == '__main__':
    diagnose_growth_history_calc()
    diagnose_ai_analysis()
