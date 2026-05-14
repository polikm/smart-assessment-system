import { getDb } from '../db.js';
import { aiCall } from '../utils/aiClient.js';
import { inferDimensionFromKnowledgePoint, isValidDimensionCode } from './dimensionService.js';

// 人教版数学教材知识点大纲
const KNOWLEDGE_POINTS = {
  math: {
    '1-2': [
      '认识整数、100以内加减法',
      '认识长度（米、厘米）',
      '认识钟表',
      '认识人民币',
      '简单乘法',
      '简单除法',
      '平面图形初步',
      '简单统计',
      '找规律'
    ],
    '3-4': [
      '万以内数的认识',
      '多位数加减法',
      '多位数乘除法',
      '小数初步认识',
      '分数初步认识',
      '长方形、正方形周长',
      '面积计算',
      '年、月、日',
      '位置与方向',
      '可能性'
    ],
    '5-6': [
      '小数的四则运算',
      '分数的四则运算',
      '百分数',
      '比和比例',
      '圆的周长和面积',
      '圆柱、圆锥',
      '统计与概率',
      '数学广角',
      '方程初步',
      '负数'
    ],
    '7-9': [
      '有理数',
      '整式',
      '一元一次方程',
      '二元一次方程组',
      '不等式与不等式组',
      '相交线与平行线',
      '三角形',
      '全等三角形',
      '轴对称',
      '勾股定理',
      '四边形',
      '一次函数',
      '反比例函数',
      '二次函数',
      '圆',
      '统计与概率'
    ]
  },
  scratch: {
    '1-2': ['角色移动', '等待与循环', '外观变化', '简单事件', '声音播放', '坐标与舞台', '对话与说话', '简单条件判断'],
    '3-4': ['移动与控制', '变量与列表', '条件与分支', '随机数', '侦测', '运算', '画笔', '简单动画'],
    '5-6': ['复杂循环', '自定义积木', '克隆', '列表操作', '复杂条件', '游戏逻辑', '简单算法', '声音与音乐'],
    '7-9': ['算法初步', '数据结构', '复杂游戏', '物理模拟', '人工智能入门', '项目开发', '代码优化']
  },
  python: {
    '1-2': ['print输出', '变量与赋值', '简单输入', '字符串', '整数运算', '条件判断', '循环', '列表基础'],
    '3-4': ['字符串操作', '列表与元组', '字典', '函数基础', '循环与嵌套', '条件判断', '文件操作', '随机数'],
    '5-6': ['函数进阶', '列表推导', '字典操作', '类与对象', '异常处理', '模块导入', '简单算法', '游戏开发'],
    '7-9': ['数据结构', '算法', '面向对象', '文件处理', '库的使用', '数据分析', 'Web基础', '项目开发']
  },
  cpp: {
    '3-4': ['变量与数据类型', '输入输出', '运算符', '条件判断', '循环', '数组', '函数'],
    '5-6': ['函数进阶', '数组与字符串', '结构体', '指针基础', 'STL基础', '排序算法', '递归'],
    '7-9': ['指针与引用', '面向对象', 'STL', '数据结构', '算法', '动态规划', '图论', '数论', '字符串算法']
  },
  aigc: {
    '1-2': ['AI初步认识', '绘画提示词', '简单创意', '图像描述', 'AI工具介绍'],
    '3-4': ['提示词技巧', '图像编辑', 'AI音频', '内容创作', '创意应用'],
    '5-6': ['提示词工程', '图像生成进阶', '视频创作', '智能体', 'AI伦理'],
    '7-9': ['AI应用开发', '提示词优化', '多模态AI', '项目开发', 'AI创新']
  }
};

// 18小维度代码列表（用于校验AI返回的dimension_code）
const VALID_DIMENSION_CODES = [
  'COG_UNDERSTANDING', 'COG_REASONING', 'COG_TRANSFER',
  'SKL_BASIC', 'SKL_APPLICATION', 'SKL_EFFICIENCY',
  'QLT_ATTENTION', 'QLT_EXPRESSION', 'QLT_ATTITUDE',
  'INN_CREATIVITY', 'INN_EXPLORATION', 'INN_DESIGN',
  'COL_EXPRESSION', 'COL_TEAMWORK', 'COL_SHARING',
  'ETH_AWARENESS', 'ETH_RESPONSIBILITY', 'ETH_HUMANISTIC',
];

class QuestionGenerator {
  private generatedContents: Set<string>;

