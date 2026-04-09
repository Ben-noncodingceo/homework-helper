import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS homework (
      id         TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      subject    TEXT NOT NULL,
      grade      TEXT NOT NULL,
      summary    TEXT NOT NULL,
      data       TEXT NOT NULL
    );
  `);

  // Defaults for 3 AI roles: primary (主力), fallback (备选), multimodal (多模态)
  const defaults: Record<string, string> = {
    'ai.primary.provider': 'anthropic',
    'ai.primary.apiKey': '',
    'ai.primary.model': 'claude-opus-4-5',
    'ai.primary.baseUrl': 'https://api.anthropic.com',
    'ai.fallback.provider': 'openai',
    'ai.fallback.apiKey': '',
    'ai.fallback.model': 'gpt-4o',
    'ai.fallback.baseUrl': 'https://api.openai.com',
    'ai.multimodal.provider': 'anthropic',
    'ai.multimodal.apiKey': '',
    'ai.multimodal.model': 'claude-opus-4-5',
    'ai.multimodal.baseUrl': 'https://api.anthropic.com',
    province: '广东省',
    city: '广州市',
  };
  const ins = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaults)) ins.run(k, v);
}

export function getConfig(): Record<string, string> {
  const rows = getDb()
    .prepare('SELECT key, value FROM config')
    .all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setConfig(key: string, value: string) {
  getDb()
    .prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
    .run(key, value);
}

export function getAIConfig(role: 'primary' | 'fallback' | 'multimodal') {
  const cfg = getConfig();
  return {
    provider: cfg[`ai.${role}.provider`] || 'anthropic',
    apiKey: cfg[`ai.${role}.apiKey`] || '',
    model: cfg[`ai.${role}.model`] || 'claude-opus-4-5',
    baseUrl: cfg[`ai.${role}.baseUrl`] || 'https://api.anthropic.com',
  };
}

export function saveHomework(record: {
  id: string;
  created_at: string;
  subject: string;
  grade: string;
  summary: string;
  data: string;
}) {
  getDb()
    .prepare(
      'INSERT INTO homework (id, created_at, subject, grade, summary, data) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(record.id, record.created_at, record.subject, record.grade, record.summary, record.data);
}

export function getHomeworkById(id: string): { data: string } | undefined {
  return getDb()
    .prepare('SELECT data FROM homework WHERE id = ?')
    .get(id) as { data: string } | undefined;
}

export function listHomework(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const items = getDb()
    .prepare(
      'SELECT id, created_at, subject, grade, summary FROM homework ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    .all(limit, offset) as {
    id: string;
    created_at: string;
    subject: string;
    grade: string;
    summary: string;
  }[];
  const { cnt } = getDb()
    .prepare('SELECT COUNT(*) as cnt FROM homework')
    .get() as { cnt: number };
  return { items, total: cnt };
}
