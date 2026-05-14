import { useState, useEffect } from 'react';
import { faqApi } from '../../api/client';
import { useTheme } from '../../components/ThemeProvider';
import PageHeader from '../../components/PageHeader';
import StatCards from '../../components/StatCards';
import {
  BookOpen, Plus, Search, Trash2, Edit, Eye, ChevronDown, ChevronUp, Tag, HelpCircle
} from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string;
  status: string;
  created_at: string;
}

const categoryMap: Record<string, string> = {
  general: '通用',
  exam: '测评相关',
  course: '课程相关',
  account: '账户相关',
  technical: '技术问题',
};

export default function AdminKnowledgeBase() {
  const { isDark } = useTheme();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    tags: '',
    status: 'active',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqList, catList] = await Promise.all([
        faqApi.list({ status: 'all' } as any),
        faqApi.categories(),
      ]);
      setFaqs(faqList);
      setCategories(catList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个FAQ吗？')) return;
    try {
      await faqApi.delete(id);
      loadData();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await faqApi.update(editingFaq.id, formData);
      } else {
        await faqApi.create(formData);
      }
      setShowModal(false);
      setEditingFaq(null);
      setFormData({ question: '', answer: '', category: 'general', tags: '', status: 'active' });
      loadData();
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'general',
      tags: faq.tags || '',
      status: faq.status || 'active',
    });
    setShowModal(true);
  };

  const filteredFaqs = faqs.filter((f) => {
    const matchSearch = !searchQuery ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !activeCategory || f.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const statCards = [
    { title: 'FAQ总数', value: faqs.length, icon: BookOpen, color: 'bg-blue-500' },
    { title: '已启用', value: faqs.filter((f) => f.status === 'active').length, icon: HelpCircle, color: 'bg-green-500' },
    { title: '分类数', value: categories.length, icon: Tag, color: 'bg-purple-500' },
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
      <PageHeader title="知识库管理" description="管理FAQ问答知识库，帮助学生快速找到答案">
        <button
          onClick={() => { setEditingFaq(null); setFormData({ question: '', answer: '', category: 'general', tags: '', status: 'active' }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增FAQ
        </button>
      </PageHeader>

      <StatCards cards={statCards} />

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !activeCategory
              ? 'bg-blue-600 text-white'
              : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat.category
                ? 'bg-blue-600 text-white'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {categoryMap[cat.category] || cat.category} ({cat.count})
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索问题或答案..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* FAQ列表 */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => (
          <div
            key={faq.id}
            className={`rounded-2xl border transition-all ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <button
              onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                faq.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <HelpCircle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {faq.question}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    faq.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {faq.status === 'active' ? '启用' : '停用'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {categoryMap[faq.category] || faq.category}
                  </span>
                  {faq.tags && faq.tags.split(',').map((tag) => (
                    <span key={tag} className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(faq); }}
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(faq.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={14} />
                </button>
                {expandedId === faq.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </div>
            </button>

            {expandedId === faq.id && (
              <div className={`px-4 pb-4 pt-0 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className={`p-4 rounded-xl text-sm leading-relaxed ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className={`text-center py-12 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <HelpCircle size={48} className="mx-auto text-slate-300 mb-3" />
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>暂无FAQ记录</p>
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {editingFaq ? '编辑FAQ' : '新增FAQ'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>问题</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="input-field"
                  placeholder="请输入问题"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>答案</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="请输入答案"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="general">通用</option>
                    <option value="exam">测评相关</option>
                    <option value="course">课程相关</option>
                    <option value="account">账户相关</option>
                    <option value="technical">技术问题</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>标签</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input-field"
                    placeholder="用逗号分隔"
                  />
                </div>
              </div>
              {editingFaq && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>状态</label>
                  <select
                    value={formData.status || editingFaq.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary py-2.5">取消</button>
                <button type="submit" className="flex-1 btn-primary py-2.5">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
