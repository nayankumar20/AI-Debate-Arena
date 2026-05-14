import { api } from './api';
import type { ArenaPulsePayload, DashboardAnalytics } from '@/types/debate';

export async function getDashboardAnalyticsApi() {
  const { data } = await api.get<{ success: boolean; analytics: DashboardAnalytics }>('/api/analytics/dashboard');
  return data.analytics;
}

export async function getArenaPulseApi() {
  const { data } = await api.get<{ success: boolean; pulse: ArenaPulsePayload }>('/api/analytics/arena-pulse');
  return data.pulse;
}
