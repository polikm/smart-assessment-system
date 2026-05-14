import { getDb } from '../db.js';

function getGradeRange(grade: number): string {
  if (grade <= 2) return '1-2';
  if (grade <= 4) return '3-4';
  if (grade <= 6) return '5-6';
  return '7-9';
}

// 兜底维度映射：当数据库中无维度权重配置时使用
function getFallbackDimensionMap(): Record<string, string> {
  return {
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
}

// 题目自定义维度代码到6大标准维度的映射
// 因为 questions 表中的 dimension_code 可能是自定义值（如 problem_understanding）
// 需要映射到 cognitive/skill/quality/innovation/collaboration/ethics
function getQuestionDimensionMap(): Record<string, string> {
  return {
    // 认知能力 - 问题理解、分析、推理
    'problem_understanding': 'cognitive',
    'logical_reasoning': 'cognitive',
    'problem_analysis': 'cognitive',
    'concept_understanding': 'cognitive',
    'conceptual_understanding': 'cognitive',
    'code_analysis': 'cognitive',
    'data_analysis': 'cognitive',
    'data_interpretation': 'cognitive',
    'inference': 'cognitive',
    'critical_thinking': 'cognitive',
    'mathematical_reasoning': 'cognitive',
    'pattern_recognition': 'cognitive',
    'spatial_reasoning': 'cognitive',
    'statistical_reasoning': 'cognitive',
    'probability_reasoning': 'cognitive',
    'numerical_pattern': 'cognitive',
    'alternating_pattern': 'cognitive',
    'algorithm_structure': 'cognitive',
    'algorithm_recognition': 'cognitive',
    'algorithm_analysis': 'cognitive',
    'debugging_analysis': 'cognitive',
    'error_analysis': 'cognitive',
    'data_structure_logic': 'cognitive',
    'data_structure_behavior': 'cognitive',

    // 技能能力 - 问题解决、应用、实现
    'problem_solving': 'skill',
    'problem_solving_strategy': 'skill',
    'algorithm_design': 'skill',
    'algorithm_implementation': 'skill',
    'algorithm_application': 'skill',
    'algorithm_execution': 'skill',
    'algorithm_efficiency': 'skill',
    'algorithm_strategy': 'skill',
    'algorithm_selection': 'skill',
    'code_implementation': 'skill',
    'code_execution': 'skill',
    'code_completion': 'skill',
    'code_optimization': 'skill',
    'application': 'skill',
    'application_and_practice': 'skill',
    'concept_application': 'skill',
    'knowledge_application': 'skill',
    'pattern_application': 'skill',
    'data_structure_application': 'skill',
    'data_processing': 'skill',
    'data_representation': 'skill',
    'data_comparison': 'skill',
    'mathematical_application': 'skill',
    'conditional_probability': 'skill',
    'probability_calculation': 'skill',
    'time_calculation': 'skill',
    'time_interval': 'skill',
    'optimization': 'skill',
    'efficiency_optimization': 'skill',

    // 综合素养 - 专注、态度、表达
    'attention_to_detail': 'quality',
    'learning_attitude': 'quality',
    'creative_expression': 'quality',
    'technical_knowledge': 'quality',
    'conceptual_knowledge': 'quality',
    'concept_mastery': 'quality',
    'structure_integration': 'quality',

    // 创新思维 - 创新、探索、设计
    'creative_thinking': 'innovation',
    'design_thinking': 'innovation',

    // 协作沟通 - 表达、团队、分享
    'communication': 'collaboration',
    'event_handling': 'collaboration',

    // AI伦理 - 伦理、责任、安全
    'moral_judgment': 'ethics',
    'responsible_use': 'ethics',
    'learning_ethics': 'ethics',
    'conditional_judgment': 'ethics',
    'error_handling': 'ethics',
    'debugging': 'ethics',
  };
}

function calculateLevel(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

function calculateTrendChange(current: number, previous: number): { trend: string; changeRate: number } {
  if (previous === 0) {
    return { trend: 'stable', changeRate: 0 };
  }
  const changeRate = ((current - previous) / previous) * 100;
  if (changeRate > 5) return { trend: 'rising', changeRate };
  if (changeRate < -5) return { trend: 'declining', changeRate };
  return { trend: 'stable', changeRate };
}

function aggregateCategoryScores(dimensionScores: Record<string, { correct: number; total: number }>, category: string, dimensionMap: Record<string, string>): { total: number; max: number } {
  const categoryDimensions = Object.entries(dimensionMap)
    .filter(([_, cat]) => cat === category)
    .map(([code]) => code);

  let total = 0;
  let max = 0;

  for (const dimCode of categoryDimensions) {
    if (dimensionScores[dimCode]) {
      total += dimensionScores[dimCode].correct;
      max += dimensionScores[dimCode].total;
    }
  }

  return { total, max };
}

export async function updateStudentAbilityProfile(
  studentId: number,
  courseType: string,
  grade: number,
  dimensionScores: Record<string, { correct: number; total: number }>
) {
  const db = await getDb();
  const gradeRange = getGradeRange(grade);

  const dimensions = await db.all(`
    SELECT cdw.dimension_code, ad.category
    FROM course_dimension_weights cdw
    JOIN assessment_dimensions ad ON cdw.dimension_code = ad.code
    WHERE cdw.course_type = ? AND cdw.grade_range = ?
  `, [courseType, gradeRange]);

  const dimensionMap: Record<string, string> = {};
  for (const dim of dimensions) {
    dimensionMap[dim.dimension_code] = dim.category;
  }

  const cognitive = aggregateCategoryScores(dimensionScores, 'cognitive', dimensionMap);
  const skill = aggregateCategoryScores(dimensionScores, 'skill', dimensionMap);
  const quality = aggregateCategoryScores(dimensionScores, 'quality', dimensionMap);
  const innovation = aggregateCategoryScores(dimensionScores, 'innovation', dimensionMap);
  const collaboration = aggregateCategoryScores(dimensionScores, 'collaboration', dimensionMap);
  const ethics = aggregateCategoryScores(dimensionScores, 'ethics', dimensionMap);

  let cognitiveScore = cognitive.max > 0 ? Math.round((cognitive.total / cognitive.max) * 100) : 0;
  let skillScore = skill.max > 0 ? Math.round((skill.total / skill.max) * 100) : 0;
  let qualityScore = quality.max > 0 ? Math.round((quality.total / quality.max) * 100) : 0;
  let innovationScore = innovation.max > 0 ? Math.round((innovation.total / innovation.max) * 100) : 0;
  let collaborationScore = collaboration.max > 0 ? Math.round((collaboration.total / collaboration.max) * 100) : 0;
  let ethicsScore = ethics.max > 0 ? Math.round((ethics.total / ethics.max) * 100) : 0;

  // 兜底逻辑：如果数据库关联查询无结果，使用兜底维度映射
  if (dimensions.length === 0) {
    console.log(`[updateStudentAbilityProfile] No dimension weights found for courseType=${courseType} gradeRange=${gradeRange}, using fallback`);
    const fallbackMap = getFallbackDimensionMap();
    const fbCognitive = aggregateCategoryScores(dimensionScores, 'cognitive', fallbackMap);
    const fbSkill = aggregateCategoryScores(dimensionScores, 'skill', fallbackMap);
    const fbQuality = aggregateCategoryScores(dimensionScores, 'quality', fallbackMap);
    const fbInnovation = aggregateCategoryScores(dimensionScores, 'innovation', fallbackMap);
    const fbCollaboration = aggregateCategoryScores(dimensionScores, 'collaboration', fallbackMap);
    const fbEthics = aggregateCategoryScores(dimensionScores, 'ethics', fallbackMap);

    cognitiveScore = fbCognitive.max > 0 ? Math.round((fbCognitive.total / fbCognitive.max) * 100) : cognitiveScore;
    skillScore = fbSkill.max > 0 ? Math.round((fbSkill.total / fbSkill.max) * 100) : skillScore;
    qualityScore = fbQuality.max > 0 ? Math.round((fbQuality.total / fbQuality.max) * 100) : qualityScore;
    innovationScore = fbInnovation.max > 0 ? Math.round((fbInnovation.total / fbInnovation.max) * 100) : innovationScore;
    collaborationScore = fbCollaboration.max > 0 ? Math.round((fbCollaboration.total / fbCollaboration.max) * 100) : collaborationScore;
    ethicsScore = fbEthics.max > 0 ? Math.round((fbEthics.total / fbEthics.max) * 100) : ethicsScore;
  }

  // 如果所有维度分数仍为0，使用平均分作为兜底
  const totalValid = [cognitiveScore, skillScore, qualityScore, innovationScore, collaborationScore, ethicsScore].filter(s => s > 0).length;
  if (totalValid === 0) {
    const totalCorrect = Object.values(dimensionScores).reduce((sum, s) => sum + s.correct, 0);
    const totalQuestions = Object.values(dimensionScores).reduce((sum, s) => sum + s.total, 0);
    const avgScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    cognitiveScore = skillScore = qualityScore = innovationScore = collaborationScore = ethicsScore = avgScore;
    console.log(`[updateStudentAbilityProfile] All dimension scores are 0, using average score=${avgScore} as fallback`);
  }

  const totalScore = Math.round((cognitiveScore + skillScore + qualityScore + innovationScore + collaborationScore + ethicsScore) / 6);
  const overallLevel = calculateLevel(totalScore);

  const existing = await db.get(
    'SELECT * FROM student_ability_profile WHERE student_id = ? AND course_type = ?',
    [studentId, courseType]
  );

  let trend = 'stable';
  let trendChangeRate = 0;

  if (existing) {
    const prevTotal = Math.round((existing.cognitive_score + existing.skill_score + existing.quality_score + existing.innovation_score + existing.collaboration_score + existing.ethics_score) / 6);
    const result = calculateTrendChange(totalScore, prevTotal);
    trend = result.trend;
    trendChangeRate = result.changeRate;
  }

  const confidence = Math.min(1, (existing?.data_count || 0 + 1) / 10);

  await db.run(`
    INSERT INTO student_ability_profile 
    (student_id, course_type, cognitive_score, skill_score, quality_score, innovation_score, collaboration_score, ethics_score, overall_level, trend, trend_change_rate, confidence, data_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(student_id, course_type) DO UPDATE SET
    cognitive_score = ?, skill_score = ?, quality_score = ?, innovation_score = ?, collaboration_score = ?, ethics_score = ?, overall_level = ?,
    trend = ?, trend_change_rate = ?, confidence = ?, data_count = ?, updated_at = CURRENT_TIMESTAMP
  `, [
    studentId, courseType, cognitiveScore, skillScore, qualityScore, innovationScore, collaborationScore, ethicsScore, overallLevel, trend, trendChangeRate, confidence, (existing?.data_count || 0) + 1,
    cognitiveScore, skillScore, qualityScore, innovationScore, collaborationScore, ethicsScore, overallLevel,
    trend, trendChangeRate, confidence, (existing?.data_count || 0) + 1
  ]);

  return {
    cognitiveScore,
    skillScore,
    qualityScore,
    innovationScore,
    collaborationScore,
    ethicsScore,
    totalScore,
    overallLevel,
    trend,
    trendChangeRate
  };
}

export async function saveGrowthHistory(
  studentId: number,
  courseType: string,
  examRecordId: number,
  dimensionScores: Record<string, { correct: number; total: number }>
) {
  const db = await getDb();

  // 首先尝试从数据库获取标准维度映射
  const dimensions = await db.all(`
    SELECT cdw.dimension_code, ad.category
    FROM course_dimension_weights cdw
    JOIN assessment_dimensions ad ON cdw.dimension_code = ad.code
    WHERE cdw.course_type = ?
  `, [courseType]);

  const dimensionMap: Record<string, string> = {};
  for (const dim of dimensions) {
    dimensionMap[dim.dimension_code] = dim.category;
  }

  // 同时获取题目自定义维度到标准维度的映射
  const questionDimMap = getQuestionDimensionMap();

  // 将传入的 dimensionScores（键可能是自定义维度代码）转换为标准6大维度分数
  // 优先使用数据库标准映射，如果没有匹配则使用题目自定义映射
  const standardizedScores: Record<string, { correct: number; total: number }> = {};
  for (const [dimCode, scores] of Object.entries(dimensionScores)) {
    // 先尝试标准映射
    let category = dimensionMap[dimCode];
    // 如果没有匹配，尝试题目自定义映射
    if (!category) {
      category = questionDimMap[dimCode];
    }
    // 如果还是没有匹配，尝试兜底映射
    if (!category) {
      const fallbackMap = getFallbackDimensionMap();
      category = fallbackMap[dimCode];
    }

    if (category) {
      if (!standardizedScores[category]) {
        standardizedScores[category] = { correct: 0, total: 0 };
      }
      standardizedScores[category].correct += scores.correct;
      standardizedScores[category].total += scores.total;
    } else {
      console.log(`[saveGrowthHistory] Unmapped dimension code: ${dimCode}, defaulting to cognitive`);
      if (!standardizedScores['cognitive']) {
        standardizedScores['cognitive'] = { correct: 0, total: 0 };
      }
      standardizedScores['cognitive'].correct += scores.correct;
      standardizedScores['cognitive'].total += scores.total;
    }
  }

  console.log(`[saveGrowthHistory] Standardized scores:`, JSON.stringify(standardizedScores));

  // 使用标准化后的分数计算6大维度
  const cognitive = standardizedScores['cognitive'] || { correct: 0, total: 0 };
  const skill = standardizedScores['skill'] || { correct: 0, total: 0 };
  const quality = standardizedScores['quality'] || { correct: 0, total: 0 };
  const innovation = standardizedScores['innovation'] || { correct: 0, total: 0 };
  const collaboration = standardizedScores['collaboration'] || { correct: 0, total: 0 };
  const ethics = standardizedScores['ethics'] || { correct: 0, total: 0 };

  let cognitiveScore = cognitive.total > 0 ? Math.round((cognitive.correct / cognitive.total) * 100) : 0;
  let skillScore = skill.total > 0 ? Math.round((skill.correct / skill.total) * 100) : 0;
  let qualityScore = quality.total > 0 ? Math.round((quality.correct / quality.total) * 100) : 0;
  let innovationScore = innovation.total > 0 ? Math.round((innovation.correct / innovation.total) * 100) : 0;
  let collaborationScore = collaboration.total > 0 ? Math.round((collaboration.correct / collaboration.total) * 100) : 0;
  let ethicsScore = ethics.total > 0 ? Math.round((ethics.correct / ethics.total) * 100) : 0;

  // 获取学生能力画像中的历史分数，用于填充本次未测评的维度
  const abilityProfile = await db.get(
    'SELECT cognitive_score, skill_score, quality_score, innovation_score, collaboration_score, ethics_score FROM student_ability_profile WHERE student_id = ? AND course_type = ?',
    [studentId, courseType]
  );

  // 对于本次没有题目的维度，使用学生画像中的历史分数作为默认值（而不是0）
  if (abilityProfile) {
    if (cognitive.total === 0 && abilityProfile.cognitive_score > 0) {
      cognitiveScore = abilityProfile.cognitive_score;
      console.log(`[saveGrowthHistory] cognitive has no questions in this exam, using profile score=${cognitiveScore}`);
    }
    if (skill.total === 0 && abilityProfile.skill_score > 0) {
      skillScore = abilityProfile.skill_score;
      console.log(`[saveGrowthHistory] skill has no questions in this exam, using profile score=${skillScore}`);
    }
    if (quality.total === 0 && abilityProfile.quality_score > 0) {
      qualityScore = abilityProfile.quality_score;
      console.log(`[saveGrowthHistory] quality has no questions in this exam, using profile score=${qualityScore}`);
    }
    if (innovation.total === 0 && abilityProfile.innovation_score > 0) {
      innovationScore = abilityProfile.innovation_score;
      console.log(`[saveGrowthHistory] innovation has no questions in this exam, using profile score=${innovationScore}`);
    }
    if (collaboration.total === 0 && abilityProfile.collaboration_score > 0) {
      collaborationScore = abilityProfile.collaboration_score;
      console.log(`[saveGrowthHistory] collaboration has no questions in this exam, using profile score=${collaborationScore}`);
    }
    if (ethics.total === 0 && abilityProfile.ethics_score > 0) {
      ethicsScore = abilityProfile.ethics_score;
      console.log(`[saveGrowthHistory] ethics has no questions in this exam, using profile score=${ethicsScore}`);
    }
  }

  // 如果所有维度分数仍为0，使用平均分作为兜底
  const totalValid = [cognitiveScore, skillScore, qualityScore, innovationScore, collaborationScore, ethicsScore].filter(s => s > 0).length;
  if (totalValid === 0) {
    const totalCorrect = Object.values(dimensionScores).reduce((sum, s) => sum + s.correct, 0);
    const totalQuestions = Object.values(dimensionScores).reduce((sum, s) => sum + s.total, 0);
    const avgScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    cognitiveScore = skillScore = qualityScore = innovationScore = collaborationScore = ethicsScore = avgScore;
    console.log(`[saveGrowthHistory] All dimension scores are 0, using average score=${avgScore} as fallback`);
  }

  const scores = {
    cognitive: cognitiveScore,
    skill: skillScore,
    quality: qualityScore,
    innovation: innovationScore,
    collaboration: collaborationScore,
    ethics: ethicsScore
  };

  const previousRecord = await db.get(`
    SELECT scores FROM student_growth_history
    WHERE student_id = ? AND course_type = ?
    ORDER BY created_at DESC LIMIT 1
  `, [studentId, courseType]);

  let comparison: Record<string, string> | null = null;

  if (previousRecord) {
    const prevScores = JSON.parse(previousRecord.scores);
    comparison = {
      cognitive: `${prevScores.cognitive !== cognitiveScore ? (cognitiveScore > prevScores.cognitive ? '+' : '') + (cognitiveScore - prevScores.cognitive) : 0}`,
      skill: `${prevScores.skill !== skillScore ? (skillScore > prevScores.skill ? '+' : '') + (skillScore - prevScores.skill) : 0}`,
      quality: `${prevScores.quality !== qualityScore ? (qualityScore > prevScores.quality ? '+' : '') + (qualityScore - prevScores.quality) : 0}`,
      innovation: `${prevScores.innovation !== innovationScore ? (innovationScore > prevScores.innovation ? '+' : '') + (innovationScore - prevScores.innovation) : 0}`,
      collaboration: `${prevScores.collaboration !== collaborationScore ? (collaborationScore > prevScores.collaboration ? '+' : '') + (collaborationScore - prevScores.collaboration) : 0}`,
      ethics: `${prevScores.ethics !== ethicsScore ? (ethicsScore > prevScores.ethics ? '+' : '') + (ethicsScore - prevScores.ethics) : 0}`,
    };
  }

  await db.run(`
    INSERT INTO student_growth_history (student_id, course_type, exam_record_id, scores, comparison)
    VALUES (?, ?, ?, ?, ?)
  `, [studentId, courseType, examRecordId, JSON.stringify(scores), comparison ? JSON.stringify(comparison) : null]);

  return { scores, comparison };
}

export async function getStudentProfile(studentId: number, courseType: string) {
  const db = await getDb();

  const profile = await db.get(
    'SELECT * FROM student_ability_profile WHERE student_id = ? AND course_type = ?',
    [studentId, courseType]
  );

  if (!profile) {
    return null;
  }

  const history = await db.all(`
    SELECT sgh.*, e.name as exam_name
    FROM student_growth_history sgh
    JOIN exam_records er ON sgh.exam_record_id = er.id
    JOIN exams e ON er.exam_id = e.id
    WHERE sgh.student_id = ? AND sgh.course_type = ?
    ORDER BY sgh.created_at DESC
    LIMIT 10
  `, [studentId, courseType]);

  for (const h of history) {
    h.scores = JSON.parse(h.scores || '{}');
    h.comparison = h.comparison ? JSON.parse(h.comparison) : null;
  }

  return { ...profile, history };
}

export async function analyzeGrowthTrend(studentId: number, courseType: string, limit: number = 10) {
  const db = await getDb();

  const history = await db.all(`
    SELECT * FROM student_growth_history
    WHERE student_id = ? AND course_type = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [studentId, courseType, limit]);

  if (history.length < 2) {
    return {
      trend: 'stable',
      overallChange: 0,
      dimensionTrends: {
        cognitive: { trend: 'stable', change: 0 },
        skill: { trend: 'stable', change: 0 },
        quality: { trend: 'stable', change: 0 },
        innovation: { trend: 'stable', change: 0 },
        collaboration: { trend: 'stable', change: 0 },
        ethics: { trend: 'stable', change: 0 }
      },
      summary: '数据不足，无法分析成长趋势'
    };
  }

  history.reverse();

  const firstScores = JSON.parse(history[0].scores);
  const lastScores = JSON.parse(history[history.length - 1].scores);

  const calculateTrend = (first: number, last: number) => {
    const change = last - first;
    if (change > 5) return { trend: 'rising' as const, change };
    if (change < -5) return { trend: 'declining' as const, change };
    return { trend: 'stable' as const, change };
  };

  const cognitiveTrend = calculateTrend(firstScores.cognitive, lastScores.cognitive);
  const skillTrend = calculateTrend(firstScores.skill, lastScores.skill);
  const qualityTrend = calculateTrend(firstScores.quality, lastScores.quality);
  const innovationTrend = calculateTrend(firstScores.innovation, lastScores.innovation);
  const collaborationTrend = calculateTrend(firstScores.collaboration, lastScores.collaboration);
  const ethicsTrend = calculateTrend(firstScores.ethics, lastScores.ethics);

  const overallFirst = (firstScores.cognitive + firstScores.skill + firstScores.quality + firstScores.innovation + firstScores.collaboration + firstScores.ethics) / 6;
  const overallLast = (lastScores.cognitive + lastScores.skill + lastScores.quality + lastScores.innovation + lastScores.collaboration + lastScores.ethics) / 6;
  const overallTrend = calculateTrend(overallFirst, overallLast);

  let summary = '';
  if (overallTrend.trend === 'rising') {
    summary = `整体能力呈上升趋势，提升了${Math.round(overallTrend.change)}分`;
  } else if (overallTrend.trend === 'declining') {
    summary = `整体能力有所下降，下降了${Math.abs(Math.round(overallTrend.change))}分，建议加强练习`;
  } else {
    summary = `整体能力保持稳定`;
  }

  return {
    trend: overallTrend.trend,
    overallChange: Math.round(overallTrend.change),
    dimensionTrends: {
      cognitive: cognitiveTrend,
      skill: skillTrend,
      quality: qualityTrend,
      innovation: innovationTrend,
      collaboration: collaborationTrend,
      ethics: ethicsTrend
    },
    history: history.map(h => ({
      date: h.created_at,
      scores: JSON.parse(h.scores || '{}')
    })),
    summary
  };
}
