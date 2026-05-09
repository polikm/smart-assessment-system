import { useEffect, useState, useCallback } from 'react';
import { configApi, apiFetch } from '../../api/client';
import {
  Cpu, Save, Check, X, Activity, Clock, Zap,
  FileText, Brain, Shield, TrendingUp, Edit3,
  Bot, Puzzle, Lightbulb, ChevronRight, Sliders,
  MessageSquare, BarChart3, X as XIcon, Filter
} from 'lucide-react';

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
      description: '根据知识点和难度智能组合试卷（开发中）',
      enabled: false,
      systemPrompt: '你是一位资深的试卷组卷专家。请根据给定的知识点、难度分布和题目数量要求，从题库中选择最合适的题目组合成一套试卷。',
      temperature: 0.5,
      maxTokens: 4000,
    },
    {
      key: 'course_recommend',
      name: '智能推荐',
      description: '根据测评结果智能推荐课程（开发中）',
      enabled: false,
      systemPrompt: '你是一位资深的教育顾问。请根据学生的测评结果、兴趣爱好和学习情况，推荐最适合的课程和学习路径。',
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
    ai_enabled_features: JSON.stringify({ report_analysis: true, question_generate: true, question_review: true }),
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
  const [activeTab, setActiveTab] = useState<'config' | 'agents' | 'logs'>('config');
  const [isEditing, setIsEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configData, logsData, statsData] = await Promise.all([
        configApi.get(),
        apiFetch('/ai-logs'),
        apiFetch('/ai-logs/stats'),
      ]);

      setConfig({
        ai_api_key: configData.ai_api_key || '',
        ai_api_endpoint: configData.ai_api_endpoint || 'https://api.longcat.chat/openai/v1/chat/completions',
        ai_model: configData.ai_model || 'LongCat-Flash-Chat',
        ai_enabled_features: configData.ai_enabled_features || JSON.stringify({ report_analysis: true, question_generate: true, question_review: true }),
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
                <option value="">全部智能体</option>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-2 text-slate-600 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('zh-CN')}
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
                        {new Date(log.created_at).toLocaleString('zh-CN')}
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
    </div>
  );
}