  constructor() {
    this.generatedContents = new Set<string>();
  }

  // 检查题目是否重复
  isDuplicate(content: string): boolean {
    return this.generatedContents.has(content);
  }

  // 记录已生成题目
  addGenerated(content: string) {
    this.generatedContents.add(content);
  }

  // 生成题目提示词
  getGeneratePrompt(courseType: string, gradeRange: string, knowledgePoint: string, difficulty: number, count: number, batchNumber: number): string {
    const needImage = courseType === 'math' && ['平面图形', '立体几何', '三视图', '图形变换', '面积', '周长', '圆', '三角形', '几何'].some(k => knowledgePoint.includes(k));

    return `你是一位专业的${courseType === 'math' ? '数学' : courseType === 'scratch' ? 'Scratch' : courseType === 'python' ? 'Python' : courseType === 'cpp' ? 'C++' : 'AIGC'}教师，请生成${count}道优质题目，用于${gradeRange}年级学生测评。

要求：
1. 知识点：${knowledgePoint}
2. 难度：${difficulty}星（1星最简单，5星最难）
3. 题型：单选题
4. 必须严格按照以下JSON格式返回，不要包含任何其他文字
5. 这是第${batchNumber}批次生成，题目内容不能与之前批次重复
6. ${courseType === 'math' ? '禁止出现类似"50×30="这种最基础的直接计算填空题，要出应用题、推理题、逻辑题' : ''}
7. 题目要结合人教版教材，难度要匹配年级
8. 题目内容要有创意，避免重复
${needImage ? `9. 这是图形类题目，请在image_svg字段中提供完整的SVG图片代码，图片要清晰，大小合适（建议宽400px高300px）` : '9. 不需要图片，image_svg留空'}

【重要】每道题必须根据知识点内容，选择对应的能力维度代码。维度代码必须从以下列表中选择：
- 认知能力(cognitive)：COG_UNDERSTANDING(问题理解与分析)、COG_REASONING(逻辑推理与判断)、COG_TRANSFER(知识迁移与应用)
- 技能能力(skill)：SKL_BASIC(基础操作与工具使用)、SKL_APPLICATION(进阶应用与问题解决)、SKL_EFFICIENCY(效率与质量控制)
- 综合素养(quality)：QLT_ATTENTION(专注力与细心度)、QLT_EXPRESSION(创意与表达能力)、QLT_ATTITUDE(学习态度与成长潜力)
- 创新思维(innovation)：INN_CREATIVITY(创新意识与创造力)、INN_EXPLORATION(探索精神与好奇心)、INN_DESIGN(设计思维与迭代优化)
- 协作沟通(collaboration)：COL_EXPRESSION(表达与沟通能力)、COL_TEAMWORK(团队协作能力)、COL_SHARING(知识分享与互助)
- AI伦理(ethics)：ETH_AWARENESS(AI伦理意识)、ETH_RESPONSIBILITY(数字责任与安全意识)、ETH_HUMANISTIC(人文素养与价值判断)

选择规则：
- 涉及理解、分析、问题分解的题目 → COG_UNDERSTANDING
- 涉及逻辑推理、条件判断的题目 → COG_REASONING
- 涉及知识应用、场景迁移的题目 → COG_TRANSFER
- 涉及基础操作、工具使用的题目 → SKL_BASIC
- 涉及综合应用、问题解决的题目 → SKL_APPLICATION
- 涉及效率、质量控制的题目 → SKL_EFFICIENCY
- 涉及专注、细心、审题的题目 → QLT_ATTENTION
- 涉及创意、表达、沟通能力的题目 → QLT_EXPRESSION
- 涉及学习态度、积极性的题目 → QLT_ATTITUDE
- 涉及创新思维、创造力的题目 → INN_CREATIVITY
- 涉及探索、好奇心的题目 → INN_EXPLORATION
- 涉及设计、迭代优化的题目 → INN_DESIGN
- 涉及表达沟通能力的题目 → COL_EXPRESSION
- 涉及团队协作的题目 → COL_TEAMWORK
- 涉及分享互助的题目 → COL_SHARING
- 涉及AI伦理的题目 → ETH_AWARENESS
- 涉及安全、责任的题目 → ETH_RESPONSIBILITY
- 涉及人文价值的题目 → ETH_HUMANISTIC

返回格式示例：
{
  "questions": [
    {
      "content": "题目内容",
      "image_svg": "<svg>...</svg>" 或 "",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "A",
      "explanation": "题目解析",
      "knowledge_point": "${knowledgePoint}",
      "dimension_code": "COG_UNDERSTANDING",
      "difficulty": ${difficulty}
    }
  ]
}

确保返回的JSON格式正确，dimension_code必须是上述18个代码之一，不包含任何额外文字！`;
  }

