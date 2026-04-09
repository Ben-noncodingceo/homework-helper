import { AppConfig, GenerateRequest, HomeworkSet, HistoryItem } from '../types';
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

  getHomework: (id: string) => request<HomeworkSet>(`/homework/${id}`),

  getHistory: (page = 1) =>
    request<{ items: HistoryItem[]; total: number }>(`/homework/history?page=${page}`),
};
