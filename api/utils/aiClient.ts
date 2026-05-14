import { getDb } from '../db.js';

interface AIConfig {
  apiKey: string;
  endpoint: string;
  model: string;
  enabledFeatures: Record<string, boolean>;
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

interface AICallOptions {
  feature: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

let cachedConfig: AIConfig | null = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute

function getDefaultAgentsConfig(): AIAgentsConfig {
  return {
    agents: [
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
        name: '智能课程推荐',
        description: '根据测评结果智能推荐课程',
        enabled: true,
        systemPrompt: '你是资深教育顾问，根据学生测评结果从机构课程库中推荐最适合的课程。必须严格从提供的课程列表中选择，禁止推荐不存在的课程。以JSON格式返回。',
        temperature: 0.7,
        maxTokens: 2000,
      },
    ],
  };
}

async function getAIConfig(): Promise<AIConfig> {
  const now = Date.now();
  if (cachedConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }

  const db = await getDb();
  const configs = await db.all('SELECT key, value FROM config WHERE key LIKE ?', ['ai_%']);
  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.key] = c.value;
  }

  let enabledFeatures: Record<string, boolean> = {
    report_analysis: true,
    question_generate: true,
    question_review: true,
  };

  // 优先从新的 ai_agents_config 读取
  try {
    if (configMap.ai_agents_config) {
      const agentsConfig: AIAgentsConfig = JSON.parse(configMap.ai_agents_config);
      for (const agent of agentsConfig.agents) {
        enabledFeatures[agent.key] = agent.enabled;
      }
    } else if (configMap.ai_enabled_features) {
      enabledFeatures = { ...enabledFeatures, ...JSON.parse(configMap.ai_enabled_features) };
    }
  } catch (e) {}

  cachedConfig = {
    apiKey: configMap.ai_api_key || process.env.AI_API_KEY || '',
    endpoint: configMap.ai_api_endpoint || 'https://api.longcat.chat/openai/v1/chat/completions',
    model: configMap.ai_model || 'LongCat-Flash-Chat',
    enabledFeatures,
  };
  configCacheTime = now;
  return cachedConfig;
}

export async function getAIAgentsConfig(): Promise<AIAgentsConfig> {
  const db = await getDb();
  const row = await db.get("SELECT value FROM config WHERE key = ?", ['ai_agents_config']);

  if (row?.value) {
    try {
      const config: AIAgentsConfig = JSON.parse(row.value);
      // 确保所有默认智能体都存在
      const defaultConfig = getDefaultAgentsConfig();
      const existingKeys = new Set(config.agents.map(a => a.key));
      for (const defaultAgent of defaultConfig.agents) {
        if (!existingKeys.has(defaultAgent.key)) {
          config.agents.push(defaultAgent);
        }
      }
      return config;
    } catch (e) {}
  }

  // 从旧配置迁移
  const oldRow = await db.get("SELECT value FROM config WHERE key = ?", ['ai_enabled_features']);
  let oldFeatures: Record<string, boolean> = {};
  try {
    oldFeatures = JSON.parse(oldRow?.value || '{}');
  } catch (e) {}

  const defaultConfig = getDefaultAgentsConfig();
  for (const agent of defaultConfig.agents) {
    if (oldFeatures[agent.key] !== undefined) {
      agent.enabled = oldFeatures[agent.key];
    }
  }

  // 保存新配置
  await db.run(
    'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    ['ai_agents_config', JSON.stringify(defaultConfig), JSON.stringify(defaultConfig)]
  );

  return defaultConfig;
}

export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const config = await getAIConfig();
  return config.enabledFeatures[feature] !== false;
}

