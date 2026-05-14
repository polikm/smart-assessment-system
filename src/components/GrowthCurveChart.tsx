import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GrowthCurveChartProps {
  records: any[];
}

export default function GrowthCurveChart({ records }: GrowthCurveChartProps) {
  const parseScores = (scores: any) => {
    if (typeof scores === 'object' && scores !== null && !Array.isArray(scores)) return scores;
    try { return JSON.parse(scores || '{}'); } catch { return {}; }
  };

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const labels = sortedRecords.map((r, i) => `第${i + 1}次`);

  const dimensions = [
    { key: 'cognitive', label: '认知能力', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    { key: 'skill', label: '技能能力', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
    { key: 'quality', label: '综合素养', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    { key: 'innovation', label: '创新思维', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    { key: 'collaboration', label: '协作沟通', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
    { key: 'ethics', label: 'AI伦理', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.1)' },
  ];

  const datasets = dimensions.map((dim) => ({
    label: dim.label,
    data: sortedRecords.map((r) => {
      const scores = parseScores(r.scores);
      const value = scores[dim.key];
      if (typeof value === 'number' && value > 0) return value;
      // 兜底：如果维度分数不存在或为0，尝试从总分计算
      if (r.score > 0) return Math.round(r.score);
      return 0;
    }),
    borderColor: dim.color,
    backgroundColor: dim.bgColor,
    tension: 0.3,
    fill: false,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 2,
  }));

  // 检查是否所有数据点都是0
  const allZero = datasets.every(ds => ds.data.every(v => v === 0));
  if (allZero) {
    return (
      <div className="space-y-4">
        <div className="h-80 flex items-center justify-center bg-slate-50 rounded-2xl">
          <div className="text-center text-slate-400">
            <p className="text-lg font-medium mb-2">暂无成长数据</p>
            <p className="text-sm">完成多次测评后将展示成长趋势</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 text-center">
          展示各能力维度随测评次数的变化趋势
        </p>
      </div>
    );
  }

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#94a3b8' },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { font: { size: 11 }, color: '#94a3b8', stepSize: 20 },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="h-80">
        <Line data={data} options={options} />
      </div>
      <p className="text-sm text-slate-500 text-center">
        展示各能力维度随测评次数的变化趋势
      </p>
    </div>
  );
}
