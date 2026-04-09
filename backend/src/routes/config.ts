import { Router, Request, Response } from 'express';
import { getConfig, setConfig } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const raw = getConfig();
  // Shape into nested object for frontend
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
  res.json(cfg);
});

router.post('/', (req: Request, res: Response) => {
  const body = req.body as Record<string, Record<string, string> | string>;
  const roles = ['primary', 'fallback', 'multimodal'] as const;
  for (const role of roles) {
    const roleData = body[role] as Record<string, string> | undefined;
    if (roleData) {
      if (roleData.provider !== undefined) setConfig(`ai.${role}.provider`, roleData.provider);
      if (roleData.apiKey !== undefined) setConfig(`ai.${role}.apiKey`, roleData.apiKey);
      if (roleData.model !== undefined) setConfig(`ai.${role}.model`, roleData.model);
      if (roleData.baseUrl !== undefined) setConfig(`ai.${role}.baseUrl`, roleData.baseUrl);
    }
  }
  if (typeof body.province === 'string') setConfig('province', body.province);
  if (typeof body.city === 'string') setConfig('city', body.city);
  res.json({ ok: true });
});

export default router;
