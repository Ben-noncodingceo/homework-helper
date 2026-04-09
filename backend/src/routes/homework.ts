import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getConfig, getAIConfig, saveHomework, getHomeworkById, listHomework } from '../db';
import { callWithFallback, callAI, extractJSON } from '../services/aiClient';
import { buildGeneratePrompt, buildChartPrompt, GenerateParams } from '../services/promptBuilder';
import { getSubject, getGradeLevel } from '../data/knowledgePoints';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const body = req.body as GenerateParams;
    const { subjectId, grade, knowledgePointIds, questionTypes, counts } = body;

    if (!subjectId || !grade || !knowledgePointIds?.length || !questionTypes?.length) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const rawCfg = getConfig();
    const province = rawCfg['province'] || '广东省';
    const city = rawCfg['city'] || '广州市';

    const params: GenerateParams = { subjectId, grade, knowledgePointIds, questionTypes, counts, province, city };

    const primaryAI = getAIConfig('primary');
    const fallbackAI = getAIConfig('fallback');
    const multimodalAI = getAIConfig('multimodal');

    if (!primaryAI.apiKey && !fallbackAI.apiKey) {
      return res.status(400).json({ error: '请先在设置页面配置 AI API Key' });
    }

    const prompt = buildGeneratePrompt(params);
    const rawResponse = await callWithFallback(
      primaryAI,
      fallbackAI,
      [{ role: 'user', content: prompt }],
      6000
    );

    const jsonStr = extractJSON(rawResponse);
    let questions: Record<string, unknown>[] = [];
    try {
      questions = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({ error: 'AI 返回格式解析失败，请重试', raw: rawResponse.slice(0, 500) });
    }

    if (!Array.isArray(questions)) {
      return res.status(500).json({ error: 'AI 返回数据格式不正确' });
    }

    // Enrich chart questions using multimodal AI (if configured)
    const hasMultimodalKey = multimodalAI.apiKey;
    const needsChart = questionTypes.includes('chart');

    if (needsChart && hasMultimodalKey) {
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

    // Add UUIDs to questions if missing
    questions.forEach((q, i) => {
      if (!q.id) q.id = `q${i + 1}`;
    });

    const subject = getSubject(subjectId);
    const gradeLevel = getGradeLevel(subjectId, grade);
    const kpNames = knowledgePointIds
      .map((id) => gradeLevel?.points.find((p) => p.id === id)?.name ?? id)
      .join('、');

    const id = randomUUID();
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

    saveHomework({
      id,
      created_at: now,
      subject: subject?.name ?? subjectId,
      grade: gradeLevel?.label ?? grade,
      summary,
      data: JSON.stringify(homeworkSet),
    });

    return res.json(homeworkSet);
  } catch (err) {
    console.error('[generate]', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/history', (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10);
  const result = listHomework(page, 20);
  res.json(result);
});

router.get('/:id', (req: Request, res: Response) => {
  const record = getHomeworkById(req.params.id);
  if (!record) return res.status(404).json({ error: '未找到' });
  try {
    return res.json(JSON.parse(record.data));
  } catch {
    return res.status(500).json({ error: '数据损坏' });
  }
});

export default router;