  // 生成一批题目
  async generateBatch(
    courseType: string,
    gradeRange: string,
    knowledgePoints: string[],
    difficulty: number,
    count: number,
    batchNumber: number
  ): Promise<any[]> {
    const allQuestions: any[] = [];

    for (const kp of knowledgePoints) {
      const perKpCount = Math.ceil(count / knowledgePoints.length);
      
      try {
        const prompt = this.getGeneratePrompt(courseType, gradeRange, kp, difficulty, perKpCount, batchNumber);
        const aiResponse = await aiCall({
          feature: 'question_generate',
          messages: [{ role: 'user', content: prompt }]
        });
        
        const result = aiResponse.choices?.[0]?.message?.content || '';
        
        // 解析AI返回的JSON
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('AI返回格式错误');
          continue;
        }
        
        let parsed;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('JSON解析失败:', e);
          continue;
        }

        if (parsed.questions && Array.isArray(parsed.questions)) {
          for (const q of parsed.questions) {
            // 去重检查
            if (this.isDuplicate(q.content)) {
              console.log('题目重复，跳过:', q.content.substring(0, 30));
              continue;
            }

            // 校验并修正dimension_code
            let dimCode = q.dimension_code;
            if (!dimCode || !isValidDimensionCode(dimCode)) {
              console.log(`[AI] Invalid dimension_code "${dimCode}" for question, inferring from knowledge point...`);
              dimCode = inferDimensionFromKnowledgePoint(q.knowledge_point || kp);
            }

            this.addGenerated(q.content);
            allQuestions.push({
              ...q,
              course_type: courseType,
              grade_range: gradeRange,
              question_type: 'single',
              status: 'pending',
              ai_generated: true,
              dimension_code: dimCode,
            });
          }
        }
      } catch (error) {
        console.error(`生成题目失败 [${courseType}][${kp}]:`, error);
      }
    }

    return allQuestions;
  }

  // 保存题目到数据库
  async saveQuestions(questions: any[]): Promise<number> {
    const db = await getDb();
    let savedCount = 0;

    for (const q of questions) {
      try {
        await db.run(`
          INSERT INTO questions (
            course_type, grade_range, question_type, content, image_svg,
            options, answer, explanation, knowledge_point, dimension_code,
            difficulty, status, ai_generated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          q.course_type, q.grade_range, q.question_type, q.content, q.image_svg || '',
          JSON.stringify(q.options), q.answer, q.explanation, q.knowledge_point, q.dimension_code,
          q.difficulty, q.status, q.ai_generated ? 1 : 0
        ]);
        savedCount++;
      } catch (e) {
        console.error('保存题目失败:', e);
      }
    }

    return savedCount;
  }

  // 清空所有题目
  async clearAllQuestions(): Promise<void> {
    const db = await getDb();
    await db.run('DELETE FROM questions');
    console.log('已清空所有题目');
  }

  // 获取题目统计
  async getStats(): Promise<any> {
    const db = await getDb();
    
    const total = await db.get('SELECT COUNT(*) as count FROM questions');
    const byCourse = await db.all('SELECT course_type, COUNT(*) as count FROM questions GROUP BY course_type');
    const byDifficulty = await db.all('SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty');
    const byGrade = await db.all('SELECT grade_range, COUNT(*) as count FROM questions GROUP BY grade_range');
    
    return {
      total: total.count,
      byCourse: Object.fromEntries(byCourse.map((r: any) => [r.course_type, r.count])),
      byDifficulty: Object.fromEntries(byDifficulty.map((r: any) => [r.difficulty, r.count])),
      byGrade: Object.fromEntries(byGrade.map((r: any) => [r.grade_range, r.count]))
    };
  }

  // 加载已有题目内容用于去重
  async loadExistingContents(): Promise<void> {
    const db = await getDb();
    const questions = await db.all('SELECT content FROM questions');
    for (const q of questions) {
      this.generatedContents.add(q.content);
    }
    console.log(`已加载 ${this.generatedContents.size} 条已有题目内容用于去重`);
  }
}

export const questionGenerator = new QuestionGenerator();
export { KNOWLEDGE_POINTS };
