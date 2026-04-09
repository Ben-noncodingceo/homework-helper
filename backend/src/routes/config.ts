import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getConfig, setConfig } from '../db';

const app = new Hono<AppEnv>();

app.get('/', async (c) => {
  const db = c.env.DB;
  const raw = await getConfig(db);
  const cfg = {
    primary: {
      provider: raw['ai.primary.provider'] || 'anthropic',
      apiKey: raw['ai.primary.apiKey'] || '',
      model: raw['ai.primary.model'] || 'claude-opus-4-5',
      baseUrl: raw['ai.primary.baseUrl'] || 'https://api.anthropic.com',
    },
    fallback: {
      provider: raw['ai.fallback.provider'] || 'openai',
      apiKey: raw['ai.fallback.apiKey'] || '',
      model: raw['ai.fallback.model'] || 'gpt-4o',
      baseUrl: raw['ai.fallback.baseUrl'] || 'https://api.openai.com',
    },
    multimodal: {
      provider: raw['ai.multimodal.provider'] || 'anthropic',
      apiKey: raw['ai.multimodal.apiKey'] || '',
      model: raw['ai.multimodal.model'] || 'claude-opus-4-5',
      baseUrl: raw['ai.multimodal.baseUrl'] || 'https://api.anthropic.com',
    },
    province: raw['province'] || '广东省',
    city: raw['city'] || '广州市',
  };
  return c.json(cfg);
});

app.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<Record<string, Record<string, string> | string>>();
  const roles = ['primary', 'fallback', 'multimodal'] as const;
  for (const role of roles) {
    const roleData = body[role] as Record<string, string> | undefined;
    if (roleData) {
      if (roleData.provider !== undefined) await setConfig(db, `ai.${role}.provider`, roleData.provider);
      if (roleData.apiKey !== undefined) await setConfig(db, `ai.${role}.apiKey`, roleData.apiKey);
      if (roleData.model !== undefined) await setConfig(db, `ai.${role}.model`, roleData.model);
      if (roleData.baseUrl !== undefined) await setConfig(db, `ai.${role}.baseUrl`, roleData.baseUrl);
    }
  }
  if (typeof body.province === 'string') await setConfig(db, 'province', body.province);
  if (typeof body.city === 'string') await setConfig(db, 'city', body.city);
  return c.json({ ok: true });
});

export default app;
