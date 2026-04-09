import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getConfig, getAIConfig, saveHomework, getHomeworkById, listHomework } from '../db';
import { callWithFallback, callAI, extractJSON, extractSvg } from '../services/aiClient';
import { buildGeneratePrompt, buildChartPrompt, buildSvgPrompt, GenerateParams } from '../services/promptBuilder';
import { getSubject, getGradeLevel } from '../data/knowledgePoints';

const app = new Hono<AppEnv>();

/* ── Batch generate: one difficulty at a time ──────────── */

app.post('/generate-batch', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    subjectId: string;
    grade: string;
    knowledgePointIds: string[];
    questionTypes: string[];
    counts: { easy: number; medium: number; hard: number };
    difficulty: 'easy' | 'medium' | 'hard';
  }>();

  const { difficulty, subjectId, grade, knowledgePointIds, questionTypes, counts } = body;

  if (!subjectId || !grade || !knowledgePointIds?.length || !questionTypes?.length) {
    return c.json({ error: '参数不完整' }, 400);
  }

  const count = counts[difficulty] || 0;
  if (count === 0) {
    return c.json({ questions: [], province: '' });
  }

  const rawCfg = await getConfig(db);
  const province = rawCfg['province'] || '广东省';
  const city = rawCfg['city'] || '广州市';

  const batchCounts = { easy: 0, medium: 0, hard: 0 };
  batchCounts[difficulty] = count;

  const params: GenerateParams = {
    subjectId, grade, knowledgePointIds, questionTypes,
    counts: batchCounts, province, city,
  };

  const primaryAI = await getAIConfig(db, 'primary');
  const fallbackAI = await getAIConfig(db, 'fallback');

  if (!primaryAI.apiKey && !fallbackAI.apiKey) {
    return c.json({ error: '请先在设置页面配置 AI API Key' }, 400);
  }

  const prompt = buildGeneratePrompt(params);
  const rawResponse = await callWithFallback(
    primaryAI, fallbackAI,
    [{ role: 'user', content: prompt }],
    4000
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

  // Filter to requested difficulty only & enrich chart questions
  questions = questions.filter((q) => q.difficulty === difficulty);

  const multimodalAI = await getAIConfig(db, 'multimodal');
  if (questionTypes.includes('chart') && multimodalAI.apiKey) {
    for (const q of questions) {
      if (q.type === 'chart' && !q.chart) {
        try {
          const chartPrompt = buildChartPrompt(params, String(q.question));
          const chartRaw = await callAI(multimodalAI, [{ role: 'user', content: chartPrompt }], 1000);
          q.chart = JSON.parse(extractJSON(chartRaw));
        } catch { /* non-fatal */ }
      }
    }
  }

  questions.forEach((q, i) => {
    if (!q.id) q.id = `${difficulty[0]}${i + 1}`;
  });

  // Enrich with SVG diagrams for questions that reference figures
  const svgAI = multimodalAI.apiKey ? multimodalAI : (primaryAI.apiKey ? primaryAI : fallbackAI);
  if (svgAI.apiKey) {
    for (const q of questions) {
      if (q.svg) continue; // already has SVG
      const text = String(q.question || '');
      const chartDesc = (q.chart as Record<string, unknown> | null)?.description as string | undefined;
      const needsSvg = /如图|图中|示意图|下图|图示/.test(text)
        || (q.chart && (q.chart as Record<string, unknown>).type === 'geometry');
      if (!needsSvg) continue;
      try {
        const svgPrompt = buildSvgPrompt(text, chartDesc);
        const svgRaw = await callAI(svgAI, [{ role: 'user', content: svgPrompt }], 2000);
        const svg = extractSvg(svgRaw);
        if (svg) q.svg = svg;
      } catch { /* non-fatal, question still works without diagram */ }
    }
  }

  return c.json({ questions, province });
});

/* ── Save completed homework ──────────────────────────── */

app.post('/save', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    subject: string;
    subjectId: string;
    grade: string;
    province: string;
    knowledgePoints: string[];
    questions: Record<string, unknown>[];
  }>();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const summary = `${body.subject} · ${body.grade}`;

  const questions = body.questions;
  const homeworkSet = {
    id,
    createdAt: now,
    subject: body.subject,
    subjectId: body.subjectId,
    grade: body.grade,
    province: body.province,
    knowledgePoints: body.knowledgePoints,
    questions,
    easy: questions.filter((q) => q.difficulty === 'easy'),
    medium: questions.filter((q) => q.difficulty === 'medium'),
    hard: questions.filter((q) => q.difficulty === 'hard'),
  };

  await saveHomework(db, {
    id,
    created_at: now,
    subject: body.subject,
    grade: body.grade,
    summary,
    data: JSON.stringify(homeworkSet),
  });

  return c.json({ id });
});

