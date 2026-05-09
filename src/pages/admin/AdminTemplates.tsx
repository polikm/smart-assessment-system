import { useEffect, useState, useRef, useCallback } from 'react';
import { noticeApi } from '../../api/client';
import { FileText, Plus, X, Save, Trash2, Eye, Palette } from 'lucide-react';
import { renderPoster, posterTemplates, type PosterData } from '../../utils/posterCanvas';

const defaultPreviewData: PosterData = {
  studentName: '张三',
  courseTypeName: '编程',
  level: 'A',
  score: 95,
  schoolName: '未来科技学院',
  date: new Date().toLocaleDateString('zh-CN'),
  phone: '400-888-8888',
};

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'admission',
    content: '',
    variables: [] as string[],
    design_config: {
      templateId: 'academic',
      schoolName: '未来科技学院',
      phone: '400-888-8888',
    },
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    renderPreview();
  }, [formData.design_config]);

  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 280;
    const displayHeight = 392;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const previewData = {
      ...defaultPreviewData,
      schoolName: formData.design_config.schoolName,
      phone: formData.design_config.phone,
    };

    renderPoster(canvas, formData.design_config.templateId, previewData);
  }, [formData.design_config]);

  const loadTemplates = async () => {
    try {
      const data = await noticeApi.templates();
      setTemplates(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        variables: ['studentName', 'courseType', 'level', 'score'],
      };
      if (editingTemplate) {
        await noticeApi.updateTemplate(editingTemplate.id, payload);
      } else {
        await noticeApi.createTemplate(payload);
      }
      setShowAddModal(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'admission',
      content: '',
      variables: [],
      design_config: {
        templateId: 'academic',
        schoolName: '未来科技学院',
        phone: '400-888-8888',
      },
    });
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    let designConfig = {
      templateId: 'academic',
      schoolName: '未来科技学院',
      phone: '400-888-8888',
    };
    if (template.design_config) {
      try {
        designConfig = { ...designConfig, ...JSON.parse(template.design_config) };
      } catch (e) {}
    }
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      variables: template.variables ? JSON.parse(template.variables) : [],
      design_config: designConfig,
    });
    setShowAddModal(true);
  };

  const updateDesignConfig = (key: string, value: string) => {
    setFormData({
      ...formData,
      design_config: { ...formData.design_config, [key]: value },
    });
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">录取通知书模板配置</h1>
        <button
          onClick={() => {
            setEditingTemplate(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          添加模板
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          let designConfig: any = {};
          try {
            if (template.design_config) {
              designConfig = JSON.parse(template.design_config);
            }
          } catch (e) {}
          const posterTemplate = posterTemplates.find((t) => t.id === designConfig.templateId) || posterTemplates[0];

          return (
            <div key={template.id} className="glass-card glass-card-hover rounded-3xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: posterTemplate.primaryColor + '20' }}>
                  <FileText style={{ color: posterTemplate.primaryColor }} size={20} />
                </div>
                <button
                  onClick={() => handleEdit(template)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  编辑
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{template.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: posterTemplate.primaryColor }} />
                <span className="text-xs text-slate-500">{posterTemplate.name}风格</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">类型：{template.type}</p>
              <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 whitespace-pre-line line-clamp-4">
                {template.content}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTemplate ? '编辑模板' : '添加模板'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">模板名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">海报风格</label>
                  <div className="grid grid-cols-3 gap-2">
                    {posterTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateDesignConfig('templateId', t.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          formData.design_config.templateId === t.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full mx-auto mb-1"
                          style={{ backgroundColor: t.primaryColor }}
                        />
                        <span className="text-xs font-medium text-slate-700">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">学校名称</label>
                  <input
                    type="text"
                    value={formData.design_config.schoolName}
                    onChange={(e) => updateDesignConfig('schoolName', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                  <input
                    type="text"
                    value={formData.design_config.phone}
                    onChange={(e) => updateDesignConfig('phone', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">模板内容（用于文本通知）</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input-field min-h-[120px] resize-none"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    可用变量：{'{studentName}'}, {'{courseType}'}, {'{level}'}, {'{score}'}
                  </p>
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

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={18} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700">海报预览</h3>
                </div>
                <div className="flex justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="rounded-xl shadow-lg"
                    style={{ width: '280px', height: '392px' }}
                  />
                </div>
                <p className="text-xs text-slate-400 text-center">
                  预览数据为示例，实际下发时会替换为学生真实数据
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
