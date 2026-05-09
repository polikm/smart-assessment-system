import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// 获取课程列表（支持筛选）
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { course_type, grade_range, status } = req.query;

    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params: any[] = [];

    if (course_type) {
      sql += ' AND course_type = ?';
      params.push(course_type);
    }
    if (grade_range) {
      sql += ' AND grade_range = ?';
      params.push(grade_range);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const courses = await db.all(sql, params);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: '获取课程列表失败' });
  }
});

// 获取课程详情（包含开班计划）
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const course = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);

    if (!course) {
      res.status(404).json({ message: '课程不存在' });
      return;
    }

    const schedules = await db.all(
      'SELECT * FROM course_schedules WHERE course_id = ? ORDER BY start_date ASC',
      [req.params.id]
    );

    res.json({ ...course, schedules });
  } catch (error) {
    res.status(500).json({ message: '获取课程详情失败' });
  }
});

// 创建课程（admin/teacher）
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, course_type, grade_range, description, syllabus, target_audience, total_hours, price, class_mode, location, course_objectives, matching_events, start_date } = req.body;

    const result = await db.run(
      `INSERT INTO courses (name, course_type, grade_range, description, syllabus, target_audience, total_hours, price, class_mode, location, course_objectives, matching_events, start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, course_type, grade_range, description || '', syllabus || '[]', target_audience || '', total_hours || 0, price || 0, class_mode || 'offline', location || '', course_objectives || '', matching_events || '', start_date || '']
    );

    res.status(201).json({ id: result.lastID, message: '课程创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建课程失败' });
  }
});

// 更新课程（admin/teacher）
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, course_type, grade_range, description, syllabus, target_audience, total_hours, price, status, class_mode, location, course_objectives, matching_events, start_date } = req.body;

    await db.run(
      `UPDATE courses SET name = ?, course_type = ?, grade_range = ?, description = ?, syllabus = ?, target_audience = ?, total_hours = ?, price = ?, status = ?, class_mode = ?, location = ?, course_objectives = ?, matching_events = ?, start_date = ?
       WHERE id = ?`,
      [name, course_type, grade_range, description, syllabus, target_audience, total_hours, price, status, class_mode || 'offline', location || '', course_objectives || '', matching_events || '', start_date || '', req.params.id]
    );

    res.json({ message: '课程更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新课程失败' });
  }
});

// 删除课程（admin）
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const courseId = req.params.id;

    // Check for associated schedules
    const schedules = await db.get('SELECT COUNT(*) as count FROM course_schedules WHERE course_id = ?', [courseId]);
    if (schedules.count > 0) {
      console.log(`[DELETE] Course ${courseId} has ${schedules.count} schedules - these will be CASCADE deleted`);
    }

    await db.run('DELETE FROM courses WHERE id = ?', [courseId]);
    console.log(`[DELETE] Course ${courseId} deleted successfully`);
    res.json({ message: '课程删除成功' });
  } catch (error: any) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: '删除课程失败: ' + (error.message || '未知错误') });
  }
});

// ========== 开班计划API ==========

// 获取某课程的开班计划
router.get('/:id/schedules', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const schedules = await db.all(
      'SELECT * FROM course_schedules WHERE course_id = ? ORDER BY start_date ASC',
      [req.params.id]
    );
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: '获取开班计划失败' });
  }
});

// 创建开班计划（admin/teacher）
router.post('/:id/schedules', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const courseId = req.params.id;
    const { name, teacher, start_date, end_date, schedule_time, location, capacity } = req.body;

    const result = await db.run(
      `INSERT INTO course_schedules (course_id, name, teacher, start_date, end_date, schedule_time, location, capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, name, teacher || '', start_date || '', end_date || '', schedule_time || '', location || '', capacity || 20]
    );

    res.status(201).json({ id: result.lastID, message: '开班计划创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建开班计划失败' });
  }
});

// 更新开班计划（admin/teacher）
router.put('/schedules/:scheduleId', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, teacher, start_date, end_date, schedule_time, location, capacity, enrolled, status } = req.body;

    await db.run(
      `UPDATE course_schedules SET name = ?, teacher = ?, start_date = ?, end_date = ?, schedule_time = ?, location = ?, capacity = ?, enrolled = ?, status = ?
       WHERE id = ?`,
      [name, teacher, start_date, end_date, schedule_time, location, capacity, enrolled, status, req.params.scheduleId]
    );

    res.json({ message: '开班计划更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新开班计划失败' });
  }
});

// 删除开班计划（admin/teacher）
router.delete('/schedules/:scheduleId', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM course_schedules WHERE id = ?', [req.params.scheduleId]);
    res.json({ message: '开班计划删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除开班计划失败' });
  }
});

export default router;
