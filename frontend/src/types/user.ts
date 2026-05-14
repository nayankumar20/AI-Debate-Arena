export type ThemePreference = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  themePreference: ThemePreference;
  isGuest: boolean;
  createdAt?: string;
}
