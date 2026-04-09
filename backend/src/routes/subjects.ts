import { Hono } from 'hono';
import type { AppEnv } from '../types';
import SUBJECTS from '../data/knowledgePoints';

const app = new Hono<AppEnv>();

app.get('/', (c) => {
  return c.json(SUBJECTS);
});

export default app;
