import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classApi, examApi, studentApi } from '../../api/client';
import { useTheme } from '../../components/ThemeProvider';
import PageHeader from '../../components/PageHeader';
import StatCards from '../../components/StatCards';
import { ArrowLeft, Users, BookOpen, BarChart3, Award, UserPlus, Trash2, GraduationCap, School } from 'lucide-react';
import { formatDateTime } from '../../utils/dateFormat';

interface Student {
  id: number;
  name: string;
  username: string;
  grade: number;
  school: string;
  gender: string;
}

interface ExamRecord {
  id: number;
  student_name: string;
  exam_name: string;
  score: number;
  total_score: number;
  completed_at: string;
}

export default function AdminClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [cls, setCls] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'exams' | 'stats'>('students');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [classStats, setClassStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadClassDetail();
    }
  }, [id]);

  const loadClassDetail = async () => {
    setLoading(true);
    try {
      const classList = await classApi.list();
      const currentClass = classList.find((c: any) => c.id === Number(id));
      setCls(currentClass);

      const studentList = await classApi.students(Number(id));
      setStudents(studentList);

      // 加载班级统计数据
      loadClassStats();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await classApi.statistics(Number(id));
      setClassStats(stats);
      // 转换recentExams为records格式
      if (stats.recentExams) {
        setRecords(stats.recentExams.map((r: any) => ({
          id: r.id,
          student_name: r.student_name,
          exam_name: r.exam_name,
          score: r.score,
          total_score: r.total_score,
          completed_at: r.created_at,
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAllStudents = async () => {
    try {
      const data = await studentApi.list();
      // 过滤掉已在班级中的学生
      const existingIds = new Set(students.map((s) => s.id));
      setAllStudents(data.filter((s: any) => !existingIds.has(s.id)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;
    try {
      await classApi.addStudent(Number(id), Number(selectedStudentId));
      setShowAddStudent(false);
      setSelectedStudentId('');
      loadClassDetail();
    } catch (error) {
      alert('添加学生失败');
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm('确定将该学生从班级中移除？')) return;
    try {
      await classApi.removeStudent(Number(id), studentId);
      loadClassDetail();
    } catch (error) {
      alert('移除失败');
    }
  };

  const overview = classStats?.overview || {};
  const statCards = [
    { title: '班级学生', value: overview.total_students || students.length, icon: Users, color: 'bg-blue-500' },
    { title: '测评次数', value: overview.total_records || records.length, icon: BookOpen, color: 'bg-green-500' },
    { title: '平均分', value: overview.avg_score ? Math.round(overview.avg_score) + '%' : '-', icon: BarChart3, color: 'bg-purple-500' },
    { title: '优良率', value: overview.total_records > 0 ? Math.round(((overview.a_count || 0) + (overview.b_count || 0)) / overview.total_records * 100) + '%' : '-', icon: Award, color: 'bg-amber-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={cls?.name || '班级详情'}
        description={`${cls?.grade || '-'}年级 · 教师：${cls?.teacher_name || '未分配'}`}
      >
        <button onClick={() => navigate('/admin/classes')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={16} />
          返回列表
        </button>
      </PageHeader>

      <StatCards cards={statCards} />

      {/* 标签页 */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {[
          { key: 'students', label: '学生列表', icon: Users },
          { key: 'exams', label: '测评记录', icon: BookOpen },
          { key: 'stats', label: '统计概览', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 学生列表 */}
      {activeTab === 'students' && (
        <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>班级学生</h3>
            <button
              onClick={() => { loadAllStudents(); setShowAddStudent(true); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <UserPlus size={16} />
              添加学生
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">姓名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">用户名</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">性别</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">年级</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">学校</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}>
                    <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-sm">{s.username}</td>
                    <td className="px-4 py-3 text-sm">{s.gender === 'male' ? '男' : s.gender === 'female' ? '女' : '-'}</td>
                    <td className="px-4 py-3 text-sm">{s.grade ? `${s.grade}年级` : '-'}</td>
                    <td className="px-4 py-3 text-sm">{s.school || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRemoveStudent(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                      暂无学生，点击上方按钮添加
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 测评记录 */}
      {activeTab === 'exams' && (
        <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>测评记录</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">学生</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">测评</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">得分</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">完成时间</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}>
                    <td className="px-4 py-3 text-sm font-medium">{r.student_name}</td>
                    <td className="px-4 py-3 text-sm">{r.exam_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.score / r.total_score >= 0.8 ? 'bg-emerald-100 text-emerald-700' :
                        r.score / r.total_score >= 0.6 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {r.score}/{r.total_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(r.completed_at)}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                      暂无测评记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 统计概览 */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* 等级分布 */}
              <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>等级分布</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { level: 'A', count: overview.a_count || 0, color: 'bg-emerald-100 text-emerald-600' },
                    { level: 'B', count: overview.b_count || 0, color: 'bg-blue-100 text-blue-600' },
                    { level: 'C', count: overview.c_count || 0, color: 'bg-amber-100 text-amber-600' },
                    { level: 'D', count: overview.d_count || 0, color: 'bg-red-100 text-red-600' },
                  ].map((item) => (
                    <div key={item.level} className={`p-4 rounded-xl text-center ${item.color}`}>
                      <p className="text-2xl font-bold">{item.count}</p>
                      <p className="text-xs font-medium">{item.level}级</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 学生成绩排行 */}
              <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>学生成绩排行</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">排名</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">姓名</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">测评次数</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">平均分</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">最近测评</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(classStats?.students || []).map((s: any, idx: number) => (
                        <tr key={s.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}>
                          <td className="px-4 py-3 text-sm font-bold text-slate-600">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-sm">{s.exam_count || 0}</td>
                          <td className="px-4 py-3 text-sm font-medium">{s.avg_score ? Math.round(s.avg_score) + '%' : '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{s.last_exam_at ? formatDateTime(s.last_exam_at) : '-'}</td>
                        </tr>
                      ))}
                      {(!classStats?.students || classStats.students.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">暂无数据</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 添加学生弹窗 */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>添加学生到班级</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>选择学生</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择学生</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
                  ))}
                </select>
                {allStudents.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">暂无可添加的学生</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddStudent(false)} className="flex-1 btn-secondary py-2.5">取消</button>
                <button
                  onClick={handleAddStudent}
                  disabled={!selectedStudentId}
                  className="flex-1 btn-primary py-2.5 disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
