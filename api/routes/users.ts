import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const users = await db.all('SELECT id, username, name, role, phone, email, status, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { username, password, name, role, phone, email } = req.body;

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      res.status(400).json({ message: '用户名已存在' });
      return;
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (username, password, role, name, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, role, name, phone, email]
    );

    if (role === 'student') {
      await db.run('INSERT INTO students_info (user_id, name) VALUES (?, ?)', [result.lastID, name]);
    } else if (role === 'teacher') {
      await db.run('INSERT INTO teachers (user_id) VALUES (?)', [result.lastID]);
    }

    res.status(201).json({ id: result.lastID, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建用户失败' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, role, phone, email, status } = req.body;

    await db.run(
      'UPDATE users SET name = ?, role = ?, phone = ?, email = ?, status = ? WHERE id = ?',
      [name, role, phone, email, status, req.params.id]
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新用户失败' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const userId = req.params.id;

    // Check for associated data before deletion
    const studentInfo = await db.get('SELECT id FROM students_info WHERE user_id = ?', [userId]);
    const teacherInfo = await db.get('SELECT id FROM teachers WHERE user_id = ?', [userId]);

    if (studentInfo) {
      const examRecords = await db.get('SELECT COUNT(*) as count FROM exam_records WHERE student_id = ?', [studentInfo.id]);
      const notices = await db.get('SELECT COUNT(*) as count FROM notices WHERE student_id = ?', [studentInfo.id]);
      console.log(`[DELETE] User ${userId} has student record with ${examRecords.count} exam records and ${notices.count} notices - these will be CASCADE deleted`);
    }

    if (teacherInfo) {
      const classes = await db.get('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?', [teacherInfo.id]);
      console.log(`[DELETE] User ${userId} has teacher record with ${classes.count} classes - teacher_id will be SET NULL`);
    }

    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    console.log(`[DELETE] User ${userId} deleted successfully`);
    res.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: '删除用户失败: ' + (error.message || '未知错误') });
  }
});

export default router;
