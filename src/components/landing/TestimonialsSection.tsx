import { useInView } from '../../hooks/useInView';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: '张女士',
    role: '学生家长',
    avatar: '张',
    content: '报告很详细，终于知道孩子哪里需要加强了。雷达图一目了然，AI分析的建议也很实用，孩子现在学习更有方向了。',
    rating: 5,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    name: '李老师',
    role: '培训机构教师',
    avatar: '李',
    content: '出题效率提升10倍，报表一键生成。以前花一整天整理的测评报告，现在几分钟就搞定了，还能给出个性化的学习建议。',
    rating: 5,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    name: '王校长',
    role: '教育机构负责人',
    avatar: '王',
    content: '学生转化率提升了35%。专业的测评报告让家长更信任我们的教学能力，AI智能体管理也让我们的运营效率大幅提升。',
    rating: 5,
    color: 'bg-amber-100 text-amber-600',
  },
];

export default function TestimonialsSection() {
  const [ref, isInView] = useInView<HTMLElement>();

  return (
    <section
      id="testimonials"
      ref={ref}
      className="py-24 bg-white"
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'fade-in' : 'opacity-0'}`}>
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            用户评价
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
            他们都在用智测云
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            来自家长、教师、教育机构的真实反馈
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className={`glass-card glass-card-hover rounded-3xl p-6 relative ${
                isInView ? 'slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 text-slate-100">
                <Quote size={40} />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-slate-600 text-sm leading-relaxed mb-6 relative z-10">
                "{item.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div
                  className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center font-bold text-sm`}
                >
                  {item.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
