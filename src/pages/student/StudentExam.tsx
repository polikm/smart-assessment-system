import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { studentApi, examApi, configApi } from '../../api/client';
import { Sparkles, Code, Brain, Star, Clock, ClipboardList, ChevronRight, History } from 'lucide-react';
import InfoRequiredModal from '../../components/InfoRequiredModal';
import { formatDate } from '../../utils/dateFormat';

const examTypes = [
  {
    id: 'math',
    title: '数理逻辑测评',
    desc: '数学思维、逻辑推理、基础算法认知',
    icon: <Brain size={24} />,
    color: 'rose',
    bgColor: 'bg-rose-500',
    lightBg: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-600',
    isRecommended: false,
  },
  {
    id: 'scratch',
    title: 'Scratch图形化编程',
    desc: '积木式编程、趣味动画与游戏',
    icon: <Code size={24} />,
    color: 'amber',
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-600',
    isRecommended: false,
  },
  {
    id: 'python',
    title: 'Python编程',
    desc: '代码编程、游戏开发、算法入门',
    icon: <Code size={24} />,
    color: 'blue',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    isRecommended: true,
  },
  {
    id: 'cpp',
    title: 'C++算法',
    desc: '竞赛算法、数据结构、信息学奥赛',
    icon: <Brain size={24} />,
    color: 'emerald',
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    isRecommended: false,
  },
  {
    id: 'aigc',
    title: 'AIGC素养课',
    desc: 'AI绘画、AI音视频、智能体开发',
    icon: <Sparkles size={24} />,
    color: 'purple',
    bgColor: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    isRecommended: false,
  },
];

const levelColors: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
};

