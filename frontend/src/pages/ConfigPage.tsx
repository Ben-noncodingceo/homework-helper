import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppConfig, AIRoleConfig } from '../types';

const ROLE_LABELS: Record<string, { title: string; desc: string; icon: string }> = {
  primary: { title: '主力 AI', desc: '优先使用，负责生成大部分题目', icon: '⭐' },
  fallback: { title: '备选 AI', desc: '主力 AI 失败时自动切换', icon: '🔄' },
  multimodal: { title: '多模态 AI', desc: '处理图表题的生成与解析', icon: '📊' },
};

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI / 兼容接口' },
];

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
  const set = (k: keyof AIRoleConfig, v: string) => onChange({ ...cfg, [k]: v });

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{meta.icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{meta.title}</h3>
          <p className="text-xs text-gray-500">{meta.desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">提供商</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={cfg.provider}
            onChange={(e) => set('provider', e.target.value as 'anthropic' | 'openai')}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">模型名称</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={cfg.model}
            onChange={(e) => set('model', e.target.value)}
            placeholder="claude-opus-4-5"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={cfg.apiKey}
            onChange={(e) => set('apiKey', e.target.value)}
            placeholder="sk-..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">API Base URL</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={cfg.baseUrl}
            onChange={(e) => set('baseUrl', e.target.value)}
            placeholder="https://api.anthropic.com"
          />
        </div>
      </div>
    </section>
  );
}

const DEFAULT_CFG: AppConfig = {
  primary: { provider: 'anthropic', apiKey: '', model: 'claude-opus-4-5', baseUrl: 'https://api.anthropic.com' },
  fallback: { provider: 'openai', apiKey: '', model: 'gpt-4o', baseUrl: 'https://api.openai.com' },
  multimodal: { provider: 'anthropic', apiKey: '', model: 'claude-opus-4-5', baseUrl: 'https://api.anthropic.com' },
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
      <h1 className="text-2xl font-bold text-gray-900">⚙ AI 设置</h1>

      <RoleSection role="primary" cfg={cfg.primary} onChange={setRole('primary')} />
      <RoleSection role="fallback" cfg={cfg.fallback} onChange={setRole('fallback')} />
      <RoleSection role="multimodal" cfg={cfg.multimodal} onChange={setRole('multimodal')} />

      {/* Location */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">📍 地区设置</h3>
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
