import { useInView } from '../../hooks/useInView';
import {
  FileText,
  Brain,
  ShieldCheck,
  Puzzle,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

const agents = [
  {
    key: 'report_analysis',
    name: '测评报告 AI 分析',
    description: '基于学生测评结果，自动生成六维度深度分析报告，涵盖知识掌握度、逻辑思维、学习潜力、薄弱环节、优势领域与发展建议，让每位学生的成长路径清晰可见。',
    icon: <FileText size={28} />,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    highlight: '六维度分析',
  },
  {
    key: 'question_generate',
    name: 'AI 智能出题',
    description: '根据知识点、难度等级和题型要求，自动生成高质量测评题目。支持 AIGC、Scratch、Python、C++、数理逻辑五大方向，出题效率提升 10 倍。',
    icon: <Brain size={28} />,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    highlight: '五大方向覆盖',
  },
  {
    key: 'question_review',
    name: 'AI 题目审核',
    description: '智能审核题目质量，自动检测答案准确性、选项合理性、表述清晰度，确保每道题目都符合教育标准，为测评质量保驾护航。',
    icon: <ShieldCheck size={28} />,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    highlight: '质量保障',
  },
  {
    key: 'exam_assemble',
    name: '智能组卷',
    description: '根据知识点分布、难度梯度、题型比例等要求，从题库中智能筛选组合，生成科学合理的测评试卷，实现"千人千卷"的个性化测评。',
    icon: <Puzzle size={28} />,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    highlight: '千人千卷',
  },
  {
    key: 'course_recommend',
    name: '智能课程推荐',
    description: '基于测评结果分析学生能力画像，智能推荐最适合的学习路径、课程班级和训练方案，实现因材施教，让每个孩子都能找到适合自己的成长路线。',
    icon: <Lightbulb size={28} />,
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    highlight: '因材施教',
  },
];

export default function AIAgentsSection() {
  const [ref, isInView] = useInView<HTMLElement>();

  return (
    <section
      id="ai-agents"
      ref={ref}
      className="py-24 bg-white"
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'fade-in' : 'opacity-0'}`}>
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            AI 智能体
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
            五大 AI 智能体，赋能教育全链路
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            每个智能体专注解决教育测评中的一个核心环节，协同工作形成完整的智能化测评闭环
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, idx) => (
            <div
              key={agent.key}
              className={`glass-card glass-card-hover rounded-2xl p-6 group ${
                isInView ? 'slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Icon & Highlight */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-14 h-14 ${agent.lightColor} rounded-2xl flex items-center justify-center`}
                >
                  <span className={agent.textColor}>{agent.icon}</span>
                </div>
                <span
                  className={`px-3 py-1 ${agent.lightColor} ${agent.textColor} rounded-full text-xs font-medium`}
                >
                  {agent.highlight}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-slate-800 mb-3">
                {agent.name}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {agent.description}
              </p>

              {/* Link */}
              <button className="flex items-center gap-1 text-sm font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
                了解更多
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
