import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const kpiCards = [
  { label: '有效测评总量', value: '10,000+', unit: '人次' },
  { label: '覆盖测评方向', value: '5', unit: '大专项方向' },
  { label: '家长满意度', value: '98%', unit: '好评反馈' },
  { label: '合作教育机构', value: '50+', unit: '家校覆盖' },
];

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const el = document.querySelector('#features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1e3a8a 0%, #1e40af 30%, #2563eb 70%, #3b82f6 100%)',
      }}
    >
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Subtle radial glow top-right */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 py-32 w-full">
        {/* Top label */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-amber-400 rounded-full" />
          <span className="text-sm text-amber-300 font-medium tracking-wide">
            AI 驱动的 K-9 素质教育测评平台
          </span>
        </div>

        {/* Main title */}
        <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6 max-w-3xl">
          智测云
          <br />
          <span className="text-amber-300">智能测评与学情分析</span>系统
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-white/70 leading-relaxed max-w-2xl mb-10">
          基于 AI 大模型能力，覆盖 AIGC / Scratch / Python / C++ / 数理逻辑 五大测评方向，
          智能出题、六维度分析报告、个性化课程推荐，形成"量化精准、质性深厚、维度完备"的教育测评闭环。
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4 mb-16">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 bg-white text-blue-700 rounded-2xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-xl flex items-center gap-2"
          >
            免费体验测评
            <ArrowRight size={16} />
          </button>
          <button
            onClick={scrollToFeatures}
            className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all border border-white/20"
          >
            了解功能详情
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-5 border border-white/10"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-xs text-amber-300 font-medium mb-2">{card.label}</p>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-xs text-white/50">{card.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16">
          <path
            d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 36C840 40 960 48 1080 52C1200 56 1320 56 1380 56L1440 56V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z"
            fill="#f8fafc"
          />
        </svg>
      </div>
    </section>
  );
}
