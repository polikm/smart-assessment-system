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

// GET /dashboard/trends - 数据趋势
router.get('/trends', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();

    const dailyRecords = await db.all(`
      SELECT
        date(er.created_at) as date,
        COUNT(*) as count,
        AVG(CASE WHEN e.total_score > 0 THEN er.score * 100.0 / e.total_score ELSE 0 END) as avg_score
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.created_at >= date('now', '-30 days')
      GROUP BY date(er.created_at)
      ORDER BY date
    `);

    const courseDistribution = await db.all(`
      SELECT
        e.course_type,
        COUNT(er.id) as record_count,
        AVG(CASE WHEN e.total_score > 0 THEN er.score * 100.0 / e.total_score ELSE 0 END) as avg_score
      FROM exams e
      LEFT JOIN exam_records er ON e.id = er.exam_id
      GROUP BY e.course_type
    `);

    const gradeDistribution = await db.all(`
      SELECT
        s.grade,
        COUNT(er.id) as record_count,
        AVG(CASE WHEN e.total_score > 0 THEN er.score * 100.0 / e.total_score ELSE 0 END) as avg_score
      FROM students_info s
      LEFT JOIN exam_records er ON s.id = er.student_id
      LEFT JOIN exams e ON er.exam_id = e.id
      WHERE s.grade IS NOT NULL
      GROUP BY s.grade
      ORDER BY s.grade
    `);

    const activeStudents = await db.all(`
      SELECT
        s.id,
        s.name,
        COUNT(er.id) as exam_count,
        AVG(CASE WHEN e.total_score > 0 THEN er.score * 100.0 / e.total_score ELSE 0 END) as avg_score
      FROM students_info s
      LEFT JOIN exam_records er ON s.id = er.student_id
      LEFT JOIN exams e ON er.exam_id = e.id
      GROUP BY s.id
      HAVING exam_count > 0
      ORDER BY exam_count DESC
      LIMIT 10
    `);

    res.json({
      dailyRecords: dailyRecords || [],
      courseDistribution: courseDistribution || [],
      gradeDistribution: gradeDistribution || [],
      activeStudents: activeStudents || [],
    });
  } catch (error: any) {
    console.error('[Dashboard Trends] Error:', error);
    res.status(500).json({ message: '获取趋势数据失败: ' + (error.message || '未知错误') });
  }
});

export default router;
