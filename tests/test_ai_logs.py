#!/usr/bin/env python3
"""
检查AI调用日志
"""

import sqlite3

conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=" * 60)
print("最近的AI调用日志")
print("=" * 60)

cursor.execute("""
    SELECT id, feature, status, error_message, duration_ms, created_at
    FROM ai_usage_logs
    ORDER BY created_at DESC
    LIMIT 20
""")

for row in cursor.fetchall():
    print(f"\nID={row['id']}, 功能={row['feature']}, 状态={row['status']}, 时间={row['created_at']}")
    print(f"  耗时={row['duration_ms']}ms")
    if row['error_message']:
        print(f"  错误: {row['error_message'][:100]}")

print("\n" + "=" * 60)
print("report_analysis 功能的调用情况")
print("=" * 60)

cursor.execute("""
    SELECT status, COUNT(*) as count
    FROM ai_usage_logs
    WHERE feature = 'report_analysis'
    GROUP BY status
""")

for row in cursor.fetchall():
    print(f"  {row['status']}: {row['count']} 次")

print("\n" + "=" * 60)
print("course_recommend 功能的调用情况")
print("=" * 60)

cursor.execute("""
    SELECT status, COUNT(*) as count
    FROM ai_usage_logs
    WHERE feature = 'course_recommend'
    GROUP BY status
""")

for row in cursor.fetchall():
    print(f"  {row['status']}: {row['count']} 次")

conn.close()
