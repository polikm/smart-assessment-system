import sqlite3
import bcrypt

# 直接修改数据库重置学生密码
conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
cursor = conn.cursor()

# 查找学生用户
cursor.execute("SELECT u.id, u.username, u.name FROM users u JOIN students_info s ON u.id = s.user_id WHERE u.role = 'student' LIMIT 1")
student = cursor.fetchone()

if student:
    user_id, username, name = student
    print(f"学生: ID={user_id}, username={username}, name={name}")

    # 生成新密码hash
    new_hash = bcrypt.hashpw('123456'.encode(), bcrypt.gensalt(10)).decode()
    cursor.execute("UPDATE users SET password = ? WHERE id = ?", [new_hash, user_id])
    conn.commit()
    print(f"✅ 重置密码成功: {username} -> 123456")

    # 验证
    cursor.execute("SELECT password FROM users WHERE id = ?", [user_id])
    row = cursor.fetchone()
    if row:
        is_valid = bcrypt.checkpw('123456'.encode(), row[0].encode())
        print(f"验证密码: {'✅ 正确' if is_valid else '❌ 错误'}")

conn.close()
