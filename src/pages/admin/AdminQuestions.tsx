import { useEffect, useState } from 'react';
import { questionApi } from '../../api/client';
import { Plus, X, Save, Trash2, Sparkles, CheckCircle, Search, Eye, Star, Edit3 } from 'lucide-react';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [editRestricted, setEditRestricted] = useState(false);
  const [filter, setFilter] = useState({ course_type: '', grade_range: '', status: '', keyword: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 });
  const [formData, setFormData] = useState({
    course_type: 'math',
    grade_range: '1-3',
    question_type: 'single',
    content: '',
    options: ['', '', '', ''],
    answer: 'A',
    explanation: '',
    knowledge_point: '',
    score: 5,
    difficulty: 3,
  });
  const [aiParams, setAiParams] = useState({
    courseType: 'math',
    grade: 3,
    knowledgePoint: '',
    difficulty: 3,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [filter, pagination.page, pagination.pageSize]);

  const loadQuestions = async () => {
    try {
      const params: Record<string, string> = {
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      };
      if (filter.course_type) params.course_type = filter.course_type;
      if (filter.grade_range) params.grade_range = filter.grade_range;
      if (filter.status) params.status = filter.status;
      if (filter.keyword) params.keyword = filter.keyword;

      const data = await questionApi.list(params);
      setQuestions(data.questions || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: Partial<typeof filter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openEdit = async (q: any) => {
    try {
      const usage = await questionApi.usage(q.id);
      setEditRestricted(usage.used);
      setEditingQuestion(q);
      setFormData({
        course_type: q.course_type,
        grade_range: q.grade_range,
        question_type: q.question_type,
        content: q.content,
        options: JSON.parse(q.options || '[]'),
        answer: q.answer,
        explanation: q.explanation || '',
        knowledge_point: q.knowledge_point || '',
        score: q.score,
        difficulty: q.difficulty,
      });
      setShowEditModal(true);
    } catch (error) {
      console.error(error);
      alert('获取题目使用状态失败');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setSaving(true);
    try {
      await questionApi.update(editingQuestion.id, formData);
      setShowEditModal(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await questionApi.create(formData);
      setShowAddModal(false);
      setFormData({
        course_type: 'math',
        grade_range: '1-3',
        question_type: 'single',
        content: '',
        options: ['', '', '', ''],
        answer: 'A',
        explanation: '',
        knowledge_point: '',
        score: 5,
        difficulty: 3,
      });
      loadQuestions();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await questionApi.aiGenerate(aiParams);
      setShowAiModal(false);
      loadQuestions();
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该题目吗？')) return;
    try {
      await questionApi.delete(id);
      loadQuestions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await questionApi.update(id, { status: 'approved' });
      loadQuestions();
    } catch (error) {
      console.error(error);
    }
  };

  const openPreview = (q: any) => {
    setPreviewQuestion(q);
    setShowPreviewModal(true);
  };

  const renderDifficultyStars = (difficulty: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={14}
            className={i < (difficulty || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
          />
        ))}
      </div>
    );
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: '待审核', color: 'bg-amber-100 text-amber-600' },
    approved: { text: '已通过', color: 'bg-emerald-100 text-emerald-600' },
    rejected: { text: '已拒绝', color: 'bg-red-100 text-red-600' },
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-800">题库管理</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowAiModal(true)} className="btn-secondary flex items-center gap-2">
            <Sparkles size={18} />
            AI出题
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            添加题目
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={filter.keyword}
              onChange={(e) => handleFilterChange({ keyword: e.target.value })}
              className="input-field pl-10 text-sm"
              placeholder="搜索题目内容或知识点"
            />
          </div>
          <select
            value={filter.course_type}
            onChange={(e) => handleFilterChange({ course_type: e.target.value })}
            className="input-field w-auto text-sm"
          >
            <option value="">全部课程</option>
            <option value="math">数理逻辑</option>
            <option value="aigc">AIGC素养</option>
            <option value="scratch">Scratch</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
          <select
            value={filter.grade_range}
            onChange={(e) => handleFilterChange({ grade_range: e.target.value })}
            className="input-field w-auto text-sm"
          >
            <option value="">全部年级</option>
            <option value="1-3">1-3年级</option>
            <option value="4-6">4-6年级</option>
            <option value="7-9">7-9年级</option>
          </select>
          <select
            value={filter.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="input-field w-auto text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">题目内容</th>
                <th className="pb-3 font-medium">课程</th>
                <th className="pb-3 font-medium">年级</th>
                <th className="pb-3 font-medium">知识点</th>
                <th className="pb-3 font-medium">分值</th>
                <th className="pb-3 font-medium">难度</th>
                <th className="pb-3 font-medium">出现次数</th>
                <th className="pb-3 font-medium">正确率</th>
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <p>暂无题目数据</p>
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 text-sm text-slate-600">{q.id}</td>
                    <td className="py-3 text-sm text-slate-800 max-w-xs truncate">{q.content}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        q.course_type === 'aigc' ? 'bg-purple-100 text-purple-600' : q.course_type === 'scratch' ? 'bg-amber-100 text-amber-600' : q.course_type === 'python' ? 'bg-blue-100 text-blue-600' : q.course_type === 'cpp' ? 'bg-emerald-100 text-emerald-600' : q.course_type === 'math' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {q.course_type === 'aigc' ? 'AIGC' : q.course_type === 'scratch' ? 'Scratch' : q.course_type === 'python' ? 'Python' : q.course_type === 'cpp' ? 'C++' : q.course_type === 'math' ? '数理' : q.course_type}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-600">{q.grade_range}</td>
                    <td className="py-3 text-sm text-slate-600">{q.knowledge_point || '-'}</td>
                    <td className="py-3 text-sm text-slate-600">{q.score}</td>
                    <td className="py-3">{renderDifficultyStars(q.difficulty)}</td>
                    <td className="py-3 text-sm text-slate-600">{q.usage_count || 0}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${q.correct_rate || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{q.correct_rate || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusLabels[q.status]?.color || 'bg-slate-100'}`}>
                        {statusLabels[q.status]?.text || q.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openPreview(q)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="预览"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEdit(q)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit3 size={16} />
                        </button>
                        {q.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(q.id)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="通过"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(q.id)}
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
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            共 {pagination.total} 条，第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize) || 1} 页
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">题目预览</h2>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  previewQuestion.course_type === 'aigc' ? 'bg-purple-100 text-purple-600' : previewQuestion.course_type === 'scratch' ? 'bg-amber-100 text-amber-600' : previewQuestion.course_type === 'python' ? 'bg-blue-100 text-blue-600' : previewQuestion.course_type === 'cpp' ? 'bg-emerald-100 text-emerald-600' : previewQuestion.course_type === 'math' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {previewQuestion.course_type === 'aigc' ? 'AIGC' : previewQuestion.course_type === 'scratch' ? 'Scratch' : previewQuestion.course_type === 'python' ? 'Python' : previewQuestion.course_type === 'cpp' ? 'C++' : previewQuestion.course_type === 'math' ? '数理' : previewQuestion.course_type}
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{previewQuestion.grade_range}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-medium">{previewQuestion.score}分</span>
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                  难度: {renderDifficultyStars(previewQuestion.difficulty)}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-sm font-bold text-slate-700 mb-1">题干</p>
                <p className="text-sm text-slate-800">{previewQuestion.content}</p>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">选项</p>
                <div className="space-y-2">
                  {JSON.parse(previewQuestion.options || '[]').map((opt: string, idx: number) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${
                      String.fromCharCode(65 + idx) === previewQuestion.answer ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'
                    }`}>
                      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                        String.fromCharCode(65 + idx) === previewQuestion.answer ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm text-slate-700">{opt}</span>
                      {String.fromCharCode(65 + idx) === previewQuestion.answer && (
                        <span className="ml-auto text-xs font-bold text-emerald-600">正确答案</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {previewQuestion.explanation && (
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <p className="text-sm font-bold text-blue-700 mb-1">解析</p>
                  <p className="text-sm text-blue-800">{previewQuestion.explanation}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">知识点</p>
                  <p className="text-sm font-medium text-slate-700">{previewQuestion.knowledge_point || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">状态</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusLabels[previewQuestion.status]?.color || 'bg-slate-100'}`}>
                    {statusLabels[previewQuestion.status]?.text || previewQuestion.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">添加题目</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">课程类型</label>
                  <select
                    value={formData.course_type}
                    onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                    className="input-field"
                  >
                    <option value="math">数理逻辑</option>
                    <option value="aigc">AIGC素养</option>
                    <option value="scratch">Scratch</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">年级范围</label>
                  <select
                    value={formData.grade_range}
                    onChange={(e) => setFormData({ ...formData, grade_range: e.target.value })}
                    className="input-field"
                  >
                    <option value="1-3">1-3年级</option>
                    <option value="4-6">4-6年级</option>
                    <option value="7-9">7-9年级</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">题目内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">选项</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 w-6">{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[idx] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      className="input-field flex-1"
                      placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">正确答案</label>
                  <select
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    className="input-field"
                  >
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">分值</label>
                  <select
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    <option value={5}>基础 5分</option>
                    <option value={10}>进阶 10分</option>
                    <option value={15}>挑战 15分</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">难度</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>{d}星</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">解析</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">知识点</label>
                <input
                  type="text"
                  value={formData.knowledge_point}
                  onChange={(e) => setFormData({ ...formData, knowledge_point: e.target.value })}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">编辑题目</h2>
              <button onClick={() => { setShowEditModal(false); setEditingQuestion(null); }} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {editRestricted && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700">
                  该题目已被使用，仅允许修改题干、解析、知识点、难度和状态
                </p>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">课程类型</label>
                  <select
                    value={formData.course_type}
                    onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                    className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={editRestricted}
                  >
                    <option value="math">数理逻辑</option>
                    <option value="aigc">AIGC素养</option>
                    <option value="scratch">Scratch</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">年级范围</label>
                  <select
                    value={formData.grade_range}
                    onChange={(e) => setFormData({ ...formData, grade_range: e.target.value })}
                    className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={editRestricted}
                  >
                    <option value="1-3">1-3年级</option>
                    <option value="4-6">4-6年级</option>
                    <option value="7-9">7-9年级</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">题目内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">选项</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 w-6">{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[idx] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      className="input-field flex-1 disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                      disabled={editRestricted}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">正确答案</label>
                  <select
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={editRestricted}
                  >
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">分值</label>
                  <select
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                    className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={editRestricted}
                  >
                    <option value={5}>基础 5分</option>
                    <option value={10}>进阶 10分</option>
                    <option value={15}>挑战 15分</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">难度</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>{d}星</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">解析</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">知识点</label>
                <input
                  type="text"
                  value={formData.knowledge_point}
                  onChange={(e) => setFormData({ ...formData, knowledge_point: e.target.value })}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">AI出题</h2>
              <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">课程类型</label>
                <select
                  value={aiParams.courseType}
                  onChange={(e) => setAiParams({ ...aiParams, courseType: e.target.value })}
                  className="input-field"
                >
                  <option value="math">数理逻辑</option>
                  <option value="aigc">AIGC素养</option>
                  <option value="scratch">Scratch</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">年级</label>
                <select
                  value={aiParams.grade}
                  onChange={(e) => setAiParams({ ...aiParams, grade: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>{g}年级</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">知识点</label>
                <input
                  type="text"
                  value={aiParams.knowledgePoint}
                  onChange={(e) => setAiParams({ ...aiParams, knowledgePoint: e.target.value })}
                  className="input-field"
                  placeholder="如：AI绘画基础"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">难度 (1-5)</label>
                <input
                  type="range"
                  value={aiParams.difficulty}
                  onChange={(e) => setAiParams({ ...aiParams, difficulty: parseInt(e.target.value) })}
                  className="w-full"
                  min={1}
                  max={5}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>简单</span>
                  <span>困难</span>
                </div>
              </div>

              <button
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={18} />
                {aiLoading ? '生成中...' : 'AI生成题目'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