export default function StudentExam() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingInfo, setCheckingInfo] = useState(true);
  const [infoComplete, setInfoComplete] = useState(false);
  const [examConfig, setExamConfig] = useState({ question_count: 15, time_limit: 60 });
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    checkStudentInfo();
    loadExamConfig();
    loadHistory();
  }, []);

  const loadExamConfig = async () => {
    try {
      const config = await configApi.get();
      setExamConfig({
        question_count: parseInt(config.default_question_count || '15'),
        time_limit: parseInt(config.default_time_limit || '60'),
      });
    } catch (error) {
      console.error('加载测评配置失败:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const currentStudent = await studentApi.me();
      if (currentStudent?.id) {
        const records = await studentApi.records(currentStudent.id);
        setHistory(records || []);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const checkStudentInfo = async () => {
    try {
      const currentStudent = await studentApi.me();
      setStudent(currentStudent);
      const complete = !!(currentStudent?.name && currentStudent?.gender && currentStudent?.grade && currentStudent?.school);
      setInfoComplete(complete);
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingInfo(false);
    }
  };

  const getRecommendedType = () => {
    if (!student) return null;

    const priorCoursesRaw = student.prior_courses || [];
    let priorCourses: string[] = [];
    if (Array.isArray(priorCoursesRaw)) {
      priorCourses = priorCoursesRaw;
    } else if (typeof priorCoursesRaw === 'string') {
      try {
        const parsed = JSON.parse(priorCoursesRaw || '[]');
        priorCourses = Array.isArray(parsed) ? parsed : [priorCoursesRaw];
      } catch {
        priorCourses = [priorCoursesRaw];
      }
    }
    const base = student.programming_base;
    const interestProgramming = student.interest_programming || 0;
    const interestAigc = student.interest_aigc || 0;

    if (!base || base === '无基础') {
      return 'math';
    }

    if (priorCourses.length > 0) {
      const courseToExamType: Record<string, string> = {
        'scratch': 'scratch',
        'python': 'python',
        'cpp': 'cpp',
        'c++': 'cpp',
        'aigc': 'aigc',
        'ai': 'aigc',
        'math': 'math',
        '数理逻辑': 'math',
      };

      const learnedTypes = priorCourses
        .map((c: string) => courseToExamType[c.toLowerCase()])
        .filter(Boolean);

      if (learnedTypes.length > 0) {
        const typeInterests: Record<string, number> = {
          'python': interestProgramming,
          'cpp': interestProgramming,
          'aigc': interestAigc,
          'scratch': interestProgramming,
          'math': 3,
        };

        learnedTypes.sort((a: string, b: string) => (typeInterests[b] || 0) - (typeInterests[a] || 0));
        return learnedTypes[0];
      }
    }

    if (interestProgramming >= 3) {
      return 'scratch';
    }
    if (interestAigc >= 3) {
      return 'aigc';
    }

    return 'math';
  };

  const startExam = async (courseType: string) => {
    if (!student?.grade) {
      alert('请先完善个人信息中的年级信息');
      return;
    }

    const typeNames: Record<string, string> = {
      aigc: 'AIGC素养',
      scratch: 'Scratch图形化编程',
      python: 'Python编程',
      cpp: 'C++算法',
      math: '数理逻辑测评',
    };

    setLoading(true);
    try {
      const examData = await examApi.create({
        name: `${typeNames[courseType]}测评 - ${student.grade}年级`,
        course_type: courseType,
        grade: student.grade,
        question_count: examConfig.question_count,
        time_limit: examConfig.time_limit,
      });

      navigate('/student/exam-loading', { state: { examId: examData.id, courseType } });
    } catch (error: any) {
      alert(error.message || '创建试卷失败');
    } finally {
      setLoading(false);
    }
  };

  if (checkingInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!infoComplete) {
    return <InfoRequiredModal />;
  }

  const recommended = getRecommendedType();
  const recommendedType = examTypes.find((t) => t.id === recommended) || examTypes[0];
  const otherTypes = examTypes.filter((t) => t.id !== recommended);

  return (
    <div className="max-w-2xl mx-auto fade-in space-y-6">
      {/* 选择测评类型 */}
      <div className="glass-card rounded-3xl p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">选择测评类型</h1>
        <p className="text-slate-500 mb-6">请根据您的兴趣选择测评课程类型</p>

        {/* 推荐卡片 */}
        {recommended && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-700">为您推荐</span>
            </div>
            <button
              onClick={() => startExam(recommendedType.id)}
              disabled={loading || !student?.grade}
              className="w-full glass-card rounded-3xl p-6 text-left disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ring-2 ring-amber-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute top-3 right-3 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg flex items-center gap-1">
                <Star size={12} className="fill-amber-500" />
                推荐
              </div>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 ${recommendedType.bgColor} rounded-2xl flex items-center justify-center shrink-0`}>
                  <span className="text-white">{recommendedType.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800">{recommendedType.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{recommendedType.desc}</p>
                  <p className="text-xs text-slate-400 mt-2">{examConfig.question_count}道题 · {examConfig.time_limit}分钟 · 客观题为主</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* 其他类型 */}
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-3">其他测评类型</p>
          <div className="grid grid-cols-2 gap-3">
            {otherTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => startExam(type.id)}
                disabled={loading || !student?.grade}
                className="glass-card rounded-2xl p-4 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${type.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                    <span className="text-white">{type.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{type.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{type.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 历史测评记录 */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={20} className="text-slate-600" />
          <h2 className="text-lg font-bold text-slate-800">测评历史</h2>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <ClipboardList className="mx-auto mb-2" size={32} />
            <p className="text-sm">暂无测评记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const scorePercent = record.total_score > 0
                ? Math.round((record.score / record.total_score) * 100)
                : 0;
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: `${levelColors[record.level] || '#94a3b8'}20`,
                      color: levelColors[record.level] || '#94a3b8',
                    }}
                  >
                    {record.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{record.exam_name || `测评 #${record.exam_id}`}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(record.created_at)}
                      </span>
                      <span>{Math.floor(record.duration / 60)}分{record.duration % 60}秒</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">{record.score}/{record.total_score}</p>
                    <p className="text-xs text-slate-500">{scorePercent}%</p>
                  </div>
                  <button
                    onClick={() => navigate('/student/report', { state: { recordId: record.id } })}
                    className="shrink-0 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    查看
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
