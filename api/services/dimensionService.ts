import { getDb } from '../db.js';

const DEFAULT_DIMENSIONS = [
  // 认知能力
  {
    code: 'COG_UNDERSTANDING',
    name: '问题理解与分析',
    category: 'cognitive',
    description: '理解问题、分解任务、识别关键信息的能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'COG_REASONING',
    name: '逻辑推理与判断',
    category: 'cognitive',
    description: '逻辑推理、条件判断、因果分析的能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'COG_TRANSFER',
    name: '知识迁移与应用',
    category: 'cognitive',
    description: '已有知识在新场景中的应用能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  // 技能能力
  {
    code: 'SKL_BASIC',
    name: '基础操作与工具使用',
    category: 'skill',
    description: '基本操作、工具使用的熟练程度',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'SKL_APPLICATION',
    name: '进阶应用与问题解决',
    category: 'skill',
    description: '综合运用知识解决实际问题的能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'SKL_EFFICIENCY',
    name: '效率与质量控制',
    category: 'skill',
    description: '完成任务的速度和质量控制能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  // 综合素养
  {
    code: 'QLT_ATTENTION',
    name: '专注力与细心度',
    category: 'quality',
    description: '审题仔细、计算准确、细节关注程度',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'QLT_EXPRESSION',
    name: '创意与表达能力',
    category: 'quality',
    description: '创意构思、思路表达、分享交流能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'QLT_ATTITUDE',
    name: '学习态度与成长潜力',
    category: 'quality',
    description: '学习积极性、尝试意愿、成长空间',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  // 创新思维
  {
    code: 'INN_CREATIVITY',
    name: '创新意识与创造力',
    category: 'innovation',
    description: '发散思维、创新方案设计能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'INN_EXPLORATION',
    name: '探索精神与好奇心',
    category: 'innovation',
    description: '主动探索、问题发现、持续追问能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'INN_DESIGN',
    name: '设计思维与迭代优化',
    category: 'innovation',
    description: '方案设计、测试改进、迭代优化能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  // 协作沟通
  {
    code: 'COL_EXPRESSION',
    name: '表达与沟通能力',
    category: 'collaboration',
    description: '清晰表达、有效沟通、观点分享能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'COL_TEAMWORK',
    name: '团队协作能力',
    category: 'collaboration',
    description: '分工合作、协调配合、共同目标达成能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'COL_SHARING',
    name: '知识分享与互助',
    category: 'collaboration',
    description: '帮助他人、经验分享、互助学习能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  // AI伦理与责任
  {
    code: 'ETH_AWARENESS',
    name: 'AI伦理意识',
    category: 'ethics',
    description: '了解AI伦理问题、识别伦理风险能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'ETH_RESPONSIBILITY',
    name: '数字责任与安全意识',
    category: 'ethics',
    description: '数据安全、隐私保护、负责任使用AI能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
  {
    code: 'ETH_HUMANISTIC',
    name: '人文素养与价值判断',
    category: 'ethics',
    description: '以人为本、价值判断、科技向善能力',
    applicable_courses: JSON.stringify(['scratch', 'python', 'cpp', 'aigc', 'math']),
    applicable_grades: JSON.stringify(['1-3', '4-6', '7-9']),
  },
];

const COURSE_WEIGHTS = {
  scratch: {
    '1-3': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 12, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 8, is_required: 0 },
      { dimension_code: 'SKL_BASIC', weight: 18, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 15, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 10, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 10, is_required: 1 },
      { dimension_code: 'QLT_ATTITUDE', weight: 5, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 12, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 10, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
    '4-6': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 12, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 10, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 13, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 18, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 8, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 10, is_required: 1 },
      { dimension_code: 'QLT_ATTITUDE', weight: 7, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 10, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 8, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
  },
  python: {
    '4-6': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 12, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 13, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 10, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 15, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 18, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 8, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 10, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTITUDE', weight: 7, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 10, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 8, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
    '7-9': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 10, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 12, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 10, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 20, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 10, is_required: 1 },
      { dimension_code: 'QLT_ATTENTION', weight: 8, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTITUDE', weight: 8, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 10, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 8, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
  },
  cpp: {
    '7-9': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 10, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 10, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 20, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 10, is_required: 1 },
      { dimension_code: 'QLT_ATTENTION', weight: 8, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'QLT_ATTITUDE', weight: 7, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 10, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 8, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
  },
  aigc: {
    '1-3': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 12, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 10, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 13, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 15, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 15, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 5, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 8, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 15, is_required: 1 },
      { dimension_code: 'QLT_ATTITUDE', weight: 7, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 12, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 10, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
    '4-6': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 10, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 13, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 12, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 12, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 18, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 5, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_EXPRESSION', weight: 15, is_required: 1 },
      { dimension_code: 'QLT_ATTITUDE', weight: 8, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 12, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 10, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
    '7-9': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 10, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 13, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 12, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 10, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 20, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 8, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_EXPRESSION', weight: 12, is_required: 1 },
      { dimension_code: 'QLT_ATTITUDE', weight: 8, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 12, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 10, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
  },
  math: {
    '1-3': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 8, is_required: 0 },
      { dimension_code: 'SKL_BASIC', weight: 18, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 12, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 12, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'QLT_ATTITUDE', weight: 8, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 12, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 10, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
    '4-6': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 13, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 10, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 15, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 15, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 10, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTITUDE', weight: 8, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 12, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 10, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
    '7-9': [
      { dimension_code: 'COG_UNDERSTANDING', weight: 12, is_required: 1 },
      { dimension_code: 'COG_REASONING', weight: 15, is_required: 1 },
      { dimension_code: 'COG_TRANSFER', weight: 12, is_required: 1 },
      { dimension_code: 'SKL_BASIC', weight: 12, is_required: 1 },
      { dimension_code: 'SKL_APPLICATION', weight: 18, is_required: 1 },
      { dimension_code: 'SKL_EFFICIENCY', weight: 8, is_required: 0 },
      { dimension_code: 'QLT_ATTENTION', weight: 8, is_required: 1 },
      { dimension_code: 'QLT_EXPRESSION', weight: 7, is_required: 0 },
      { dimension_code: 'QLT_ATTITUDE', weight: 8, is_required: 0 },
      { dimension_code: 'INN_CREATIVITY', weight: 12, is_required: 1 },
      { dimension_code: 'INN_EXPLORATION', weight: 10, is_required: 0 },
      { dimension_code: 'INN_DESIGN', weight: 8, is_required: 0 },
      { dimension_code: 'COL_EXPRESSION', weight: 5, is_required: 0 },
      { dimension_code: 'COL_TEAMWORK', weight: 5, is_required: 0 },
      { dimension_code: 'COL_SHARING', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_AWARENESS', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_RESPONSIBILITY', weight: 5, is_required: 0 },
      { dimension_code: 'ETH_HUMANISTIC', weight: 5, is_required: 0 },
    ],
  },
};

export async function initializeDimensions() {
  const db = await getDb();

  for (const dim of DEFAULT_DIMENSIONS) {
    try {
      const existing = await db.get('SELECT id FROM assessment_dimensions WHERE code = ?', [dim.code]);
      if (!existing) {
        await db.run(
          `INSERT INTO assessment_dimensions (code, name, category, description, applicable_courses, applicable_grades)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [dim.code, dim.name, dim.category, dim.description, dim.applicable_courses, dim.applicable_grades]
        );
        console.log(`[Dimension Init] Inserted dimension: ${dim.code} - ${dim.name}`);
      }
    } catch (err) {
      console.error(`[Dimension Init] Error inserting ${dim.code}:`, err);
    }
  }

  for (const [courseType, grades] of Object.entries(COURSE_WEIGHTS)) {
    for (const [gradeRange, weights] of Object.entries(grades)) {
      for (const w of weights) {
        try {
          const existing = await db.get(
            'SELECT id FROM course_dimension_weights WHERE course_type = ? AND grade_range = ? AND dimension_code = ?',
            [courseType, gradeRange, w.dimension_code]
          );
          if (!existing) {
            await db.run(
              `INSERT INTO course_dimension_weights (course_type, grade_range, dimension_code, weight, is_required)
               VALUES (?, ?, ?, ?, ?)`,
              [courseType, gradeRange, w.dimension_code, w.weight, w.is_required]
            );
          }
        } catch (err) {
          console.error(`[Dimension Init] Error inserting weight for ${courseType} ${gradeRange} ${w.dimension_code}:`, err);
        }
      }
    }
  }

  console.log('[Dimension Init] Dimensions initialization completed');
}

export async function initializeCourseKnowledge() {
  const db = await getDb();

  const courseKnowledgeData = {
    scratch: {
      '1-3': {
        knowledge_points: JSON.stringify([
          { code: 'SCR_001', name: '角色与舞台', difficulty: 1 },
          { code: 'SCR_002', name: '积木分类', difficulty: 1 },
          { code: 'SCR_003', name: '移动与转向', difficulty: 1 },
          { code: 'SCR_004', name: '事件响应', difficulty: 2 },
          { code: 'SCR_005', name: '外观控制', difficulty: 2 },
          { code: 'SCR_006', name: '循环结构', difficulty: 2 },
          { code: 'SCR_007', name: '条件判断', difficulty: 3 },
          { code: 'SCR_008', name: '变量基础', difficulty: 3 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '1-3', objectives: ['掌握角色添加和基本操作', '理解积木分类', '能创建简单动画'] },
        ]),
        prerequisites: JSON.stringify({
          'SCR_004': ['SCR_001', 'SCR_002'],
          'SCR_006': ['SCR_003'],
          'SCR_007': ['SCR_002', 'SCR_005'],
        }),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['SCR_001', 'SCR_002', 'SCR_003'] },
          { stage: '基础', points: ['SCR_004', 'SCR_005', 'SCR_006'] },
          { stage: '进阶', points: ['SCR_007', 'SCR_008'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'SCR_006', error: '循环次数设置错误', tip: '先画流程图确认循环次数' },
          { point: 'SCR_007', error: '条件判断逻辑混淆', tip: '区分"如果...那么"和"如果...那么...否则"' },
        ]),
      },
      '4-6': {
        knowledge_points: JSON.stringify([
          { code: 'SCR_001', name: '角色与舞台', difficulty: 1 },
          { code: 'SCR_002', name: '积木分类', difficulty: 1 },
          { code: 'SCR_003', name: '移动与转向', difficulty: 1 },
          { code: 'SCR_004', name: '事件响应', difficulty: 2 },
          { code: 'SCR_005', name: '外观控制', difficulty: 2 },
          { code: 'SCR_006', name: '循环结构', difficulty: 2 },
          { code: 'SCR_007', name: '条件判断', difficulty: 3 },
          { code: 'SCR_008', name: '变量基础', difficulty: 3 },
          { code: 'SCR_009', name: '侦测模块', difficulty: 3 },
          { code: 'SCR_010', name: '广播消息', difficulty: 3 },
          { code: 'SCR_011', name: '列表基础', difficulty: 4 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '4-6', objectives: ['熟练使用事件驱动编程', '掌握循环和条件判断', '能创建多角色交互项目'] },
        ]),
        prerequisites: JSON.stringify({
          'SCR_004': ['SCR_001', 'SCR_002'],
          'SCR_006': ['SCR_003'],
          'SCR_007': ['SCR_002', 'SCR_005'],
          'SCR_010': ['SCR_004', 'SCR_007'],
        }),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['SCR_001', 'SCR_002', 'SCR_003'] },
          { stage: '基础', points: ['SCR_004', 'SCR_005', 'SCR_006', 'SCR_007'] },
          { stage: '进阶', points: ['SCR_008', 'SCR_009', 'SCR_010'] },
          { stage: '精通', points: ['SCR_011'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'SCR_006', error: '死循环', tip: '注意循环结束条件' },
          { point: 'SCR_010', error: '消息发送接收时序问题', tip: '使用广播并等待解决时序问题' },
        ]),
      },
    },
    python: {
      '4-6': {
        knowledge_points: JSON.stringify([
          { code: 'PY_001', name: '输出与输入', difficulty: 1 },
          { code: 'PY_002', name: '变量与数据类型', difficulty: 1 },
          { code: 'PY_003', name: '算术运算', difficulty: 1 },
          { code: 'PY_004', name: '字符串操作', difficulty: 2 },
          { code: 'PY_005', name: '条件语句', difficulty: 2 },
          { code: 'PY_006', name: '循环语句', difficulty: 2 },
          { code: 'PY_007', name: '列表基础', difficulty: 3 },
          { code: 'PY_008', name: '函数定义', difficulty: 3 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '4-6', objectives: ['掌握Python基本语法', '能编写简单程序', '理解程序逻辑结构'] },
        ]),
        prerequisites: JSON.stringify({
          'PY_005': ['PY_001', 'PY_002'],
          'PY_006': ['PY_001', 'PY_002'],
          'PY_007': ['PY_006'],
          'PY_008': ['PY_005', 'PY_006'],
        }),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['PY_001', 'PY_002', 'PY_003'] },
          { stage: '基础', points: ['PY_004', 'PY_005', 'PY_006'] },
          { stage: '进阶', points: ['PY_007', 'PY_008'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'PY_002', error: '变量命名错误', tip: '变量名不能以数字开头，不能使用关键字' },
          { point: 'PY_005', error: '缩进错误', tip: 'Python使用缩进表示代码块' },
        ]),
      },
      '7-9': {
        knowledge_points: JSON.stringify([
          { code: 'PY_001', name: '输出与输入', difficulty: 1 },
          { code: 'PY_002', name: '变量与数据类型', difficulty: 1 },
          { code: 'PY_003', name: '算术运算', difficulty: 1 },
          { code: 'PY_004', name: '字符串操作', difficulty: 2 },
          { code: 'PY_005', name: '条件语句', difficulty: 2 },
          { code: 'PY_006', name: '循环语句', difficulty: 2 },
          { code: 'PY_007', name: '列表与元组', difficulty: 2 },
          { code: 'PY_008', name: '字典基础', difficulty: 3 },
          { code: 'PY_009', name: '函数定义', difficulty: 3 },
          { code: 'PY_010', name: '模块导入', difficulty: 3 },
          { code: 'PY_011', name: '文件操作', difficulty: 4 },
          { code: 'PY_012', name: '异常处理', difficulty: 4 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '7-9', objectives: ['掌握Python核心语法', '能开发实用程序', '了解面向对象概念'] },
        ]),
        prerequisites: JSON.stringify({
          'PY_005': ['PY_001', 'PY_002'],
          'PY_006': ['PY_001', 'PY_002'],
          'PY_007': ['PY_006'],
          'PY_008': ['PY_007'],
          'PY_009': ['PY_005', 'PY_006'],
        }),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['PY_001', 'PY_002', 'PY_003'] },
          { stage: '基础', points: ['PY_004', 'PY_005', 'PY_006', 'PY_007'] },
          { stage: '进阶', points: ['PY_008', 'PY_009', 'PY_010'] },
          { stage: '精通', points: ['PY_011', 'PY_012'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'PY_007', error: '列表索引越界', tip: '注意列表索引从0开始' },
          { point: 'PY_009', error: '函数参数传递错误', tip: '注意值传递和引用传递的区别' },
        ]),
      },
    },
    cpp: {
      '7-9': {
        knowledge_points: JSON.stringify([
          { code: 'CPP_001', name: 'C++基础', difficulty: 2 },
          { code: 'CPP_002', name: '变量与数据类型', difficulty: 2 },
          { code: 'CPP_003', name: '输入输出', difficulty: 2 },
          { code: 'CPP_004', name: '条件语句', difficulty: 2 },
          { code: 'CPP_005', name: '循环结构', difficulty: 2 },
          { code: 'CPP_006', name: '数组基础', difficulty: 3 },
          { code: 'CPP_007', name: '函数基础', difficulty: 3 },
          { code: 'CPP_008', name: '排序算法', difficulty: 4 },
          { code: 'CPP_009', name: '搜索算法', difficulty: 4 },
          { code: 'CPP_010', name: '基础数据结构', difficulty: 4 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '7-9', objectives: ['掌握C++语法基础', '理解算法与数据结构', '能解决基础算法问题'] },
        ]),
        prerequisites: JSON.stringify({
          'CPP_004': ['CPP_001', 'CPP_002'],
          'CPP_005': ['CPP_002', 'CPP_003'],
          'CPP_006': ['CPP_005'],
          'CPP_007': ['CPP_004', 'CPP_005'],
        }),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['CPP_001', 'CPP_002', 'CPP_003'] },
          { stage: '基础', points: ['CPP_004', 'CPP_005', 'CPP_006', 'CPP_007'] },
          { stage: '进阶', points: ['CPP_008', 'CPP_009', 'CPP_010'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'CPP_002', error: '数据类型混淆', tip: '注意int和float的区别' },
          { point: 'CPP_005', error: '数组越界', tip: '数组下标从0开始，最大为n-1' },
        ]),
      },
    },
    aigc: {
      '1-3': {
        knowledge_points: JSON.stringify([
          { code: 'AIGC_001', name: '什么是AI', difficulty: 1 },
          { code: 'AIGC_002', name: 'AI的应用场景', difficulty: 1 },
          { code: 'AIGC_003', name: 'AI生成内容', difficulty: 2 },
          { code: 'AIGC_004', name: '提示词基础', difficulty: 2 },
          { code: 'AIGC_005', name: '图像生成', difficulty: 2 },
          { code: 'AIGC_006', name: 'AI伦理意识', difficulty: 2 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '1-3', objectives: ['了解AI基本概念', '能使用简单AI工具', '培养AI时代素养'] },
        ]),
        prerequisites: JSON.stringify({}),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['AIGC_001', 'AIGC_002'] },
          { stage: '基础', points: ['AIGC_003', 'AIGC_004', 'AIGC_005'] },
          { stage: '进阶', points: ['AIGC_006'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'AIGC_004', error: '提示词过于简单', tip: '详细的描述能获得更好的生成结果' },
        ]),
      },
      '4-6': {
        knowledge_points: JSON.stringify([
          { code: 'AIGC_001', name: '什么是AI', difficulty: 1 },
          { code: 'AIGC_002', name: 'AI的应用场景', difficulty: 1 },
          { code: 'AIGC_003', name: 'AI生成内容原理', difficulty: 2 },
          { code: 'AIGC_004', name: '提示词工程', difficulty: 2 },
          { code: 'AIGC_005', name: '图像生成', difficulty: 2 },
          { code: 'AIGC_006', name: '文本生成', difficulty: 2 },
          { code: 'AIGC_007', name: 'AI工具迭代优化', difficulty: 3 },
          { code: 'AIGC_008', name: 'AI伦理与安全', difficulty: 3 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '4-6', objectives: ['理解AI生成原理', '掌握提示词技巧', '能创作AI作品'] },
        ]),
        prerequisites: JSON.stringify({}),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['AIGC_001', 'AIGC_002', 'AIGC_003'] },
          { stage: '基础', points: ['AIGC_004', 'AIGC_005', 'AIGC_006'] },
          { stage: '进阶', points: ['AIGC_007', 'AIGC_008'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'AIGC_004', error: '提示词不够具体', tip: '包含风格、细节、格式等具体要求' },
        ]),
      },
      '7-9': {
        knowledge_points: JSON.stringify([
          { code: 'AIGC_001', name: 'AI基础认知', difficulty: 1 },
          { code: 'AIGC_002', name: 'AI应用场景', difficulty: 1 },
          { code: 'AIGC_003', name: 'AI生成原理', difficulty: 2 },
          { code: 'AIGC_004', name: '提示词工程进阶', difficulty: 2 },
          { code: 'AIGC_005', name: '图像生成进阶', difficulty: 2 },
          { code: 'AIGC_006', name: '文本生成应用', difficulty: 2 },
          { code: 'AIGC_007', name: '音视频处理', difficulty: 3 },
          { code: 'AIGC_008', name: 'AI伦理与版权', difficulty: 3 },
          { code: 'AIGC_009', name: '批判性思维', difficulty: 3 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '7-9', objectives: ['深入理解AI原理', '掌握高级提示词技巧', '能进行AI创作项目'] },
        ]),
        prerequisites: JSON.stringify({}),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['AIGC_001', 'AIGC_002', 'AIGC_003'] },
          { stage: '基础', points: ['AIGC_004', 'AIGC_005', 'AIGC_006'] },
          { stage: '进阶', points: ['AIGC_007', 'AIGC_008', 'AIGC_009'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'AIGC_008', error: '忽视版权问题', tip: '了解AI生成内容的版权归属' },
        ]),
      },
    },
    math: {
      '1-3': {
        knowledge_points: JSON.stringify([
          { code: 'MATH_001', name: '数的认识', difficulty: 1 },
          { code: 'MATH_002', name: '加减法', difficulty: 1 },
          { code: 'MATH_003', name: '乘除法基础', difficulty: 2 },
          { code: 'MATH_004', name: '图形认识', difficulty: 2 },
          { code: 'MATH_005', name: '简单应用题', difficulty: 2 },
          { code: 'MATH_006', name: '逻辑推理入门', difficulty: 3 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '1-3', objectives: ['掌握基础运算', '认识基本图形', '培养数感'] },
        ]),
        prerequisites: JSON.stringify({}),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['MATH_001', 'MATH_002'] },
          { stage: '基础', points: ['MATH_003', 'MATH_004'] },
          { stage: '进阶', points: ['MATH_005', 'MATH_006'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'MATH_002', error: '进位退位错误', tip: '注意运算规则，多做练习' },
        ]),
      },
      '4-6': {
        knowledge_points: JSON.stringify([
          { code: 'MATH_001', name: '小数与分数', difficulty: 2 },
          { code: 'MATH_002', name: '四则运算', difficulty: 2 },
          { code: 'MATH_003', name: '方程基础', difficulty: 2 },
          { code: 'MATH_004', name: '图形与面积', difficulty: 2 },
          { code: 'MATH_005', name: '统计初步', difficulty: 3 },
          { code: 'MATH_006', name: '逻辑推理', difficulty: 3 },
          { code: 'MATH_007', name: '应用题综合', difficulty: 3 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '4-6', objectives: ['掌握分数小数运算', '能解简单方程', '提升逻辑推理能力'] },
        ]),
        prerequisites: JSON.stringify({
          'MATH_003': ['MATH_001', 'MATH_002'],
          'MATH_007': ['MATH_002', 'MATH_003'],
        }),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['MATH_001', 'MATH_002'] },
          { stage: '基础', points: ['MATH_003', 'MATH_004'] },
          { stage: '进阶', points: ['MATH_005', 'MATH_006', 'MATH_007'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'MATH_001', error: '分数大小比较错误', tip: '通分后比较分子' },
        ]),
      },
      '7-9': {
        knowledge_points: JSON.stringify([
          { code: 'MATH_001', name: '有理数运算', difficulty: 2 },
          { code: 'MATH_002', name: '代数式', difficulty: 2 },
          { code: 'MATH_003', name: '方程与不等式', difficulty: 2 },
          { code: 'MATH_004', name: '函数基础', difficulty: 3 },
          { code: 'MATH_005', name: '几何证明', difficulty: 3 },
          { code: 'MATH_006', name: '三角形与四边形', difficulty: 3 },
          { code: 'MATH_007', name: '圆与立体几何', difficulty: 4 },
          { code: 'MATH_008', name: '概率统计', difficulty: 3 },
        ]),
        learning_objectives: JSON.stringify([
          { grade: '7-9', objectives: ['掌握代数基础', '理解函数概念', '能进行几何证明'] },
        ]),
        prerequisites: JSON.stringify({
          'MATH_003': ['MATH_001', 'MATH_002'],
          'MATH_004': ['MATH_003'],
        }),
        learning_path: JSON.stringify([
          { stage: '入门', points: ['MATH_001', 'MATH_002'] },
          { stage: '基础', points: ['MATH_003', 'MATH_004'] },
          { stage: '进阶', points: ['MATH_005', 'MATH_006', 'MATH_007'] },
          { stage: '精通', points: ['MATH_008'] },
        ]),
        common_mistakes: JSON.stringify([
          { point: 'MATH_003', error: '移项变号错误', tip: '移项要变号，等式两边同时进行' },
        ]),
      },
    },
  };

  for (const [courseType, grades] of Object.entries(courseKnowledgeData)) {
    for (const [gradeRange, data] of Object.entries(grades)) {
      try {
        const existing = await db.get(
          'SELECT id FROM course_knowledge WHERE course_type = ? AND grade_range = ?',
          [courseType, gradeRange]
        );
        if (!existing) {
          await db.run(
            `INSERT INTO course_knowledge (course_type, grade_range, knowledge_points, learning_objectives, prerequisites, learning_path, common_mistakes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [courseType, gradeRange, data.knowledge_points, data.learning_objectives, data.prerequisites, data.learning_path, data.common_mistakes]
          );
          console.log(`[Course Knowledge Init] Inserted: ${courseType} - ${gradeRange}`);
        }
      } catch (err) {
        console.error(`[Course Knowledge Init] Error for ${courseType} ${gradeRange}:`, err);
      }
    }
  }

  console.log('[Course Knowledge Init] Course knowledge initialization completed');
}

// 小维度代码到大类category的映射
const DIMENSION_CATEGORY_MAP: Record<string, string> = {
  COG_UNDERSTANDING: 'cognitive',
  COG_REASONING: 'cognitive',
  COG_TRANSFER: 'cognitive',
  SKL_BASIC: 'skill',
  SKL_APPLICATION: 'skill',
  SKL_EFFICIENCY: 'skill',
  QLT_ATTENTION: 'quality',
  QLT_EXPRESSION: 'quality',
  QLT_ATTITUDE: 'quality',
  INN_CREATIVITY: 'innovation',
  INN_EXPLORATION: 'innovation',
  INN_DESIGN: 'innovation',
  COL_EXPRESSION: 'collaboration',
  COL_TEAMWORK: 'collaboration',
  COL_SHARING: 'collaboration',
  ETH_AWARENESS: 'ethics',
  ETH_RESPONSIBILITY: 'ethics',
  ETH_HUMANISTIC: 'ethics',
};

// 6大维度分类信息
const CATEGORY_INFO: Record<string, { name: string; codes: string[] }> = {
  cognitive: { name: '认知能力', codes: ['COG_UNDERSTANDING', 'COG_REASONING', 'COG_TRANSFER'] },
  skill: { name: '技能能力', codes: ['SKL_BASIC', 'SKL_APPLICATION', 'SKL_EFFICIENCY'] },
  quality: { name: '综合素养', codes: ['QLT_ATTENTION', 'QLT_EXPRESSION', 'QLT_ATTITUDE'] },
  innovation: { name: '创新思维', codes: ['INN_CREATIVITY', 'INN_EXPLORATION', 'INN_DESIGN'] },
  collaboration: { name: '协作沟通', codes: ['COL_EXPRESSION', 'COL_TEAMWORK', 'COL_SHARING'] },
  ethics: { name: 'AI伦理', codes: ['ETH_AWARENESS', 'ETH_RESPONSIBILITY', 'ETH_HUMANISTIC'] },
};

export function getDimensionCategoryMap(): Record<string, string> {
  return { ...DIMENSION_CATEGORY_MAP };
}

export function getCategoryInfo(): Record<string, { name: string; codes: string[] }> {
  return { ...CATEGORY_INFO };
}

// 获取所有有效维度代码
export function getValidDimensionCodes(): string[] {
  return Object.keys(DIMENSION_CATEGORY_MAP);
}

// 校验维度代码是否有效
export function isValidDimensionCode(code: string): boolean {
  return !!DIMENSION_CATEGORY_MAP[code];
}

// 根据课程类型和年级范围获取6大维度各自的题目数量分配
export function getDimensionDistribution(
  courseType: string,
  gradeRange: string,
  totalQuestions: number
): Record<string, number> {
  const weights = COURSE_WEIGHTS[courseType as keyof typeof COURSE_WEIGHTS]?.[gradeRange as keyof any];
  if (!weights) {
    // 默认均匀分配
    const perCategory = Math.max(1, Math.floor(totalQuestions / 6));
    return {
      cognitive: perCategory,
      skill: perCategory,
      quality: perCategory,
      innovation: perCategory,
      collaboration: perCategory,
      ethics: perCategory,
    };
  }

  // 按category聚合weight
  const categoryWeights: Record<string, number> = {};
  for (const w of weights) {
    const cat = DIMENSION_CATEGORY_MAP[w.dimension_code];
    if (cat) {
      categoryWeights[cat] = (categoryWeights[cat] || 0) + w.weight;
    }
  }

  const totalWeight = Object.values(categoryWeights).reduce((sum, w) => sum + w, 0);
  const distribution: Record<string, number> = {};
  let allocated = 0;

  // 先分配基础数量（每个维度至少1题）
  const categories = Object.keys(CATEGORY_INFO);
  for (const cat of categories) {
    distribution[cat] = 1;
    allocated++;
  }

  // 剩余题目按权重比例分配
  const remaining = totalQuestions - allocated;
  if (remaining > 0 && totalWeight > 0) {
    for (const cat of categories) {
      const weight = categoryWeights[cat] || 0;
      const extra = Math.round((weight / totalWeight) * remaining);
      distribution[cat] += extra;
    }
  }

  // 调整确保总数正确
  const currentTotal = Object.values(distribution).reduce((sum, n) => sum + n, 0);
  if (currentTotal !== totalQuestions) {
    const diff = totalQuestions - currentTotal;
    // 找到权重最大的维度进行调整
    let maxCat = categories[0];
    let maxWeight = categoryWeights[maxCat] || 0;
    for (const cat of categories) {
      if ((categoryWeights[cat] || 0) > maxWeight) {
        maxWeight = categoryWeights[cat] || 0;
        maxCat = cat;
      }
    }
    distribution[maxCat] += diff;
  }

  return distribution;
}

export function inferDimensionFromKnowledgePoint(knowledgePoint: string): string {
  const kp = knowledgePoint?.toLowerCase() || '';

  // 认知能力 - 理解、分析、推理、概念、思维
  if (kp.includes('理解') || kp.includes('分析') || kp.includes('问题') || kp.includes('概念') || kp.includes('识别') || kp.includes('认知')) return 'COG_UNDERSTANDING';
  if (kp.includes('推理') || kp.includes('逻辑') || kp.includes('判断') || kp.includes('思维') || kp.includes('思考') || kp.includes('证明')) return 'COG_REASONING';
  if (kp.includes('迁移') || kp.includes('应用') || kp.includes('运用') || kp.includes('转化')) return 'COG_TRANSFER';

  // 技能能力 - 编程、算法、实现、操作、基础、进阶
  if (kp.includes('基础') || kp.includes('操作') || kp.includes('工具') || kp.includes('使用') || kp.includes('语法') || kp.includes('入门')) return 'SKL_BASIC';
  if (kp.includes('进阶') || kp.includes('综合') || kp.includes('解决') || kp.includes('实现') || kp.includes('编程') || kp.includes('代码') || kp.includes('开发') || kp.includes('算法') || kp.includes('数据结构') || kp.includes('排序') || kp.includes('搜索')) return 'SKL_APPLICATION';
  if (kp.includes('效率') || kp.includes('质量') || kp.includes('速度') || kp.includes('优化') || kp.includes('性能')) return 'SKL_EFFICIENCY';

  // 综合素养 - 专注、细心、态度、表达、创意
  if (kp.includes('专注') || kp.includes('细心') || kp.includes('注意') || kp.includes('细节') || kp.includes('审题') || kp.includes('检查')) return 'QLT_ATTENTION';
  if (kp.includes('表达') || kp.includes('创意') || kp.includes('沟通') || kp.includes('展示') || kp.includes('描述') || kp.includes('写作') || kp.includes('写作') || kp.includes('文字') || kp.includes('语言')) return 'QLT_EXPRESSION';
  if (kp.includes('态度') || kp.includes('潜力') || kp.includes('积极性') || kp.includes('习惯') || kp.includes('兴趣') || kp.includes('学习') || kp.includes('素养')) return 'QLT_ATTITUDE';

  // 创新思维 - 创新、创造、探索、设计、想象
  if (kp.includes('创新') || kp.includes('创造') || kp.includes('发明') || kp.includes('想象') || kp.includes('发散') || kp.includes('独特')) return 'INN_CREATIVITY';
  if (kp.includes('探索') || kp.includes('好奇') || kp.includes('发现') || kp.includes('调研') || kp.includes('尝试') || kp.includes('实验')) return 'INN_EXPLORATION';
  if (kp.includes('设计') || kp.includes('迭代') || kp.includes('优化') || kp.includes('架构') || kp.includes('规划') || kp.includes('方案') || kp.includes('建模')) return 'INN_DESIGN';

  // 协作沟通 - 团队、协作、合作、分享、交流
  if (kp.includes('团队') || kp.includes('协作') || kp.includes('合作') || kp.includes('配合') || kp.includes('协调') || kp.includes('项目管理')) return 'COL_TEAMWORK';
  if (kp.includes('分享') || kp.includes('互助') || kp.includes('交流') || kp.includes('讨论') || kp.includes('反馈') || kp.includes('评价')) return 'COL_SHARING';

  // AI伦理 - 伦理、道德、安全、责任、隐私、版权
  if (kp.includes('伦理') || kp.includes('道德') || kp.includes('版权') || kp.includes('公平') || kp.includes('偏见')) return 'ETH_AWARENESS';
  if (kp.includes('安全') || kp.includes('责任') || kp.includes('隐私') || kp.includes('保护') || kp.includes('风险') || kp.includes('防护')) return 'ETH_RESPONSIBILITY';
  if (kp.includes('人文') || kp.includes('价值') || kp.includes('社会') || kp.includes('影响') || kp.includes('可持续')) return 'ETH_HUMANISTIC';

  // 按课程类型的默认映射
  if (kp.includes('计算机') || kp.includes('网络') || kp.includes('系统') || kp.includes('硬件') || kp.includes('软件') || kp.includes('cpu') || kp.includes('内存')) return 'SKL_BASIC';
  if (kp.includes('scratch') || kp.includes('图形化') || kp.includes('积木')) return 'SKL_APPLICATION';
  if (kp.includes('python') || kp.includes('c++') || kp.includes('cpp') || kp.includes('java') || kp.includes('javascript')) return 'SKL_APPLICATION';
  if (kp.includes('aigc') || kp.includes('ai') || kp.includes('人工智能') || kp.includes('生成') || kp.includes('模型') || kp.includes('大语言')) return 'COG_UNDERSTANDING';
  if (kp.includes('数学') || kp.includes('算术') || kp.includes('几何') || kp.includes('代数') || kp.includes('概率') || kp.includes('统计') || kp.includes('数理') || kp.includes('数')) return 'COG_REASONING';
  if (kp.includes('绘画') || kp.includes('图像') || kp.includes('视觉') || kp.includes('色彩') || kp.includes('美术')) return 'INN_CREATIVITY';
  if (kp.includes('音乐') || kp.includes('音频') || kp.includes('声音') || kp.includes('作曲')) return 'QLT_EXPRESSION';
  if (kp.includes('视频') || kp.includes('动画') || kp.includes('影视') || kp.includes('剪辑')) return 'INN_DESIGN';

  return 'COG_UNDERSTANDING';
}

export async function initAllDimensions() {
  await initializeDimensions();
  await initializeCourseKnowledge();
}
