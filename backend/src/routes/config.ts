import { Router, Request, Response } from 'express';
import { getConfig, setConfig } from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const raw = await getConfig();
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
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, Record<string, string> | string>;
    const roles = ['primary', 'fallback', 'multimodal'] as const;
    for (const role of roles) {
      const roleData = body[role] as Record<string, string> | undefined;
      if (roleData) {
        if (roleData.provider !== undefined) await setConfig(`ai.${role}.provider`, roleData.provider);
        if (roleData.apiKey !== undefined) await setConfig(`ai.${role}.apiKey`, roleData.apiKey);
        if (roleData.model !== undefined) await setConfig(`ai.${role}.model`, roleData.model);
        if (roleData.baseUrl !== undefined) await setConfig(`ai.${role}.baseUrl`, roleData.baseUrl);
      }
    }
    if (typeof body.province === 'string') await setConfig('province', body.province);
    if (typeof body.city === 'string') await setConfig('city', body.city);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
