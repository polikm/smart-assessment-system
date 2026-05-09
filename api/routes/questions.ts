import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { aiCall, isFeatureEnabled } from '../utils/aiClient.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { course_type, grade_range, status, keyword, page = '1', pageSize = '50' } = req.query;

    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (course_type) {
      whereSql += ' AND course_type = ?';
      params.push(course_type);
    }
    if (grade_range) {
      whereSql += ' AND grade_range = ?';
      params.push(grade_range);
    }
    if (status) {
      whereSql += ' AND status = ?';
      params.push(status);
    }
    if (keyword) {
      whereSql += ' AND (content LIKE ? OR knowledge_point LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 查询总数
    const countResult = await db.get(`SELECT COUNT(*) as total FROM questions ${whereSql}`, params);
    const total = countResult.total;

    // 查询分页数据
    const pageNum = Math.max(1, parseInt(page as string));
    const size = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const offset = (pageNum - 1) * size;

    const questions = await db.all(
      `SELECT * FROM questions ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    res.json({ questions, total, page: pageNum, pageSize: size });
  } catch (error) {
    res.status(500).json({ message: '获取题目列表失败' });
  }
});

router.post('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { course_type, grade_range, question_type, content, options, answer, explanation, knowledge_point, score, difficulty } = req.body;

    const result = await db.run(
      `INSERT INTO questions (course_type, grade_range, question_type, content, options, answer, explanation, knowledge_point, score, difficulty, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_type, grade_range, question_type, content, JSON.stringify(options), answer, explanation, knowledge_point, score, difficulty, 'approved']
    );

    res.status(201).json({ id: result.lastID, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建题目失败' });
  }
});

router.get('/:id/usage', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const questionId = req.params.id;

    const examQuestions = await db.all(
      'SELECT exam_id FROM exam_questions WHERE question_id = ?',
      [questionId]
    );

    res.json({
      used: examQuestions.length > 0,
      examCount: examQuestions.length,
      examIds: examQuestions.map((eq: any) => eq.exam_id),
    });
  } catch (error) {
    res.status(500).json({ message: '查询题目使用状态失败' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const questionId = req.params.id;
    const { course_type, grade_range, question_type, content, options, answer, explanation, knowledge_point, score, difficulty, status } = req.body;

    // 先查询现有题目数据，用于填充未提供的字段
    const existing = await db.get('SELECT * FROM questions WHERE id = ?', [questionId]);
    if (!existing) {
      res.status(404).json({ message: '题目不存在' });
      return;
    }

    // 查询题目是否已被使用
    const examQuestions = await db.all(
      'SELECT exam_id FROM exam_questions WHERE question_id = ?',
      [questionId]
    );
    const isUsed = examQuestions.length > 0;

    if (isUsed) {
      // 已使用的题目，只允许修改部分字段，缺失字段保持原值
      await db.run(
        `UPDATE questions SET content = ?, explanation = ?, knowledge_point = ?, difficulty = ?, status = ?
         WHERE id = ?`,
        [
          content !== undefined ? content : existing.content,
          explanation !== undefined ? explanation : existing.explanation,
          knowledge_point !== undefined ? knowledge_point : existing.knowledge_point,
          difficulty !== undefined ? difficulty : existing.difficulty,
          status !== undefined ? status : existing.status,
          questionId
        ]
      );
      res.json({ message: '更新成功（部分字段因题目已被使用而保留）', restricted: true });
    } else {
      // 未使用的题目，允许修改所有字段，缺失字段保持原值
      await db.run(
        `UPDATE questions SET course_type = ?, grade_range = ?, question_type = ?, content = ?, options = ?, answer = ?, explanation = ?, knowledge_point = ?, score = ?, difficulty = ?, status = ?
         WHERE id = ?`,
        [
          course_type !== undefined ? course_type : existing.course_type,
          grade_range !== undefined ? grade_range : existing.grade_range,
          question_type !== undefined ? question_type : existing.question_type,
          content !== undefined ? content : existing.content,
          options !== undefined ? JSON.stringify(options) : existing.options,
          answer !== undefined ? answer : existing.answer,
          explanation !== undefined ? explanation : existing.explanation,
          knowledge_point !== undefined ? knowledge_point : existing.knowledge_point,
          score !== undefined ? score : existing.score,
          difficulty !== undefined ? difficulty : existing.difficulty,
          status !== undefined ? status : existing.status,
          questionId
        ]
      );
      res.json({ message: '更新成功', restricted: false });
    }
  } catch (error: any) {
    console.error('Update question error:', error);
    res.status(500).json({ message: '更新题目失败: ' + (error.message || '未知错误') });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const questionId = req.params.id;

    // Check if question is used in any exams
    const examQuestions = await db.all('SELECT exam_id FROM exam_questions WHERE question_id = ?', [questionId]);
    if (examQuestions.length > 0) {
      const examIds = [...new Set(examQuestions.map((eq: any) => eq.exam_id))];
      console.log(`[DELETE] Question ${questionId} is used in exams: ${examIds.join(', ')} - exam_questions records will be CASCADE deleted`);

      // Return warning to client
      res.status(400).json({
        message: `该题目已被${examQuestions.length}个试卷使用，删除将导致这些试卷题目缺失。建议先禁用该题目（修改状态为rejected），或确认后强制删除。`,
        examIds,
        questionId
      });
      return;
    }

    await db.run('DELETE FROM questions WHERE id = ?', [questionId]);
    console.log(`[DELETE] Question ${questionId} deleted successfully`);
    res.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: '删除题目失败: ' + (error.message || '未知错误') });
  }
});

