import axios from 'axios';
import { api } from './api';
import type { Debate, DebateListItem, AudienceReaction } from '@/types/debate';

export async function createDebateApi(body: {
  topic: string;
  sideAModelId: string;
  sideBModelId: string;
  totalRounds: number;
  category?: string;
}) {
  const { data } = await api.post<{ success: boolean; debate: Debate }>('/api/debates/create', body);
  return data.debate;
}

export async function listDebatesApi(params: { search?: string; status?: string; page?: number; limit?: number }) {
  const { data } = await api.get<{
    success: boolean;
    debates: DebateListItem[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>('/api/debates', { params });
  return data;
}

export async function getDebateApi(id: string) {
  const { data } = await api.get<{ success: boolean; debate: Debate }>(`/api/debates/${id}`);
  return data.debate;
}

export async function startDebateStepApi(id: string) {
  const { data } = await api.post<{
    success: boolean;
    completed: boolean;
    debate: Debate;
    code?: string;
  }>(`/api/debates/${id}/start`);
  return data;
}

/** Handles transient 409 PROCESSING locks. */
export async function startDebateStepWithRetry(id: string, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await startDebateStepApi(id);
    } catch (err) {
      const code =
        axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object'
          ? (err.response.data as { code?: string }).code
          : undefined;
      const isProcessingLock =
        axios.isAxiosError(err) && err.response?.status === 409 && code === 'PROCESSING';
      if (isProcessingLock && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 350 + attempt * 120));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Unable to advance debate (engine busy)');
}

export async function voteDebateApi(
  id: string,
  body: { side: 'A' | 'B'; comment?: string; audienceReaction?: AudienceReaction | null }
) {
  const { data } = await api.post<{ success: boolean; debate: Debate }>(`/api/debates/${id}/vote`, body);
  return data.debate;
}

export async function postDebateCommentApi(id: string, body: string) {
  const { data } = await api.post<{ success: boolean; debate: Debate }>(`/api/debates/${id}/comments`, {
    body,
  });
  return data.debate;
}

export async function requestJudgeApi(id: string) {
  const { data } = await api.post<{ success: boolean; debate: Debate }>(`/api/debates/${id}/judge`);
  return data.debate;
}
