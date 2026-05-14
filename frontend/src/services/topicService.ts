import { api } from './api';
import type { TopicSuggestionsResponse } from '@/types/debate';

export async function getTopicSuggestionsApi(): Promise<TopicSuggestionsResponse> {
  const { data } = await api.get<{ success: boolean } & TopicSuggestionsResponse>('/api/topics/suggestions');
  return {
    categories: data.categories,
    trending: data.trending,
    popular: data.popular,
    controversial: data.controversial,
  };
}

/** Uses auth token from our api instance (optional AI refresh). */
export async function refreshTopicIdeasApi() {
  const { data } = await api.post<{
    success: boolean;
    generated: { topic: string; category: string; blurb: string }[];
  }>('/api/topics/refresh');
  return data.generated ?? [];
}