export async function aiCall(options: AICallOptions): Promise<any> {
  const { feature, messages } = options;
  const startTime = Date.now();

  const config = await getAIConfig();

  // 获取智能体配置
  let agentConfig: AIAgent | undefined;
  try {
    const agentsConfig = await getAIAgentsConfig();
    agentConfig = agentsConfig.agents.find(a => a.key === feature);
  } catch (e) {}

  // 确定最终参数：传入的 > 智能体配置 > 默认值
  const temperature = options.temperature ?? agentConfig?.temperature ?? 0.7;
  const max_tokens = options.max_tokens ?? agentConfig?.maxTokens ?? 2000;

  if (!config.enabledFeatures[feature]) {
    const error = new Error(`AI功能 [${feature}] 已被禁用`);
    await logAIUsage(feature, 'failed', '', '', 0, error.message, JSON.stringify(messages), '', JSON.stringify({ model: config.model, temperature, max_tokens }));
    throw error;
  }

  if (!config.apiKey) {
    const error = new Error('AI API Key 未配置');
    await logAIUsage(feature, 'failed', '', '', 0, error.message, JSON.stringify(messages), '', JSON.stringify({ model: config.model, temperature, max_tokens }));
    throw error;
  }

  // 构建消息列表：如果智能体有systemPrompt且传入的messages第一个不是system，则插入
  let finalMessages = [...messages];
  if (agentConfig?.systemPrompt && finalMessages.length > 0 && finalMessages[0].role !== 'system') {
    finalMessages = [
      { role: 'system', content: agentConfig.systemPrompt },
      ...finalMessages,
    ];
  }

  const inputSummary = messages[messages.length - 1]?.content?.slice(0, 200) || '';

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: finalMessages,
        temperature,
        max_tokens,
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      const inputFull = JSON.stringify(finalMessages);
      const contextData = JSON.stringify({ model: config.model, temperature, max_tokens, messageCount: finalMessages.length });
      await logAIUsage(feature, 'failed', inputSummary, '', duration, errorText, inputFull, '', contextData);
      throw new Error(`AI API 错误: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const outputContent = data.choices?.[0]?.message?.content || '';
    const outputSummary = outputContent.slice(0, 200);
    const inputFull = JSON.stringify(finalMessages);
    const outputFull = JSON.stringify(data);
    const contextData = JSON.stringify({ model: config.model, temperature, max_tokens, messageCount: finalMessages.length });

    await logAIUsage(feature, 'success', inputSummary, outputSummary, duration, undefined, inputFull, outputFull, contextData);

    return data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const inputFull = JSON.stringify(finalMessages);
    const contextData = JSON.stringify({ model: config.model, temperature, max_tokens, messageCount: finalMessages.length });
    await logAIUsage(feature, 'failed', inputSummary, '', duration, error.message, inputFull, '', contextData);
    throw error;
  }
}

// 获取东八区当前时间字符串（YYYY-MM-DD HH:mm:ss格式）
function getChinaTimeString(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat('zh-CN', options).formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
}

// 获取东八区当前日期字符串（YYYY-MM-DD格式）
function getChinaDateString(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('zh-CN', options).formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

async function logAIUsage(
  feature: string,
  status: string,
  inputSummary: string,
  outputSummary: string,
  durationMs: number,
  errorMessage?: string,
  inputFull?: string,
  outputFull?: string,
  contextData?: string
) {
  try {
    const db = await getDb();
    const chinaTime = getChinaTimeString();
    await db.run(
      'INSERT INTO ai_usage_logs (feature, status, input_summary, output_summary, duration_ms, error_message, input_full, output_full, context_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [feature, status, inputSummary, outputSummary, durationMs, errorMessage || null, inputFull || null, outputFull || null, contextData || null, chinaTime]
    );
  } catch (e) {
    console.error('[AI] Failed to log usage:', e);
  }
}

export async function getAILogs(params: { feature?: string; limit?: number; offset?: number } = {}) {
  const db = await getDb();
  const { feature, limit = 50, offset = 0 } = params;

  let sql = 'SELECT id, feature, status, input_summary, output_summary, duration_ms, error_message as errorMessage, input_full, output_full, context_data, created_at FROM ai_usage_logs WHERE 1=1';
  const queryParams: any[] = [];

  if (feature) {
    sql += ' AND feature = ?';
    queryParams.push(feature);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);

  const logs = await db.all(sql, queryParams);

  const countResult = await db.get(
    'SELECT COUNT(*) as total FROM ai_usage_logs' + (feature ? ' WHERE feature = ?' : ''),
    feature ? [feature] : []
  );

  return { logs, total: countResult?.total || 0 };
}

export async function getAIStats() {
  const db = await getDb();
  const today = getChinaDateString();

  const [todayStats, overallStats, featureStats] = await Promise.all([
    db.get(
      `SELECT COUNT(*) as count, AVG(duration_ms) as avg_duration
       FROM ai_usage_logs WHERE status = 'success' AND date(created_at) = date(?)`,
      [today]
    ),
    db.get(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
       FROM ai_usage_logs`
    ),
    db.all(
      `SELECT feature, COUNT(*) as count, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
       FROM ai_usage_logs GROUP BY feature`
    ),
  ]);

  return {
    today: { count: todayStats?.count || 0, avgDuration: Math.round(todayStats?.avg_duration || 0) },
    overall: {
      total: overallStats?.total || 0,
      success: overallStats?.success || 0,
      rate: overallStats?.total ? Math.round((overallStats.success / overallStats.total) * 100) : 0,
    },
    byFeature: featureStats,
  };
}
