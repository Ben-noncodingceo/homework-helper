export async function getConfig(db: D1Database): Promise<Record<string, string>> {
  const { results } = await db.prepare('SELECT key, value FROM config').all<{ key: string; value: string }>();
  return Object.fromEntries((results ?? []).map((r) => [r.key, r.value]));
}

export async function setConfig(db: D1Database, key: string, value: string): Promise<void> {
  await db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
    .bind(key, value)
    .run();
}

export async function getAIConfig(db: D1Database, role: 'primary' | 'fallback' | 'multimodal') {
  const cfg = await getConfig(db);
  return {
    provider: cfg[`ai.${role}.provider`] || 'anthropic',
    apiKey: cfg[`ai.${role}.apiKey`] || '',
    model: cfg[`ai.${role}.model`] || 'claude-opus-4-5',
    baseUrl: cfg[`ai.${role}.baseUrl`] || 'https://api.anthropic.com',
  };
}

export async function saveHomework(db: D1Database, record: {
  id: string;
  created_at: string;
  subject: string;
  grade: string;
  summary: string;
  data: string;
}): Promise<void> {
  await db.prepare(
    'INSERT INTO homework (id, created_at, subject, grade, summary, data) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(record.id, record.created_at, record.subject, record.grade, record.summary, record.data)
    .run();
}

export async function getHomeworkById(db: D1Database, id: string): Promise<{ data: string } | null> {
  return await db.prepare('SELECT data FROM homework WHERE id = ?')
    .bind(id)
    .first<{ data: string }>();
}

export async function listHomework(db: D1Database, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { results: items } = await db.prepare(
    'SELECT id, created_at, subject, grade, summary FROM homework ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
    .bind(limit, offset)
    .all<{ id: string; created_at: string; subject: string; grade: string; summary: string }>();

  const countRow = await db.prepare('SELECT COUNT(*) as cnt FROM homework').first<{ cnt: number }>();

  return {
    items: items ?? [],
    total: countRow?.cnt ?? 0,
  };
}
