import { useState, useRef, useCallback } from 'react';
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
import { Radar, Bar } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Trophy, Target, TrendingUp, Award, X,
  Calendar, ArrowRight, MapPin, GraduationCap,
  AlertTriangle, Clock, Star, Share2, FileText,
  Brain, Sparkles, Zap, BookMarked, Compass,
  Eye
} from 'lucide-react';
import SharePoster from './SharePoster';
import CourseDetailModal from './CourseDetailModal';

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

  const getRecommendations = useCallback((rec: any) => {
    if (rec?.recommendations) {
      try { return JSON.parse(rec.recommendations); } catch { return getDefaultRecommendations(rec); }
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

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`测评报告-${record.exam_name || '报告'}.pdf`);
    } catch (e) {
      alert('导出PDF失败');
    } finally {
      setExporting(false);
    }
  };

  const aiAnalysis = recommendations?.aiAnalysis;

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
            学生：{record.student_name || '-'} | 学校：{record.school || '-'} | 年级：{record.student_grade || '-'}年级
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
          {aiAnalysis ? (
            <div className="space-y-3">
              {analysisDimensions.map((dim) => {
                const content = aiAnalysis[dim.key];
                if (!content) return null;
                const Icon = dim.icon;
                return (
                  <div key={dim.key} className={`p-4 ${dim.lightColor} rounded-2xl`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 ${dim.color} rounded-lg flex items-center justify-center`}>
                        <Icon size={14} className="text-white" />
                      </div>
                      <span className={`text-sm font-bold ${dim.textColor}`}>{dim.title}</span>
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
    </div>
  );
}
