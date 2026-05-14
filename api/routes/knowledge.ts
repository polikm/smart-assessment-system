import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/dimensions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { category, course_type } = req.query;

    let sql = 'SELECT * FROM assessment_dimensions WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY category, code';

    const dimensions = await db.all(sql, params);

    if (course_type) {
      for (const dim of dimensions) {
        const applicableCourses = JSON.parse(dim.applicable_courses || '[]');
        dim.is_applicable = applicableCourses.includes(course_type);
      }
    }

    res.json(dimensions);
  } catch (error) {
    res.status(500).json({ message: '获取维度列表失败' });
  }
});

router.get('/dimensions/weights', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { course_type, grade_range } = req.query;

    if (!course_type || !grade_range) {
      res.status(400).json({ message: '缺少参数：course_type 和 grade_range' });
      return;
    }

    const weights = await db.all(`
      SELECT cdw.*, ad.name as dimension_name, ad.category, ad.description
      FROM course_dimension_weights cdw
      JOIN assessment_dimensions ad ON cdw.dimension_code = ad.code
      WHERE cdw.course_type = ? AND cdw.grade_range = ?
      ORDER BY ad.category, cdw.weight DESC
    `, [course_type, grade_range]);

    res.json(weights);
  } catch (error) {
    res.status(500).json({ message: '获取维度权重失败' });
  }
});

router.get('/courses', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { course_type, grade_range } = req.query;

    let sql = 'SELECT * FROM course_knowledge WHERE 1=1';
    const params: any[] = [];

    if (course_type) {
      sql += ' AND course_type = ?';
      params.push(course_type);
    }
    if (grade_range) {
      sql += ' AND grade_range = ?';
      params.push(grade_range);
    }

    const courses = await db.all(sql, params);

    for (const course of courses) {
      course.knowledge_points = JSON.parse(course.knowledge_points || '[]');
      course.learning_objectives = JSON.parse(course.learning_objectives || '[]');
      course.prerequisites = JSON.parse(course.prerequisites || '{}');
      course.learning_path = JSON.parse(course.learning_path || '[]');
      course.common_mistakes = JSON.parse(course.common_mistakes || '[]');
      course.ai_learning_log = course.ai_learning_log ? JSON.parse(course.ai_learning_log) : [];
    }

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: '获取课程知识失败' });
  }
});

router.get('/courses/:courseType/:gradeRange', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { courseType, gradeRange } = req.params;

    const course = await db.get(
      'SELECT * FROM course_knowledge WHERE course_type = ? AND grade_range = ?',
      [courseType, gradeRange]
    );

    if (!course) {
      res.status(404).json({ message: '课程知识不存在' });
      return;
    }

    course.knowledge_points = JSON.parse(course.knowledge_points || '[]');
    course.learning_objectives = JSON.parse(course.learning_objectives || '[]');
    course.prerequisites = JSON.parse(course.prerequisites || '{}');
    course.learning_path = JSON.parse(course.learning_path || '[]');
    course.common_mistakes = JSON.parse(course.common_mistakes || '[]');
    course.ai_learning_log = course.ai_learning_log ? JSON.parse(course.ai_learning_log) : [];

    const weights = await db.all(`
      SELECT cdw.*, ad.name as dimension_name, ad.category
      FROM course_dimension_weights cdw
      JOIN assessment_dimensions ad ON cdw.dimension_code = ad.code
      WHERE cdw.course_type = ? AND cdw.grade_range = ?
    `, [courseType, gradeRange]);

    res.json({ ...course, weights });
  } catch (error) {
    res.status(500).json({ message: '获取课程知识失败' });
  }
});

router.get('/students/:id/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { course_type } = req.query;

    let sql = 'SELECT * FROM student_ability_profile WHERE student_id = ?';
    const params: any[] = [id];

    if (course_type) {
      sql += ' AND course_type = ?';
      params.push(course_type);
    }

    const profiles = await db.all(sql, params);

    if (course_type && profiles.length > 0) {
      const history = await db.all(`
        SELECT sgh.*, e.name as exam_name, e.course_type, e.created_at as exam_date
        FROM student_growth_history sgh
        JOIN exam_records er ON sgh.exam_record_id = er.id
        JOIN exams e ON er.exam_id = e.id
        WHERE sgh.student_id = ? AND sgh.course_type = ?
        ORDER BY sgh.created_at DESC
        LIMIT 10
      `, [id, course_type]);

      for (const h of history) {
        h.scores = JSON.parse(h.scores || '{}');
        h.comparison = h.comparison ? JSON.parse(h.comparison) : null;
      }

      profiles[0].history = history;
    }

    res.json(course_type ? (profiles[0] || null) : profiles);
  } catch (error) {
    res.status(500).json({ message: '获取学生画像失败' });
  }
});

