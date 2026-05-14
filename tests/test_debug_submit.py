#!/usr/bin/env python3
"""
调试脚本：检查提交时传入 saveGrowthHistory 的数据
"""

import sqlite3
import json

conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 获取最新记录（recordId=38）
record_id = 38
cursor.execute("""
    SELECT er.id, er.exam_id, er.answers, er.score, er.level, e.course_type
    FROM exam_records er
    JOIN exams e ON er.exam_id = e.id
    WHERE er.id = ?
""", [record_id])
record = cursor.fetchone()

print(f"记录ID={record['id']}, exam_id={record['exam_id']}, course_type={record['course_type']}")
print(f"总分={record['score']}, 等级={record['level']}")

# 解析答案
answers = json.loads(record['answers']) if record['answers'] else []
print(f"\n答案数量: {len(answers)}")

# 获取题目信息
cursor.execute("""
    SELECT eq.sequence, eq.score as exam_score, q.dimension_code, q.knowledge_point, q.answer
    FROM exam_questions eq
    JOIN questions q ON eq.question_id = q.id
    WHERE eq.exam_id = ?
    ORDER BY eq.sequence
""", [record['exam_id']])
questions = cursor.fetchall()

print(f"题目数量: {len(questions)}")

# 模拟 exams.ts 中的维度分数计算
dimension_scores_by_code = {}
for q in questions:
    dim_code = q['dimension_code'] or 'unknown'
    if dim_code not in dimension_scores_by_code:
        dimension_scores_by_code[dim_code] = {'correct': 0, 'total': 0}
    dimension_scores_by_code[dim_code]['total'] += 1

    # 查找学生答案
    student_ans = None
    for ans in answers:
        if str(ans.get('sequence')) == str(q['sequence']):
            student_ans = ans.get('studentAnswer')
            break

    if student_ans == q['answer']:
        dimension_scores_by_code[dim_code]['correct'] += 1

print(f"\n维度分数统计（按题目dimension_code）:")
for code, scores in sorted(dimension_scores_by_code.items()):
    rate = scores['correct'] / scores['total'] * 100 if scores['total'] > 0 else 0
    print(f"  {code}: {scores['correct']}/{scores['total']} = {rate:.1f}%")

# 模拟 getQuestionDimensionMap 映射
question_dim_map = {
    'problem_understanding': 'cognitive',
    'logical_reasoning': 'cognitive',
    'problem_analysis': 'cognitive',
    'concept_understanding': 'cognitive',
    'conceptual_understanding': 'cognitive',
    'code_analysis': 'cognitive',
    'data_analysis': 'cognitive',
    'data_interpretation': 'cognitive',
    'inference': 'cognitive',
    'critical_thinking': 'cognitive',
    'mathematical_reasoning': 'cognitive',
    'pattern_recognition': 'cognitive',
    'spatial_reasoning': 'cognitive',
    'statistical_reasoning': 'cognitive',
    'probability_reasoning': 'cognitive',
    'numerical_pattern': 'cognitive',
    'alternating_pattern': 'cognitive',
    'algorithm_structure': 'cognitive',
    'algorithm_recognition': 'cognitive',
    'algorithm_analysis': 'cognitive',
    'debugging_analysis': 'cognitive',
    'error_analysis': 'cognitive',
    'data_structure_logic': 'cognitive',
    'data_structure_behavior': 'cognitive',
    'problem_solving': 'skill',
    'problem_solving_strategy': 'skill',
    'algorithm_design': 'skill',
    'algorithm_implementation': 'skill',
    'algorithm_application': 'skill',
    'algorithm_execution': 'skill',
    'algorithm_efficiency': 'skill',
    'algorithm_strategy': 'skill',
    'algorithm_selection': 'skill',
    'code_implementation': 'skill',
    'code_execution': 'skill',
    'code_completion': 'skill',
    'code_optimization': 'skill',
    'application': 'skill',
    'application_and_practice': 'skill',
    'concept_application': 'skill',
    'knowledge_application': 'skill',
    'pattern_application': 'skill',
    'data_structure_application': 'skill',
    'data_processing': 'skill',
    'data_representation': 'skill',
    'data_comparison': 'skill',
    'mathematical_application': 'skill',
    'conditional_probability': 'skill',
    'probability_calculation': 'skill',
    'time_calculation': 'skill',
    'time_interval': 'skill',
    'optimization': 'skill',
    'efficiency_optimization': 'skill',
    'attention_to_detail': 'quality',
    'learning_attitude': 'quality',
    'creative_expression': 'quality',
    'technical_knowledge': 'quality',
    'conceptual_knowledge': 'quality',
    'concept_mastery': 'quality',
    'structure_integration': 'quality',
    'creative_thinking': 'innovation',
    'design_thinking': 'innovation',
    'communication': 'collaboration',
    'event_handling': 'collaboration',
    'moral_judgment': 'ethics',
    'responsible_use': 'ethics',
    'learning_ethics': 'ethics',
    'conditional_judgment': 'ethics',
    'error_handling': 'ethics',
    'debugging': 'ethics',
}

# 映射到6大维度
standardized_scores = {}
for dim_code, scores in dimension_scores_by_code.items():
    category = question_dim_map.get(dim_code)
    if category:
        if category not in standardized_scores:
            standardized_scores[category] = {'correct': 0, 'total': 0}
        standardized_scores[category]['correct'] += scores['correct']
        standardized_scores[category]['total'] += scores['total']
    else:
        print(f"⚠️ 未映射的维度代码: {dim_code}")

print(f"\n标准化后的6大维度分数:")
for cat, scores in sorted(standardized_scores.items()):
    rate = scores['correct'] / scores['total'] * 100 if scores['total'] > 0 else 0
    print(f"  {cat}: {scores['correct']}/{scores['total']} = {rate:.1f}%")

# 检查数据库中实际存储的值
cursor.execute("SELECT scores FROM student_growth_history WHERE exam_record_id = ?", [record_id])
gh = cursor.fetchone()
if gh:
    stored_scores = json.loads(gh['scores']) if gh['scores'] else {}
    print(f"\n数据库中存储的scores: {json.dumps(stored_scores, ensure_ascii=False)}")
else:
    print(f"\n⚠️ 没有成长历史记录")

conn.close()
