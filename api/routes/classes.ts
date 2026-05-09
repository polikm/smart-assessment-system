import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const classes = await db.all(`
      SELECT c.*, t.user_id as teacher_user_id, u.name as teacher_name
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: '获取班级列表失败' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, teacher_id, grade } = req.body;

    const result = await db.run(
      'INSERT INTO classes (name, teacher_id, grade) VALUES (?, ?, ?)',
      [name, teacher_id, grade]
    );

    res.status(201).json({ id: result.lastID, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建班级失败' });
  }
});

router.get('/:id/students', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const students = await db.all(`
      SELECT s.*, u.username
      FROM class_students cs
      JOIN students_info s ON cs.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE cs.class_id = ?
    `, [req.params.id]);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: '获取班级学生列表失败' });
  }
});

router.post('/:id/students', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { student_id } = req.body;

    await db.run(
      'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)',
      [req.params.id, student_id]
    );

    res.json({ message: '添加成功' });
  } catch (error) {
    res.status(500).json({ message: '添加学生到班级失败' });
  }
});

export default router;
