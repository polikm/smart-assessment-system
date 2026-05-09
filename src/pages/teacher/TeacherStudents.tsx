import { useState, useEffect } from 'react';
import { studentApi } from '../../api/client';
import {
  Users, Plus, Upload, X, Save, Trash2, Search, Edit3, GraduationCap,
  FileSpreadsheet, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  username: string;
  gender: string;
  school: string;
  grade: number;
  math_score: string;
  ai_base: string;
  programming_base: string;
  awards: string;
  interest_aigc: number;
  interest_programming: number;
  status: string;
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '123456',
    gender: '',
    school: '',
    grade: '',
    math_score: '',
    ai_base: '',
    programming_base: '',
    awards: '',
  });

  const [batchData, setBatchData] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(
      (s) =>
        s.name?.includes(searchQuery) ||
        s.school?.includes(searchQuery) ||
        s.username?.includes(searchQuery)
    );
    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchQuery, students]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentApi.list();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '123456',
      gender: '',
      school: '',
      grade: '',
      math_score: '',
      ai_base: '',
      programming_base: '',
      awards: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      await studentApi.create({
        ...formData,
        grade: parseInt(formData.grade) || 1,
      });
      setSuccess('添加成功');
      resetForm();
      loadStudents();
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess('');
      }, 1500);
    } catch (error: any) {
      setSuccess('');
      alert(error.message || '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSaving(true);
    setSuccess('');
    try {
      await studentApi.update(editingStudent.id, {
        name: formData.name,
        gender: formData.gender,
        school: formData.school,
        grade: parseInt(formData.grade) || null,
        math_score: formData.math_score,
        ai_base: formData.ai_base,
        programming_base: formData.programming_base,
        awards: formData.awards,
      });
      setSuccess('更新成功');
      loadStudents();
      setTimeout(() => {
        setShowEditModal(false);
        setEditingStudent(null);
        setSuccess('');
      }, 1500);
    } catch (error: any) {
      setSuccess('');
      alert(error.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该学生吗？此操作不可恢复。')) return;
    try {
      await studentApi.delete(id);
      loadStudents();
    } catch (error: any) {
      alert(error.message || '删除失败');
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      username: student.username || '',
      password: '123456',
      gender: student.gender || '',
      school: student.school || '',
      grade: student.grade?.toString() || '',
      math_score: student.math_score || '',
      ai_base: student.ai_base || '',
      programming_base: student.programming_base || '',
      awards: student.awards || '',
    });
    setShowEditModal(true);
  };

  const handleBatchSubmit = async () => {
    setSaving(true);
    setSuccess('');
    try {
      const lines = batchData.trim().split('\n');
      let count = 0;
      for (const line of lines) {
        const [name, grade, school] = line.split(',').map((s) => s.trim());
        if (name && grade) {
          await studentApi.create({
            name,
            username: `student_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            password: '123456',
            grade: parseInt(grade),
            school: school || '',
          });
          count++;
        }
      }
      setSuccess(`成功导入 ${count} 名学生`);
      setBatchData('');
      loadStudents();
      setTimeout(() => {
        setShowBatchModal(false);
        setSuccess('');
      }, 2000);
    } catch (error: any) {
      setSuccess('');
      alert(error.message || '批量导入失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setSaving(true);
    setSuccess('');
    try {
      const text = await csvFile.text();
      const lines = text.trim().split('\n');
      let count = 0;
      // Skip header if first line contains non-numeric grade
      const startIndex = lines[0].includes('姓名') || lines[0].includes('name') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const [name, grade, school, gender, math_score, ai_base, programming_base] = lines[i].split(',').map((s) => s.trim());
        if (name && grade) {
          await studentApi.create({
            name,
            username: `student_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            password: '123456',
            grade: parseInt(grade),
            school: school || '',
            gender: gender || '',
            math_score: math_score || '',
            ai_base: ai_base || '',
            programming_base: programming_base || '',
          });
          count++;
        }
      }
      setSuccess(`成功导入 ${count} 名学生`);
      setCsvFile(null);
      loadStudents();
      setTimeout(() => {
        setShowBatchModal(false);
        setSuccess('');
      }, 2000);
    } catch (error: any) {
      setSuccess('');
      alert(error.message || 'CSV导入失败');
    } finally {
      setSaving(false);
    }
  };

  const renderStudentForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">姓名 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            required
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名（可选）</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input-field"
              placeholder="留空自动生成"
            />
          </div>
        )}
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="input-field"
            >
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        )}
      </div>

      {!isEdit && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="input-field"
            >
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">年级 *</label>
          <select
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            className="input-field"
            required
          >
            <option value="">请选择</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
              <option key={g} value={g}>{g}年级</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">学校</label>
          <input
            type="text"
            value={formData.school}
            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">数学成绩</label>
        <input
          type="text"
          value={formData.math_score}
          onChange={(e) => setFormData({ ...formData, math_score: e.target.value })}
          className="input-field"
          placeholder="如：优秀/90分"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">AI基础</label>
          <input
            type="text"
            value={formData.ai_base}
            onChange={(e) => setFormData({ ...formData, ai_base: e.target.value })}
            className="input-field"
            placeholder="如：无/有基础"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">编程基础</label>
          <input
            type="text"
            value={formData.programming_base}
            onChange={(e) => setFormData({ ...formData, programming_base: e.target.value })}
            className="input-field"
            placeholder="如：无/Scratch"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">获奖情况</label>
        <textarea
          value={formData.awards}
          onChange={(e) => setFormData({ ...formData, awards: e.target.value })}
          className="input-field min-h-[60px] resize-none"
          placeholder="请描述相关获奖经历"
        />
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-600">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={18} />
        {saving ? '保存中...' : isEdit ? '保存修改' : '添加学生'}
      </button>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-800">学生管理</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBatchModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={18} />
            批量导入
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            添加学生
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-11 w-full max-w-md"
          placeholder="搜索姓名、学校或用户名..."
        />
      </div>

      {/* Student List */}
      <div className="glass-card rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">姓名</th>
                <th className="pb-3 font-medium">性别</th>
                <th className="pb-3 font-medium">年级</th>
                <th className="pb-3 font-medium">学校</th>
                <th className="pb-3 font-medium">数学成绩</th>
                <th className="pb-3 font-medium">AI基础</th>
                <th className="pb-3 font-medium">编程基础</th>
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <Users className="mx-auto mb-2" size={32} />
                    <p>暂无学生数据</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 text-sm text-slate-600">{student.id}</td>
                    <td className="py-3 text-sm font-medium text-slate-800">{student.name}</td>
                    <td className="py-3 text-sm text-slate-600">
                      {student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'}
                    </td>
                    <td className="py-3 text-sm text-slate-600">{student.grade ? `${student.grade}年级` : '-'}</td>
                    <td className="py-3 text-sm text-slate-600">{student.school || '-'}</td>
                    <td className="py-3 text-sm text-slate-600">{student.math_score || '-'}</td>
                    <td className="py-3 text-sm text-slate-600">{student.ai_base || '-'}</td>
                    <td className="py-3 text-sm text-slate-600">{student.programming_base || '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        student.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {student.status === 'active' ? '正常' : '禁用'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              共 {filteredStudents.length} 条，第 {currentPage}/{totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">添加学生</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>
            {renderStudentForm(handleSubmit, false)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">编辑学生 - {editingStudent.name}</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>
            {renderStudentForm(handleEdit, true)}
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">批量导入</h2>
              <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {/* CSV Upload */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                <FileSpreadsheet size={16} />
                CSV 文件导入
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
              {csvFile && (
                <button
                  onClick={handleCsvUpload}
                  disabled={saving}
                  className="mt-3 w-full btn-primary py-2 text-sm disabled:opacity-50"
                >
                  {saving ? '导入中...' : `导入 ${csvFile.name}`}
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">或</span>
              </div>
            </div>

            {/* Text Paste */}
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                每行输入一个学生，格式：姓名,年级,学校（可选）
              </p>
              <textarea
                value={batchData}
                onChange={(e) => setBatchData(e.target.value)}
                className="input-field min-h-[150px] resize-none"
                placeholder={`张三,3,实验小学\n李四,5,阳光小学\n王五,7`}
              />
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-600 mb-4">
                {success}
              </div>
            )}

            <button
              onClick={handleBatchSubmit}
              disabled={saving || !batchData.trim()}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload size={18} />
              {saving ? '导入中...' : '开始导入'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
