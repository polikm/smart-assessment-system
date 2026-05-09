import { useEffect, useState } from 'react';
import { configApi } from '../../api/client';
import { Settings, Save, Check } from 'lucide-react';

export default function AdminConfig() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await configApi.get();
      setConfig(data);
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
      await configApi.update(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig({ ...config, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">测评配置</h1>

      <div className="glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Settings className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">系统配置</h2>
            <p className="text-sm text-slate-500">配置测评系统的各项参数</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">能力等级分数线</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 px-2 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-lg text-center">
                  A级
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">最低分数</label>
                  <input
                    type="number"
                    value={config.level_a_min || '90'}
                    onChange={(e) => updateConfig('level_a_min', e.target.value)}
                    className="input-field"
                    min={0}
                    max={100}
                  />
                </div>
                <span className="text-sm text-slate-500">90-100分</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-lg text-center">
                  B级
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">最低分数</label>
                  <input
                    type="number"
                    value={config.level_b_min || '80'}
                    onChange={(e) => updateConfig('level_b_min', e.target.value)}
                    className="input-field"
                    min={0}
                    max={100}
                  />
                </div>
                <span className="text-sm text-slate-500">80-89分</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 px-2 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg text-center">
                  C级
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">最低分数</label>
                  <input
                    type="number"
                    value={config.level_c_min || '70'}
                    onChange={(e) => updateConfig('level_c_min', e.target.value)}
                    className="input-field"
                    min={0}
                    max={100}
                  />
                </div>
                <span className="text-sm text-slate-500">70-79分</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg text-center">
                  D级
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">最高分数</label>
                  <input
                    type="number"
                    value={config.level_d_max || '69'}
                    onChange={(e) => updateConfig('level_d_max', e.target.value)}
                    className="input-field"
                    min={0}
                    max={100}
                  />
                </div>
                <span className="text-sm text-slate-500">0-{config.level_d_max || 69}分</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">试卷默认配置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">题目数量</label>
                <input
                  type="number"
                  value={config.default_question_count || '15'}
                  onChange={(e) => updateConfig('default_question_count', e.target.value)}
                  className="input-field"
                  min={5}
                  max={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">时间限制（分钟）</label>
                <input
                  type="number"
                  value={config.default_time_limit || '60'}
                  onChange={(e) => updateConfig('default_time_limit', e.target.value)}
                  className="input-field"
                  min={10}
                  max={180}
                />
              </div>
            </div>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-600 mt-6">
            <Check size={16} />
            配置保存成功
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
        >
          <Save size={18} />
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
