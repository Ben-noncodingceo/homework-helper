import { createClient, type Client } from '@libsql/client';

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (_client) return _client;
  _client = createClient({
    url: process.env.DATABASE_URL || 'file:data.sqlite',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  return _client;
}

async function ensureSchema(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const client = getClient();
    await client.executeMultiple(`
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
    for (const [k, v] of Object.entries(defaults)) {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)',
        args: [k, v],
      });
    }
  })();
  return _initPromise;
}

async function db(): Promise<Client> {
  await ensureSchema();
  return getClient();
}

export async function getConfig(): Promise<Record<string, string>> {
  const client = await db();
  const result = await client.execute('SELECT key, value FROM config');
  return Object.fromEntries(result.rows.map((r) => [String(r.key), String(r.value)]));
}

export async function setConfig(key: string, value: string): Promise<void> {
  const client = await db();
  await client.execute({
    sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
    args: [key, value],
  });
}

export async function getAIConfig(role: 'primary' | 'fallback' | 'multimodal') {
  const cfg = await getConfig();
  return {
    provider: cfg[`ai.${role}.provider`] || 'anthropic',
    apiKey: cfg[`ai.${role}.apiKey`] || '',
    model: cfg[`ai.${role}.model`] || 'claude-opus-4-5',
    baseUrl: cfg[`ai.${role}.baseUrl`] || 'https://api.anthropic.com',
  };
}

export async function saveHomework(record: {
  id: string;
  created_at: string;
  subject: string;
  grade: string;
  summary: string;
  data: string;
}): Promise<void> {
  const client = await db();
  await client.execute({
    sql: 'INSERT INTO homework (id, created_at, subject, grade, summary, data) VALUES (?, ?, ?, ?, ?, ?)',
    args: [record.id, record.created_at, record.subject, record.grade, record.summary, record.data],
  });
}

export async function getHomeworkById(id: string): Promise<{ data: string } | undefined> {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT data FROM homework WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return undefined;
  return { data: String(result.rows[0].data) };
}

export async function listHomework(page = 1, limit = 20) {
  const client = await db();
  const items = await client.execute({
    sql: 'SELECT id, created_at, subject, grade, summary FROM homework ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [limit, (page - 1) * limit],
  });
  const countResult = await client.execute('SELECT COUNT(*) as cnt FROM homework');
  const cnt = Number(countResult.rows[0].cnt);
  return {
    items: items.rows.map((r) => ({
      id: String(r.id),
      created_at: String(r.created_at),
      subject: String(r.subject),
      grade: String(r.grade),
      summary: String(r.summary),
    })),
    total: cnt,
  };
}
