import { useState, useEffect } from 'react';
import { noticeApi } from '../../api/client';
import PageHeader from '../../components/PageHeader';
import StatCards from '../../components/StatCards';
import { useTheme } from '../../components/ThemeProvider';
import { formatDate } from '../../utils/dateFormat';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Bell, Send, FileText, Plus, Search, Edit, Trash2, Eye, BarChart3, TrendingUp, CheckCircle, Mail, X, Save } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

export default function AdminNotices() {
  const { isDark } = useTheme();
  const [templates, setTemplates] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'records' | 'stats'>('templates');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [viewingTemplate, setViewingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'system',
    content: '',
    variables: '[]',
    design_config: '{}',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, noticesData] = await Promise.all([
        noticeApi.templates(),
        noticeApi.list(),
      ]);
      setTemplates(templatesData);
      setNotices(noticesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', type: 'system', content: '', variables: '[]', design_config: '{}' });
    setTemplateModalOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name || '',
      type: template.type || 'system',
      content: template.content || '',
      variables: typeof template.variables === 'string' ? template.variables : JSON.stringify(template.variables || []),
      design_config: typeof template.design_config === 'string' ? template.design_config : JSON.stringify(template.design_config || {}),
    });
    setTemplateModalOpen(true);
  };

  const handleViewTemplate = (template: any) => {
    setViewingTemplate(template);
    setViewModalOpen(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await noticeApi.deleteTemplate(id);
      loadData();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...templateForm,
        variables: JSON.parse(templateForm.variables || '[]'),
        design_config: JSON.parse(templateForm.design_config || '{}'),
      };
      if (editingTemplate) {
        await noticeApi.updateTemplate(editingTemplate.id, data);
      } else {
        await noticeApi.createTemplate(data);
      }
      setTemplateModalOpen(false);
      loadData();
    } catch (error) {
      alert('保存失败，请检查JSON格式');
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { title: '模板总数', value: templates.length, icon: FileText, color: 'bg-blue-500' },
    { title: '已发送通知', value: notices.length, icon: Send, color: 'bg-green-500' },
    { title: '未读通知', value: notices.filter((n) => !n.is_read).length, icon: Bell, color: 'bg-amber-500' },
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
      <PageHeader title="通知管理" description="管理通知模板、发送记录和通知统计">
        <button onClick={handleCreateTemplate} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新建模板
        </button>
      </PageHeader>

      <StatCards cards={statCards} />

      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          {[
            { key: 'templates', label: '模板配置' },
            { key: 'records', label: '发送记录' },
            { key: 'stats', label: '通知统计' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'templates' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">模板名称</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">类型</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className="px-4 py-3 text-sm font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-sm">{t.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleViewTemplate(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye size={16} /></button>
                          <button onClick={() => handleEditTemplate(t)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">接收人</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">内容</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">状态</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">发送时间</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className="px-4 py-3 text-sm">{n.student_name || '未知'}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{n.content}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${n.is_read ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {n.is_read ? '已读' : '未读'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{n.sent_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={16} className="text-blue-500" />
                    <span className="text-sm text-slate-500">总通知数</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{notices.length}</p>
                </div>
                <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="text-sm text-slate-500">已读</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{notices.filter(n => n.is_read).length}</p>
                </div>
                <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bell size={16} className="text-amber-500" />
                    <span className="text-sm text-slate-500">未读</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{notices.filter(n => !n.is_read).length}</p>
                </div>
                <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-purple-500" />
                    <span className="text-sm text-slate-500">已读率</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {notices.length > 0 ? Math.round((notices.filter(n => n.is_read).length / notices.length) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-700' : 'bg-white border border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={18} className="text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-800">通知发送趋势（近7天）</h3>
                  </div>
                  {(() => {
                    const dateMap: Record<string, number> = {};
                    notices.forEach(n => {
                      const date = formatDate(n.sent_at);
                      dateMap[date] = (dateMap[date] || 0) + 1;
                    });
                    const sortedDates = Object.keys(dateMap).sort().slice(-7);
                    return (
                      <div className="h-48">
                        <Bar
                          data={{
                            labels: sortedDates,
                            datasets: [{
                              label: '发送数量',
                              data: sortedDates.map(d => dateMap[d] || 0),
                              backgroundColor: '#3b82f6',
                              borderRadius: 6,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>

                <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-700' : 'bg-white border border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-800">已读/未读分布</h3>
                  </div>
                  <div className="h-48 flex items-center justify-center">
                    <Doughnut
                      data={{
                        labels: ['已读', '未读'],
                        datasets: [{
                          data: [
                            notices.filter(n => n.is_read).length,
                            notices.filter(n => !n.is_read).length,
                          ],
                          backgroundColor: ['#22c55e', '#f59e0b'],
                          borderWidth: 0,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-700' : 'bg-white border border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-purple-500" />
                  <h3 className="text-sm font-bold text-slate-800">模板使用统计</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
                        <th className="text-left px-4 py-2 text-sm font-medium text-slate-500">模板名称</th>
                        <th className="text-left px-4 py-2 text-sm font-medium text-slate-500">使用次数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map(t => {
                        const count = notices.filter(n => n.template_id === t.id).length;
                        return (
                          <tr key={t.id} className={`border-b ${isDark ? 'border-slate-600' : 'border-slate-100'}`}>
                            <td className="px-4 py-2 text-sm">{t.name}</td>
                            <td className="px-4 py-2 text-sm font-medium">{count}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {editingTemplate ? '编辑模板' : '新建模板'}
            </h2>
            <form onSubmit={handleSubmitTemplate} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>模板名称</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="input-field"
                  placeholder="请输入模板名称"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>类型</label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="system">系统通知</option>
                  <option value="exam">测评通知</option>
                  <option value="course">课程通知</option>
                  <option value="reminder">提醒通知</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>内容</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="请输入模板内容，可用变量如 {{student_name}}"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>变量 (JSON数组)</label>
                <input
                  type="text"
                  value={templateForm.variables}
                  onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                  className="input-field"
                  placeholder='["student_name", "exam_name"]'
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTemplateModalOpen(false)} className="flex-1 btn-secondary py-2.5">取消</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {viewModalOpen && viewingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>模板详情</h2>
              <button onClick={() => setViewModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500">模板名称</span>
                <p className="text-sm font-medium text-slate-800">{viewingTemplate.name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">类型</span>
                <p className="text-sm font-medium text-slate-800">{viewingTemplate.type}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">内容</span>
                <div className={`p-3 rounded-xl text-sm mt-1 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                  {viewingTemplate.content}
                </div>
              </div>
              {viewingTemplate.variables && (
                <div>
                  <span className="text-xs text-slate-500">变量</span>
                  <p className="text-sm text-slate-600">{typeof viewingTemplate.variables === 'string' ? viewingTemplate.variables : JSON.stringify(viewingTemplate.variables)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
