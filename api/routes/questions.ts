import express from 'express';
import { getDb } from '../db.js';
import { questionGenerator, KNOWLEDGE_POINTS } from '../services/questionGenerator.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await questionGenerator.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

router.delete('/all', authMiddleware, async (req, res) => {
  try {
    await questionGenerator.clearAllQuestions();
    res.json({ success: true, message: '已清空所有题目' });
  } catch (error) {
    res.status(500).json({ success: false, error: '清空失败' });
  }
});

router.get('/knowledge-points', authMiddleware, async (req, res) => {
  res.json({ success: true, knowledgePoints: KNOWLEDGE_POINTS });
});

// 题目列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { page = '1', pageSize = '50', course_type, grade_range, status, keyword } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 50;
    const offset = (pageNum - 1) * size;

    let whereClause = '1=1';
    const params: any[] = [];

    if (course_type) {
      whereClause += ' AND course_type = ?';
      params.push(course_type);
    }
    if (grade_range) {
      whereClause += ' AND grade_range = ?';
      params.push(grade_range);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (keyword) {
      whereClause += ' AND (content LIKE ? OR knowledge_point LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countResult = await db.get(`SELECT COUNT(*) as total FROM questions WHERE ${whereClause}`, params) as { total: number };
    const total = countResult.total;

    const questions = await db.all(`SELECT * FROM questions WHERE ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, size, offset]);

    res.json({
      success: true,
      questions,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    });
  } catch (error) {
    console.error('获取题目列表失败:', error);
    res.status(500).json({ success: false, error: '获取题目列表失败' });
  }
});

// 获取单个题目
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const question = await db.get('SELECT * FROM questions WHERE id = ?', req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: '题目不存在' });
    }
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取题目失败' });
  }
});

// 创建题目
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const {
      course_type, grade_range, question_type, content, options,
      answer, explanation, knowledge_point, score, difficulty, image_svg, dimension_code
    } = req.body;

    const result = await db.run(`
      INSERT INTO questions (course_type, grade_range, question_type, content, options, answer, explanation, knowledge_point, score, difficulty, image_svg, dimension_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    `, course_type, grade_range, question_type, content, JSON.stringify(options), answer, explanation, knowledge_point, score || 5, difficulty || 3, image_svg || null, dimension_code || null);

    res.json({ success: true, id: result.lastID, message: '题目创建成功' });
  } catch (error) {
    console.error('创建题目失败:', error);
    res.status(500).json({ success: false, error: '创建题目失败' });
  }
});

// 更新题目
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { content, options, answer, explanation, knowledge_point, score, difficulty, status, image_svg, dimension_code } = req.body;

    const existing = await db.get('SELECT id FROM questions WHERE id = ?', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: '题目不存在' });
    }

    await db.run(`
      UPDATE questions SET content = ?, options = ?, answer = ?, explanation = ?, knowledge_point = ?, score = ?, difficulty = ?, status = ?, image_svg = ?, dimension_code = ?
      WHERE id = ?
    `, content, JSON.stringify(options), answer, explanation, knowledge_point, score, difficulty, status, image_svg || null, dimension_code || null, id);

    res.json({ success: true, message: '题目更新成功' });
  } catch (error) {
    console.error('更新题目失败:', error);
    res.status(500).json({ success: false, error: '更新题目失败' });
  }
});

// 删除题目
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    await db.run('DELETE FROM questions WHERE id = ?', id);
    res.json({ success: true, message: '题目删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除题目失败' });
  }
});

// 题目使用统计
router.get('/:id/usage', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const questionId = req.params.id;

    const result = await db.get(`
      SELECT
        COUNT(*) as usage_count,
        SUM(CASE WHEN answer = user_answer THEN 1 ELSE 0 END) as correct_count
      FROM exam_records er
      JOIN exam_record_details erd ON er.id = erd.record_id
      WHERE erd.question_id = ?
    `, questionId) as { usage_count: number; correct_count: number };

    const usageCount = result?.usage_count || 0;
    const correctRate = usageCount > 0 ? Math.round((result?.correct_count || 0) / usageCount * 100) : 0;

    res.json({
      success: true,
      usage: { count: usageCount, correct_rate: correctRate, used: usageCount > 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取使用统计失败' });
  }
});

// AI生成单题
router.post('/ai-generate', authMiddleware, async (req, res) => {
  try {
    const { courseType, grade, knowledgePoint, difficulty } = req.body;
    const kps = knowledgePoint ? [knowledgePoint] : (KNOWLEDGE_POINTS[courseType || 'math']?.[grade || '3-4'] || ['基础练习']);
    const questions = await questionGenerator.generateBatch(
      courseType || 'math',
      grade || '3-4',
      kps,
      difficulty || 3,
      5,
      1
    );

    if (questions.length > 0) {
      const saved = await questionGenerator.saveQuestions(questions);
      res.json({ success: true, questions: questions.slice(0, 5), saved });
    } else {
      res.status(400).json({ success: false, error: '生成失败' });
    }
  } catch (error) {
    console.error('AI生成失败:', error);
    res.status(500).json({ success: false, error: 'AI生成失败' });
  }
});

// AI审核题目
router.post('/ai-review', authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    res.json({ success: true, review: { valid: true, issues: [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: '审核失败' });
  }
});

// 批量生成题目
router.post('/generate-batch', authMiddleware, async (req, res) => {
  const { 
    courseType, 
    gradeRange, 
    knowledgePoints, 
    difficulty, 
    count, 
    batchNumber 
  } = req.body;

  try {
    console.log(`开始生成第${batchNumber}批题目...`);
    const questions = await questionGenerator.generateBatch(
      courseType,
      gradeRange,
      knowledgePoints,
      difficulty,
      count,
      batchNumber
    );

    const savedCount = await questionGenerator.saveQuestions(questions);
    console.log(`第${batchNumber}批完成：生成${questions.length}道，保存${savedCount}道`);

    res.json({
      success: true,
      message: `第${batchNumber}批题目生成完成`,
      generated: questions.length,
      saved: savedCount,
      questions: questions.slice(0, 10) // 返回前10题预览
    });
  } catch (error) {
    console.error('批量生成失败:', error);
    res.status(500).json({ success: false, error: '生成失败' });
  }
});

// 完整流程：清空 + 生成所有批次
router.post('/full-regenerate', authMiddleware, async (req, res) => {
  try {
    // 1. 清空
    await questionGenerator.clearAllQuestions();
    await questionGenerator.loadExistingContents();

    // 2. 生成计划
    const plan = [
      // 第1批：数理逻辑 1-2年级 1-2星 (~50题)
      { courseType: 'math', gradeRange: '1-2', difficulty: [1, 2], count: 50 },
      // 第1批：Scratch 1-2年级 1-2星 (~40题)
      { courseType: 'scratch', gradeRange: '1-2', difficulty: [1, 2], count: 40 },
      
      // 第2批：数理逻辑 3-4年级 2-3星 (~60题)
      { courseType: 'math', gradeRange: '3-4', difficulty: [2, 3], count: 60 },
      // 第2批：Python 3-4年级 2-3星 (~50题)
      { courseType: 'python', gradeRange: '3-4', difficulty: [2, 3], count: 50 },
      
      // 第3批：数理逻辑 5-6年级 3-4星 (~70题)
      { courseType: 'math', gradeRange: '5-6', difficulty: [3, 4], count: 70 },
      // 第3批：C++ 5-6年级 2-3星 (~50题)
      { courseType: 'cpp', gradeRange: '5-6', difficulty: [2, 3], count: 50 },
      // 第3批：AIGC 全年级 1-2星 (~50题)
      { courseType: 'aigc', gradeRange: '3-4', difficulty: [1, 2], count: 50 },
      
      // 第4批：数理逻辑 7-9年级 4-5星 (~70题)
      { courseType: 'math', gradeRange: '7-9', difficulty: [4, 5], count: 70 },
      // 第4批：Python 5-6年级 3-4星 (~50题)
      { courseType: 'python', gradeRange: '5-6', difficulty: [3, 4], count: 50 },
      // 第4批：Scratch 3-4年级 3-4星 (~60题)
      { courseType: 'scratch', gradeRange: '3-4', difficulty: [3, 4], count: 60 },
      
      // 第5批：C++ 7-9年级 4-5星 (~100题)
      { courseType: 'cpp', gradeRange: '7-9', difficulty: [4, 5], count: 100 },
      // 第5批：Python 7-9年级 4-5星 (~100题)
      { courseType: 'python', gradeRange: '7-9', difficulty: [4, 5], count: 100 },
      // 第5批：Scratch 5-6/7-9年级 4-5星 (~100题)
      { courseType: 'scratch', gradeRange: '5-6', difficulty: [4, 5], count: 100 },
      // 第5批：补充数理逻辑和AIGC (~100题)
      { courseType: 'math', gradeRange: '1-2', difficulty: [3, 4], count: 50 },
      { courseType: 'aigc', gradeRange: '5-6', difficulty: [3, 4], count: 50 }
    ];

    res.json({ success: true, message: '后台开始生成题目，请稍后查看统计', plan });

    // 后台异步生成
    (async () => {
      let batchNumber = 1;
      let totalSaved = 0;

      for (const task of plan) {
        for (const diff of task.difficulty) {
          const kps = KNOWLEDGE_POINTS[task.courseType as keyof typeof KNOWLEDGE_POINTS]?.[task.gradeRange as keyof any] || [];
          if (kps.length === 0) continue;

          try {
            const questions = await questionGenerator.generateBatch(
              task.courseType,
              task.gradeRange,
              kps,
              diff,
              Math.ceil(task.count / task.difficulty.length),
              batchNumber
            );

            const saved = await questionGenerator.saveQuestions(questions);
            totalSaved += saved;
            console.log(`第${batchNumber}批 [${task.courseType}][${task.gradeRange}][${diff}星] 完成，保存${saved}道，累计${totalSaved}道`);
          } catch (e) {
            console.error(`第${batchNumber}批失败:`, e);
          }

          batchNumber++;
          
          // 批次间稍作休息
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      console.log(`✅ 全部完成！共保存 ${totalSaved} 道题目`);
    })();

  } catch (error) {
    console.error('完整再生失败:', error);
    res.status(500).json({ success: false, error: '失败' });
  }
});

// GET /questions/statistics - 题目使用统计
router.get('/statistics/overview', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();

    const totalStats = await db.get(`
      SELECT
        COUNT(*) as total_questions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        AVG(difficulty) as avg_difficulty
      FROM questions
    `);

    const courseStats = await db.all(`
      SELECT
        course_type,
        COUNT(*) as count,
        AVG(difficulty) as avg_difficulty
      FROM questions
      GROUP BY course_type
    `);

    const dimensionStats = await db.all(`
      SELECT
        dimension_code,
        COUNT(*) as count
      FROM questions
      WHERE dimension_code IS NOT NULL
      GROUP BY dimension_code
    `);

    const mostUsed = await db.all(`
      SELECT
        q.id,
        q.content,
        q.course_type,
        COUNT(erd.id) as usage_count,
        SUM(CASE WHEN erd.user_answer = q.answer THEN 1 ELSE 0 END) as correct_count
      FROM questions q
      LEFT JOIN exam_record_details erd ON q.id = erd.question_id
      GROUP BY q.id
      HAVING usage_count > 0
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      overview: totalStats || {},
      byCourse: courseStats || [],
      byDimension: dimensionStats || [],
      mostUsed: mostUsed || [],
    });
  } catch (error) {
    console.error('获取题目统计失败:', error);
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

export default router;
