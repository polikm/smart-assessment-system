import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// 获取学生的证书列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const studentId = req.query.student_id;

    let query = `
      SELECT c.*, s.name as student_name, er.exam_id, er.score as exam_score
      FROM certificates c
      LEFT JOIN students_info s ON c.student_id = s.id
      LEFT JOIN exam_records er ON c.exam_record_id = er.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (studentId) {
      query += ' AND c.student_id = ?';
      params.push(studentId);
    }

    query += ' ORDER BY c.issue_date DESC';

    const certificates = await db.all(query, params);
    res.json(certificates);
  } catch (error) {
    console.error('[Certificates] List error:', error);
    res.status(500).json({ message: '获取证书列表失败' });
  }
});

// 获取单个证书
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const certificate = await db.get(`
      SELECT c.*, s.name as student_name, s.grade, s.school,
             er.exam_id, er.score as exam_score, er.total_score
      FROM certificates c
      LEFT JOIN students_info s ON c.student_id = s.id
      LEFT JOIN exam_records er ON c.exam_record_id = er.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!certificate) {
      return res.status(404).json({ message: '证书不存在' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('[Certificates] Get error:', error);
    res.status(500).json({ message: '获取证书失败' });
  }
});

// 创建证书（管理员）
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { student_id, exam_record_id, course_type, level } = req.body;

    // 生成证书编号
    const date = new Date();
    const certNo = `CERT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    const result = await db.run(
      'INSERT INTO certificates (student_id, exam_record_id, course_type, level, certificate_no) VALUES (?, ?, ?, ?, ?)',
      [student_id, exam_record_id, course_type, level, certNo]
    );

    res.status(201).json({ id: result.lastID, certificate_no: certNo, message: '证书创建成功' });
  } catch (error) {
    console.error('[Certificates] Create error:', error);
    res.status(500).json({ message: '创建证书失败' });
  }
});

// 更新证书状态
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { level, status } = req.body;

    await db.run(
      'UPDATE certificates SET level = COALESCE(?, level), status = COALESCE(?, status) WHERE id = ?',
      [level, status, req.params.id]
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('[Certificates] Update error:', error);
    res.status(500).json({ message: '更新证书失败' });
  }
});

// 删除证书
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('[Certificates] Delete error:', error);
    res.status(500).json({ message: '删除证书失败' });
  }
});

// 获取学生的徽章列表
router.get('/badges/:studentId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const badges = await db.all(`
      SELECT b.*, sb.earned_at
      FROM student_badges sb
      JOIN badges b ON sb.badge_id = b.id
      WHERE sb.student_id = ?
      ORDER BY sb.earned_at DESC
    `, [req.params.studentId]);

    res.json(badges);
  } catch (error) {
    console.error('[Badges] List error:', error);
    res.status(500).json({ message: '获取徽章列表失败' });
  }
});

export default router;
