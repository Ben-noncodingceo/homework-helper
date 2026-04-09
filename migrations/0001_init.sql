-- 配置表 (AI 配置 & 地区设置)
CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 作业历史
CREATE TABLE IF NOT EXISTS homework (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  subject    TEXT NOT NULL,
  grade      TEXT NOT NULL,
  summary    TEXT NOT NULL,
  data       TEXT NOT NULL
);

-- 默认配置
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.primary.provider', 'anthropic');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.primary.apiKey', '');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.primary.model', 'claude-opus-4-5');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.primary.baseUrl', 'https://api.anthropic.com');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.fallback.provider', 'openai');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.fallback.apiKey', '');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.fallback.model', 'gpt-4o');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.fallback.baseUrl', 'https://api.openai.com');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.multimodal.provider', 'anthropic');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.multimodal.apiKey', '');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.multimodal.model', 'claude-opus-4-5');
INSERT OR IGNORE INTO config (key, value) VALUES ('ai.multimodal.baseUrl', 'https://api.anthropic.com');
INSERT OR IGNORE INTO config (key, value) VALUES ('province', '广东省');
INSERT OR IGNORE INTO config (key, value) VALUES ('city', '广州市');
