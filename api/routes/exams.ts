import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { aiCall, isFeatureEnabled } from '../utils/aiClient.js';

const router = Router();

function getGradeRange(grade: number): string {
  if (grade <= 3) return '1-3';
  if (grade <= 6) return '4-6';
  return '7-9';
}

async function getLevelConfig(db: any): Promise<Record<string, string>> {
  const configs = await db.all("SELECT * FROM config WHERE key LIKE 'level_%'");
  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.key] = c.value;
  }
  return configMap;
}

async function calculateLevel(score: number, db?: any): Promise<string> {
  let config: Record<string, string> = {};
  if (db) {
    config = await getLevelConfig(db);
  }
  const aMin = parseInt(config.level_a_min || '90');
  const bMin = parseInt(config.level_b_min || '80');
  const cMin = parseInt(config.level_c_min || '70');

  if (score >= aMin) return 'A';
  if (score >= bMin) return 'B';
  if (score >= cMin) return 'C';
  return 'D';
}

function hasDuplicateQuestions(questions: any[]): boolean {
  const ids = new Set();
  for (const q of questions) {
    if (ids.has(q.id)) return true;
    ids.add(q.id);
  }
  return false;
}

async function selectQuestions(db: any, courseType: string, gradeRange: string, targetCount: number, existingIds: number[]): Promise<any[]> {
  const excludeIds = [...new Set(existingIds)];
  if (excludeIds.length === 0) {
    const questions = await db.all(
      `SELECT * FROM questions WHERE course_type = ? AND grade_range = ? AND status = 'approved'
       ORDER BY RANDOM() LIMIT ?`,
      [courseType, gradeRange, targetCount]
    );
    return questions;
  }
  const placeholders = excludeIds.map(() => '?').join(',');
  const questions = await db.all(
    `SELECT * FROM questions WHERE course_type = ? AND grade_range = ? AND status = 'approved'
     AND id NOT IN (${placeholders})
     ORDER BY RANDOM() LIMIT ?`,
    [courseType, gradeRange, ...excludeIds, targetCount]
  );
  return questions;
}

function getAdjacentGradeRanges(gradeRange: string): string[] {
  const adjacents: Record<string, string[]> = {
    '1-3': ['4-6'],
    '4-6': ['1-3', '7-9'],
    '7-9': ['4-6'],
  };
  return adjacents[gradeRange] || [];
}

function getAllGradeRanges(): string[] {
  return ['1-3', '4-6', '7-9'];
}

