import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const students = await db.all(`
      SELECT s.*, u.username, u.status
      FROM students_info s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: '获取学生列表失败' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    let student = await db.get(`
      SELECT s.*, u.username, u.status
      FROM students_info s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `, [req.user!.id]);

    if (!student) {
      const result = await db.run(
        'INSERT INTO students_info (user_id, name) VALUES (?, ?)',
        [req.user!.id, req.user!.name || '']
      );
      student = await db.get(`
        SELECT s.*, u.username, u.status
        FROM students_info s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `, [result.lastID]);
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: '获取学生信息失败' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, gender, birth_date, school, grade, math_score, ai_base, programming_base, awards, username, password, phone, email } = req.body;

    const bcryptjs = await import('bcryptjs');
    const hashedPassword = await bcryptjs.hash(password || '123456', 10);

    const finalUsername = username || `student_${Date.now()}`;

    const userResult = await db.run(
      'INSERT INTO users (username, password, role, name, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
      [finalUsername, hashedPassword, 'student', name, phone || null, email || null]
    );

    await db.run(
      `INSERT INTO students_info (user_id, name, gender, birth_date, school, grade, math_score, ai_base, programming_base, awards, interest_aigc, interest_programming, has_computer, parent_support, learning_time, prior_courses, logical_ability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, null, null, null, null, null)`,
      [userResult.lastID, name, gender || null, birth_date || null, school || null, grade ? parseInt(grade) : null, math_score || null, ai_base || null, programming_base || null, awards || null]
    );

    res.status(201).json({ id: userResult.lastID, message: '创建成功' });
  } catch (error: any) {
    console.error('Create student error:', error);
    res.status(500).json({ message: '创建学生失败: ' + (error.message || '未知错误') });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const student = await db.get(`
      SELECT s.*, u.username, u.status
      FROM students_info s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!student) {
      res.status(404).json({ message: '学生不存在' });
      return;
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: '获取学生信息失败' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const {
      name, gender, birth_date, school, grade,
      math_score, ai_base, programming_base, awards,
      interest_aigc, interest_programming,
      has_computer, parent_support, learning_time,
      prior_courses, logical_ability
    } = req.body;

    console.log('Update student:', req.params.id, req.body);

    await db.run(
      `UPDATE students_info SET
        name = ?, gender = ?, birth_date = ?, school = ?, grade = ?,
        math_score = ?, ai_base = ?, programming_base = ?, awards = ?,
        interest_aigc = ?, interest_programming = ?,
        has_computer = ?, parent_support = ?, learning_time = ?,
        prior_courses = ?, logical_ability = ?
       WHERE id = ?`,
      [
        name || '',
        gender || null,
        birth_date || null,
        school || null,
        grade ? parseInt(grade) : null,
        math_score || null,
        ai_base || null,
        programming_base || null,
        awards || null,
        interest_aigc ? parseInt(interest_aigc) : 0,
        interest_programming ? parseInt(interest_programming) : 0,
        has_computer || null,
        parent_support || null,
        learning_time || null,
        prior_courses || null,
        logical_ability || null,
        req.params.id
      ]
    );

    res.json({ message: '更新成功' });
  } catch (error: any) {
    console.error('Update student error:', error);
    res.status(500).json({ message: '更新学生信息失败: ' + (error.message || '未知错误') });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const studentId = req.params.id;
    const student = await db.get('SELECT user_id, name FROM students_info WHERE id = ?', [studentId]);

    if (!student) {
      res.status(404).json({ message: '学生不存在' });
      return;
    }

    // Check for associated data before deletion
    const examRecords = await db.get('SELECT COUNT(*) as count FROM exam_records WHERE student_id = ?', [studentId]);
    const notices = await db.get('SELECT COUNT(*) as count FROM notices WHERE student_id = ?', [studentId]);
    const classMemberships = await db.get('SELECT COUNT(*) as count FROM class_students WHERE student_id = ?', [studentId]);

    console.log(`[DELETE] Student ${studentId} (${student.name}) has ${examRecords.count} exam records, ${notices.count} notices, ${classMemberships.count} class memberships - these will be CASCADE deleted`);

    // 由于外键约束 ON DELETE CASCADE，删除 users 会自动删除 students_info 及关联记录
    await db.run('DELETE FROM users WHERE id = ?', [student.user_id]);
    console.log(`[DELETE] Student ${studentId} (${student.name}) and all associated data deleted successfully`);

    res.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: '删除学生失败: ' + (error.message || '未知错误') });
  }
});

router.get('/:id/records', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const records = await db.all(`
      SELECT er.*, e.name as exam_name, e.course_type, e.grade as exam_grade,
             s.name as student_name, s.school, s.grade as student_grade
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      JOIN students_info s ON er.student_id = s.id
      WHERE er.student_id = ?
      ORDER BY er.created_at DESC
    `, [req.params.id]);
    res.json(records);
  } catch (error: any) {
    console.error('Get records error:', error);
    res.status(500).json({ message: '获取测评记录失败: ' + (error.message || '未知错误') });
  }
});

export default router;
