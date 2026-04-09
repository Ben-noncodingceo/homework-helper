import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import configRoutes from './routes/config';
import homeworkRoutes from './routes/homework';
import subjectsRoutes from './routes/subjects';

const app = new Hono<AppEnv>().basePath('/api');

app.use('*', cors());

app.route('/config', configRoutes);
app.route('/homework', homeworkRoutes);
app.route('/subjects', subjectsRoutes);

app.onError((err, c) => {
  console.error('[api]', err);
  return c.json({ error: err.message }, 500);
});

export default app;
