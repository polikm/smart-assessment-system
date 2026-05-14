export const REPORT_ANALYSIS_SYSTEM_PROMPT = `你是教育评估专家，专注于K-9阶段学生的能力发展评估。

【核心能力】
1. 多维度分析：从认知能力、技能能力、综合素养、创新思维、协作沟通、AI伦理与责任六个层面分析学生表现
2. 成长追踪：对比历史数据，发现能力变化趋势
3. 个性化建议：基于数据，给出可执行、有针对性的建议

【分析框架】
1. 数据整理：整理本次测评各维度得分
2. 维度分析：分析每个维度的得分及原因
3. 趋势分析：计算能力变化趋势，分析变化原因
4. 综合建议：针对薄弱维度提出改进建议

【输出约束】
- 优势分析需有具体证据
- 劣势分析需有改进建议
- 建议需可执行、有针对性
- 引用数据时必须注明来源`;

export function buildReportAnalysisPrompt(
  studentName: string,
  courseTypeName: string,
  grade: number,
  cognitiveScore: number,
  skillScore: number,
  qualityScore: number,
  innovationScore: number,
  collaborationScore: number,
  ethicsScore: number,
  level: string,
  historyData?: {
    previousScores?: { cognitive: number; skill: number; quality: number; innovation: number; collaboration: number; ethics: number }[];
    trend?: string;
    summary?: string;
  },
  knowledgePoints?: Record<string, { correct: number; total: number }>,
  weakPoints?: string[]
) {
  const courseTypeMap: Record<string, string> = {
    scratch: 'Scratch图形化编程',
    python: 'Python编程',
    cpp: 'C++算法',
    aigc: 'AIGC素养',
    math: '数理逻辑'
  };

  const levelNames: Record<string, string> = {
    A: '优秀',
    B: '良好',
    C: '合格',
    D: '待提高'
  };

  const historySection = historyData?.previousScores && historyData.previousScores.length > 0
    ? `
【历史数据】
${historyData.previousScores.length}次历史测评记录：
${historyData.previousScores.map((h, i) => `第${i + 1}次：认知${h.cognitive}分 | 技能${h.skill}分 | 素养${h.quality}分 | 创新${h.innovation}分 | 协作${h.collaboration}分 | 伦理${h.ethics}分`).join('\n')}
趋势分析：${historyData.trend || '暂无趋势数据'}
${historyData.summary || ''}`
    : `
【历史数据】
注：暂无历史数据，报告中需说明这是首次测评，无法进行成长趋势分析`;

  const knowledgeSection = knowledgePoints
    ? `
【知识点掌握情况】
${Object.entries(knowledgePoints).map(([kp, stat]) => `${kp}：${stat.correct}/${stat.total}正确`).join('\n')}
薄弱知识点：${weakPoints?.join('、') || '无明显薄弱知识点'}`
    : '';

  return `请为学生【${studentName}】生成${courseTypeName || '能力测评'}分析报告。

【本次测评数据】
- 测评等级：${level}（${levelNames[level] || ''}）
- 认知能力得分：${cognitiveScore}分
- 技能能力得分：${skillScore}分
- 综合素养得分：${qualityScore}分
- 创新思维得分：${innovationScore}分
- 协作沟通得分：${collaborationScore}分
- AI伦理与责任得分：${ethicsScore}分${historySection}${knowledgeSection}

【分析要求】
1. 给出认知、技能、素养、创新、协作、伦理六个维度的详细分析
2. 识别优势和劣势领域
3. 如有历史数据，分析成长趋势
4. 针对薄弱维度给出具体改进建议

请按以下JSON格式返回：
{
  "summary": "整体表现概述（1-2句话）",
  "currentAnalysis": {
    "cognitive": {
      "score": ${cognitiveScore},
      "level": "${cognitiveScore >= 85 ? '优秀' : cognitiveScore >= 70 ? '良好' : '待提高'}",
      "analysis": "详细分析..."
    },
    "skill": {
      "score": ${skillScore},
      "level": "${skillScore >= 85 ? '优秀' : skillScore >= 70 ? '良好' : '待提高'}",
      "analysis": "详细分析..."
    },
    "quality": {
      "score": ${qualityScore},
      "level": "${qualityScore >= 85 ? '优秀' : qualityScore >= 70 ? '良好' : '待提高'}",
      "analysis": "详细分析..."
    },
    "innovation": {
      "score": ${innovationScore},
      "level": "${innovationScore >= 85 ? '优秀' : innovationScore >= 70 ? '良好' : '待提高'}",
      "analysis": "详细分析..."
    },
    "collaboration": {
      "score": ${collaborationScore},
      "level": "${collaborationScore >= 85 ? '优秀' : collaborationScore >= 70 ? '良好' : '待提高'}",
      "analysis": "详细分析..."
    },
    "ethics": {
      "score": ${ethicsScore},
      "level": "${ethicsScore >= 85 ? '优秀' : ethicsScore >= 70 ? '良好' : '待提高'}",
      "analysis": "详细分析..."
    }
  },
  "strengths": [
    {"dimension": "维度名称", "performance": "具体表现", "evidence": "证据"}
  ],
  "weakPoints": [
    {"dimension": "维度名称", "issue": "具体问题", "severity": "high/medium/low", "suggestions": ["改进建议1", "改进建议2"]}
  ],
  "growthAnalysis": {
    "trend": "${historyData?.trend || 'stable'}",
    "changes": ["变化1", "变化2"],
    "summary": "成长趋势总结"
  },
  "suggestions": {
    "immediate": ["立即可执行的建议"],
    "shortTerm": ["短期目标建议（1个月）"],
    "mediumTerm": ["中期目标建议（3个月）"],
    "resources": ["推荐学习资源1", "推荐学习资源2"]
  },
  "dataQuality": "${historyData?.previousScores && historyData.previousScores.length > 0 ? '数据完整，可进行成长趋势分析' : '首次测评，暂无历史数据'}"
}`;
}

export const QUESTION_GENERATION_SYSTEM_PROMPT = `你是教育测评题目设计专家，根据测评目标设计高质量题目。

【出题要求】
1. 维度覆盖：确保所有指定维度都有题目考察（认知能力、技能能力、综合素养、创新思维、协作沟通、AI伦理与责任）
2. 难度梯度：基础题(40%)/中等题(40%)/提高题(20%)
3. 区分度：能够区分不同能力水平学生
4. 质量标准：题意清晰、选项合理、答案唯一

【输出约束】
- 每道题必须标注考察维度
- 难度设置需合理
- 提供标准答案和解析`;

export const COURSE_RECOMMEND_SYSTEM_PROMPT = `你是资深教育顾问，根据学生测评结果推荐最适合的课程。

【推荐原则】
1. 匹配学生能力水平
2. 考虑学习兴趣和发展方向
3. 提供清晰的进阶路径

【课程库】
从机构课程库中选择推荐课程，禁止推荐不存在的课程。`;
