import { useInView } from '../../hooks/useInView';
import {
  Brain,
  BarChart3,
  Shield,
  GraduationCap,
  Cpu,
  LineChart,
} from 'lucide-react';

const features = [
  {
    icon: <Brain size={24} />,
    title: '智能出题',
    desc: 'AI自动生成个性化试题，覆盖多知识点、多难度梯度，出题效率提升10倍',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    icon: <BarChart3 size={24} />,
    title: '学情分析',
    desc: '六维度AI深度分析报告：知识掌握度、逻辑思维、学习潜力、薄弱环节、优势领域、发展建议',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    icon: <Shield size={24} />,
    title: '防作弊监控',
    desc: '页面切换检测、答题时间追踪、异常行为标记，确保测评结果真实可靠',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    icon: <GraduationCap size={24} />,
    title: '课程推荐',
    desc: '基于测评结果智能分班，推荐最适合的学习路径和课程方案',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    icon: <Cpu size={24} />,
    title: 'AI智能体',
    desc: '可配置的AI能力管理中枢，独立控制每个AI功能的开关、提示词和参数',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
  },
  {
    icon: <LineChart size={24} />,
    title: '数据大盘',
    desc: '实时学情可视化监控，雷达图、柱状图、环形图多维展示，数据驱动决策',
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
  },
];

export default function FeaturesSection() {
  const [ref, isInView] = useInView<HTMLElement>();

  return (
    <section
      id="features"
      ref={ref}
      className="py-24 bg-slate-50"
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'fade-in' : 'opacity-0'}`}>
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            核心能力
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
            六大核心能力，重新定义教育测评
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            从出题到分析，从监控到推荐，覆盖教育测评全链路
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`glass-card glass-card-hover rounded-2xl p-6 ${
                isInView ? 'slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div
                className={`w-12 h-12 ${feature.lightColor} rounded-xl flex items-center justify-center mb-4`}
              >
                <span className={feature.textColor}>{feature.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