/* ── Legacy full generate (kept for compatibility) ─────── */

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
  const rawResponse = await callWithFallback(primaryAI, fallbackAI, [{ role: 'user', content: prompt }], 6000);

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

  if (questionTypes.includes('chart') && multimodalAI.apiKey) {
    for (const q of questions) {
      if (q.type === 'chart' && !q.chart) {
        try {
          const chartPrompt = buildChartPrompt(params, String(q.question));
          const chartRaw = await callAI(multimodalAI, [{ role: 'user', content: chartPrompt }], 1000);
          q.chart = JSON.parse(extractJSON(chartRaw));
        } catch { /* non-fatal */ }
      }
    }
  }

  questions.forEach((q, i) => { if (!q.id) q.id = `q${i + 1}`; });

  // SVG enrichment for legacy endpoint
  const legacySvgAI = multimodalAI.apiKey ? multimodalAI : (primaryAI.apiKey ? primaryAI : fallbackAI);
  if (legacySvgAI.apiKey) {
    for (const q of questions) {
      if (q.svg) continue;
      const text = String(q.question || '');
      const chartDesc = (q.chart as Record<string, unknown> | null)?.description as string | undefined;
      const needsSvg = /如图|图中|示意图|下图|图示/.test(text)
        || (q.chart && (q.chart as Record<string, unknown>).type === 'geometry');
      if (!needsSvg) continue;
      try {
        const svgRaw = await callAI(legacySvgAI, [{ role: 'user', content: buildSvgPrompt(text, chartDesc) }], 2000);
        const svg = extractSvg(svgRaw);
        if (svg) q.svg = svg;
      } catch { /* non-fatal */ }
    }
  }

  const subject = getSubject(subjectId);
  const gradeLevel = getGradeLevel(subjectId, grade);
  const kpNames = knowledgePointIds
    .map((id) => gradeLevel?.points.find((p) => p.id === id)?.name ?? id)
    .join('、');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const summary = `${subject?.name ?? subjectId} · ${gradeLevel?.label ?? grade} · ${kpNames}`;

  const homeworkSet = {
    id, createdAt: now,
    subject: subject?.name ?? subjectId, subjectId,
    grade: gradeLevel?.label ?? grade, province,
    knowledgePoints: knowledgePointIds, questions,
    easy: questions.filter((q) => q.difficulty === 'easy'),
    medium: questions.filter((q) => q.difficulty === 'medium'),
    hard: questions.filter((q) => q.difficulty === 'hard'),
  };

  await saveHomework(db, { id, created_at: now, subject: subject?.name ?? subjectId, grade: gradeLevel?.label ?? grade, summary, data: JSON.stringify(homeworkSet) });
  return c.json(homeworkSet);
});

/* ── AI Chat ───────────────────────────────────────────── */

app.post('/chat', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    question: string; answer: string; explanation: string;
    userMessage: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  }>();

  const primaryAI = await getAIConfig(db, 'primary');
  const fallbackAI = await getAIConfig(db, 'fallback');
  if (!primaryAI.apiKey && !fallbackAI.apiKey) {
    return c.json({ error: '请先配置 AI API Key' }, 400);
  }

  const contextPrompt = `你是一位耐心的中国K-12教育老师。学生刚做了以下题目，现在有疑问想和你讨论。

【题目】
${body.question}

【正确答案】
${body.answer}

【解析】
${body.explanation}

请根据学生的问题，用通俗易懂的语言进一步解释。可以用不同的方法解题，或举类似的例子帮助理解。回答要简洁明了。如果有数学公式，请用 $...$ 包裹。`;

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: contextPrompt },
    { role: 'assistant', content: '好的，我已经了解了这道题目。请问你有什么疑问？' },
    ...(body.history ?? []),
    { role: 'user', content: body.userMessage },
  ];

  const reply = await callWithFallback(primaryAI, fallbackAI, messages, 1000);
  return c.json({ reply });
});

/* ── Read ──────────────────────────────────────────────── */

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
