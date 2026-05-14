import { useEffect, useState, useCallback } from 'react';
import { configApi, apiFetch, knowledgeApi, faqApi } from '../../api/client';
import {
  Cpu, Save, Check, X, Activity, Clock, Zap,
  FileText, Brain, Shield, TrendingUp, Edit3,
  Bot, Puzzle, Lightbulb, ChevronRight, Sliders,
  MessageSquare, BarChart3, X as XIcon, Filter,
  BookOpen, GraduationCap, Award, Database,
  PieChart, TrendingUp as TrendingUpIcon, Users,
  Eye, AlertCircle, Copy, CheckCircle,
  Plus, Search, Trash2, Edit, HelpCircle, Tag, ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateFormat';
import { useTheme } from '../../components/ThemeProvider';

interface AIConfig {
  ai_api_key: string;
  ai_api_endpoint: string;
  ai_model: string;
  ai_enabled_features: string;
  ai_agents_config: string;
}

interface AIAgent {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface AIAgentsConfig {
  agents: AIAgent[];
}

interface AILog {
  id: number;
  feature: string;
  status: string;
  input_summary: string;
  output_summary: string;
  duration_ms: number;
  errorMessage: string;
  input_full: string;
  output_full: string;
  context_data: string;
  created_at: string;
}

interface AIStats {
  today: { count: number; avgDuration: number };
  overall: { total: number; success: number; rate: number };
  byFeature: Array<{ feature: string; count: number; success: number }>;
}

const agentIcons: Record<string, React.ReactNode> = {
  report_analysis: <FileText size={20} />,
  question_generate: <Brain size={20} />,
  question_review: <Shield size={20} />,
  exam_assemble: <Puzzle size={20} />,
  course_recommend: <Lightbulb size={20} />,
};

const agentColors: Record<string, { bg: string; text: string; border: string }> = {
  report_analysis: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  question_generate: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  question_review: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  exam_assemble: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  course_recommend: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
};

function getDefaultAgents(): AIAgent[] {
  return [
    {
      key: 'report_analysis',
      name: '测评报告AI分析',
      description: '根据测评结果生成个性化分析报告',
      enabled: true,
      systemPrompt: '你是一位资深的教育评估专家，擅长根据学生的测评结果和个人信息提供专业的分析报告。请以JSON格式返回分析结果。',
      temperature: 0.7,
      maxTokens: 2000,
    },
    {
      key: 'question_generate',
      name: 'AI智能出题',
      description: '根据知识点自动生成题目',
      enabled: true,
      systemPrompt: '你是一个专业的教育题目生成助手。请根据要求生成结构化的测评题目，以JSON格式返回。',
      temperature: 0.7,
      maxTokens: 2000,
    },
    {
      key: 'question_review',
      name: 'AI题目审核',
      description: '审核题目质量和准确性',
      enabled: true,
      systemPrompt: '你是一个专业的教育题目审核助手。请审核题目质量，检查准确性、选项合理性、答案正确性。以JSON格式返回审核结果。',
      temperature: 0.7,
      maxTokens: 2000,
    },
    {
      key: 'exam_assemble',
      name: '智能组卷',
      description: '根据知识点和难度智能组合试卷',
      enabled: false,
      systemPrompt: '你是一位资深的试卷组卷专家。请根据给定的知识点、难度分布和题目数量要求，从题库中选择最合适的题目组合成一套试卷。',
      temperature: 0.5,
      maxTokens: 4000,
    },
    {
      key: 'course_recommend',
      name: '智能推荐',
      description: '根据测评结果智能推荐课程',
      enabled: true,
      systemPrompt: '你是资深教育顾问，根据学生测评结果从机构课程库中推荐最适合的课程。必须严格从提供的课程列表中选择，禁止推荐不存在的课程。以JSON格式返回。',
      temperature: 0.7,
      maxTokens: 2000,
    },
  ];
}

export default function AdminAIConfig() {
  const [config, setConfig] = useState<AIConfig>({
    ai_api_key: '',
    ai_api_endpoint: 'https://api.longcat.chat/openai/v1/chat/completions',
    ai_model: 'LongCat-Flash-Chat',
    ai_enabled_features: JSON.stringify({ report_analysis: true, question_generate: true, question_review: true, course_recommend: true }),
    ai_agents_config: '',
  });
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [logFilter, setLogFilter] = useState<string>('');
  const [stats, setStats] = useState<AIStats>({
    today: { count: 0, avgDuration: 0 },
    overall: { total: 0, success: 0, rate: 0 },
    byFeature: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'agents' | 'logs' | 'knowledge'>('config');
  const [isEditing, setIsEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);

  // Log Detail Modal State
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Knowledge Base State
  const [knowledgeOverview, setKnowledgeOverview] = useState<any>(null);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseType, setSelectedCourseType] = useState<string>('scratch');
  const [selectedGradeRange, setSelectedGradeRange] = useState<string>('1-3');
  const [knowledgeTab, setKnowledgeTab] = useState<'overview' | 'dimensions' | 'courses' | 'faq'>('overview');

  // FAQ State (from AdminKnowledgeBase)
  const { isDark } = useTheme();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqCategories, setFaqCategories] = useState<any[]>([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('');
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general', tags: '', status: 'active' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configData, logsData, statsData, overviewData, dimData, courseData] = await Promise.all([
        configApi.get(),
        apiFetch('/ai-logs'),
        apiFetch('/ai-logs/stats'),
        knowledgeApi.overview(),
        knowledgeApi.dimensions(),
        knowledgeApi.courses(),
      ]);

      setConfig({
        ai_api_key: configData.ai_api_key || '',
        ai_api_endpoint: configData.ai_api_endpoint || 'https://api.longcat.chat/openai/v1/chat/completions',
        ai_model: configData.ai_model || 'LongCat-Flash-Chat',
        ai_enabled_features: configData.ai_enabled_features || JSON.stringify({ report_analysis: true, question_generate: true, question_review: true, course_recommend: true }),
        ai_agents_config: configData.ai_agents_config || '',
      });

      // 解析智能体配置
      let parsedAgents: AIAgent[] = [];
      try {
        if (configData.ai_agents_config) {
          const agentsConfig: AIAgentsConfig = JSON.parse(configData.ai_agents_config);
          parsedAgents = agentsConfig.agents || [];
        }
      } catch (e) {
        console.error('Failed to parse ai_agents_config:', e);
      }

      // 如果数据库没有智能体配置，使用默认配置
      if (parsedAgents.length === 0) {
        parsedAgents = getDefaultAgents();
      }
      setAgents(parsedAgents);

      setLogs(logsData?.logs || []);
      setStats(statsData || {
        today: { count: 0, avgDuration: 0 },
        overall: { total: 0, success: 0, rate: 0 },
        byFeature: [],
      });

      // Knowledge Base
      setKnowledgeOverview(overviewData);
      setDimensions(dimData || []);
      setCourses(courseData || []);

      // FAQ (from AdminKnowledgeBase)
      const [faqList, catList] = await Promise.all([
        faqApi.list({ status: 'all' } as any),
        faqApi.categories(),
      ]);
      setFaqs(faqList);
      setFaqCategories(catList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // FAQ handlers
  const loadFaqs = async () => {
    try {
      const [faqList, catList] = await Promise.all([
        faqApi.list({ status: 'all' } as any),
        faqApi.categories(),
      ]);
      setFaqs(faqList);
      setFaqCategories(catList);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('确定要删除这个FAQ吗？')) return;
    try {
      await faqApi.delete(id);
      loadFaqs();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleSubmitFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await faqApi.update(editingFaq.id, faqForm);
      } else {
        await faqApi.create(faqForm);
      }
      setFaqModalOpen(false);
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', category: 'general', tags: '', status: 'active' });
      loadFaqs();
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleEditFaq = (faq: any) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'general',
      tags: faq.tags || '',
      status: faq.status || 'active',
    });
    setFaqModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await configApi.update({
        ai_api_key: config.ai_api_key,
        ai_api_endpoint: config.ai_api_endpoint,
        ai_model: config.ai_model,
        ai_enabled_features: config.ai_enabled_features,
        ai_agents_config: JSON.stringify({ agents }),
      });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadData();
  };

  const toggleAgent = (key: string) => {
    setAgents(prev => prev.map(agent =>
      agent.key === key ? { ...agent, enabled: !agent.enabled } : agent
    ));
  };

  const openAgentDrawer = (agent: AIAgent) => {
    setSelectedAgent({ ...agent });
    setDrawerOpen(true);
    setDrawerEditing(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedAgent(null);
    setDrawerEditing(false);
  };

  const saveAgentConfig = async () => {
    if (!selectedAgent) return;
    setDrawerSaving(true);
    try {
      const updatedAgents = agents.map(a =>
        a.key === selectedAgent.key ? selectedAgent : a
      );
      setAgents(updatedAgents);
      await configApi.update({
        ai_agents_config: JSON.stringify({ agents: updatedAgents }),
      });
      setDrawerEditing(false);
    } catch (error) {
      console.error(error);
      alert('保存智能体配置失败');
    } finally {
      setDrawerSaving(false);
    }
  };

  const getFeatureStatusColor = (feature: string) => {
    const stat = stats?.byFeature?.find(f => f.feature === feature);
    if (!stat) return 'text-slate-400';
    const rate = stat.count > 0 ? Math.round((stat.success / stat.count) * 100) : 0;
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getAgentStats = (key: string) => {
    const stat = stats?.byFeature?.find(f => f.feature === key);
    if (!stat) return { count: 0, success: 0, rate: 0 };
    return {
      count: stat.count,
      success: stat.success,
      rate: stat.count > 0 ? Math.round((stat.success / stat.count) * 100) : 0,
    };
  };

  const filteredLogs = logFilter
    ? logs.filter(log => log.feature === logFilter)
    : logs;

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
        <h1 className="text-2xl font-bold text-slate-800">AI模型配置</h1>
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'config' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                配置
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'agents' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                智能体管理
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'knowledge' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                知识库
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'logs' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                使用记录
              </button>
            </div>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Zap className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.today.count}</p>
                    <p className="text-xs text-slate-500">今日调用次数</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.overall.rate}%</p>
                    <p className="text-xs text-slate-500">总体成功率</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.today.avgDuration}ms</p>
                    <p className="text-xs text-slate-500">今日平均响应</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Base Config */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Cpu className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">AI基础配置</h2>
                  <p className="text-sm text-slate-500">配置AI服务的连接参数</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  <Edit3 size={16} />
                  修改配置
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={config.ai_api_key}
                  onChange={(e) => setConfig({ ...config, ai_api_key: e.target.value })}
                  className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="输入AI API Key"
                  disabled={!isEditing}
                />
                <p className="text-xs text-slate-400 mt-1">留空则使用环境变量 AI_API_KEY</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint</label>
                <input
                  type="text"
                  value={config.ai_api_endpoint}
                  onChange={(e) => setConfig({ ...config, ai_api_endpoint: e.target.value })}
                  className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="https://api.example.com/v1/chat/completions"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">模型名称</label>
                <input
                  type="text"
                  value={config.ai_model}
                  onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                  className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="如：gpt-4, LongCat-Flash-Chat"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saved ? <Check size={18} /> : <Save size={18} />}
                {saving ? '保存中...' : saved ? '已保存' : '保存配置'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const colors = agentColors[agent.key] || agentColors.report_analysis;
              const agentStat = getAgentStats(agent.key);

              return (
                <div
                  key={agent.key}
                  onClick={() => openAgentDrawer(agent)}
                  className={`glass-card rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all border-2 ${
                    agent.enabled ? colors.border : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${agent.enabled ? colors.bg : 'bg-slate-100'} rounded-xl flex items-center justify-center`}>
                        <span className={agent.enabled ? colors.text : 'text-slate-400'}>
                          {agentIcons[agent.key] || <Bot size={20} />}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">{agent.name}</h3>
                        <p className="text-xs text-slate-500">{agent.description}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      agent.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {agent.enabled ? '已启用' : '已禁用'}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 size={12} />
                        {agentStat.count} 次调用
                      </span>
                      {agentStat.count > 0 && (
                        <span className={`flex items-center gap-1 ${getFeatureStatusColor(agent.key)}`}>
                          <TrendingUp size={12} />
                          {agentStat.rate}% 成功率
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Overview Stats */}
          {knowledgeOverview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Award className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{knowledgeOverview.dimensions || 0}</p>
                    <p className="text-xs text-slate-500">测评维度</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{knowledgeOverview.courses || 0}</p>
                    <p className="text-xs text-slate-500">课程知识</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Users className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{knowledgeOverview.students || 0}</p>
                    <p className="text-xs text-slate-500">学生画像</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Database className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{knowledgeOverview.questions || 0}</p>
                    <p className="text-xs text-slate-500">关联题目</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Tab Navigation */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setKnowledgeTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                knowledgeTab === 'overview' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setKnowledgeTab('dimensions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                knowledgeTab === 'dimensions' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
            >
              测评维度
            </button>
            <button
              onClick={() => setKnowledgeTab('courses')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                knowledgeTab === 'courses' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
            >
              课程知识
            </button>
            <button
              onClick={() => setKnowledgeTab('faq')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                knowledgeTab === 'faq' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
            >
              FAQ知识库
            </button>
          </div>

          {/* Dimension Content */}
          {knowledgeTab === 'dimensions' && (
            <div className="space-y-4">
              <div className="glass-card rounded-3xl p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">测评维度列表</h2>
                <div className="space-y-3">
                  {['cognitive', 'skill', 'quality'].map(category => (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-600 mb-3 capitalize">
                        {category === 'cognitive' ? '认知能力' : category === 'skill' ? '技能能力' : '综合素养'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dimensions
                          .filter(d => d.category === category)
                          .map(dim => (
                            <div key={dim.id} className="bg-slate-50 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-slate-800">{dim.name}</p>
                                  <p className="text-xs text-slate-500">{dim.description || ''}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  dim.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {dim.is_system ? '系统' : '自定义'}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Courses Content */}
          {knowledgeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <option value="scratch">Scratch图形化</option>
                  <option value="python">Python编程</option>
                  <option value="cpp">C++算法</option>
                  <option value="aigc">AIGC素养</option>
                  <option value="math">数理逻辑</option>
                </select>
                <select
                  value={selectedGradeRange}
                  onChange={(e) => setSelectedGradeRange(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <option value="1-3">1-3年级</option>
                  <option value="4-6">4-6年级</option>
                  <option value="7-9">7-9年级</option>
                </select>
              </div>

              <div className="glass-card rounded-3xl p-6">
                {(() => {
                  const course = courses.find(c => c.course_type === selectedCourseType && c.grade_range === selectedGradeRange);
                  if (!course) {
                    return (
                      <div className="text-center py-12 text-slate-400">
                        <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
                        <p>暂无该课程知识</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">知识点列表</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {(course.knowledge_points || []).map((kp: any, i: number) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-3">
                              <p className="font-medium text-slate-700">{kp.name}</p>
                              <p className="text-xs text-slate-500 mt-1">难度: {'★'.repeat(kp.difficulty || 1)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">学习路径</h3>
                        <div className="space-y-2">
                          {(course.learning_path || []).map((path: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{path.stage}</span>
                              <span className="text-sm text-slate-600">{(path.points || []).join(' → ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {course.common_mistakes && course.common_mistakes.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 mb-3">常见错误</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(course.common_mistakes || []).map((mistake: any, i: number) => (
                              <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="font-medium text-amber-800">{mistake.point}</p>
                                <p className="text-sm text-amber-700 mt-1">问题: {mistake.error}</p>
                                {mistake.tip && <p className="text-xs text-amber-600 mt-2">建议: {mistake.tip}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Overview Content */}
          {knowledgeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">知识库功能</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">智能分析辅助</p>
                      <p className="text-xs text-slate-500 mt-1">AI智能体调用知识库进行分析</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUpIcon size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">成长追踪</p>
                      <p className="text-xs text-slate-500 mt-1">记录学生能力变化趋势</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PieChart size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">维度分析</p>
                      <p className="text-xs text-slate-500 mt-1">多维度能力画像评估</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">快速统计</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">已覆盖课程</span>
                    <span className="font-bold text-slate-800">{courses.length}门</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">定义维度数</span>
                    <span className="font-bold text-slate-800">{dimensions.length}个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">系统维度</span>
                    <span className="font-bold text-emerald-600">{dimensions.filter(d => d.is_system).length}个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">自定义维度</span>
                    <span className="font-bold text-blue-600">{dimensions.filter(d => !d.is_system).length}个</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Content */}
          {knowledgeTab === 'faq' && (
            <div className="space-y-6">
              {/* FAQ Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">FAQ知识库管理</h2>
                <button
                  onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '', category: 'general', tags: '', status: 'active' }); setFaqModalOpen(true); }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  新增FAQ
                </button>
              </div>

              {/* FAQ Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{faqs.length}</p>
                      <p className="text-xs text-slate-500">FAQ总数</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="text-emerald-600" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{faqs.filter((f: any) => f.status === 'active').length}</p>
                      <p className="text-xs text-slate-500">已启用</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Tag className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{faqCategories.length}</p>
                      <p className="text-xs text-slate-500">分类数</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFaqCategory('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    !faqCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  全部
                </button>
                {faqCategories.map((cat: any) => (
                  <button
                    key={cat.category}
                    onClick={() => setFaqCategory(cat.category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      faqCategory === cat.category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {cat.category === 'general' ? '通用' : cat.category === 'exam' ? '测评相关' : cat.category === 'course' ? '课程相关' : cat.category === 'account' ? '账户相关' : cat.category === 'technical' ? '技术问题' : cat.category} ({cat.count})
                  </button>
                ))}
              </div>

              {/* FAQ Search */}
              <div className="glass-card rounded-2xl p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="搜索问题或答案..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* FAQ List */}
              <div className="space-y-3">
                {faqs
                  .filter((f: any) => {
                    const matchSearch = !faqSearch ||
                      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                      f.answer.toLowerCase().includes(faqSearch.toLowerCase());
                    const matchCategory = !faqCategory || f.category === faqCategory;
                    return matchSearch && matchCategory;
                  })
                  .map((faq: any) => (
                  <div
                    key={faq.id}
                    className="glass-card rounded-2xl border border-slate-100 transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        faq.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <HelpCircle size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate text-slate-800">
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
                          <span className="text-xs text-slate-500">
                            {faq.category === 'general' ? '通用' : faq.category === 'exam' ? '测评相关' : faq.category === 'course' ? '课程相关' : faq.category === 'account' ? '账户相关' : faq.category === 'technical' ? '技术问题' : faq.category}
                          </span>
                          {faq.tags && faq.tags.split(',').map((tag: string) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditFaq(faq); }}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFaq(faq.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedFaqId === faq.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                      </div>
                    </button>

                    {expandedFaqId === faq.id && (
                      <div className="px-4 pb-4 pt-0 text-slate-600">
                        <div className="p-4 rounded-xl text-sm leading-relaxed bg-slate-50">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {faqs.filter((f: any) => {
                  const matchSearch = !faqSearch ||
                    f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                    f.answer.toLowerCase().includes(faqSearch.toLowerCase());
                  const matchCategory = !faqCategory || f.category === faqCategory;
                  return matchSearch && matchCategory;
                }).length === 0 && (
                  <div className="text-center py-12 rounded-2xl border bg-white border-slate-200">
                    <HelpCircle size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">暂无FAQ记录</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg bg-white">
            <h2 className="text-lg font-bold mb-4 text-slate-800">
              {editingFaq ? '编辑FAQ' : '新增FAQ'}
            </h2>
            <form onSubmit={handleSubmitFaq} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">问题</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="input-field"
                  placeholder="请输入问题"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">答案</label>
                <textarea
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="请输入答案"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">分类</label>
                  <select
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
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
                  <label className="block text-sm font-medium mb-1 text-slate-700">标签</label>
                  <input
                    type="text"
                    value={faqForm.tags}
                    onChange={(e) => setFaqForm({ ...faqForm, tags: e.target.value })}
                    className="input-field"
                    placeholder="用逗号分隔"
                  />
                </div>
              </div>
              {editingFaq && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">状态</label>
                  <select
                    value={faqForm.status}
                    onChange={(e) => setFaqForm({ ...faqForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFaqModalOpen(false)} className="flex-1 btn-secondary py-2.5">取消</button>
                <button type="submit" className="flex-1 btn-primary py-2.5">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200">
              <Filter size={16} className="text-slate-400" />
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="text-sm bg-transparent outline-none text-slate-700"
              >
                <option value="">全部功能</option>
                {agents.map(agent => (
                  <option key={agent.key} value={agent.key}>{agent.name}</option>
                ))}
              </select>
            </div>
            {logFilter && (
              <button
                onClick={() => setLogFilter('')}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <XIcon size={14} />
                清除筛选
              </button>
            )}
          </div>

          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">AI使用记录</h2>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity size={40} className="mx-auto mb-3 opacity-50" />
                <p>暂无AI使用记录</p>
                <p className="text-xs text-slate-400 mt-2">当AI功能被调用后，记录将显示在这里</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">时间</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">智能体</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">状态</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">输入摘要</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">耗时</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => { setSelectedLog(log); setLogModalOpen(true); }}
                      >
                        <td className="py-3 px-2 text-slate-600 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                            {agents.find(a => a.key === log.feature)?.name || log.feature}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {log.status === 'success' ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Check size={14} /> 成功
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500">
                              <X size={14} /> 失败
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-600 max-w-[200px] truncate" title={log.input_summary}>
                          {log.input_summary || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-600 whitespace-nowrap">
                          {log.duration_ms}ms
                        </td>
                        <td className="py-3 px-2">
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); setLogModalOpen(true); }}
                            title="查看详情"
                          >
                            <Eye size={16} className="text-slate-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Detail Drawer */}
      {drawerOpen && selectedAgent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 fade-in"
            onClick={closeDrawer}
          />
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out translate-x-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${selectedAgent.enabled ? (agentColors[selectedAgent.key]?.bg || 'bg-blue-100') : 'bg-slate-100'} rounded-xl flex items-center justify-center`}>
                    <span className={selectedAgent.enabled ? (agentColors[selectedAgent.key]?.text || 'text-blue-600') : 'text-slate-400'}>
                      {agentIcons[selectedAgent.key] || <Bot size={20} />}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedAgent.name}</h2>
                    <p className="text-xs text-slate-500">{selectedAgent.description}</p>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XIcon size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">智能体状态</span>
                </div>
                <button
                  onClick={() => {
                    const updated = { ...selectedAgent, enabled: !selectedAgent.enabled };
                    setSelectedAgent(updated);
                    toggleAgent(selectedAgent.key);
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    selectedAgent.enabled ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      selectedAgent.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Stats */}
              {(() => {
                const agentStat = getAgentStats(selectedAgent.key);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-slate-800">{agentStat.count}</p>
                      <p className="text-xs text-slate-500">总调用次数</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className={`text-2xl font-bold ${agentStat.rate >= 70 ? 'text-emerald-600' : agentStat.rate >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {agentStat.rate}%
                      </p>
                      <p className="text-xs text-slate-500">成功率</p>
                    </div>
                  </div>
                );
              })()}

              {/* Edit Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <MessageSquare size={16} />
                  系统提示词
                </h3>
                <button
                  onClick={() => setDrawerEditing(!drawerEditing)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {drawerEditing ? '取消编辑' : '编辑'}
                </button>
              </div>

              {/* System Prompt */}
              {drawerEditing ? (
                <textarea
                  value={selectedAgent.systemPrompt}
                  onChange={(e) => setSelectedAgent({ ...selectedAgent, systemPrompt: e.target.value })}
                  className="w-full h-48 p-4 bg-slate-50 rounded-xl text-sm text-slate-700 border border-slate-200 focus:border-blue-400 focus:outline-none resize-none"
                  placeholder="输入系统提示词..."
                />
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed">
                  {selectedAgent.systemPrompt || '暂无系统提示词'}
                </div>
              )}

              {/* Parameters */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <Sliders size={16} />
                  参数配置
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Temperature</label>
                    {drawerEditing ? (
                      <input
                        type="number"
                        min={0}
                        max={2}
                        step={0.1}
                        value={selectedAgent.temperature}
                        onChange={(e) => setSelectedAgent({ ...selectedAgent, temperature: parseFloat(e.target.value) })}
                        className="w-full p-2 bg-slate-50 rounded-lg text-sm border border-slate-200 focus:border-blue-400 focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 font-medium">{selectedAgent.temperature}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Max Tokens</label>
                    {drawerEditing ? (
                      <input
                        type="number"
                        min={100}
                        max={8000}
                        step={100}
                        value={selectedAgent.maxTokens}
                        onChange={(e) => setSelectedAgent({ ...selectedAgent, maxTokens: parseInt(e.target.value) })}
                        className="w-full p-2 bg-slate-50 rounded-lg text-sm border border-slate-200 focus:border-blue-400 focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 font-medium">{selectedAgent.maxTokens}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {drawerEditing && (
                <button
                  onClick={saveAgentConfig}
                  disabled={drawerSaving}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {drawerSaving ? '保存中...' : <><Save size={16} /> 保存配置</>}
                </button>
              )}

              {/* Recent Logs */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <Activity size={16} />
                  最近调用
                </h3>
                {logs
                  .filter(log => log.feature === selectedAgent.key)
                  .slice(0, 5)
                  .map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <X size={14} className="text-red-500" />
                        )}
                        <span className="text-slate-600 truncate max-w-[200px]" title={log.input_summary}>
                          {log.input_summary || '-'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>
                  ))}
                {logs.filter(log => log.feature === selectedAgent.key).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">暂无调用记录</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Log Detail Modal */}
      {logModalOpen && selectedLog && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 fade-in"
            onClick={() => setLogModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col fade-in">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedLog.status === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {selectedLog.status === 'success' ? (
                      <Check size={18} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={18} className="text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {agents.find(a => a.key === selectedLog.feature)?.name || selectedLog.feature}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(selectedLog.created_at)} · {selectedLog.duration_ms}ms
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLogModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XIcon size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {selectedLog.status === 'success' ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium">
                      调用成功
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                      调用失败
                    </span>
                  )}
                </div>

                {/* Context Data */}
                {selectedLog.context_data && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Database size={16} className="text-purple-500" />
                      关联数据
                    </h4>
                    <div className="bg-purple-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap break-all max-h-40 overflow-y-auto border border-purple-100">
                      {(() => {
                        try {
                          const ctx = JSON.parse(selectedLog.context_data);
                          return Object.entries(ctx).map(([k, v]) => `${k}: ${v}`).join('\n');
                        } catch {
                          return selectedLog.context_data;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Input Summary */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" />
                    输入摘要
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                    {selectedLog.input_summary || '无输入内容'}
                  </div>
                </div>

                {/* Full Input */}
                {selectedLog.input_full && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" />
                        完整输入
                      </h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLog.input_full);
                          setCopiedField('input');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        {copiedField === 'input' ? <CheckCircle size={12} /> : <Copy size={12} />}
                        {copiedField === 'input' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap break-all max-h-80 overflow-y-auto font-mono text-xs">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.input_full), null, 2);
                        } catch {
                          return selectedLog.input_full;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Output Summary */}
                {selectedLog.output_summary && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <MessageSquare size={16} className="text-emerald-500" />
                      输出摘要
                    </h4>
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                      {selectedLog.output_summary}
                    </div>
                  </div>
                )}

                {/* Full Output */}
                {selectedLog.output_full && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-emerald-600" />
                        完整输出
                      </h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLog.output_full);
                          setCopiedField('output');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        {copiedField === 'output' ? <CheckCircle size={12} /> : <Copy size={12} />}
                        {copiedField === 'output' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap break-all max-h-80 overflow-y-auto font-mono text-xs">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.output_full), null, 2);
                        } catch {
                          return selectedLog.output_full;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} />
                      失败原因
                    </h4>
                    <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600 whitespace-pre-wrap break-all max-h-60 overflow-y-auto border border-red-100">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
