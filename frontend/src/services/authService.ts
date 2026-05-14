import { api } from './api';
import type { ThemePreference, User } from '@/types/user';

export interface AuthPayload {
  token: string;
  user: User;
}

export async function registerApi(body: {
  name: string;
  email: string;
  password: string;
  themePreference?: ThemePreference;
}) {
  const { data } = await api.post<AuthPayload & { success: boolean }>('/api/auth/register', body);
  return data;
}

export async function loginApi(body: { email: string; password: string }) {
  const { data } = await api.post<AuthPayload & { success: boolean }>('/api/auth/login', body);
  return data;
}

export async function guestApi() {
  const { data } = await api.post<AuthPayload & { success: boolean }>('/api/auth/guest');
  return data;
}

export async function meApi() {
  const { data } = await api.get<{ success: boolean; user: User }>('/api/auth/me');
  return data.user;
}
