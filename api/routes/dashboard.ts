import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();

    const totalStudents = await db.get('SELECT COUNT(*) as count FROM students_info');
    const totalTeachers = await db.get('SELECT COUNT(*) as count FROM teachers');
    const totalQuestions = await db.get('SELECT COUNT(*) as count FROM questions');
    const totalExams = await db.get('SELECT COUNT(*) as count FROM exams');
    const totalRecords = await db.get('SELECT COUNT(*) as count FROM exam_records');

    const recentRecords = await db.all(`
      SELECT er.*, s.name as student_name, e.name as exam_name
      FROM exam_records er
      JOIN students_info s ON er.student_id = s.id
      JOIN exams e ON er.exam_id = e.id
      ORDER BY er.created_at DESC
      LIMIT 10
    `);

    const levelDistribution = await db.all(`
      SELECT level, COUNT(*) as count
      FROM exam_records
      GROUP BY level
    `);

    res.json({
      stats: {
        totalStudents: totalStudents.count,
        totalTeachers: totalTeachers.count,
        totalQuestions: totalQuestions.count,
        totalExams: totalExams.count,
        totalRecords: totalRecords.count,
      },
      recentRecords,
      levelDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: '获取仪表盘数据失败' });
  }
});

export default router;