router.get('/students/:id/growth', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { course_type, limit = '10' } = req.query;

    if (!course_type) {
      res.status(400).json({ message: '缺少参数：course_type' });
      return;
    }

    const history = await db.all(`
      SELECT sgh.*, e.name as exam_name, e.course_type
      FROM student_growth_history sgh
      JOIN exam_records er ON sgh.exam_record_id = er.id
      JOIN exams e ON er.exam_id = e.id
      WHERE sgh.student_id = ? AND sgh.course_type = ?
      ORDER BY sgh.created_at DESC
      LIMIT ?
    `, [id, course_type, parseInt(limit as string)]);

    for (const h of history) {
      h.scores = JSON.parse(h.scores || '{}');
      h.comparison = h.comparison ? JSON.parse(h.comparison) : null;
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: '获取成长历史失败' });
  }
});

router.get('/question-mappings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { question_id, dimension_code } = req.query;

    let sql = 'SELECT dqm.*, ad.name as dimension_name, ad.category FROM dimension_question_mapping dqm JOIN assessment_dimensions ad ON dqm.dimension_code = ad.code WHERE 1=1';
    const params: any[] = [];

    if (question_id) {
      sql += ' AND dqm.question_id = ?';
      params.push(question_id);
    }
    if (dimension_code) {
      sql += ' AND dqm.dimension_code = ?';
      params.push(dimension_code);
    }

    const mappings = await db.all(sql, params);
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ message: '获取维度映射失败' });
  }
});

router.post('/question-mappings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { question_id, dimension_code, relevance = 100 } = req.body;

    await db.run(
      `INSERT INTO dimension_question_mapping (question_id, dimension_code, relevance) VALUES (?, ?, ?)
       ON CONFLICT(dimension_code, question_id) DO UPDATE SET relevance = ?`,
      [question_id, dimension_code, relevance, relevance]
    );

    res.json({ message: '映射创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建维度映射失败' });
  }
});

router.get('/dimension-scores/:examRecordId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { examRecordId } = req.params;

    const scores = await db.all(`
      SELECT ds.*, ad.name as dimension_name, ad.category
      FROM dimension_scores ds
      JOIN assessment_dimensions ad ON ds.dimension_code = ad.code
      WHERE ds.exam_record_id = ?
      ORDER BY ad.category, ad.code
    `, [examRecordId]);

    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: '获取维度得分失败' });
  }
});

router.post('/dimension-scores', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { exam_record_id, course_type, dimension_scores } = req.body;

    for (const ds of dimension_scores) {
      await db.run(
        `INSERT INTO dimension_scores (exam_record_id, course_type, dimension_code, score, max_score, percentage)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(exam_record_id, dimension_code) DO UPDATE SET
         score = ?, max_score = ?, percentage = ?`,
        [exam_record_id, course_type, ds.dimension_code, ds.score, ds.max_score, ds.percentage, ds.score, ds.max_score, ds.percentage]
      );
    }

    res.json({ message: '维度得分保存成功' });
  } catch (error) {
    res.status(500).json({ message: '保存维度得分失败' });
  }
});

router.get('/overview', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();

    const [
      dimensionCount,
      courseCount,
      studentCount,
      questionCount,
      mappingCount
    ] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM assessment_dimensions'),
      db.get('SELECT COUNT(*) as count FROM course_knowledge'),
      db.get('SELECT COUNT(*) as count FROM students_info'),
      db.get('SELECT COUNT(*) as count FROM questions'),
      db.get('SELECT COUNT(*) as count FROM dimension_question_mapping'),
    ]);

    res.json({
      dimensions: dimensionCount?.count || 0,
      courses: courseCount?.count || 0,
      students: studentCount?.count || 0,
      questions: questionCount?.count || 0,
      mappings: mappingCount?.count || 0,
    });
  } catch (error) {
    res.status(500).json({ message: '获取知识库概览失败' });
  }
});

export default router;