router.post('/ai-generate', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const { courseType, grade, knowledgePoint, difficulty } = req.body;

    const enabled = await isFeatureEnabled('question_generate');
    if (!enabled) {
      res.status(403).json({ message: 'AI出题功能已被禁用' });
      return;
    }

    const data = await aiCall({
      feature: 'question_generate',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的教育题目生成助手。请根据要求生成结构化的测评题目，以JSON格式返回。'
        },
        {
          role: 'user',
          content: `请生成一道${courseType === 'aigc' ? 'AIGC素养' : courseType === 'scratch' ? 'Scratch图形化编程' : courseType === 'python' ? 'Python编程' : courseType === 'cpp' ? 'C++算法' : courseType === 'math' ? '数理逻辑' : '编程'}课程，适合${grade}年级学生的选择题，考核知识点：${knowledgePoint}，难度${difficulty}/5。
          请以JSON格式返回：{"content":"题干","options":["A选项","B选项","C选项","D选项"],"answer":"A/B/C/D","explanation":"解析","knowledge_point":"知识点","score":5,"difficulty":${difficulty}}`
        }
      ],
    });

    const content = data.choices?.[0]?.message?.content || '';

    let questionData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      questionData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      questionData = null;
    }

    if (!questionData) {
      res.status(500).json({ message: 'AI生成题目失败，无法解析返回内容' });
      return;
    }

    const db = await getDb();
    const gradeRange = grade <= 3 ? '1-3' : grade <= 6 ? '4-6' : '7-9';

    const result = await db.run(
      `INSERT INTO questions (course_type, grade_range, question_type, content, options, answer, explanation, knowledge_point, score, difficulty, status, ai_generated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseType,
        gradeRange,
        'single',
        questionData.content,
        JSON.stringify(questionData.options),
        questionData.answer,
        questionData.explanation,
        questionData.knowledge_point || knowledgePoint,
        questionData.score || 5,
        questionData.difficulty || difficulty,
        'pending',
        1
      ]
    );

    res.status(201).json({ id: result.lastID, ...questionData, message: 'AI生成成功，待审核' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'AI生成题目失败' });
  }
});

router.post('/ai-review', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res) => {
  try {
    const { question } = req.body;

    const enabled = await isFeatureEnabled('question_review');
    if (!enabled) {
      res.status(403).json({ message: 'AI审题功能已被禁用' });
      return;
    }

    const data = await aiCall({
      feature: 'question_review',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的教育题目审核助手。请审核题目质量，检查准确性、选项合理性、答案正确性。以JSON格式返回审核结果。'
        },
        {
          role: 'user',
          content: `请审核以下题目：${JSON.stringify(question)}。请以JSON格式返回：{"approved":true/false,"reason":"审核意见","suggestions":"改进建议"}`
        }
      ],
    });

    const content = data.choices?.[0]?.message?.content || '';

    let reviewResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      reviewResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      reviewResult = null;
    }

    if (!reviewResult) {
      res.status(500).json({ message: 'AI审题失败，无法解析返回内容' });
      return;
    }

    res.json(reviewResult);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'AI审题失败' });
  }
});

export default router;
