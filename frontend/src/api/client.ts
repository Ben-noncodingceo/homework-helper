import { AppConfig, GenerateRequest, HomeworkSet, HistoryItem, Question } from '../types';
import type { Subject } from '../types/subjects';

const BASE = '/api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  getConfig: () => request<AppConfig>('/config'),
  saveConfig: (cfg: AppConfig) =>
    request<{ ok: boolean }>('/config', { method: 'POST', body: JSON.stringify(cfg) }),

  getSubjects: () => request<Subject[]>('/subjects'),

  generate: (req: GenerateRequest) =>
    request<HomeworkSet>('/homework/generate', { method: 'POST', body: JSON.stringify(req) }),

  generateBatch: (req: GenerateRequest & { difficulty: 'easy' | 'medium' | 'hard' }) =>
    request<{ questions: Question[]; province: string }>('/homework/generate-batch', {
      method: 'POST', body: JSON.stringify(req),
    }),

  saveHomework: (data: {
    subject: string; subjectId: string; grade: string; province: string;
    knowledgePoints: string[]; questions: Record<string, unknown>[];
  }) =>
    request<{ id: string }>('/homework/save', { method: 'POST', body: JSON.stringify(data) }),

  getHomework: (id: string) => request<HomeworkSet>(`/homework/${id}`),

  getHistory: (page = 1) =>
    request<{ items: HistoryItem[]; total: number }>(`/homework/history?page=${page}`),

  chat: (req: {
    question: string; answer: string; explanation: string;
    userMessage: string; history: { role: string; content: string }[];
  }) =>
    request<{ reply: string }>('/homework/chat', { method: 'POST', body: JSON.stringify(req) }),
};
