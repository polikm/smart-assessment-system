import { useEffect } from 'react';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { Database, Building2, Zap } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const barData = {
  labels: ['1-3年级', '4-6年级', '7-9年级'],
  datasets: [
    {
      label: '平均得分',
      data: [82, 76, 71],
      backgroundColor: '#3b82f6',
      borderRadius: 8,
    },
  ],
};

const radarData = {
  labels: ['逻辑思维', '编程基础', 'AI素养', '数学能力', '创新思维', '问题解决'],
  datasets: [
    {
      label: '掌握度(%)',
      data: [85, 72, 68, 90, 78, 82],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      pointBackgroundColor: '#3b82f6',
    },
  ],
};

const stats = [
  { icon: <Database size={20} />, value: 15000, suffix: '+', label: '题目库', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: <Building2 size={20} />, value: 50, suffix: '+', label: '合作机构', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: <Zap size={20} />, value: 99.5, suffix: '%', label: '系统稳定性', color: 'text-amber-600', bg: 'bg-amber-50', isDecimal: true },
];

function StatCard({ stat, isInView }: { stat: typeof stats[0]; isInView: boolean }) {
  const [count, startAnimation] = useCountUp(
    stat.isDecimal ? Math.floor(stat.value * 10) : stat.value,
    2000
  );

  useEffect(() => {
    if (isInView) {
      startAnimation();
    }
  }, [isInView]);

  const displayValue = stat.isDecimal
    ? (count / 10).toFixed(1)
    : count.toLocaleString();

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 text-center">
      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
        <span className={stat.color}>{stat.icon}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800">
        {displayValue}{stat.suffix}
      </p>
      <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
    </div>
  );
}

export default function DataVizSection() {
  const [ref, isInView] = useInView<HTMLElement>();

  return (
    <section
      id="data-viz"
      ref={ref}
      className="py-24 bg-slate-50"
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isInView ? 'fade-in' : 'opacity-0'}`}>
          <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            数据洞察
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
            用数据说话，让成长可见
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            实时学情数据可视化，多维度展示学生能力分布与成长轨迹
          </p>
        </div>

        {/* Charts */}
        <div className={`grid lg:grid-cols-2 gap-8 mb-12 ${isInView ? 'slide-up' : 'opacity-0'}`}>
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">各年级平均得分分布</h3>
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } },
                },
              }}
            />
          </div>
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">知识点掌握度雷达图</h3>
            <div className="aspect-square max-w-sm mx-auto">
              <Radar
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  scales: {
                    r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
