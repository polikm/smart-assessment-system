import { useState, useEffect } from 'react';
import { certificateApi, studentApi, examApi } from '../../api/client';
import { useTheme } from '../../components/ThemeProvider';
import PageHeader from '../../components/PageHeader';
import StatCards from '../../components/StatCards';
import { Award, Plus, Search, Trash2, Eye, FileText, User, Calendar, CheckCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';

interface Certificate {
  id: number;
  student_name: string;
  course_type: string;
  level: string;
  certificate_no: string;
  issue_date: string;
  status: string;
  exam_score: number;
}

const courseTypeMap: Record<string, string> = {
  aigc: 'AIGC',
  scratch: 'Scratch',
  python: 'Python',
  cpp: 'C++',
  math: '数学思维',
};

const levelMap: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
  expert: '专家',
};

export default function AdminCertificates() {
  const { isDark } = useTheme();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Certificate | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    exam_record_id: '',
    course_type: 'aigc',
    level: 'beginner',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [certs, studs] = await Promise.all([
        certificateApi.list(),
        studentApi.list(),
      ]);
      setCertificates(certs);
      setStudents(studs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个证书吗？')) return;
    try {
      await certificateApi.delete(id);
      loadData();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await certificateApi.create({
        student_id: parseInt(formData.student_id),
        exam_record_id: formData.exam_record_id ? parseInt(formData.exam_record_id) : null,
        course_type: formData.course_type,
        level: formData.level,
      });
      setShowModal(false);
      setFormData({ student_id: '', exam_record_id: '', course_type: 'aigc', level: 'beginner' });
      loadData();
    } catch (error) {
      alert('创建失败');
    }
  };

  const filteredCerts = certificates.filter((c) =>
    c.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.certificate_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { title: '证书总数', value: certificates.length, icon: Award, color: 'bg-amber-500' },
    { title: '初级证书', value: certificates.filter((c) => c.level === 'beginner').length, icon: FileText, color: 'bg-green-500' },
    { title: '中级证书', value: certificates.filter((c) => c.level === 'intermediate').length, icon: FileText, color: 'bg-blue-500' },
    { title: '高级证书', value: certificates.filter((c) => c.level === 'advanced').length, icon: FileText, color: 'bg-purple-500' },
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
      <PageHeader title="证书管理" description="管理学生测评证书，包括创建、查看和删除">
        <button
          onClick={() => { setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          颁发证书
        </button>
      </PageHeader>

      <StatCards cards={statCards} />

      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜索学生姓名或证书编号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">证书编号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">学生</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">课程</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">等级</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">颁发日期</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">状态</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map((cert) => (
                <tr key={cert.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}>
                  <td className="px-4 py-3 text-sm font-mono">{cert.certificate_no}</td>
                  <td className="px-4 py-3 text-sm font-medium">{cert.student_name}</td>
                  <td className="px-4 py-3 text-sm">{courseTypeMap[cert.course_type] || cert.course_type}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cert.level === 'beginner' ? 'bg-green-100 text-green-700' :
                      cert.level === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                      cert.level === 'advanced' ? 'bg-purple-100 text-purple-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {levelMap[cert.level] || cert.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(cert.issue_date)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cert.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cert.status === 'active' ? '有效' : '失效'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setShowDetail(cert)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDelete(cert.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                    暂无证书记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 创建证书弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>颁发证书</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>学生</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">请选择学生</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.username || s.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>课程类型</label>
                <select
                  value={formData.course_type}
                  onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                  className="input-field"
                >
                  <option value="aigc">AIGC</option>
                  <option value="scratch">Scratch</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="math">数学思维</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>等级</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="input-field"
                >
                  <option value="beginner">初级</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                  <option value="expert">专家</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-2.5">取消</button>
                <button type="submit" className="flex-1 btn-primary py-2.5">颁发</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 证书详情弹窗 */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={32} className="text-amber-600" />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>测评证书</h2>
              <p className="text-sm text-slate-500 mt-1">{showDetail.certificate_no}</p>
            </div>

            <div className={`space-y-3 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>学生姓名</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{showDetail.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>课程类型</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{courseTypeMap[showDetail.course_type] || showDetail.course_type}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>证书等级</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{levelMap[showDetail.level] || showDetail.level}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>颁发日期</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDate(showDetail.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>状态</span>
                <span className={`text-sm font-medium ${showDetail.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {showDetail.status === 'active' ? '有效' : '失效'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowDetail(null)}
              className="w-full btn-secondary py-2.5 mt-6"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
