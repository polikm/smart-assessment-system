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

router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, teacher_id, grade } = req.body;

    await db.run(
      'UPDATE classes SET name = ?, teacher_id = ?, grade = ? WHERE id = ?',
      [name, teacher_id, grade, req.params.id]
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新班级失败' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除班级失败' });
  }
});

router.delete('/:id/students/:studentId', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    await db.run(
      'DELETE FROM class_students WHERE class_id = ? AND student_id = ?',
      [req.params.id, req.params.studentId]
    );
    res.json({ message: '移除成功' });
  } catch (error) {
    res.status(500).json({ message: '移除学生失败' });
  }
});

// GET /classes/:id/statistics - 班级测评统计
router.get('/:id/statistics', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const classId = req.params.id;

    const stats = await db.get(`
      SELECT
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT er.id) as total_records,
        AVG(er.score * 100.0 / er.total_score) as avg_score,
        MAX(er.score * 100.0 / er.total_score) as max_score,
        MIN(er.score * 100.0 / er.total_score) as min_score,
        COUNT(CASE WHEN er.level = 'A' THEN 1 END) as a_count,
        COUNT(CASE WHEN er.level = 'B' THEN 1 END) as b_count,
        COUNT(CASE WHEN er.level = 'C' THEN 1 END) as c_count,
        COUNT(CASE WHEN er.level = 'D' THEN 1 END) as d_count
      FROM classes c
      LEFT JOIN class_students cs ON c.id = cs.class_id
      LEFT JOIN students_info s ON cs.student_id = s.id
      LEFT JOIN exam_records er ON s.id = er.student_id
      WHERE c.id = ?
    `, [classId]);

    const studentStats = await db.all(`
      SELECT
        s.id,
        s.name,
        COUNT(er.id) as exam_count,
        AVG(er.score * 100.0 / er.total_score) as avg_score,
        MAX(er.created_at) as last_exam_at
      FROM students_info s
      JOIN class_students cs ON s.id = cs.student_id
      LEFT JOIN exam_records er ON s.id = er.student_id
      WHERE cs.class_id = ?
      GROUP BY s.id
      ORDER BY avg_score DESC
    `, [classId]);

    const recentExams = await db.all(`
      SELECT
        er.id,
        er.score,
        er.total_score,
        er.level,
        er.duration,
        er.created_at,
        e.name as exam_name,
        e.course_type,
        s.name as student_name
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      JOIN students_info s ON er.student_id = s.id
      JOIN class_students cs ON s.id = cs.student_id
      WHERE cs.class_id = ?
      ORDER BY er.created_at DESC
      LIMIT 20
    `, [classId]);

    res.json({
      overview: stats || {},
      students: studentStats || [],
      recentExams: recentExams || [],
    });
  } catch (error: any) {
    console.error('[Class Statistics] Error:', error);
    res.status(500).json({ message: '获取班级统计失败: ' + (error.message || '未知错误') });
  }
});

// GET /classes/:id/reports - 班级报告列表
router.get('/:id/reports', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const classId = req.params.id;

    const reports = await db.all(`
      SELECT
        er.id,
        er.score,
        er.total_score,
        er.level,
        er.report,
        er.recommendations,
        er.created_at,
        e.name as exam_name,
        e.course_type,
        s.name as student_name,
        s.grade
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      JOIN students_info s ON er.student_id = s.id
      JOIN class_students cs ON s.id = cs.student_id
      WHERE cs.class_id = ? AND er.report IS NOT NULL
      ORDER BY er.created_at DESC
      LIMIT 50
    `, [classId]);

    res.json(reports || []);
  } catch (error: any) {
    console.error('[Class Reports] Error:', error);
    res.status(500).json({ message: '获取班级报告失败: ' + (error.message || '未知错误') });
  }
});

export default router;
