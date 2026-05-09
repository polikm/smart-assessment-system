import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, BarChart3, BrainCircuit, Lightbulb, CheckCircle } from 'lucide-react';
import { examApi } from '../../api/client';

const statusMessages = [
  { icon: <Upload size={20} />, text: '提交测评数据...' },
  { icon: <BarChart3 size={20} />, text: '分析答题情况...' },
  { icon: <BrainCircuit size={20} />, text: '评估知识掌握度...' },
  { icon: <Lightbulb size={20} />, text: '生成学习建议...' },
  { icon: <CheckCircle size={20} />, text: '分析完成！' },
];

export default function AnalysisLoading() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState('');
  const startTimeRef = useRef(Date.now());

  const recordId = location.state?.recordId;
  const MIN_DISPLAY_TIME = 10000; // 最少展示10秒
  const MAX_WAIT_TIME = 120000;   // 最多等待120秒
  const CHECK_INTERVAL = 1500;    // 轮询间隔1.5秒

  useEffect(() => {
    if (!recordId) {
      navigate('/student/report');
      return;
    }

    startTimeRef.current = Date.now();

    // 进度条动画 - 基于最大等待时间
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progressPercent = Math.min(100, (elapsed / MAX_WAIT_TIME) * 100);
      setProgress(progressPercent);

      // 更新状态消息
      const messageIndex = Math.min(
        statusMessages.length - 1,
        Math.floor((progressPercent / 100) * statusMessages.length)
      );
      setStatusIndex(messageIndex);

      if (elapsed >= MAX_WAIT_TIME) {
        clearInterval(progressInterval);
      }
    }, 200);

    // 轮询检查报告状态
    let isWaitingForDelay = false;

    const checkStatus = async () => {
      try {
        const status = await examApi.checkStatus(recordId);
        const elapsed = Date.now() - startTimeRef.current;

        // 如果报告已生成且已超过最少展示时间，则等待3秒后跳转
        if (status.ready && elapsed >= MIN_DISPLAY_TIME && !isWaitingForDelay) {
          isWaitingForDelay = true;
          setStatusIndex(statusMessages.length - 1);
          // 等待3秒确保内容完全加载
          setTimeout(() => {
            clearInterval(progressInterval);
            clearTimeout(checkTimeout);
            navigate('/student/report');
          }, 3000);
          return;
        }

        // 如果超过最大等待时间，强制跳转
        if (elapsed >= MAX_WAIT_TIME) {
          clearInterval(progressInterval);
          clearTimeout(checkTimeout);
          navigate('/student/report');
          return;
        }
      } catch (err: any) {
        console.error('检查状态失败:', err);
      }
    };

    // 立即检查一次，然后定时轮询
    checkStatus();
    const checkTimeout = setInterval(checkStatus, CHECK_INTERVAL);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(checkTimeout);
    };
  }, [navigate, recordId]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center z-50">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-red-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">分析失败</h2>
          <p className="text-red-300/70 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/student/report')}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
          >
            查看报告
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center z-50">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Glowing ring */}
        <div className="relative mb-10">
          <div className="w-32 h-32 rounded-full border-4 border-purple-500/20" />
          <div className="absolute inset-0 w-32 h-32 rounded-full border-t-4 border-purple-400 animate-spin" style={{ animationDuration: '1s' }} />
          <div className="absolute inset-0 w-32 h-32 rounded-full border-r-4 border-cyan-400/50 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          <div className="absolute inset-4 w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center">
            <BrainCircuit className="text-purple-300" size={40} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">智能分析中</h1>
        <p className="text-purple-300/70 text-sm mb-8">AI正在深度分析您的测评结果</p>

        {/* Progress bar */}
        <div className="w-72 h-2 bg-slate-700 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage */}
        <p className="text-3xl font-bold text-white mb-6">{Math.round(progress)}%</p>

        {/* Status message */}
        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <span className="text-purple-400 animate-pulse">{statusMessages[statusIndex].icon}</span>
          <span className="text-white/90 text-sm font-medium">{statusMessages[statusIndex].text}</span>
        </div>

        {/* Time hint */}
        <p className="text-white/30 text-xs mt-4">
          预计需要 10-120 秒
        </p>
      </div>
    </div>
  );
}
