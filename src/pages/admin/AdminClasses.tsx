import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classApi } from '../../api/client';
import PageHeader from '../../components/PageHeader';
import StatCards from '../../components/StatCards';
import { useTheme } from '../../components/ThemeProvider';
import { School, Users, BookOpen, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

export default function AdminClasses() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', grade: '', teacher_id: '' });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classApi.list();
      setClasses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个班级吗？')) return;
    try {
      await classApi.delete(id);
      loadClasses();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await classApi.update(editingClass.id, formData);
      } else {
        await classApi.create(formData);
      }
      setShowModal(false);
      setEditingClass(null);
      setFormData({ name: '', grade: '', teacher_id: '' });
      loadClasses();
    } catch (error) {
      alert('保存失败');
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { title: '班级总数', value: classes.length, icon: School, color: 'bg-blue-500' },
    { title: '学生总数', value: classes.reduce((sum, c) => sum + (c.student_count || 0), 0), icon: Users, color: 'bg-green-500' },
    { title: '课程总数', value: 0, icon: BookOpen, color: 'bg-purple-500' },
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
      <PageHeader title="班级管理" description="管理班级信息、学生分班和班级统计">
        <button
          onClick={() => { setEditingClass(null); setFormData({ name: '', grade: '', teacher_id: '' }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增班级
        </button>
      </PageHeader>

      <StatCards cards={statCards} />

      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜索班级..."
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
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">班级名称</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">年级</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">教师</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">学生数</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}>
                  <td className="px-4 py-3 text-sm font-medium">{cls.name}</td>
                  <td className="px-4 py-3 text-sm">{cls.grade}年级</td>
                  <td className="px-4 py-3 text-sm">{cls.teacher_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{cls.student_count || 0}人</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/admin/classes/${cls.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => { setEditingClass(cls); setFormData({ name: cls.name, grade: cls.grade?.toString() || '', teacher_id: cls.teacher_id?.toString() || '' }); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(cls.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 w-full max-w-md mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className="text-lg font-bold mb-4">{editingClass ? '编辑班级' : '新增班级'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">班级名称</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">年级</label>
                <input type="number" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="input-field" required />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
