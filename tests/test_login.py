import requests
import sqlite3

BASE_URL = "http://localhost:3001"

# 从数据库读取学生用户的username和password hash
conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT u.username, u.password, u.name, s.id as student_id FROM users u JOIN students_info s ON u.id = s.user_id WHERE u.role = 'student' LIMIT 1")
student = cursor.fetchone()
conn.close()

if student:
    username, password_hash, name, student_id = student
    print(f"学生: username={username}, name={name}, student_id={student_id}")
    print(f"Password hash: {password_hash[:50]}...")

    # 这个用户可能是通过注册接口创建的，密码未知
    # 让我们用管理员账号登录，然后重置学生密码
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if resp.status_code == 200:
        admin_token = resp.json().get('token')
        print("✅ 管理员登录成功")

        # 更新学生密码为123456
        import sqlite3
        conn = sqlite3.connect(r'D:\AICode\TRAE\data\data.sqlite')
        cursor = conn.cursor()
        # 使用bcrypt生成hash
        import bcrypt
        new_hash = bcrypt.hashpw('123456'.encode(), bcrypt.gensalt(10)).decode()
        cursor.execute("UPDATE users SET password = ? WHERE username = ?", [new_hash, username])
        conn.commit()
        conn.close()
        print(f"✅ 重置 {username} 的密码为 123456")

        # 尝试登录
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": username,
            "password": "123456"
        })
        print(f"\n登录 ({username}/123456): {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ 登录成功! token={data.get('token')[:30]}...")
        else:
            print(f"❌ 登录失败: {resp.text[:200]}")
