import { api } from './api';
import type { UserProfile } from '@/types/debate';

export async function getProfileApi() {
  const { data } = await api.get<{ success: boolean; profile: UserProfile }>('/api/users/profile');
  return data.profile;
}

export async function updateProfileApi(body: Partial<{ name: string; avatar: string; themePreference: string }>) {
  const { data } = await api.patch<{ success: boolean; profile: UserProfile }>('/api/users/profile', body);
  return data.profile;
}
