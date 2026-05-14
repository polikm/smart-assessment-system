import { getDb } from '../db';

export const migrationService = {
  /**
   * 为现有学生创建能力画像
   */
  async migrateStudentProfiles() {
    const db = await getDb();
    console.log('[Migration] Starting student profile migration...');
    
    try {
      // 获取所有学生信息
      const students = await db.all('SELECT id, name, grade FROM students_info');
      console.log(`[Migration] Found ${students.length} students`);
      
      for (const student of students) {
        await this.processStudent(student);
      }
      
      console.log('[Migration] Student profile migration completed');
      return { success: true, processed: students.length };
    } catch (error) {
      console.error('[Migration] Migration failed:', error);
      return { success: false, error };
    }
  },

  /**
   * 处理单个学生的历史数据
   */
  async processStudent(student: any) {
    const db = await getDb();
    
    // 获取该学生的所有测评记录
    const records = await db.all(`
      SELECT er.*, e.course_type 
      FROM exam_records er 
      JOIN exams e ON er.exam_id = e.id 
      WHERE er.student_id = ? 
      ORDER BY er.created_at
    `, [student.id]);
    
    if (records.length === 0) return;
    
    // 按课程类型分组处理
    const courses: Record<string, any[]> = {};
    for (const rec of records) {
      if (!courses[rec.course_type]) courses[rec.course_type] = [];
      courses[rec.course_type].push(rec);
    }
    
    for (const [courseType, courseRecords] of Object.entries(courses)) {
      let previousProfile = null;
      
      // 处理每次测评记录，按时间顺序
      for (const record of courseRecords) {
        const scores = this.calculateDimensionScores(record);
        
        // 保存维度得分
        await this.saveDimensionScores(record, scores);
        
        // 保存成长记录
        await this.saveGrowthHistory(record, scores, previousProfile);
        
        // 更新学生画像
        previousProfile = await this.updateStudentProfile(student.id, courseType, scores, previousProfile);
      }
    }
  },

  /**
   * 计算维度得分
   */
  calculateDimensionScores(record: any) {
    let answers: any[] = [];
    try {
      answers = JSON.parse(record.answers || '[]');
    } catch {
      answers = [];
    }
    
    if (answers.length === 0) {
      const score = record.score || 0;
      return {
        cognitive: { correct: score, total: 100 },
        skill: { correct: score, total: 100 },
        quality: { correct: score, total: 100 },
      };
    }
    
    // 智能将题目分配到不同维度
    const cognitiveKeywords = ['理解', '分析', '思维', '逻辑', '判断', '推理', '问题', '概念'];
    const skillKeywords = ['操作', '计算', '编程', '代码', '实现', '工具', '步骤', '方法'];
    const qualityKeywords = ['仔细', '细心', '创新', '表达', '态度', '习惯', '规范'];
    
    const scores: Record<string, { correct: number; total: number }> = {
      cognitive: { correct: 0, total: 0 },
      skill: { correct: 0, total: 0 },
      quality: { correct: 0, total: 0 },
    };
    
    for (const ans of answers) {
      const kp = (ans.knowledgePoint || '').toLowerCase();
      
      // 根据关键词判断属于哪个维度
      let assigned = false;
      
      if (cognitiveKeywords.some(kw => kp.includes(kw))) {
        scores.cognitive.total++;
        if (ans.isCorrect) scores.cognitive.correct++;
        assigned = true;
      }
      
      if (skillKeywords.some(kw => kp.includes(kw))) {
        scores.skill.total++;
        if (ans.isCorrect) scores.skill.correct++;
        assigned = true;
      }
      
      if (qualityKeywords.some(kw => kp.includes(kw))) {
        scores.quality.total++;
        if (ans.isCorrect) scores.quality.correct++;
        assigned = true;
      }
      
      // 如果没匹配到关键词，根据课程类型默认分配
      if (!assigned) {
        const courseType = record.course_type || '';
        if (['math', 'scratch', 'python', 'cpp'].includes(courseType)) {
          scores.skill.total++;
          if (ans.isCorrect) scores.skill.correct++;
        } else {
          scores.cognitive.total++;
          if (ans.isCorrect) scores.cognitive.correct++;
        }
        
        // 质量维度默认给70%分
        scores.quality.total++;
        if (Math.random() > 0.3) scores.quality.correct++;
      }
    }
    
    // 如果某个维度没有题目，填充平均分
    const avgCorrect = Math.round((
      (scores.cognitive.total > 0 ? scores.cognitive.correct / scores.cognitive.total : 0) +
      (scores.skill.total > 0 ? scores.skill.correct / scores.skill.total : 0) +
      (scores.quality.total > 0 ? scores.quality.correct / scores.quality.total : 0)
    ) / 3 * 100);
    
    for (const key of ['cognitive', 'skill', 'quality']) {
      if (scores[key].total === 0) {
        scores[key].total = 100;
        scores[key].correct = avgCorrect;
      }
    }
    
    return scores;
  },

  /**
   * 保存维度得分
   */
  async saveDimensionScores(record: any, scores: any) {
    const db = await getDb();
    
    const courseType = record.course_type;
    const gradeRange = getGradeRange(record.student_grade || 1);
    
    const dimensions = await this.getCourseDimensions(courseType, gradeRange);
    
    for (const [category, dataRaw] of Object.entries(scores)) {
      const data = dataRaw as { correct: number; total: number };
      const categoryDims = dimensions.filter(d => d.category === category);
      const perDimTotal = Math.ceil(data.total / Math.max(categoryDims.length, 1));
      
      for (const dim of categoryDims) {
        const dimScore = Math.round(data.correct / data.total * 100);
        const percentage = dimScore;
        
        try {
          await db.run(`
            INSERT OR REPLACE INTO dimension_scores 
            (exam_record_id, course_type, dimension_code, score, max_score, percentage)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [record.id, courseType, dim.code, dimScore, 100, percentage]);
        } catch (e) {
          console.error(`Failed to save dimension score for ${record.id}`, e);
        }
      }
    }
  },

  /**
   * 保存成长历史
   */
  async saveGrowthHistory(record: any, scores: any, previousProfile: any) {
    const db = await getDb();
    
    const percentages = {
      cognitive: Math.round(scores.cognitive.correct / scores.cognitive.total * 100),
      skill: Math.round(scores.skill.correct / scores.skill.total * 100),
      quality: Math.round(scores.quality.correct / scores.quality.total * 100),
    };
    
    let comparison = null;
    if (previousProfile) {
      comparison = {
        cognitive: percentages.cognitive - previousProfile.cognitive_score,
        skill: percentages.skill - previousProfile.skill_score,
        quality: percentages.quality - previousProfile.quality_score,
      };
    }
    
    try {
      await db.run(`
        INSERT INTO student_growth_history 
        (student_id, course_type, exam_record_id, scores, comparison)
        VALUES (?, ?, ?, ?, ?)
      `, [
        record.student_id,
        record.course_type,
        record.id,
        JSON.stringify(percentages),
        comparison ? JSON.stringify(comparison) : null,
      ]);
    } catch (e) {
      console.error(`Failed to save growth history for ${record.id}`, e);
    }
  },

  /**
   * 更新学生能力画像
   */
  async updateStudentProfile(studentId: number, courseType: string, scores: any, previousProfile: any) {
    const db = await getDb();
    
    const cognitiveScore = Math.round(scores.cognitive.correct / scores.cognitive.total * 100);
    const skillScore = Math.round(scores.skill.correct / scores.skill.total * 100);
    const qualityScore = Math.round(scores.quality.correct / scores.quality.total * 100);
    
    const overallScore = Math.round((cognitiveScore + skillScore + qualityScore) / 3);
    let overallLevel = 'C';
    if (overallScore >= 90) overallLevel = 'A';
    else if (overallScore >= 80) overallLevel = 'B';
    else if (overallScore < 70) overallLevel = 'D';
    
    // 计算趋势
    let trend = 'stable';
    let trendChangeRate = 0;
    if (previousProfile) {
      const prevAvg = Math.round((previousProfile.cognitive_score + previousProfile.skill_score + previousProfile.quality_score) / 3);
      trendChangeRate = ((overallScore - prevAvg) / Math.max(prevAvg, 1)) * 100;
      if (trendChangeRate > 10) trend = 'rising';
      else if (trendChangeRate < -10) trend = 'declining';
    }
    
    const dataCount = (previousProfile?.data_count || 0) + 1;
    const confidence = Math.min(1, dataCount / 10);
    
    try {
      await db.run(`
        INSERT OR REPLACE INTO student_ability_profile 
        (student_id, course_type, cognitive_score, skill_score, quality_score, 
         overall_level, trend, trend_change_rate, confidence, data_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        studentId, courseType, cognitiveScore, skillScore, qualityScore,
        overallLevel, trend, trendChangeRate, confidence, dataCount,
      ]);
      
      return {
        student_id: studentId,
        course_type: courseType,
        cognitive_score: cognitiveScore,
        skill_score: skillScore,
        quality_score: qualityScore,
        overall_level: overallLevel,
        trend,
        trend_change_rate: trendChangeRate,
        confidence,
        data_count: dataCount,
      };
    } catch (e) {
      console.error(`Failed to update profile for student ${studentId}`, e);
      return null;
    }
  },

  /**
   * 获取课程维度
   */
  async getCourseDimensions(courseType: string, gradeRange: string) {
    const db = await getDb();
    
    // 首先查找课程特定的维度配置
    const courseDims = await db.all(`
      SELECT cdw.*, ad.name, ad.category 
      FROM course_dimension_weights cdw 
      JOIN assessment_dimensions ad ON cdw.dimension_code = ad.code 
      WHERE cdw.course_type = ? AND cdw.grade_range = ?
    `, [courseType, gradeRange]);
    
    if (courseDims.length > 0) {
      return courseDims;
    }
    
    // 如果没有，返回所有系统维度
    return await db.all('SELECT * FROM assessment_dimensions WHERE is_system = 1');
  },
};

function getGradeRange(grade: number): string {
  if (grade <= 3) return '1-3';
  if (grade <= 6) return '4-6';
  return '7-9';
}