async function getDefaultRecommendations(level: string, courseType: string, student: any, weakPoints: string[], db?: any): Promise<any> {
  const recommendations: any = {
    learningPlan: {
      shortTerm: '',
      mediumTerm: '',
      longTerm: '',
    },
    classRecommendation: {
      className: '',
      reason: '',
      path: [] as string[],
      courseId: null as number | null,
    },
    suggestions: [] as string[],
  };

  if (level === 'A') {
    recommendations.learningPlan.shortTerm = '巩固核心知识点，尝试挑战更高难度的题目';
    recommendations.learningPlan.mediumTerm = '深入学习进阶内容，参与项目实践';
    recommendations.learningPlan.longTerm = '准备参加相关竞赛，向培优方向发展';
  } else if (level === 'B') {
    recommendations.learningPlan.shortTerm = '查漏补缺，重点复习薄弱知识点';
    recommendations.learningPlan.mediumTerm = '系统学习进阶内容，加强练习';
    recommendations.learningPlan.longTerm = '力争达到优秀水平，挑战竞赛内容';
  } else if (level === 'C') {
    recommendations.learningPlan.shortTerm = '夯实基础知识，多做基础练习题';
    recommendations.learningPlan.mediumTerm = '逐步提升难度，建立知识体系';
    recommendations.learningPlan.longTerm = '达到良好水平，向进阶内容迈进';
  } else {
    recommendations.learningPlan.shortTerm = '从零开始系统学习基础知识';
    recommendations.learningPlan.mediumTerm = '加强基础练习，培养学习兴趣';
    recommendations.learningPlan.longTerm = '稳步提升，争取达到合格水平';
  }

  // 硬编码默认推荐（作为后备）
  if (courseType === 'aigc') {
    if (level === 'A' || level === 'B') {
      recommendations.classRecommendation.className = 'AIGC进阶班';
      recommendations.classRecommendation.reason = '您的AIGC素养测评成绩优秀，具备较好的AI工具理解和应用能力，建议直接报读进阶班，深入学习AI绘画、AI音视频创作等高级内容。';
      recommendations.classRecommendation.path = ['AIGC入门', 'AIGC基础', 'AIGC进阶', 'AIGC培优'];
    } else {
      recommendations.classRecommendation.className = 'AIGC入门班';
      recommendations.classRecommendation.reason = '建议从AIGC入门班开始，系统学习AI基础知识，培养AI素养和创作能力。';
      recommendations.classRecommendation.path = ['AIGC入门', 'AIGC基础', 'AIGC进阶', 'AIGC培优'];
    }
  } else if (courseType === 'python') {
    if (level === 'A') {
      recommendations.classRecommendation.className = 'Python/C++进阶班';
      recommendations.classRecommendation.reason = '您的编程基础扎实，逻辑思维能力强，建议报读进阶班，深入学习算法和数据结构。';
      recommendations.classRecommendation.path = ['Scratch入门', 'Python基础', 'Python进阶', 'C++培优'];
    } else if (level === 'B') {
      recommendations.classRecommendation.className = 'Python基础班';
      recommendations.classRecommendation.reason = '您具备一定的编程基础，建议系统学习Python，为进阶打下坚实基础。';
      recommendations.classRecommendation.path = ['Scratch入门', 'Python基础', 'Python进阶', 'C++培优'];
    } else {
      recommendations.classRecommendation.className = 'Scratch入门班';
      recommendations.classRecommendation.reason = '建议从Scratch图形化编程开始，培养编程兴趣和逻辑思维能力。';
      recommendations.classRecommendation.path = ['Scratch入门', 'Python基础', 'Python进阶', 'C++培优'];
    }
  } else if (courseType === 'cpp') {
    if (level === 'A' || level === 'B') {
      recommendations.classRecommendation.className = 'C++算法进阶班';
      recommendations.classRecommendation.reason = '您的数理逻辑能力出色，具备良好的逻辑思维基础，非常适合学习C++算法，建议从C++入门班开始。';
      recommendations.classRecommendation.path = ['C++入门', 'C++基础', '算法进阶', '竞赛培优'];
    } else {
      recommendations.classRecommendation.className = 'Python编程入门班';
      recommendations.classRecommendation.reason = '建议先学习Python编程，培养编程兴趣，再逐步过渡到C++算法学习。';
      recommendations.classRecommendation.path = ['Python入门', 'Python进阶', 'C++基础', '算法进阶'];
    }
  } else if (courseType === 'scratch') {
    if (level === 'A' || level === 'B') {
      recommendations.classRecommendation.className = 'Scratch进阶班';
      recommendations.classRecommendation.reason = '您的图形化编程基础扎实，建议继续学习Scratch进阶内容，或过渡到Python编程。';
      recommendations.classRecommendation.path = ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'];
    } else {
      recommendations.classRecommendation.className = 'Scratch入门班';
      recommendations.classRecommendation.reason = '建议从Scratch图形化编程开始，通过积木式编程培养编程兴趣和逻辑思维能力。';
      recommendations.classRecommendation.path = ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'];
    }
  } else if (courseType === 'math') {
    if (level === 'A' || level === 'B') {
      recommendations.classRecommendation.className = 'Python编程基础班';
      recommendations.classRecommendation.reason = '您的数理逻辑能力出色，具备良好的逻辑思维基础，建议直接学习Python编程，快速进入代码编程世界。';
      recommendations.classRecommendation.path = ['数理启蒙', 'Python基础', 'Python进阶', '算法竞赛'];
    } else {
      recommendations.classRecommendation.className = 'Scratch入门班';
      recommendations.classRecommendation.reason = '建议从Scratch图形化编程开始，通过积木式编程培养编程兴趣和逻辑思维能力，为后续学习打下基础。';
      recommendations.classRecommendation.path = ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'];
    }
  }

  // 查询课程库关联真实课程，覆盖硬编码推荐
  if (db) {
    try {
      const studentGrade = student?.grade || 3;
      const gradeRange = getGradeRange(studentGrade);
      let matchedCourse = null;

      if (courseType === 'math') {
        matchedCourse = await db.get(
          `SELECT * FROM courses
           WHERE grade_range = ? AND status = 'active'
           AND (name LIKE '%入门%' OR name LIKE '%启蒙%' OR name LIKE '%基础%')
           ORDER BY
             CASE
               WHEN ? = 'A' OR ? = 'B' THEN
                 CASE WHEN name LIKE '%Python%' OR name LIKE '%进阶%' THEN 1 ELSE 2 END
               ELSE
                 CASE WHEN name LIKE '%Scratch%' OR name LIKE '%启蒙%' THEN 1 ELSE 2 END
             END
           LIMIT 1`,
          [gradeRange, level, level]
        );
        // math测评若未匹配到课程，强制使用统一fallback课程
        if (!matchedCourse) {
          matchedCourse = await db.get(
            `SELECT * FROM courses WHERE status = 'active' AND (name LIKE '%AI素养启蒙%' OR name LIKE '%图形化编程%') LIMIT 1`
          );
        }
      } else {
        matchedCourse = await db.get(
          `SELECT * FROM courses
           WHERE course_type = ? AND grade_range = ? AND status = 'active'
           ORDER BY
             CASE
               WHEN ? = 'A' AND name LIKE '%进阶%' THEN 1
               WHEN ? = 'B' AND name LIKE '%基础%' THEN 1
               WHEN ? IN ('C','D') AND name LIKE '%入门%' THEN 1
               ELSE 2
             END
           LIMIT 1`,
          [courseType, gradeRange, level, level, level]
        );
      }

      if (matchedCourse) {
        recommendations.classRecommendation.courseId = matchedCourse.id;
        recommendations.classRecommendation.className = matchedCourse.name;
        recommendations.classRecommendation.reason = `根据您的测评结果，推荐您报读「${matchedCourse.name}」。${matchedCourse.description || ''}`;
      }
    } catch (e) {
      console.error('Failed to match course from library:', e);
    }
  }

  if (weakPoints.length > 0) {
    recommendations.suggestions.push(`重点加强以下知识点的学习：${weakPoints.join('、')}。`);
  }

  if (student?.programming_base === '无基础' && courseType !== 'math') {
    recommendations.suggestions.push('您目前没有编程基础，建议先完成数理逻辑测评，评估逻辑思维能力后再选择合适的编程课程。');
  }

  if (student?.interest_aigc >= 3 && courseType !== 'aigc') {
    recommendations.suggestions.push('您对AIGC课程表现出浓厚兴趣，可以在学习主课的同时，选修AIGC素养课程。');
  }

  if (student?.learning_time === '1-2小时') {
    recommendations.suggestions.push('您每周可学习时间较少，建议合理安排学习计划，保证学习的连续性。');
  }

  return recommendations;
}

