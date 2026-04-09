import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getConfig, getAIConfig, saveHomework, getHomeworkById, listHomework } from '../db';
import { callWithFallback, callAI, extractJSON } from '../services/aiClient';
import { buildGeneratePrompt, buildChartPrompt, GenerateParams } from '../services/promptBuilder';
import { getSubject, getGradeLevel } from '../data/knowledgePoints';

const app = new Hono<AppEnv>();

app.post('/generate', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<GenerateParams>();
  const { subjectId, grade, knowledgePointIds, questionTypes, counts } = body;

  if (!subjectId || !grade || !knowledgePointIds?.length || !questionTypes?.length) {
    return c.json({ error: '参数不完整' }, 400);
  }

  const rawCfg = await getConfig(db);
  const province = rawCfg['province'] || '广东省';
  const city = rawCfg['city'] || '广州市';

  const params: GenerateParams = { subjectId, grade, knowledgePointIds, questionTypes, counts, province, city };

  const primaryAI = await getAIConfig(db, 'primary');
  const fallbackAI = await getAIConfig(db, 'fallback');
  const multimodalAI = await getAIConfig(db, 'multimodal');

  if (!primaryAI.apiKey && !fallbackAI.apiKey) {
    return c.json({ error: '请先在设置页面配置 AI API Key' }, 400);
  }

  const prompt = buildGeneratePrompt(params);
  const rawResponse = await callWithFallback(
    primaryAI,
    fallbackAI,
    [{ role: 'user', content: prompt }],
    6000
  );

  const jsonStr = extractJSON(rawResponse);
  let questions: Record<string, unknown>[];
  try {
    questions = JSON.parse(jsonStr);
  } catch {
    return c.json({ error: 'AI 返回格式解析失败，请重试', raw: rawResponse.slice(0, 500) }, 500);
  }

  if (!Array.isArray(questions)) {
    return c.json({ error: 'AI 返回数据格式不正确' }, 500);
  }

  // Enrich chart questions using multimodal AI (if configured)
  if (questionTypes.includes('chart') && multimodalAI.apiKey) {
    for (const q of questions) {
      if (q.type === 'chart' && !q.chart) {
        try {
          const chartPrompt = buildChartPrompt(params, String(q.question));
          const chartRaw = await callAI(multimodalAI, [{ role: 'user', content: chartPrompt }], 1000);
          q.chart = JSON.parse(extractJSON(chartRaw));
        } catch {
          // non-fatal, leave chart as null
        }
      }
    }
  }

  // Add IDs to questions if missing
  questions.forEach((q, i) => {
    if (!q.id) q.id = `q${i + 1}`;
  });

  const subject = getSubject(subjectId);
  const gradeLevel = getGradeLevel(subjectId, grade);
  const kpNames = knowledgePointIds
    .map((id) => gradeLevel?.points.find((p) => p.id === id)?.name ?? id)
    .join('、');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const summary = `${subject?.name ?? subjectId} · ${gradeLevel?.label ?? grade} · ${kpNames}`;

  const homeworkSet = {
    id,
    createdAt: now,
    subject: subject?.name ?? subjectId,
    subjectId,
    grade: gradeLevel?.label ?? grade,
    knowledgePoints: knowledgePointIds,
    questions,
    easy: questions.filter((q) => q.difficulty === 'easy'),
    medium: questions.filter((q) => q.difficulty === 'medium'),
    hard: questions.filter((q) => q.difficulty === 'hard'),
  };

  await saveHomework(db, {
    id,
    created_at: now,
    subject: subject?.name ?? subjectId,
    grade: gradeLevel?.label ?? grade,
    summary,
    data: JSON.stringify(homeworkSet),
  });

  return c.json(homeworkSet);
});

app.get('/history', async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const result = await listHomework(c.env.DB, page, 20);
  return c.json(result);
});

app.get('/:id', async (c) => {
  const record = await getHomeworkById(c.env.DB, c.req.param('id'));
  if (!record) return c.json({ error: '未找到' }, 404);
  return c.json(JSON.parse(record.data));
});

export default app;
