import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { studentApi, examApi, configApi } from '../../api/client';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, Sparkles, Code, Brain, Zap, Star, EyeOff, Calculator } from 'lucide-react';
import InfoRequiredModal from '../../components/InfoRequiredModal';

const examTypes = [
  {
    id: 'math',
    title: '数理逻辑测评',
    desc: '数学思维、逻辑推理、基础算法认知',
    icon: <Calculator size={24} />,
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

export default function StudentExam() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingInfo, setCheckingInfo] = useState(true);
  const [infoComplete, setInfoComplete] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [examConfig, setExamConfig] = useState({ question_count: 15, time_limit: 60 });
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const questionStartTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const examRef = useRef<any>(null);
  const answersRef = useRef<Record<number, string>>({});
  const tabSwitchCountRef = useRef<number>(0);
  const questionTimesRef = useRef<Record<number, number>>({});

  useEffect(() => {
    checkStudentInfo();
    loadExamConfig();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  // 接收从ExamLoading传递过来的考试数据
  useEffect(() => {
    const examData = location.state?.exam;
    const shouldStart = location.state?.started;
    if (examData && shouldStart) {
      setExam(examData);
      setStarted(true);
      setTimeLeft((examData.time_limit || 60) * 60);
      startTimeRef.current = Date.now();
      // 清除location state，避免刷新时重复设置
      navigate('/student/exam', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

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

  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    tabSwitchCountRef.current = tabSwitchCount;
  }, [tabSwitchCount]);

  useEffect(() => {
    questionTimesRef.current = questionTimes;
  }, [questionTimes]);

  // Anti-cheat: track question answering time
  useEffect(() => {
    if (started && exam?.questions) {
      questionStartTimeRef.current = Date.now();
    }
  }, [started, currentQuestion, exam]);

  const autoSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    setShowSubmitConfirm(false); // 立即关闭确认弹窗

    const currentExam = examRef.current;
    const currentAnswers = answersRef.current;
    if (!currentExam) {
      setSubmitted(false);
      return;
    }

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const result = await examApi.submit(currentExam.id, {
        answers: currentAnswers,
        duration,
        tab_switch_count: tabSwitchCountRef.current,
        question_times: questionTimesRef.current,
      });
      navigate('/student/analysis-loading', { state: { recordId: result.recordId } });
    } catch (error: any) {
      alert(error.message || '提交失败');
      setSubmitted(false);
    }
  }, [navigate]);

  const autoSubmitRef = useRef(autoSubmit);
  useEffect(() => {
    autoSubmitRef.current = autoSubmit;
  }, [autoSubmit]);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    if (!started) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCountRef.current + 1;
        setTabSwitchCount(newCount);
        tabSwitchCountRef.current = newCount;
        setShowCheatWarning(true);
        setTimeout(() => setShowCheatWarning(false), 3000);

        // Auto submit if switched too many times (>= 3)
        if (newCount >= 3) {
          alert('检测到多次切换页面，试卷将自动提交');
          autoSubmitRef.current();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started]);

  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            autoSubmitRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, timeLeft]);



  const getRecommendedType = () => {
    if (!student) return null;
    const base = student.programming_base;
    const interest = student.interest_programming;
    if (!base || base === '无基础') return 'math';
    if (interest >= 3) return 'python';
    if (student.interest_aigc >= 3) return 'aigc';
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

      // 跳转到组卷过渡页，携带考试ID
      navigate('/student/exam-loading', { state: { examId: examData.id, courseType } });
    } catch (error: any) {
      alert(error.message || '创建试卷失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const qSeq = exam.questions[currentQuestion].sequence;
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    setQuestionTimes(prev => ({ ...prev, [qSeq]: timeSpent }));
    setAnswers({ ...answers, [qSeq]: answer });
  };

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    await autoSubmit();
  };

  const handleSubmitClick = () => {
    setShowSubmitConfirm(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  if (!started) {
    const recommended = getRecommendedType();
    const recommendedType = examTypes.find((t) => t.id === recommended) || examTypes[0];
    const otherTypes = examTypes.filter((t) => t.id !== recommended);

    return (
      <div className="max-w-2xl mx-auto fade-in">
        <div className="glass-card rounded-3xl p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">选择测评类型</h1>
          <p className="text-slate-500 mb-6">请根据您的兴趣选择测评课程类型</p>

          {/* 推荐卡片 - 突出展示 */}
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

          {/* 其他类型 - 弱化展示 */}
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
      </div>
    );
  }

  const question = exam?.questions?.[currentQuestion];
  const options = question ? JSON.parse(question.options) : [];
  const progress = exam ? ((currentQuestion + 1) / exam.questions.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto fade-in pb-20 lg:pb-0">
      <div className="glass-card rounded-3xl p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-800 truncate">{exam.name}</h1>
            <p className="text-xs lg:text-sm text-slate-500">第 {currentQuestion + 1} / {exam.questions.length} 题</p>
          </div>
          <div className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 rounded-xl shrink-0 ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <Clock size={16} />
            <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full mb-4 lg:mb-6 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-progress" style={{ width: `${progress}%` }} />
        </div>

        {/* Question */}
        <div className="mb-4 lg:mb-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600">
              {question.sequence}
            </span>
            <p className="text-sm lg:text-base font-medium text-slate-800 leading-relaxed">{question.content}</p>
          </div>

          <div className="space-y-2 lg:space-y-3 ml-11">
            {options.map((option: string, index: number) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = answers[question.sequence] === letter;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(letter)}
                  className={`w-full flex items-center gap-3 p-3 lg:p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center text-xs lg:text-sm font-bold ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {letter}
                  </span>
                  <span className="text-sm text-slate-700">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom controls - Mobile optimized */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Prev button */}
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="shrink-0 btn-secondary flex items-center gap-1 lg:gap-2 disabled:opacity-50 px-3 lg:px-6"
          >
            <ChevronLeft size={16} className="lg:hidden" />
            <ChevronLeft size={18} className="hidden lg:block" />
            <span className="hidden lg:inline">上一题</span>
          </button>

          {/* Question numbers - scrollable on mobile */}
          <div className="flex-1 overflow-x-auto scrollbar-thin">
            <div className="flex gap-1.5 lg:gap-2 min-w-max px-1">
              {exam.questions.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    idx === currentQuestion
                      ? 'bg-blue-500 text-white'
                      : answers[exam.questions[idx].sequence]
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Next / Submit button */}
          {currentQuestion < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="shrink-0 btn-primary flex items-center gap-1 lg:gap-2 px-3 lg:px-6"
            >
              <span className="hidden lg:inline">下一题</span>
              <ChevronRight size={16} className="lg:hidden" />
              <ChevronRight size={18} className="hidden lg:block" />
            </button>
          ) : (
            <button
              onClick={handleSubmitClick}
              disabled={submitted}
              className="shrink-0 btn-primary flex items-center gap-1 lg:gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-3 lg:px-6"
            >
              <Send size={14} className="lg:hidden" />
              <Send size={16} className="hidden lg:block" />
              <span className="hidden lg:inline">提交</span>
            </button>
          )}
        </div>
      </div>

      {/* Anti-cheat warning */}
      {showCheatWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <EyeOff size={18} />
          <span className="font-medium">警告：检测到页面切换行为（{tabSwitchCount}次）</span>
        </div>
      )}

      {/* 提交确认弹窗 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">确认提交</h3>
            <p className="text-sm text-slate-500 text-center mb-2">
              您已回答 {Object.keys(answers).length} / {exam.questions.length} 道题
            </p>
            {Object.keys(answers).length < exam.questions.length && (
              <p className="text-xs text-amber-600 text-center mb-4">
                还有 {exam.questions.length - Object.keys(answers).length} 道题未作答，提交后将无法修改
              </p>
            )}
            {Object.keys(answers).length >= exam.questions.length && (
              <p className="text-xs text-slate-400 text-center mb-4">
                提交后将无法修改答案
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 btn-secondary py-2.5"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitted}
                className="flex-1 btn-primary py-2.5 disabled:opacity-50"
              >
                {submitted ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