async function findMatchingCourse(db: any, courseType: string, gradeRange: string, level: string): Promise<any> {
  try {
    const course = await db.get(
      `SELECT * FROM courses 
       WHERE course_type = ? AND grade_range = ? AND status = 'active'
       ORDER BY 
         CASE 
           WHEN ? = 'A' AND name LIKE '%进阶%' THEN 1
           WHEN ? = 'B' AND name LIKE '%基础%' THEN 1
           WHEN ? IN ('C','D') AND name LIKE '%入门%' THEN 1
           ELSE 2
         END,
         created_at DESC
       LIMIT 1`,
      [courseType, gradeRange, level, level, level]
    );
    return course || null;
  } catch (error) {
    console.error('查询课程库失败:', error);
    return null;
  }
}

async function generateRecommendations(level: string, courseType: string, student: any, weakPoints: string[], knowledgePointStats: Record<string, { correct: number; total: number }>): Promise<any> {
  let db;
  try {
    db = await getDb();
  } catch (e) {
    console.error('Failed to get DB connection:', e);
  }

  const defaultRecs = await getDefaultRecommendations(level, courseType, student, weakPoints, db);

  const courseTypeName = courseType === 'aigc' ? 'AIGC素养' : courseType === 'python' ? 'Python编程' : courseType === 'cpp' ? 'C++算法' : courseType === 'scratch' ? 'Scratch图形化编程' : courseType === 'math' ? '数理逻辑' : '编程';
  const knowledgeStatsText = Object.entries(knowledgePointStats)
    .map(([kp, s]) => `${kp}: ${s.correct}/${s.total}正确`)
    .join('；');

  // 查询课程库中所有相关课程
  let relatedCourses: any[] = [];
  if (db) {
    try {
      const studentGrade = student?.grade || 3;
      const gradeRange = getGradeRange(studentGrade);

      if (courseType === 'math') {
        // math测评：查询所有类型的启蒙/入门/基础课程
        relatedCourses = await db.all(
          `SELECT id, name, description, grade_range, course_type, course_objectives, matching_events
           FROM courses WHERE grade_range = ? AND status = 'active'
           AND (name LIKE '%入门%' OR name LIKE '%启蒙%' OR name LIKE '%基础%')
           ORDER BY
             CASE course_type
               WHEN 'scratch' THEN 1
               WHEN 'aigc' THEN 2
               WHEN 'python' THEN 3
               ELSE 4
             END`,
          [gradeRange]
        );
      } else {
        // 其他类型：查询同类型课程
        relatedCourses = await db.all(
          `SELECT id, name, description, grade_range, course_type, course_objectives, matching_events
           FROM courses WHERE course_type = ? AND grade_range = ? AND status = 'active'`,
          [courseType, gradeRange]
        );
      }
    } catch (e) {
      console.error('Failed to query related courses:', e);
    }
  }

  const allCoursesContext = relatedCourses.length > 0
    ? relatedCourses.map(c =>
        `- ${c.name}：${c.description || '暂无描述'}（目标：${c.course_objectives || '暂无'}）`
      ).join('\n')
    : '暂无相关课程';

  const courseContext = defaultRecs.classRecommendation?.courseId
    ? `【机构课程库信息】\n- 推荐课程：${defaultRecs.classRecommendation.className}\n`
    : '';

  const mathSpecialNote = courseType === 'math'
    ? `\n【特殊说明】\n该学生完成的是数理逻辑测评。数理逻辑能力是学习编程的基础。\n- 若成绩优秀(A/B)：推荐编程入门课程（如Python基础、Scratch进阶）\n- 若成绩偏差(C/D)：推荐图形化编程启蒙或AI素养启蒙课程，培养逻辑思维能力\n`
    : '';

  try {
    const enabled = await isFeatureEnabled('report_analysis');
    if (!enabled) {
      console.log('[AI] report_analysis feature is disabled');
      return defaultRecs;
    }

    const data = await aiCall({
      feature: 'report_analysis',
      messages: [
        {
          role: 'system',
          content: '你是一位资深的教育评估专家，擅长根据学生的测评结果和个人信息提供专业的分析报告。请以JSON格式返回分析结果。'
        },
        {
          role: 'user',
          content: `请为以下学生生成测评分析报告：

【学生信息】
- 姓名：${student?.name || '未知'}
- 年级：${student?.grade || '未知'}年级
- 数学成绩：${student?.math_score || '未知'}
- AI基础：${student?.ai_base || '未知'}
- 编程基础：${student?.programming_base || '未知'}
- 逻辑思维能力：${student?.logical_ability || '未知'}
- AIGC兴趣度：${student?.interest_aigc || 0}/4
- 编程兴趣度：${student?.interest_programming || 0}/4
- 每周学习时间：${student?.learning_time || '未知'}

【测评结果】
- 课程类型：${courseTypeName}
- 测评等级：${level}（A优秀/B良好/C合格/D待提高）
- 知识点掌握情况：${knowledgeStatsText}
- 薄弱环节：${weakPoints.join('、') || '无'}

${courseContext}${mathSpecialNote}

【机构课程库】
以下是我机构开设的相关课程，请严格从以下课程中选择推荐：
${allCoursesContext}

重要约束：
1. classRecommendation.className 必须从上述课程列表中选择课程名称
2. classRecommendation.path 中的每个阶段必须是上述课程中的某个名称，按学习顺序排列
3. 如果课程库信息不足以给出完整建议，可在 learningPlan.resources 中补充推荐权威书籍或在线资源
4. 禁止推荐课程库中不存在的课程名称

请按以下6个固定维度生成分析，以JSON格式返回：
{
  "aiAnalysis": {
    "knowledgeAnalysis": "知识掌握度分析...",
    "logicAbility": "逻辑思维能力评估...",
    "potential": "学习潜力评估...",
    "weakPoints": "薄弱环节分析...",
    "strengths": "优势领域识别...",
    "development": "综合发展建议..."
  },
  "learningPlan": {
    "shortTerm": "短期目标（1个月）具体建议...",
    "mediumTerm": "中期目标（3个月）具体建议...",
    "longTerm": "长期目标（1学期）具体建议...",
    "resources": ["推荐资源1", "推荐资源2"]
  },
  "classRecommendation": {
    "className": "推荐班级名称（必须从课程库中选择）",
    "reason": "推荐理由...",
    "path": ["阶段1（课程库中的课程名称）", "阶段2", "阶段3", "阶段4"]
  }
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = data.choices?.[0]?.message?.content || '';

    let aiResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      aiResult = null;
    }

    if (aiResult) {
      const result: any = {
        ...defaultRecs,
        aiAnalysis: aiResult.aiAnalysis || defaultRecs.aiAnalysis,
        learningPlan: aiResult.learningPlan || defaultRecs.learningPlan,
        classRecommendation: {
          ...defaultRecs.classRecommendation,
          ...(aiResult.classRecommendation || {}),
        },
      };

      const validCourseNames = new Set(relatedCourses.map((c: any) => c.name));
      if (result.classRecommendation.className && validCourseNames.size > 0 && !validCourseNames.has(result.classRecommendation.className)) {
        console.log(`[AI] className "${result.classRecommendation.className}" not in course library, using default`);
        result.classRecommendation.className = defaultRecs.classRecommendation.className;
        result.classRecommendation.reason = defaultRecs.classRecommendation.reason;
        result.classRecommendation.courseId = defaultRecs.classRecommendation.courseId;
      }

      if (result.classRecommendation.path && Array.isArray(result.classRecommendation.path) && validCourseNames.size > 0) {
        result.classRecommendation.path = result.classRecommendation.path.map((step: string) =>
          validCourseNames.has(step) ? step : defaultRecs.classRecommendation.path[0] || step
        );
      }

      return result;
    }
  } catch (error) {
    console.error('AI分析调用失败，使用默认推荐:', error);
  }

  return defaultRecs;
}

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const exams = await db.all('SELECT * FROM exams ORDER BY created_at DESC');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: '获取试卷列表失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { name, course_type, grade, question_count, time_limit, student_id } = req.body;

    const gradeRange = getGradeRange(grade);
    const targetCount = question_count || 15;

    const selectedIds = new Set<number>();
    let questions: any[] = [];

    const knowledgePoints = await db.all(
      `SELECT DISTINCT knowledge_point FROM questions 
       WHERE course_type = ? AND grade_range = ? AND status = 'approved'`,
      [course_type, gradeRange]
    );

    if (knowledgePoints.length > 0) {
      const perKP = Math.ceil(targetCount / knowledgePoints.length);

      for (const kp of knowledgePoints) {
        const excludeIds = Array.from(selectedIds);
        let kpQuestions: any[] = [];
        if (excludeIds.length === 0) {
          kpQuestions = await db.all(
            `SELECT * FROM questions WHERE course_type = ? AND grade_range = ? 
             AND knowledge_point = ? AND status = 'approved'
             ORDER BY difficulty ASC, RANDOM() LIMIT ?`,
            [course_type, gradeRange, kp.knowledge_point, perKP]
          );
        } else {
          const placeholders = excludeIds.map(() => '?').join(',');
          kpQuestions = await db.all(
            `SELECT * FROM questions WHERE course_type = ? AND grade_range = ? 
             AND knowledge_point = ? AND status = 'approved'
             AND id NOT IN (${placeholders})
             ORDER BY difficulty ASC, RANDOM() LIMIT ?`,
            [course_type, gradeRange, kp.knowledge_point, ...excludeIds, perKP]
          );
        }
        for (const q of kpQuestions) {
          if (!selectedIds.has(q.id)) {
            questions.push(q);
            selectedIds.add(q.id);
          }
        }
      }
    }

    const fillMore = async (ranges: string[]) => {
      let needMore = targetCount - questions.length;
      if (needMore <= 0) return;
      for (const range of ranges) {
        if (needMore <= 0) break;
        const excludeIds = Array.from(selectedIds);
        const more = await selectQuestions(db, course_type, range, needMore, excludeIds);
        for (const q of more) {
          if (!selectedIds.has(q.id)) {
            questions.push(q);
            selectedIds.add(q.id);
          }
        }
        needMore = targetCount - questions.length;
      }
    };

    await fillMore([gradeRange]);
    await fillMore(getAdjacentGradeRanges(gradeRange));
    await fillMore(getAllGradeRanges().filter(r => r !== gradeRange && !getAdjacentGradeRanges(gradeRange).includes(r)));

    // Strict deduplication: ensure no duplicate questions by ID
    const idSet = new Set<number>();
    const uniqueQuestions: any[] = [];
    for (const q of questions) {
      if (!idSet.has(q.id)) {
        idSet.add(q.id);
        uniqueQuestions.push(q);
      }
    }
    questions = uniqueQuestions;

    // Strictly enforce target count
    questions = questions.slice(0, targetCount);

    questions.sort((a, b) => {
      if (a.knowledge_point !== b.knowledge_point) {
        return (a.knowledge_point || '').localeCompare(b.knowledge_point || '');
      }
      return (a.difficulty || 1) - (b.difficulty || 1);
    });

    const actualCount = questions.length;

    const targetTotal = 100;
    const scorePerQuestion = Math.floor(targetTotal / actualCount);
    const remainder = targetTotal - scorePerQuestion * actualCount;

    const examResult = await db.run(
      'INSERT INTO exams (name, course_type, grade, question_count, total_score, time_limit, config) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, course_type, grade, actualCount, targetTotal, time_limit || 60, JSON.stringify({ auto_generated: true })]
    );

    for (let i = 0; i < actualCount; i++) {
      const questionScore = i < remainder ? scorePerQuestion + 1 : scorePerQuestion;
      await db.run(
        'INSERT INTO exam_questions (exam_id, question_id, sequence, score) VALUES (?, ?, ?, ?)',
        [examResult.lastID, questions[i].id, i + 1, questionScore]
      );
    }

    console.log(`[Exam] Created exam ${examResult.lastID} with ${actualCount} questions`);
    res.status(201).json({ id: examResult.lastID, message: '试卷创建成功', questionCount: actualCount });
  } catch (error: any) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: '创建试卷失败: ' + (error.message || '未知错误') });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const exam = await db.get('SELECT * FROM exams WHERE id = ?', [req.params.id]);

    if (!exam) {
      res.status(404).json({ message: '试卷不存在' });
      return;
    }

    const questions = await db.all(`
      SELECT q.*, eq.sequence, eq.score as exam_score
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.sequence
    `, [req.params.id]);

    res.json({ ...exam, questions });
  } catch (error) {
    res.status(500).json({ message: '获取试卷详情失败' });
  }
});

router.post('/:id/submit', authMiddleware, async (req: AuthRequest, res) => {
  const examId = req.params.id;
  console.log(`[Submit] Starting exam submission, examId=${examId}, userId=${req.user?.id}`);

  try {
    const db = await getDb();
    const { answers, duration, tab_switch_count, question_times } = req.body;

    console.log(`[Submit] Looking up student for user_id=${req.user!.id}`);
    const student = await db.get('SELECT * FROM students_info WHERE user_id = ?', [req.user!.id]);
    if (!student) {
      console.error(`[Submit] Student not found for user_id=${req.user!.id}`);
      res.status(400).json({ message: '学生信息不存在' });
      return;
    }
    console.log(`[Submit] Found student id=${student.id}`);

    console.log(`[Submit] Looking up exam id=${examId}`);
    const exam = await db.get('SELECT * FROM exams WHERE id = ?', [examId]);
    if (!exam) {
      console.error(`[Submit] Exam not found id=${examId}`);
      res.status(404).json({ message: '试卷不存在' });
      return;
    }

    console.log(`[Submit] Loading exam questions for exam_id=${examId}`);
    const examQuestions = await db.all(`
      SELECT q.*, eq.sequence, eq.score as exam_score
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.sequence
    `, [examId]);
    console.log(`[Submit] Loaded ${examQuestions.length} questions`);

    let totalScore = 0;
    const answerResults: any[] = [];
    const knowledgePointStats: Record<string, { correct: number; total: number }> = {};

    for (const eq of examQuestions) {
      const studentAnswer = answers[eq.sequence];
      const isCorrect = studentAnswer === eq.answer;
      const score = isCorrect ? (eq.exam_score || 5) : 0;
      totalScore += score;

      const kp = eq.knowledge_point || '其他';
      if (!knowledgePointStats[kp]) knowledgePointStats[kp] = { correct: 0, total: 0 };
      knowledgePointStats[kp].total++;
      if (isCorrect) knowledgePointStats[kp].correct++;

      answerResults.push({
        sequence: eq.sequence,
        questionId: eq.id,
        studentAnswer,
        correctAnswer: eq.answer,
        isCorrect,
        score,
        knowledgePoint: eq.knowledge_point,
      });

      // 更新题目统计 - 出现次数和正确率
      try {
        const currentQuestion = await db.get('SELECT usage_count, correct_rate FROM questions WHERE id = ?', [eq.id]);
        if (currentQuestion) {
          const newUsageCount = (currentQuestion.usage_count || 0) + 1;
          const newCorrectRate = Math.round(
            ((currentQuestion.correct_rate || 0) * (currentQuestion.usage_count || 0) + (isCorrect ? 100 : 0)) / newUsageCount
          );
          await db.run(
            'UPDATE questions SET usage_count = ?, correct_rate = ? WHERE id = ?',
            [newUsageCount, newCorrectRate, eq.id]
          );
        }
      } catch (statError: any) {
        console.error(`[Submit] Failed to update question stats for qid=${eq.id}:`, statError.message);
      }
    }

    console.log(`[Submit] Calculated score=${totalScore}`);
    const level = await calculateLevel(totalScore, db);
    console.log(`[Submit] Calculated level=${level}`);

    const weakPoints = Object.entries(knowledgePointStats)
      .filter(([_, s]: [string, any]) => s.correct / s.total < 0.6)
      .map(([k]) => k);

    // Anti-cheat: detect time anomalies
    const cheatFlags: string[] = [];
    if (tab_switch_count && tab_switch_count > 0) {
      cheatFlags.push(`切屏${tab_switch_count}次`);
    }
    if (question_times && Object.keys(question_times).length > 0) {
      const times = Object.values(question_times) as number[];
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const tooFast = times.filter((t) => t < 3).length;
      const tooSlow = times.filter((t) => t > avgTime * 3).length;
      if (tooFast > 0) cheatFlags.push(`${tooFast}道题答题过快(<3秒)`);
      if (tooSlow > 0) cheatFlags.push(`${tooSlow}道题答题过慢(>3倍平均)`);
    }

    // 生成默认推荐（同步，不调用AI）
    const defaultRecs = await getDefaultRecommendations(level, exam.course_type, student, weakPoints, db);

    // 先插入记录，返回recordId
    console.log(`[Submit] Inserting exam record...`);
    const recordResult = await db.run(
      'INSERT INTO exam_records (student_id, exam_id, score, level, answers, duration, recommendations, cheat_flags, tab_switch_count, question_times) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [student.id, examId, totalScore, level, JSON.stringify(answerResults), duration, JSON.stringify(defaultRecs), JSON.stringify(cheatFlags), tab_switch_count || 0, JSON.stringify(question_times || {})]
    );

    const recordId = recordResult.lastID;
    console.log(`[Submit] Record inserted, recordId=${recordId}`);

    // 异步执行AI分析（不阻塞响应）
    // 使用独立的数据库连接，避免与主连接冲突
    setTimeout(async () => {
      try {
        console.log(`[AI] Starting async AI analysis for recordId=${recordId}`);
        const aiRecs = await generateRecommendations(level, exam.course_type, student, weakPoints, knowledgePointStats);
        try {
          const updateDb = await getDb();
          await updateDb.run(
            'UPDATE exam_records SET recommendations = ? WHERE id = ?',
            [JSON.stringify(aiRecs), recordId]
          );
          console.log(`[AI] AI analysis completed, recordId=${recordId}`);
        } catch (updateError: any) {
          console.error(`[AI] Result update failed for recordId=${recordId}:`, updateError.message);
        }
      } catch (aiError: any) {
        console.error(`[AI] Analysis failed for recordId=${recordId}:`, aiError.message);
      }
    }, 100);

    // 立即返回，不等待AI
    console.log(`[Submit] Responding immediately with recordId=${recordId}`);
    res.json({
      recordId,
      score: totalScore,
      level,
      answerResults,
      recommendations: defaultRecs,
      message: '提交成功',
    });
  } catch (error: any) {
    console.error(`[Submit] CRITICAL ERROR in exam submission examId=${examId}:`, error);
    res.status(500).json({ message: '提交试卷失败: ' + (error.message || '未知错误') });
  }
});

router.get('/:id/records', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const records = await db.all(`
      SELECT er.*, s.name as student_name
      FROM exam_records er
      JOIN students_info s ON er.student_id = s.id
      WHERE er.exam_id = ?
      ORDER BY er.score DESC
    `, [req.params.id]);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: '获取测评记录失败' });
  }
});

router.get('/records/:recordId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const recordId = req.params.recordId;

    const record = await db.get(`
      SELECT er.*, e.name as exam_name, e.course_type, e.grade as exam_grade,
             s.name as student_name, s.gender, s.school, s.grade as student_grade,
             s.math_score, s.ai_base, s.programming_base, s.interest_aigc,
             s.interest_programming, s.logical_ability
      FROM exam_records er
      JOIN exams e ON er.exam_id = e.id
      JOIN students_info s ON er.student_id = s.id
      WHERE er.id = ?
    `, [recordId]);

    if (!record) {
      res.status(404).json({ message: '测评记录不存在' });
      return;
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: '获取测评详情失败' });
  }
});

router.get('/records/:recordId/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const recordId = req.params.recordId;

    console.log(`[Status] Checking status for recordId=${recordId}`);

    const record = await db.get('SELECT id, recommendations FROM exam_records WHERE id = ?', [recordId]);

    if (!record) {
      console.error(`[Status] Record not found: ${recordId}`);
      res.status(404).json({ message: '测评记录不存在' });
      return;
    }

    // 检查recommendations是否已生成（非空且不是默认空对象）
    let ready = false;
    if (record.recommendations) {
      try {
        const recs = JSON.parse(record.recommendations);
        ready = !!(recs.learningPlan || recs.aiAnalysis || recs.classRecommendation);
      } catch (e) {
        ready = false;
      }
    }

    console.log(`[Status] recordId=${recordId}, ready=${ready}`);
    res.json({ ready, recordId: record.id });
  } catch (error: any) {
    console.error(`[Status] Error checking status for recordId=${req.params.recordId}:`, error);
    res.status(500).json({ message: '查询状态失败: ' + (error.message || '未知错误') });
  }
});

router.get('/admin/list', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const { course_type, grade, keyword } = req.query;

    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (course_type) {
      whereSql += ' AND e.course_type = ?';
      params.push(course_type);
    }
    if (grade) {
      whereSql += ' AND e.grade = ?';
      params.push(grade);
    }
    if (keyword) {
      whereSql += ' AND e.name LIKE ?';
      params.push(`%${keyword}%`);
    }

    const exams = await db.all(`
      SELECT
        e.id,
        e.name,
        e.course_type,
        e.grade,
        e.question_count,
        e.total_score,
        e.time_limit,
        e.created_at,
        COUNT(er.id) as record_count,
        GROUP_CONCAT(DISTINCT s.name) as student_names,
        MAX(er.score) as max_score,
        MIN(er.score) as min_score,
        MAX(er.created_at) as latest_record_at
      FROM exams e
      LEFT JOIN exam_records er ON e.id = er.exam_id
      LEFT JOIN students_info s ON er.student_id = s.id
      ${whereSql}
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `, params);

    res.json(exams);
  } catch (error: any) {
    console.error('[Admin Exams] Error:', error);
    res.status(500).json({ message: '获取试卷列表失败: ' + (error.message || '未知错误') });
  }
});

export default router;
