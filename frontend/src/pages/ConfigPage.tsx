import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppConfig, AIRoleConfig } from '../types';

const ROLE_LABELS: Record<string, { title: string; desc: string; icon: string }> = {
  primary: { title: '主力 AI', desc: '优先使用，负责生成大部分题目', icon: '⭐' },
  fallback: { title: '备选 AI', desc: '主力 AI 失败时自动切换', icon: '🔄' },
  multimodal: { title: '多模态 AI', desc: '处理图表题的生成与解析', icon: '📊' },
};

const PROVIDER_PRESETS = [
  { value: 'anthropic', label: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-20250514' },
  { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com', defaultModel: 'gpt-4o' },
  { value: 'deepseek', label: 'DeepSeek (深度求索)', baseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { value: 'tongyi', label: '通义千问 (阿里云)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode', defaultModel: 'qwen-plus' },
  { value: 'doubao', label: '豆包 (字节跳动)', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-1-5-pro-256k' },
  { value: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimax.chat', defaultModel: 'MiniMax-Text-01' },
  { value: 'custom', label: '其他 (OpenAI 兼容)', baseUrl: '', defaultModel: '' },
];

function getPresetValue(provider: string): string {
  return PROVIDER_PRESETS.some((p) => p.value === provider) ? provider : 'custom';
}

function RoleSection({
  role,
  cfg,
  onChange,
}: {
  role: 'primary' | 'fallback' | 'multimodal';
  cfg: AIRoleConfig;
  onChange: (c: AIRoleConfig) => void;
}) {
  const meta = ROLE_LABELS[role];
  const selectedPreset = getPresetValue(cfg.provider);
  const isCustom = selectedPreset === 'custom';

  const handleProviderChange = (newProvider: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.value === newProvider);
    if (!preset) return;
    onChange({
      ...cfg,
      provider: newProvider,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel,
    });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{meta.icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{meta.title}</h3>
          <p className="text-xs text-gray-500">{meta.desc}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Provider */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">AI 供应商</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={selectedPreset}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {PROVIDER_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={cfg.apiKey}
            onChange={(e) => onChange({ ...cfg, apiKey: e.target.value })}
            placeholder="输入你的 API Key"
          />
        </div>

        {/* Model + Base URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">模型名称</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={cfg.model}
              onChange={(e) => onChange({ ...cfg, model: e.target.value })}
              placeholder="模型名称"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              API 地址{!isCustom && <span className="text-gray-400 font-normal"> (自动填充)</span>}
            </label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                isCustom ? 'border-gray-300' : 'border-gray-200 text-gray-500'
              }`}
              value={cfg.baseUrl}
              onChange={(e) => onChange({ ...cfg, baseUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const DEFAULT_CFG: AppConfig = {
  primary: { provider: 'anthropic', apiKey: '', model: 'claude-sonnet-4-20250514', baseUrl: 'https://api.anthropic.com' },
  fallback: { provider: 'openai', apiKey: '', model: 'gpt-4o', baseUrl: 'https://api.openai.com' },
  multimodal: { provider: 'anthropic', apiKey: '', model: 'claude-sonnet-4-20250514', baseUrl: 'https://api.anthropic.com' },
  province: '广东省',
  city: '广州市',
};

export default function ConfigPage() {
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CFG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getConfig().then(setCfg).catch(() => {});
  }, []);

  const setRole = (role: keyof Pick<AppConfig, 'primary' | 'fallback' | 'multimodal'>) =>
    (c: AIRoleConfig) => setCfg((prev) => ({ ...prev, [role]: c }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveConfig(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AI 设置</h1>

      <RoleSection role="primary" cfg={cfg.primary} onChange={setRole('primary')} />
      <RoleSection role="fallback" cfg={cfg.fallback} onChange={setRole('fallback')} />
      <RoleSection role="multimodal" cfg={cfg.multimodal} onChange={setRole('multimodal')} />

      {/* Location */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">地区设置</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">省份</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={cfg.province}
              onChange={(e) => setCfg((p) => ({ ...p, province: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">城市</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={cfg.city}
              onChange={(e) => setCfg((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? '保存中…' : saved ? '✓ 已保存' : '保存设置'}
      </button>
    </div>
  );
}
