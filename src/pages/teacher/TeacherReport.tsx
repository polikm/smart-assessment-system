import { useEffect, useState } from 'react';
import { studentApi, examApi } from '../../api/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { BarChart3, Users, TrendingUp, Award, Eye } from 'lucide-react';
import ReportDetail from '../../components/ReportDetail';
import { formatDate } from '../../utils/dateFormat';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, ArcElement, Tooltip, Legend);

const levelColors: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
};

export default function TeacherReport() {
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, examsData] = await Promise.all([
        studentApi.list(),
        examApi.list(),
      ]);
      setStudents(studentsData);

      const allRecords: any[] = [];
      for (const exam of examsData) {
        const examRecords = await examApi.records(exam.id);
        allRecords.push(...examRecords);
      }
      setRecords(allRecords);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (record: any) => {
    setSelectedRecord(record);
    setDetailLoading(true);
    try {
      const detail = await examApi.recordDetail(record.id);
      setDetailRecord(detail);
    } catch (error) {
      console.error(error);
      alert('获取测评详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const levelDistribution = records.reduce((acc: Record<string, number>, record) => {
    acc[record.level] = (acc[record.level] || 0) + 1;
    return acc;
  }, {});

  const avgScore = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length)
    : 0;

  const doughnutData = {
    labels: Object.keys(levelDistribution).map((l) => `${l}级`),
    datasets: [
      {
        data: Object.values(levelDistribution),
        backgroundColor: Object.keys(levelDistribution).map((l) => levelColors[l] || '#94a3b8'),
        borderWidth: 0,
      },
    ],
  };

  const scoreRanges = [
    { label: '90-100', min: 90, max: 100 },
    { label: '80-89', min: 80, max: 89 },
    { label: '70-79', min: 70, max: 79 },
    { label: '0-69', min: 0, max: 69 },
  ];

  const barData = {
    labels: scoreRanges.map((r) => r.label),
    datasets: [
      {
        label: '人数',
        data: scoreRanges.map((range) =>
          records.filter((r) => r.score >= range.min && r.score <= range.max).length
        ),
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
        borderRadius: 8,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold text-slate-800">班级测评报表</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-3xl p-6 text-center">
          <Users className="mx-auto text-blue-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">{students.length}</p>
          <p className="text-xs text-slate-500 mt-1">学生总数</p>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center">
          <BarChart3 className="mx-auto text-emerald-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">{records.length}</p>
          <p className="text-xs text-slate-500 mt-1">测评次数</p>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center">
          <TrendingUp className="mx-auto text-amber-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">{avgScore}</p>
          <p className="text-xs text-slate-500 mt-1">平均分</p>
        </div>
        <div className="glass-card rounded-3xl p-6 text-center">
          <Award className="mx-auto text-purple-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-slate-800">
            {records.length > 0
              ? Math.round((records.filter((r) => r.level === 'A' || r.level === 'B').length / records.length) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-slate-500 mt-1">优良率</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">分数段分布</h3>
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
              },
            }}
          />
        </div>

        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">等级分布</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">测评成绩表</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">学生姓名</th>
                <th className="pb-3 font-medium">试卷</th>
                <th className="pb-3 font-medium">得分</th>
                <th className="pb-3 font-medium">等级</th>
                <th className="pb-3 font-medium">用时</th>
                <th className="pb-3 font-medium">测评时间</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 text-sm text-slate-800">{record.student_name}</td>
                  <td className="py-3 text-sm text-slate-600">{record.exam_name}</td>
                  <td className="py-3 text-sm font-medium text-slate-800">{record.score}</td>
                  <td className="py-3">
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${levelColors[record.level]}20`,
                        color: levelColors[record.level],
                      }}
                    >
                      {record.level}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-slate-600">
                    {Math.floor((record.duration || 0) / 60)}:{String((record.duration || 0) % 60).padStart(2, '0')}
                  </td>
                  <td className="py-3 text-sm text-slate-500">
                    {formatDate(record.created_at)}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => viewDetail(record)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Eye size={14} />
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : detailRecord ? (
              <ReportDetail
                record={detailRecord}
                onClose={() => { setSelectedRecord(null); setDetailRecord(null); }}
                showShareActions={true}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
