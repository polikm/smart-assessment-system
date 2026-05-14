import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { examApi } from '../../api/client';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, EyeOff } from 'lucide-react';

export default function StudentExamTaking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
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

  const examData = location.state?.exam;

  useEffect(() => {
    if (!examData) {
      navigate('/student/exam');
      return;
    }

    setExam(examData);
    setTimeLeft((examData.time_limit || 60) * 60);
    startTimeRef.current = Date.now();
    setLoading(false);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examData, navigate]);

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

  useEffect(() => {
    if (exam?.questions) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestion, exam]);

  const autoSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    setShowSubmitConfirm(false);

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
    if (!exam) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCountRef.current + 1;
        setTabSwitchCount(newCount);
        tabSwitchCountRef.current = newCount;
        setShowCheatWarning(true);
        setTimeout(() => setShowCheatWarning(false), 3000);

        if (newCount >= 3) {
          alert('检测到多次切换页面，试卷将自动提交');
          autoSubmitRef.current();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [exam]);

  useEffect(() => {
    if (exam && timeLeft > 0) {
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
  }, [exam, timeLeft]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const question = exam?.questions?.[currentQuestion];
  const options = question ? JSON.parse(question.options) : [];
  const progress = exam ? ((currentQuestion + 1) / exam.questions.length) * 100 : 0;

  if (!question) {
    return (
      <div className="max-w-3xl mx-auto fade-in pb-20 lg:pb-0">
        <div className="glass-card rounded-3xl p-8 text-center">
          <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700 mb-2">试卷加载失败</h2>
          <p className="text-sm text-slate-500 mb-4">未找到有效的题目数据，请返回重试</p>
          <button
            onClick={() => navigate('/student/exam')}
            className="btn-primary"
          >
            返回选择试卷
          </button>
        </div>
      </div>
    );
  }

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
            <div className="flex-1">
              <p className="text-sm lg:text-base font-medium text-slate-800 leading-relaxed">{question.content}</p>
              {question.image_svg && (
                <div className="mt-4 flex justify-center">
                  <div dangerouslySetInnerHTML={{ __html: question.image_svg }} className="max-w-full" />
                </div>
              )}
            </div>
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

        {/* Bottom controls */}
        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="shrink-0 btn-secondary flex items-center gap-1 lg:gap-2 disabled:opacity-50 px-3 lg:px-6"
          >
            <ChevronLeft size={16} className="lg:hidden" />
            <ChevronLeft size={18} className="hidden lg:block" />
            <span className="hidden lg:inline">上一题</span>
          </button>

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

      {/* Submit confirm */}
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
              已回答 {Object.keys(answers).length} / {exam.questions.length} 道题
            </p>
            {Object.keys(answers).length < exam.questions.length && (
              <p className="text-xs text-amber-600 text-center mb-4">
                还有 {exam.questions.length - Object.keys(answers).length} 道题未作答，提交后将无法修改
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 btn-secondary py-2.5">
                继续答题
              </button>
              <button onClick={handleSubmit} disabled={submitted} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
                {submitted ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
