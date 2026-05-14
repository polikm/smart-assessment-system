#!/usr/bin/env python3
"""
检查数据库中的维度代码映射
"""

import sqlite3
import json

conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=" * 60)
print("assessment_dimensions 表中的维度代码")
print("=" * 60)
cursor.execute("SELECT code, name, category FROM assessment_dimensions ORDER BY code")
for row in cursor.fetchall():
    print(f"  {row['code']}: {row['name']} ({row['category']})")

print("\n" + "=" * 60)
print("course_dimension_weights 表中的映射")
print("=" * 60)
cursor.execute("SELECT course_type, dimension_code, weight FROM course_dimension_weights ORDER BY course_type, dimension_code")
for row in cursor.fetchall():
    print(f"  {row['course_type']}: {row['dimension_code']} (weight={row['weight']})")

print("\n" + "=" * 60)
print("questions 表中实际使用的 dimension_code")
print("=" * 60)
cursor.execute("SELECT DISTINCT dimension_code, COUNT(*) as count FROM questions WHERE dimension_code IS NOT NULL GROUP BY dimension_code ORDER BY count DESC")
for row in cursor.fetchall():
    print(f"  {row['dimension_code']}: {row['count']} 题")

print("\n" + "=" * 60)
print("最新测评的题目维度代码")
print("=" * 60)
cursor.execute("""
    SELECT er.id, eq.sequence, q.dimension_code, q.knowledge_point
    FROM exam_records er
    JOIN exam_questions eq ON er.exam_id = eq.exam_id
    JOIN questions q ON eq.question_id = q.id
    WHERE er.id = (SELECT MAX(id) FROM exam_records)
    ORDER BY eq.sequence
""")
for row in cursor.fetchall():
    print(f"  Q{row['sequence']}: {row['dimension_code']} - {row['knowledge_point']}")

conn.close()
