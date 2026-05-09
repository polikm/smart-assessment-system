import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { classApi, studentApi, examApi } from '../../api/client';
import { Users, ClipboardCheck, TrendingUp, Bell, GraduationCap, BarChart3 } from 'lucide-react';

export default function TeacherHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalStudents: 0,
    examCompleted: 0,
    examPending: 0,
    totalClasses: 0,
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesData, studentsData, examsData] = await Promise.all([
        classApi.list(),
        studentApi.list(),
        examApi.list(),
      ]);

      setClasses(classesData);

      const examCompleted = studentsData.filter((s: any) => s.exam_count > 0).length;
      setStats({
        totalStudents: studentsData.length,
        examCompleted,
        examPending: studentsData.length - examCompleted,
        totalClasses: classesData.length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: '学生总数', value: stats.totalStudents, icon: <Users size={24} />, color: 'bg-blue-500', path: '/teacher/students' },
    { title: '已测评', value: stats.examCompleted, icon: <ClipboardCheck size={24} />, color: 'bg-emerald-500', path: '/teacher/class' },
    { title: '待测评', value: stats.examPending, icon: <TrendingUp size={24} />, color: 'bg-amber-500', path: '/teacher/class' },
    { title: '班级数', value: stats.totalClasses, icon: <GraduationCap size={24} />, color: 'bg-purple-500', path: '/teacher/class' },
  ];

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
        <h1 className="text-xl font-bold text-slate-800">教师工作台</h1>
        <p className="text-sm text-slate-500 mt-1">欢迎回来，{user?.name}老师</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            className="glass-card glass-card-hover rounded-3xl p-6 text-left"
          >
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
              <span className="text-white">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-sm text-slate-500">{card.title}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">班级列表</h3>
            <button onClick={() => navigate('/teacher/class')} className="text-sm text-blue-600 hover:text-blue-700">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {classes.slice(0, 5).map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{cls.name}</p>
                    <p className="text-xs text-slate-500">{cls.grade}年级</p>
                  </div>
                </div>
                <BarChart3 className="text-slate-400" size={18} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">快捷操作</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/teacher/students')}
              className="w-full flex items-center gap-3 p-4 bg-blue-50 rounded-2xl text-left hover:bg-blue-100 transition-colors"
            >
              <Users className="text-blue-600" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-800">录入学生</p>
                <p className="text-xs text-slate-500">批量导入或单个添加学生信息</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/teacher/notice')}
              className="w-full flex items-center gap-3 p-4 bg-amber-50 rounded-2xl text-left hover:bg-amber-100 transition-colors"
            >
              <Bell className="text-amber-600" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-800">下发通知</p>
                <p className="text-xs text-slate-500">配置模板并发送录取通知书</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/teacher/report')}
              className="w-full flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl text-left hover:bg-emerald-100 transition-colors"
            >
              <BarChart3 className="text-emerald-600" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-800">查看报表</p>
                <p className="text-xs text-slate-500">查看班级测评数据统计</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
