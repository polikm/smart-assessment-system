import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { studentApi, examApi, noticeApi } from '../../api/client';
import { ClipboardList, BarChart3, Bell, Sparkles, Clock, TrendingUp } from 'lucide-react';
import GrowthChart from '../../components/GrowthChart';

export default function StudentHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [student, setStudent] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentStudent = await studentApi.me();
      if (currentStudent) {
        setStudent(currentStudent);
        const [recordsData, noticesData] = await Promise.all([
          studentApi.records(currentStudent.id),
          noticeApi.list({ student_id: currentStudent.id.toString() }),
        ]);
        setRecords(recordsData);
        setNotices(noticesData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const latestRecord = records[0];

  const menuItems = [
    {
      title: '在线测评',
      desc: '开始新的入学测评',
      icon: <ClipboardList size={24} />,
      path: '/student/exam',
      color: 'bg-blue-500',
      requireInfo: true,
    },
    {
      title: '测评报告',
      desc: '查看历史测评结果',
      icon: <BarChart3 size={24} />,
      path: '/student/report',
      color: 'bg-amber-500',
      requireInfo: true,
    },
    {
      title: '通知中心',
      desc: `您有 ${notices.length} 条通知`,
      icon: <Bell size={24} />,
      path: '/student/notices',
      color: 'bg-emerald-500',
      requireInfo: false,
    },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.requireInfo && !student?.grade) {
      navigate('/student/info');
      return;
    }
    navigate(item.path);
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
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Sparkles className="text-blue-600" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              欢迎回来，{student?.name || user?.name || '同学'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {student?.grade ? `${student.grade}年级` : ''} {student?.school || ''}
            </p>
          </div>
        </div>
      </div>

      {/* 功能卡片前置 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item)}
            className="glass-card glass-card-hover rounded-3xl p-6 text-left"
          >
            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-4`}>
              <span className="text-white">{item.icon}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
          </button>
        ))}
      </div>

      {latestRecord && (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">最新测评</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-2xl">
              <p className="text-2xl font-bold text-blue-600">{latestRecord.score}</p>
              <p className="text-xs text-slate-500 mt-1">得分</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-2xl">
              <p className="text-2xl font-bold text-amber-600">{latestRecord.level}</p>
              <p className="text-xs text-slate-500 mt-1">等级</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-2xl">
              <p className="text-2xl font-bold text-emerald-600">
                {Math.floor((latestRecord.duration || 0) / 60)}:{String((latestRecord.duration || 0) % 60).padStart(2, '0')}
              </p>
              <p className="text-xs text-slate-500 mt-1">用时</p>
            </div>
          </div>
        </div>
      )}

      <GrowthChart records={records} />

      {!student?.grade && (
        <div className="glass-card rounded-3xl p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-amber-600" size={24} />
            <div>
              <h3 className="font-bold text-amber-800">完善个人信息</h3>
              <p className="text-sm text-amber-700 mt-1">请先填写信息采集表，以便我们为您生成合适的测评试卷</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/info')}
            className="mt-4 btn-primary bg-amber-500 hover:bg-amber-600"
          >
            去填写
          </button>
        </div>
      )}
    </div>
  );
}
