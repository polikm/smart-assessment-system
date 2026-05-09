import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import { getDb } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password, phone, email } = req.body;
    console.log(`[Login] Attempting login, username=${username}, phone=${phone}, email=${email}`);

    const db = await getDb();
    let user = null;

    if (phone) {
      user = await db.get('SELECT * FROM users WHERE phone = ? AND status = ?', [phone, 'active']);
    } else if (email) {
      user = await db.get('SELECT * FROM users WHERE email = ? AND status = ?', [email, 'active']);
    } else if (username) {
      user = await db.get('SELECT * FROM users WHERE username = ? AND status = ?', [username, 'active']);
    }

    if (!user) {
      console.error(`[Login] User not found: username=${username}, phone=${phone}, email=${email}`);
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }

    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) {
      console.error(`[Login] Invalid password for user: ${username || phone || email}`);
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }

    console.log(`[Login] Login successful: ${user.username}, role=${user.role}`);

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[Login] CRITICAL ERROR:', error);
    res.status(500).json({ message: '登录失败: ' + (error.message || '未知错误') });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role = 'student', phone, email } = req.body;
    const db = await getDb();

    // 判断是否手机号或邮箱注册
    const isPhone = phone && /^\d{11}$/.test(phone);
    const isEmail = email && email.includes('@');

    let finalUsername = username;
    if (!finalUsername) {
      if (isPhone) {
        finalUsername = `s_${phone}`;
      } else if (isEmail) {
        const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        finalUsername = `s_${prefix}_${Math.random().toString(36).substr(2, 4)}`;
      } else {
        finalUsername = `user_${Date.now()}`;
      }
    }

    // 检查用户名是否已存在
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [finalUsername]);
    if (existing) {
      res.status(400).json({ message: '用户名已存在' });
      return;
    }

    // 检查手机号/邮箱是否已注册
    if (isPhone) {
      const existingPhone = await db.get('SELECT id FROM users WHERE phone = ?', [phone]);
      if (existingPhone) {
        res.status(400).json({ message: '该手机号已注册' });
        return;
      }
    }
    if (isEmail) {
      const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail) {
        res.status(400).json({ message: '该邮箱已注册' });
        return;
      }
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (username, password, role, name, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
      [finalUsername, hashedPassword, role, name, phone || null, email || null]
    );

    if (role === 'student') {
      await db.run('INSERT INTO students_info (user_id, name) VALUES (?, ?)', [result.lastID, name]);
    } else if (role === 'teacher') {
      await db.run('INSERT INTO teachers (user_id) VALUES (?)', [result.lastID]);
    }

    res.status(201).json({ message: '注册成功', userId: result.lastID, username: finalUsername });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: '注册失败: ' + (error.message || '未知错误') });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, username, name, role, phone, email FROM users WHERE id = ?', [req.user!.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

export default router;
