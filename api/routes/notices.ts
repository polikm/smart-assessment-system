import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/templates', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const templates = await db.all('SELECT * FROM notice_templates ORDER BY created_at DESC');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: '获取模板列表失败' });
  }
});

router.post('/templates', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, type, content, variables, design_config, preview_image } = req.body;

    const result = await db.run(
      'INSERT INTO notice_templates (name, type, content, variables, design_config, preview_image) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, content, JSON.stringify(variables), JSON.stringify(design_config), preview_image]
    );

    res.status(201).json({ id: result.lastID, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建模板失败' });
  }
});

router.put('/templates/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, type, content, variables, design_config, preview_image } = req.body;

    await db.run(
      'UPDATE notice_templates SET name = ?, type = ?, content = ?, variables = ?, design_config = ?, preview_image = ? WHERE id = ?',
      [name, type, content, JSON.stringify(variables), JSON.stringify(design_config), preview_image, req.params.id]
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新模板失败' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { student_id } = req.query;

    let sql = `
      SELECT n.*, s.name as student_name, t.name as template_name, t.design_config as template_design_config
      FROM notices n
      JOIN students_info s ON n.student_id = s.id
      LEFT JOIN notice_templates t ON n.template_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (student_id) {
      sql += ' AND n.student_id = ?';
      params.push(student_id);
    }

    sql += ' ORDER BY n.sent_at DESC';

    const notices = await db.all(sql, params);
    res.json(notices);
  } catch (error: any) {
    console.error('Get notices error:', error.message);
    res.status(500).json({ message: '获取通知列表失败: ' + (error.message || '未知错误') });
  }
});

router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { template_id, student_ids, custom_content, notice_data } = req.body;

    const template = await db.get('SELECT * FROM notice_templates WHERE id = ?', [template_id]);
    if (!template) {
      res.status(404).json({ message: '模板不存在' });
      return;
    }

    const sentNotices = [];
    for (const studentId of student_ids) {
      const student = await db.get('SELECT * FROM students_info WHERE id = ?', [studentId]);
      if (!student) continue;

      const records = await db.all(`
        SELECT er.*, e.course_type
        FROM exam_records er
        JOIN exams e ON er.exam_id = e.id
        WHERE er.student_id = ?
        ORDER BY er.created_at DESC
        LIMIT 1
      `, [studentId]);

      const latestRecord = records[0];
      let content = custom_content || template.content;

      content = content.replace(/\{\{studentName\}\}/g, student.name);
      const courseTypeNameMap: Record<string, string> = {
        aigc: 'AIGC素养',
        python: 'Python编程',
        cpp: 'C++算法',
        scratch: 'Scratch图形化编程',
        math: '数理逻辑',
      };
      content = content.replace(/\{\{courseType\}\}/g, latestRecord ? (courseTypeNameMap[latestRecord.course_type] || '科技') : '科技');
      content = content.replace(/\{\{level\}\}/g, latestRecord ? latestRecord.level : 'N/A');
      content = content.replace(/\{\{score\}\}/g, latestRecord ? latestRecord.score.toString() : 'N/A');

      const studentNoticeData = notice_data || {
        studentName: student.name,
        courseType: latestRecord ? latestRecord.course_type : '',
        courseTypeName: latestRecord ? (courseTypeNameMap[latestRecord.course_type] || '科技') : '科技',
        level: latestRecord ? latestRecord.level : 'N/A',
        score: latestRecord ? latestRecord.score : 0,
        schoolName: template.design_config ? JSON.parse(template.design_config).schoolName : '未来科技学院',
        date: new Date().toLocaleDateString('zh-CN'),
      };

      const result = await db.run(
        'INSERT INTO notices (template_id, student_id, content, notice_data) VALUES (?, ?, ?, ?)',
        [template_id, studentId, content, JSON.stringify(studentNoticeData)]
      );

      sentNotices.push({ id: result.lastID, studentId, studentName: student.name });
    }

    res.json({ message: '发送成功', sentCount: sentNotices.length, notices: sentNotices });
  } catch (error) {
    res.status(500).json({ message: '发送通知失败' });
  }
});

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    await db.run('UPDATE notices SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: '标记已读成功' });
  } catch (error) {
    res.status(500).json({ message: '标记已读失败' });
  }
});

export default router;
