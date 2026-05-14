import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar, Bar, Line } from 'react-chartjs-2';
import { generateReportPDF } from '../utils/pdfGenerator';
import {
  Trophy, Target, TrendingUp, Award, X,
  Calendar, ArrowRight, MapPin, GraduationCap,
  AlertTriangle, Clock, Star, Share2, FileText,
  Brain, Sparkles, Zap, BookMarked, Compass,
  Eye, Activity, BarChart3, HelpCircle
} from 'lucide-react';
import SharePoster from './SharePoster';
import CourseDetailModal from './CourseDetailModal';
import { knowledgeApi, examApi } from '../api/client';
import { inferDimensionFromKnowledgePoint as inferDimensionFromKP } from '../utils/dimensionUtils';
import { formatDateTime } from '../utils/dateFormat';

ChartJS.register(
  RadialLinearScale, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler, Tooltip, Legend
);

const levelColors: Record<string, string> = {
  A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
};
const levelNames: Record<string, string> = {
  A: '优秀', B: '良好', C: '合格', D: '待提高',
};

function getDefaultRecommendations(record: any) {
  const level = record.level;
  const courseType = record.course_type || 'scratch';
  const plans: Record<string, any> = {
    A: { shortTerm: '巩固核心知识点，尝试挑战更高难度的题目', mediumTerm: '深入学习进阶内容，参与项目实践', longTerm: '准备参加相关竞赛，向培优方向发展' },
    B: { shortTerm: '查漏补缺，重点复习薄弱知识点', mediumTerm: '系统学习进阶内容，加强练习', longTerm: '力争达到优秀水平，挑战竞赛内容' },
    C: { shortTerm: '夯实基础知识，多做基础练习题', mediumTerm: '逐步提升难度，建立知识体系', longTerm: '达到良好水平，向进阶内容迈进' },
    D: { shortTerm: '从零开始系统学习基础知识', mediumTerm: '加强基础练习，培养学习兴趣', longTerm: '稳步提升，争取达到合格水平' },
  };
  const classRecs: Record<string, Record<string, any>> = {
    aigc: {
      A: { className: 'AIGC进阶班', reason: '您的AIGC素养测评成绩优秀，建议直接报读进阶班。', path: ['AIGC入门', 'AIGC基础', 'AIGC进阶', 'AIGC培优'] },
      B: { className: 'AIGC进阶班', reason: '您的AIGC素养测评成绩良好，建议报读进阶班。', path: ['AIGC入门', 'AIGC基础', 'AIGC进阶', 'AIGC培优'] },
      C: { className: 'AIGC入门班', reason: '建议从AIGC入门班开始，系统学习AI基础知识。', path: ['AIGC入门', 'AIGC基础', 'AIGC进阶', 'AIGC培优'] },
      D: { className: 'AIGC入门班', reason: '建议从AIGC入门班开始，培养AI素养。', path: ['AIGC入门', 'AIGC基础', 'AIGC进阶', 'AIGC培优'] },
    },
    python: {
      A: { className: 'Python/C++进阶班', reason: '您的编程基础扎实，建议报读进阶班。', path: ['Scratch入门', 'Python基础', 'Python进阶', 'C++培优'] },
      B: { className: 'Python基础班', reason: '您具备一定编程基础，建议系统学习Python。', path: ['Scratch入门', 'Python基础', 'Python进阶', 'C++培优'] },
      C: { className: 'Scratch入门班', reason: '建议从Scratch开始，培养编程兴趣。', path: ['Scratch入门', 'Python基础', 'Python进阶', 'C++培优'] },
      D: { className: 'Scratch入门班', reason: '建议从Scratch图形化编程开始。', path: ['Scratch入门', 'Python基础', 'Python进阶', 'C++培优'] },
    },
    cpp: {
      A: { className: 'C++算法进阶班', reason: '您的数理逻辑能力出色，非常适合学习C++算法。', path: ['C++入门', 'C++基础', '算法进阶', '竞赛培优'] },
      B: { className: 'C++算法进阶班', reason: '您的数理逻辑能力良好，适合学习C++算法。', path: ['C++入门', 'C++基础', '算法进阶', '竞赛培优'] },
      C: { className: 'Python编程入门班', reason: '建议先学习Python编程，再过渡到C++算法。', path: ['Python入门', 'Python进阶', 'C++基础', '算法进阶'] },
      D: { className: 'Scratch入门班', reason: '建议从Scratch图形化编程开始，培养编程兴趣。', path: ['Scratch入门', 'Python基础', 'C++基础', '算法进阶'] },
    },
    scratch: {
      A: { className: 'Scratch进阶班', reason: '您的图形化编程基础扎实，建议继续学习进阶内容。', path: ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'] },
      B: { className: 'Scratch进阶班', reason: '您的图形化编程基础良好，建议学习进阶内容。', path: ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'] },
      C: { className: 'Scratch入门班', reason: '建议从Scratch入门班开始，培养编程兴趣。', path: ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'] },
      D: { className: 'Scratch入门班', reason: '建议从Scratch图形化编程开始，培养编程兴趣。', path: ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'] },
    },
    math: {
      A: { className: 'Python编程进阶班', reason: '您的数理逻辑能力出色，具备良好的逻辑思维基础，建议直接学习Python编程进阶内容。', path: ['数理启蒙', 'Python基础', 'Python进阶', '算法竞赛'] },
      B: { className: 'Python编程基础班', reason: '您的数理逻辑能力良好，适合学习Python编程，快速进入代码编程世界。', path: ['数理启蒙', 'Python基础', 'Python进阶', '算法竞赛'] },
      C: { className: 'Scratch入门班', reason: '建议从Scratch图形化编程开始，通过积木式编程培养编程兴趣和逻辑思维能力。', path: ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'] },
      D: { className: 'Scratch入门班', reason: '建议从Scratch图形化编程开始，逐步建立编程思维，为后续学习打下基础。', path: ['Scratch入门', 'Scratch进阶', 'Python基础', 'Python进阶'] },
    },
  };
  return {
    learningPlan: plans[level] || plans.D,
    classRecommendation: classRecs[courseType]?.[level] || classRecs.logic.D,
    suggestions: [],
  };
}

interface ReportDetailProps {
  record: any;
  onClose?: () => void;
  showShareActions?: boolean;
}

export default function ReportDetail({ record, onClose, showShareActions = false }: ReportDetailProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [showPoster, setShowPoster] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [dimensionScores, setDimensionScores] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [growthHistory, setGrowthHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDimensionHelp, setShowDimensionHelp] = useState(false);

  const getKnowledgePointStats = (rec: any) => {
    if (!rec?.answers) return {};
    const answers = JSON.parse(rec.answers);
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const ans of answers) {
      const kp = ans.knowledgePoint || '其他';
      if (!stats[kp]) stats[kp] = { correct: 0, total: 0 };
      stats[kp].total++;
      if (ans.isCorrect) stats[kp].correct++;
    }
    return stats;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (record.student_id) {
          const [profile, scores, growth] = await Promise.all([
            knowledgeApi.studentProfile(record.student_id, record.course_type).catch(() => null),
            knowledgeApi.dimensionScores(record.id).catch(() => []),
            knowledgeApi.studentGrowth(record.student_id, record.course_type, 10).catch(() => []),
          ]);
          setStudentProfile(profile);
          setDimensionScores(scores);
          // 优先使用 studentGrowth API 返回的数据，如果为空则尝试从 profile.history 获取
          const growthData = growth && growth.length > 0 ? growth : (profile?.history || []);
          setGrowthHistory(growthData);
        }
      } catch (e) {
        console.error('Failed to load dimension data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [record]);



  // 18小类维度标签映射
  const dimensionLabels: Record<string, { short: string; full: string; desc: string; category: string }> = {
    COG_UNDERSTANDING: { short: '问题理解', full: '问题理解与分析', desc: '理解问题、分解任务、识别关键信息的能力', category: 'cognitive' },
    COG_REASONING: { short: '逻辑推理', full: '逻辑推理与判断', desc: '逻辑推理、条件判断、因果分析的能力', category: 'cognitive' },
    COG_TRANSFER: { short: '知识迁移', full: '知识迁移与应用', desc: '已有知识在新场景中的应用能力', category: 'cognitive' },
    SKL_BASIC: { short: '基础操作', full: '基础操作与工具使用', desc: '基本操作、工具使用的熟练程度', category: 'skill' },
    SKL_APPLICATION: { short: '进阶应用', full: '进阶应用与问题解决', desc: '综合运用知识解决实际问题的能力', category: 'skill' },
    SKL_EFFICIENCY: { short: '效率质量', full: '效率与质量控制', desc: '完成任务的速度和质量控制能力', category: 'skill' },
    QLT_ATTENTION: { short: '专注细心', full: '专注力与细心度', desc: '审题仔细、计算准确、细节关注程度', category: 'quality' },
    QLT_EXPRESSION: { short: '创意表达', full: '创意与表达能力', desc: '创意构思、思路表达、分享交流能力', category: 'quality' },
    QLT_ATTITUDE: { short: '学习态度', full: '学习态度与成长潜力', desc: '学习积极性、尝试意愿、成长空间', category: 'quality' },
    INN_CREATIVITY: { short: '创新意识', full: '创新意识与创造力', desc: '发散思维、创新方案设计能力', category: 'innovation' },
    INN_EXPLORATION: { short: '探索精神', full: '探索精神与好奇心', desc: '主动探索、问题发现、持续追问能力', category: 'innovation' },
    INN_DESIGN: { short: '设计思维', full: '设计思维与迭代优化', desc: '方案设计、测试改进、迭代优化能力', category: 'innovation' },
    COL_EXPRESSION: { short: '表达沟通', full: '表达与沟通能力', desc: '清晰表达、有效沟通、观点分享能力', category: 'collaboration' },
    COL_TEAMWORK: { short: '团队协作', full: '团队协作能力', desc: '分工合作、协调配合、共同目标达成能力', category: 'collaboration' },
    COL_SHARING: { short: '知识分享', full: '知识分享与互助', desc: '帮助他人、经验分享、互助学习能力', category: 'collaboration' },
    ETH_AWARENESS: { short: '伦理意识', full: 'AI伦理意识', desc: '了解AI伦理问题、识别伦理风险能力', category: 'ethics' },
    ETH_RESPONSIBILITY: { short: '数字责任', full: '数字责任与安全意识', desc: '数据安全、隐私保护、负责任使用AI能力', category: 'ethics' },
    ETH_HUMANISTIC: { short: '人文素养', full: '人文素养与价值判断', desc: '以人为本、价值判断、科技向善能力', category: 'ethics' },
  };

  // 6大维度分类映射
  const categoryLabels: Record<string, { name: string; codes: string[] }> = {
    cognitive: { name: '认知能力', codes: ['COG_UNDERSTANDING', 'COG_REASONING', 'COG_TRANSFER'] },
    skill: { name: '技能能力', codes: ['SKL_BASIC', 'SKL_APPLICATION', 'SKL_EFFICIENCY'] },
    quality: { name: '综合素养', codes: ['QLT_ATTENTION', 'QLT_EXPRESSION', 'QLT_ATTITUDE'] },
    innovation: { name: '创新思维', codes: ['INN_CREATIVITY', 'INN_EXPLORATION', 'INN_DESIGN'] },
    collaboration: { name: '协作沟通', codes: ['COL_EXPRESSION', 'COL_TEAMWORK', 'COL_SHARING'] },
    ethics: { name: 'AI伦理', codes: ['ETH_AWARENESS', 'ETH_RESPONSIBILITY', 'ETH_HUMANISTIC'] },
  };

  // 维度雷达图数据 - 固定6大维度展示
  const getDimensionRadarData = () => {
    const categories: Record<string, { score: number; count: number }> = {
      cognitive: { score: 0, count: 0 },
      skill: { score: 0, count: 0 },
      quality: { score: 0, count: 0 },
      innovation: { score: 0, count: 0 },
      collaboration: { score: 0, count: 0 },
      ethics: { score: 0, count: 0 },
    };

    // 第一步：从 dimensionScores（18小维度数据）按 category 聚合
    dimensionScores.forEach(dim => {
      const code = dim.dimension_code || dim.code;
      const category = dim.category || dimensionLabels[code]?.category;
      if (category && categories[category] !== undefined) {
        categories[category].score += dim.percentage || dim.score || 0;
        categories[category].count++;
      }
    });

    // 第二步：如果某category没有数据，从answers中按dimension_code推断并计算
    const missingCategories = Object.entries(categories)
      .filter(([_, v]) => v.count === 0)
      .map(([k]) => k);

    if (missingCategories.length > 0 && record?.answers) {
      try {
        const answers = JSON.parse(record.answers);
        const dimStats: Record<string, { correct: number; total: number }> = {};

        for (const ans of answers) {
          const dimCode = ans.dimensionCode || ans.dimension_code || inferDimensionFromKP(ans.knowledgePoint || ans.knowledge_point);
          if (!dimStats[dimCode]) dimStats[dimCode] = { correct: 0, total: 0 };
          dimStats[dimCode].total++;
          if (ans.isCorrect) dimStats[dimCode].correct++;
        }

        for (const cat of missingCategories) {
          const catCodes = categoryLabels[cat].codes;
          let catScore = 0;
          let catCount = 0;
          for (const code of catCodes) {
            if (dimStats[code] && dimStats[code].total > 0) {
              catScore += Math.round((dimStats[code].correct / dimStats[code].total) * 100);
              catCount++;
            }
          }
          if (catCount > 0) {
            categories[cat].score = catScore;
            categories[cat].count = catCount;
          }
        }
      } catch (e) {}
    }

    // 第三步：如果仍有category没有数据，使用该category下所有题目答题正确率的平均值
    const stillMissing = Object.entries(categories)
      .filter(([_, v]) => v.count === 0)
      .map(([k]) => k);

    if (stillMissing.length > 0 && record?.answers) {
      try {
        const answers = JSON.parse(record.answers);
        const catCorrectRates: Record<string, { correct: number; total: number }> = {};

        for (const ans of answers) {
          const dimCode = ans.dimensionCode || ans.dimension_code || inferDimensionFromKP(ans.knowledgePoint || ans.knowledge_point);
          const cat = dimensionLabels[dimCode]?.category;
          if (cat && stillMissing.includes(cat)) {
            if (!catCorrectRates[cat]) catCorrectRates[cat] = { correct: 0, total: 0 };
            catCorrectRates[cat].total++;
            if (ans.isCorrect) catCorrectRates[cat].correct++;
          }
        }

        for (const cat of stillMissing) {
          if (catCorrectRates[cat] && catCorrectRates[cat].total > 0) {
            categories[cat].score = Math.round((catCorrectRates[cat].correct / catCorrectRates[cat].total) * 100);
            categories[cat].count = 1;
          }
        }
      } catch (e) {}
    }

    // 第四步：如果仍有category没有数据，使用总分作为默认值
    const finalMissing = Object.entries(categories)
      .filter(([_, v]) => v.count === 0)
      .map(([k]) => k);

    const defaultScore = record.score || 50;
    for (const cat of finalMissing) {
      categories[cat].score = defaultScore;
      categories[cat].count = 1;
    }

    const labels = ['认知能力', '技能能力', '综合素养', '创新思维', '协作沟通', 'AI伦理'];
    const data = [
      Math.round(categories.cognitive.score / categories.cognitive.count),
      Math.round(categories.skill.score / categories.skill.count),
      Math.round(categories.quality.score / categories.quality.count),
      Math.round(categories.innovation.score / categories.innovation.count),
      Math.round(categories.collaboration.score / categories.collaboration.count),
      Math.round(categories.ethics.score / categories.ethics.count),
    ];

    return {
      labels,
      datasets: [{
        label: '得分',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
      }],
    };
  };

  // 历史趋势图数据
  const getGrowthTrendData = () => {
    const sortedHistory = [...growthHistory].sort((a, b) =>
      new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
    );

    // 安全解析scores：处理对象、JSON字符串、null等各种情况
    const parseScores = (scores: any): Record<string, number> => {
      if (scores && typeof scores === 'object' && !Array.isArray(scores)) {
        return scores as Record<string, number>;
      }
      if (typeof scores === 'string') {
        try { return JSON.parse(scores); } catch { return {}; }
      }
      return {};
    };

    return {
      labels: sortedHistory.map((h, i) => `第${i + 1}次`),
      datasets: [
        {
          label: '认知能力',
          data: sortedHistory.map(h => parseScores(h.scores).cognitive || 0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: '技能能力',
          data: sortedHistory.map(h => parseScores(h.scores).skill || 0),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: '综合素养',
          data: sortedHistory.map(h => parseScores(h.scores).quality || 0),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: '创新思维',
          data: sortedHistory.map(h => parseScores(h.scores).innovation || 0),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: '协作沟通',
          data: sortedHistory.map(h => parseScores(h.scores).collaboration || 0),
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'AI伦理',
          data: sortedHistory.map(h => parseScores(h.scores).ethics || 0),
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const getRecommendations = useCallback((rec: any) => {
    if (rec?.recommendations) {
      try {
        const parsed = JSON.parse(rec.recommendations);
        // 确保解析后的对象包含必要的字段
        if (parsed && (parsed.learningPlan || parsed.aiAnalysis || parsed.classRecommendation)) {
          return parsed;
        }
      } catch { /* 解析失败，使用默认值 */ }
    }
    return getDefaultRecommendations(rec);
  }, []);

  const stats = getKnowledgePointStats(record);
  const knowledgePoints = Object.keys(stats);
  const correctRates = knowledgePoints.map((k) => Math.round((stats[k].correct / stats[k].total) * 100));
  const recommendations = getRecommendations(record);

  const radarData = {
    labels: knowledgePoints,
    datasets: [{
      label: '正确率(%)', data: correctRates,
      backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6', borderWidth: 2, pointBackgroundColor: '#3b82f6',
    }],
  };

  const barData = {
    labels: knowledgePoints,
    datasets: [
      { label: '正确数', data: knowledgePoints.map((k) => stats[k].correct), backgroundColor: '#22c55e', borderRadius: 8 },
      { label: '错误数', data: knowledgePoints.map((k) => stats[k].total - stats[k].correct), backgroundColor: '#ef4444', borderRadius: 8 },
    ],
  };

  const dimensionRadarData = getDimensionRadarData();
  const growthTrendData = getGrowthTrendData();

  const exportPDF = async () => {
    setExporting(true);
    try {
      // 从雷达图数据中提取六维度分数
      const dimensionScores: Record<string, number> = {};
      if (dimensionRadarData.datasets?.[0]?.data) {
        const labels = ['cognitive', 'skill', 'quality', 'innovation', 'collaboration', 'ethics'];
        labels.forEach((key, idx) => {
          dimensionScores[key] = dimensionRadarData.datasets[0].data[idx] || 0;
        });
      }

      // 获取图表Canvas并导出为图片
      let radarChartImage: string | undefined;
      let trendChartImage: string | undefined;

      try {
        const radarCanvas = document.querySelector('.aspect-square canvas') as HTMLCanvasElement;
        if (radarCanvas) {
          radarChartImage = radarCanvas.toDataURL('image/png');
        }
      } catch (e) {
        console.warn('导出雷达图失败:', e);
      }

      try {
        const trendCanvas = document.querySelector('.aspect-video canvas') as HTMLCanvasElement;
        if (trendCanvas) {
          trendChartImage = trendCanvas.toDataURL('image/png');
        }
      } catch (e) {
        console.warn('导出趋势图失败:', e);
      }

      // 解析答题详情
      let answerDetails: any[] = [];
      try {
        if (record.answers) {
          const answers = JSON.parse(record.answers);
          answerDetails = answers.map((ans: any) => ({
            sequence: ans.sequence || 0,
            knowledgePoint: ans.knowledgePoint || ans.knowledge_point || '知识点',
            studentAnswer: ans.studentAnswer || ans.student_answer || '未作答',
            correctAnswer: ans.correctAnswer || ans.correct_answer || '',
            isCorrect: ans.isCorrect || ans.is_correct || false,
            score: ans.score || 0,
          }));
        }
      } catch (e) {
        console.warn('解析答题详情失败:', e);
      }

      await generateReportPDF({
        studentName: record.student_name || '-',
        school: record.school || '-',
        grade: record.student_grade ? `${record.student_grade}年级` : '-',
        examName: record.exam_name || '测评报告',
        examDate: record.created_at ? formatDateTime(record.created_at) : '-',
        score: record.score || 0,
        level: record.level || '-',
        correctRate: record.score ? Math.round((record.score / 100) * 100) : 0,
        duration: record.duration || 0,
        dimensionScores,
        knowledgeStats: stats,
        aiAnalysis: displayAiAnalysis || {},
        learningPlan: recommendations?.learningPlan || {},
        classRecommendation: recommendations?.classRecommendation || {},
        radarChartImage,
        trendChartImage,
        answerDetails,
      });
    } catch (e) {
      console.error('导出PDF失败:', e);
      alert('导出PDF失败');
    } finally {
      setExporting(false);
    }
  };

  // AI降级方案：当AI分析不可用时，基于规则生成分析内容
  const getFallbackAIAnalysis = useCallback(() => {
    const level = record.level;
    const weakPoints = Object.entries(stats)
      .filter(([_, s]: [string, any]) => s.correct / s.total < 0.6)
      .map(([k]) => k);
    const strongPoints = Object.entries(stats)
      .filter(([_, s]: [string, any]) => s.correct / s.total >= 0.8)
      .map(([k]) => k);

    return {
      knowledgeAnalysis: `根据测评结果，学生在${Object.keys(stats).join('、') || '多个'}知识点上进行了测试。整体掌握程度为${level}级（${level === 'A' ? '优秀' : level === 'B' ? '良好' : level === 'C' ? '合格' : '待提高'}），总正确率为${record.score || 0}%。`,
      logicAbility: `逻辑思维能力${level === 'A' ? '出色，展现出优秀的分析和推理能力' : level === 'B' ? '良好，具备较好的逻辑思考能力' : level === 'C' ? '合格，逻辑思维有提升空间' : '有待提升，建议加强基础逻辑训练'}。`,
      potential: `学生展现出${level === 'A' || level === 'B' ? '较好的学习潜力，能够快速理解和应用新知识' : '一定的学习潜力，通过系统训练可以显著提升'}。`,
      weakPoints: weakPoints.length > 0 ? `薄弱环节：${weakPoints.join('、')}。建议针对性加强这些知识点的学习和练习。` : '暂无明显的薄弱环节，继续保持均衡学习。',
      strengths: strongPoints.length > 0 ? `优势领域：${strongPoints.join('、')}。建议在这些领域继续深入，发挥特长。` : '基础知识掌握较为均衡，建议全面发展。',
      development: `建议${level === 'D' ? '从基础开始系统学习，建立扎实的知识体系' : level === 'C' ? '加强练习巩固基础，逐步提升难度' : level === 'B' ? '挑战更高难度内容，拓展知识广度' : '深入学习进阶内容，参与竞赛和项目实践'}。`,
    };
  }, [record.level, record.score, stats]);

  const aiAnalysis = recommendations?.aiAnalysis;
  const hasAIAnalysis = aiAnalysis && Object.keys(aiAnalysis).length > 0 && aiAnalysis.knowledgeAnalysis;
  const displayAiAnalysis = hasAIAnalysis ? aiAnalysis : getFallbackAIAnalysis();

  const analysisDimensions = [
    { key: 'knowledgeAnalysis', icon: BookMarked, title: '知识掌握度分析', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { key: 'logicAbility', icon: Brain, title: '逻辑思维能力评估', color: 'bg-purple-500', lightColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { key: 'potential', icon: Sparkles, title: '学习潜力评估', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
    { key: 'weakPoints', icon: AlertTriangle, title: '薄弱环节分析', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700' },
    { key: 'strengths', icon: Zap, title: '优势领域识别', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { key: 'development', icon: Compass, title: '综合发展建议', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  ];

  return (
    <div className="space-y-6">
      {showShareActions && (
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={exportPDF} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
            <FileText size={16} />
            {exporting ? '导出中...' : '导出PDF'}
          </button>
          <button onClick={() => setShowPoster(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Share2 size={16} />
            分享海报
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-secondary flex items-center gap-2 text-sm ml-auto">
              <X size={16} />
              关闭
            </button>
          )}
        </div>
      )}

      <div ref={reportRef} className="space-y-6 bg-white rounded-3xl p-6">
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800">{record.exam_name || '测评报告'}</h2>
          <p className="text-sm text-slate-500 mt-1">
            学生：{record.student_name || '-'} | 学校：{record.school || '-'} | 年级：{record.student_grade || '-'}年级 | 测评时间：{record.created_at ? formatDateTime(record.created_at) : '-'}
          </p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-3xl p-6 text-center">
            <Trophy className="mx-auto text-amber-500 mb-2" size={28} />
            <p className="text-3xl font-bold text-slate-800">{record.score}</p>
            <p className="text-xs text-slate-500 mt-1">总分</p>
          </div>
          <div className="glass-card rounded-3xl p-6 text-center">
            <Award className="mx-auto mb-2" size={28} style={{ color: levelColors[record.level] }} />
            <p className="text-3xl font-bold" style={{ color: levelColors[record.level] }}>{record.level}</p>
            <p className="text-xs text-slate-500 mt-1">{levelNames[record.level]}</p>
          </div>
          <div className="glass-card rounded-3xl p-6 text-center">
            <Target className="mx-auto text-blue-500 mb-2" size={28} />
            <p className="text-3xl font-bold text-slate-800">{Math.round((record.score / 100) * 100)}%</p>
            <p className="text-xs text-slate-500 mt-1">正确率</p>
          </div>
          <div className="glass-card rounded-3xl p-6 text-center">
            <TrendingUp className="mx-auto text-emerald-500 mb-2" size={28} />
            <p className="text-3xl font-bold text-slate-800">
              {Math.floor((record.duration || 0) / 60)}:{String((record.duration || 0) % 60).padStart(2, '0')}
            </p>
            <p className="text-xs text-slate-500 mt-1">用时</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target size={16} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">能力维度雷达图</h3>
              <button
                onClick={() => setShowDimensionHelp(true)}
                className="ml-auto p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                title="查看维度说明"
              >
                <HelpCircle size={16} className="text-blue-500" />
              </button>
            </div>
            <div className="aspect-square max-w-sm mx-auto">
              <Radar data={dimensionRadarData} options={{ responsive: true, maintainAspectRatio: true, scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } } }} />
            </div>

          </div>
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">成长趋势图</h3>
            </div>
            {growthHistory.length > 1 ? (
              <div className="aspect-video">
                <Line data={growthTrendData} options={{ responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, max: 100 } } }} />
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Activity size={36} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无多次测评记录，无法展示成长趋势</p>
              </div>
            )}
            {studentProfile?.trend && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-center">
                <p className="text-sm text-slate-600">
                  当前能力趋势：
                  <span className={`font-bold ml-1 ${
                    studentProfile.trend === 'rising' ? 'text-emerald-600' :
                    studentProfile.trend === 'declining' ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    {studentProfile.trend === 'rising' ? '上升' : studentProfile.trend === 'declining' ? '下降' : '稳定'}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 知识点和分布 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">知识点掌握度</h3>
            <div className="aspect-square max-w-sm mx-auto">
              <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: true, scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } } }} />
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">题目正误分布</h3>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }} />
          </div>
        </div>

        {/* AI Analysis - 测评结果分析 */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Brain className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">测评结果分析</h3>
              <p className="text-sm text-slate-500">基于AI智能分析的六维度测评解读</p>
            </div>
          </div>
          {displayAiAnalysis ? (
            <div className="space-y-3">
              {analysisDimensions.map((dim) => {
                const content = displayAiAnalysis[dim.key];
                if (!content) return null;
                const Icon = dim.icon;
                return (
                  <div key={dim.key} className={`p-4 ${dim.lightColor} rounded-2xl`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 ${dim.color} rounded-lg flex items-center justify-center`}>
                        <Icon size={14} className="text-white" />
                      </div>
                      <span className={`text-sm font-bold ${dim.textColor}`}>{dim.title}</span>
                      {hasAIAnalysis ? (
                        <span className="ml-auto text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">AI智能分析</span>
                      ) : (
                        <span className="ml-auto text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">规则分析</span>
                      )}
                    </div>
                    <p className={`text-sm ${dim.textColor} opacity-90 leading-relaxed`}>{content}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <p className="text-sm text-slate-500">AI分析数据加载中，请稍后刷新查看...</p>
            </div>
          )}
        </div>

        {/* Learning Plan */}
        {recommendations?.learningPlan && (
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-emerald-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">学习规划建议</h3>
                <p className="text-sm text-slate-500">根据测评结果制定的个性化学习计划</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: <Clock size={14} />, title: '短期目标（1个月）', text: recommendations.learningPlan.shortTerm, color: 'bg-emerald-500' },
                { icon: <Calendar size={14} />, title: '中期目标（3个月）', text: recommendations.learningPlan.mediumTerm, color: 'bg-blue-500' },
                { icon: <Star size={14} />, title: '长期目标（1学期）', text: recommendations.learningPlan.longTerm, color: 'bg-purple-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center text-white`}>{item.icon}</div>
                    {idx < 2 && <div className="w-0.5 h-full bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-bold text-slate-800 mb-1">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {recommendations.learningPlan?.resources && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-sm font-bold text-amber-800 mb-2">推荐学习资源</p>
                <div className="flex flex-wrap gap-2">
                  {recommendations.learningPlan.resources.map((res: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg">{res}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Class Recommendation */}
        {recommendations?.classRecommendation && (
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">课程路径推荐</h3>
                <p className="text-sm text-slate-500">根据测评成绩推荐的课程和学习路径</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-5">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-blue-600" size={18} />
                <span className="text-sm font-bold text-blue-800">推荐班级</span>
              </div>
              <p className="text-lg font-bold text-blue-700 mb-1">{recommendations.classRecommendation.className}</p>
              <p className="text-sm text-blue-600">{recommendations.classRecommendation.reason}</p>
              {recommendations.classRecommendation.courseId && (
                <button
                  onClick={() => setSelectedCourseId(recommendations.classRecommendation.courseId)}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium bg-white px-4 py-2 rounded-xl border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  <Eye size={14} />
                  查看课程详情与开班计划
                </button>
              )}
            </div>
            <div className="mb-4">
              <p className="text-sm font-bold text-slate-700 mb-3">学习路径规划</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {recommendations.classRecommendation.path.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 shrink-0">
                    <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      idx <= (record.level === 'A' ? 3 : record.level === 'B' ? 2 : record.level === 'C' ? 1 : 0)
                        ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{step}</div>
                    {idx < recommendations.classRecommendation.path.length - 1 && (
                      <ArrowRight className="text-slate-300 shrink-0" size={16} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Answer Details */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">答题详情</h3>
          <div className="space-y-3">
            {JSON.parse(record.answers || '[]').map((ans: any, idx: number) => (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl ${ans.isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${ans.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {ans.sequence}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{ans.knowledgePoint || '知识点'}</p>
                  <p className="text-xs text-slate-500 mt-1">您的答案：{ans.studentAnswer || '未作答'} | 正确答案：{ans.correctAnswer}</p>
                </div>
                <span className={`text-sm font-bold ${ans.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                  {ans.isCorrect ? `+${ans.score}` : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPoster && (
        <SharePoster
          record={record}
          studentName={record.student_name || '同学'}
          onClose={() => setShowPoster(false)}
        />
      )}

      {selectedCourseId && (
        <CourseDetailModal
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}

      {/* 维度说明弹窗 */}
      {showDimensionHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDimensionHelp(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">能力维度说明</h3>
              <button onClick={() => setShowDimensionHelp(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              {/* 认知能力 */}
              <div>
                <h4 className="text-sm font-bold text-blue-700 mb-2">认知能力</h4>
                <div className="space-y-2">
                  {['COG_UNDERSTANDING', 'COG_REASONING', 'COG_TRANSFER'].map(code => (
                    <div key={code} className="p-3 bg-blue-50 rounded-xl">
                      <p className="text-sm font-medium text-slate-800">{dimensionLabels[code].full}</p>
                      <p className="text-xs text-slate-500 mt-1">{dimensionLabels[code].desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* 技能能力 */}
              <div>
                <h4 className="text-sm font-bold text-emerald-700 mb-2">技能能力</h4>
                <div className="space-y-2">
                  {['SKL_BASIC', 'SKL_APPLICATION', 'SKL_EFFICIENCY'].map(code => (
                    <div key={code} className="p-3 bg-emerald-50 rounded-xl">
                      <p className="text-sm font-medium text-slate-800">{dimensionLabels[code].full}</p>
                      <p className="text-xs text-slate-500 mt-1">{dimensionLabels[code].desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* 综合素养 */}
              <div>
                <h4 className="text-sm font-bold text-amber-700 mb-2">综合素养</h4>
                <div className="space-y-2">
                  {['QLT_ATTENTION', 'QLT_EXPRESSION', 'QLT_ATTITUDE'].map(code => (
                    <div key={code} className="p-3 bg-amber-50 rounded-xl">
                      <p className="text-sm font-medium text-slate-800">{dimensionLabels[code].full}</p>
                      <p className="text-xs text-slate-500 mt-1">{dimensionLabels[code].desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* 创新思维 */}
              <div>
                <h4 className="text-sm font-bold text-purple-700 mb-2">创新思维</h4>
                <div className="space-y-2">
                  {['INN_CREATIVITY', 'INN_EXPLORATION', 'INN_DESIGN'].map(code => (
                    <div key={code} className="p-3 bg-purple-50 rounded-xl">
                      <p className="text-sm font-medium text-slate-800">{dimensionLabels[code].full}</p>
                      <p className="text-xs text-slate-500 mt-1">{dimensionLabels[code].desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* 协作沟通 */}
              <div>
                <h4 className="text-sm font-bold text-pink-700 mb-2">协作沟通</h4>
                <div className="space-y-2">
                  {['COL_EXPRESSION', 'COL_TEAMWORK', 'COL_SHARING'].map(code => (
                    <div key={code} className="p-3 bg-pink-50 rounded-xl">
                      <p className="text-sm font-medium text-slate-800">{dimensionLabels[code].full}</p>
                      <p className="text-xs text-slate-500 mt-1">{dimensionLabels[code].desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* AI伦理与责任 */}
              <div>
                <h4 className="text-sm font-bold text-teal-700 mb-2">AI伦理与责任</h4>
                <div className="space-y-2">
                  {['ETH_AWARENESS', 'ETH_RESPONSIBILITY', 'ETH_HUMANISTIC'].map(code => (
                    <div key={code} className="p-3 bg-teal-50 rounded-xl">
                      <p className="text-sm font-medium text-slate-800">{dimensionLabels[code].full}</p>
                      <p className="text-xs text-slate-500 mt-1">{dimensionLabels[code].desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
