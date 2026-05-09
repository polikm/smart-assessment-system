import { useEffect, useState, useRef, useCallback } from 'react';
import { noticeApi, studentApi } from '../../api/client';
import { Bell, Send, FileText, Check, Users, Eye } from 'lucide-react';
import AdmissionPoster from '../../components/AdmissionPoster';
import { renderPoster, posterTemplates, type PosterData } from '../../utils/posterCanvas';

export default function TeacherNotice() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [customContent, setCustomContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      updatePreview();
      renderPosterPreview();
    }
  }, [selectedTemplate, customContent]);

  const loadData = async () => {
    try {
      const [templatesData, studentsData] = await Promise.all([
        noticeApi.templates(),
        studentApi.list(),
      ]);
      setTemplates(templatesData);
      setStudents(studentsData);
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = () => {
    if (!selectedTemplate) return;
    const content = customContent || selectedTemplate.content;
    setPreviewContent(
      content
        .replace(/\{\{studentName\}\}/g, '张三')
        .replace(/\{\{courseType\}\}/g, '编程')
        .replace(/\{\{level\}\}/g, 'A')
        .replace(/\{\{score\}\}/g, '95')
    );
  };

  const renderPosterPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !selectedTemplate) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 240;
    const displayHeight = 336;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    let designConfig: any = {};
    try {
      if (selectedTemplate.design_config) {
        designConfig = JSON.parse(selectedTemplate.design_config);
      }
    } catch (e) {}

    const previewData: PosterData = {
      studentName: '张三',
      courseTypeName: '编程',
      level: 'A',
      score: 95,
      schoolName: designConfig.schoolName || '未来科技学院',
      date: new Date().toLocaleDateString('zh-CN'),
      phone: designConfig.phone || '400-888-8888',
    };

    renderPoster(canvas, designConfig.templateId || 'academic', previewData);
  }, [selectedTemplate]);

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate || selectedStudents.length === 0) return;

    setSending(true);
    setSent(false);
    try {
      let designConfig: any = {};
      try {
        if (selectedTemplate.design_config) {
          designConfig = JSON.parse(selectedTemplate.design_config);
        }
      } catch (e) {}

      await noticeApi.send({
        template_id: selectedTemplate.id,
        student_ids: selectedStudents,
        custom_content: customContent || undefined,
        notice_data: {
          schoolName: designConfig.schoolName || '未来科技学院',
          phone: designConfig.phone || '400-888-8888',
          templateId: designConfig.templateId || 'academic',
        },
      });
      setSent(true);
      setSelectedStudents([]);
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const getPosterPreviewData = (): PosterData => {
    let designConfig: any = {};
    try {
      if (selectedTemplate?.design_config) {
        designConfig = JSON.parse(selectedTemplate.design_config);
      }
    } catch (e) {}

    return {
      studentName: '张三',
      courseTypeName: '编程',
      level: 'A',
      score: 95,
      schoolName: designConfig.schoolName || '未来科技学院',
      date: new Date().toLocaleDateString('zh-CN'),
      phone: designConfig.phone || '400-888-8888',
    };
  };

  const getPosterTemplateId = (): string => {
    let designConfig: any = {};
    try {
      if (selectedTemplate?.design_config) {
        designConfig = JSON.parse(selectedTemplate.design_config);
      }
    } catch (e) {}
    return designConfig.templateId || 'academic';
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
      <h1 className="text-2xl font-bold text-slate-800">录取通知</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">选择模板</h3>
            <div className="space-y-2">
              {templates.map((template) => {
                let designConfig: any = {};
                try {
                  if (template.design_config) {
                    designConfig = JSON.parse(template.design_config);
                  }
                } catch (e) {}
                const posterTemplate = posterTemplates.find((t) => t.id === designConfig.templateId) || posterTemplates[0];

                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setCustomContent('');
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: posterTemplate.primaryColor + '20' }}
                    >
                      <FileText style={{ color: posterTemplate.primaryColor }} size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{template.name}</p>
                      <p className="text-xs text-slate-500">{posterTemplate.name}风格</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">编辑内容（可选）</h3>
            <textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="input-field min-h-[200px] resize-none"
              placeholder="留空则使用模板默认内容"
            />
            <p className="text-xs text-slate-500 mt-2">
              可用变量：{'{studentName}'}, {'{courseType}'}, {'{level}'}, {'{score}'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">海报预览</h3>
              <button
                onClick={() => setShowPosterPreview(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Eye size={14} />
                放大查看
              </button>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={previewCanvasRef}
                className="rounded-xl shadow-md"
                style={{ width: '240px', height: '336px' }}
              />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">选择学生</h3>
              <button
                onClick={toggleAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedStudents.length === students.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    selectedStudents.includes(student.id)
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                      selectedStudents.includes(student.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedStudents.includes(student.id) && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">
                        {student.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-500">
                        {student.grade}年级 · {student.school || '未知学校'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {sent && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-600">
              <Check size={16} />
              通知发送成功
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || selectedStudents.length === 0}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            {sending ? '发送中...' : `发送通知 (${selectedStudents.length}人)`}
          </button>
        </div>
      </div>

      {showPosterPreview && (
        <AdmissionPoster
          data={getPosterPreviewData()}
          templateId={getPosterTemplateId()}
          onClose={() => setShowPosterPreview(false)}
        />
      )}
    </div>
  );
}
