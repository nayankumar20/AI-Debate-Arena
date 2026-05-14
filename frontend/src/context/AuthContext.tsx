import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, ThemePreference } from '@/types/user';
import { guestApi, loginApi, meApi, registerApi } from '@/services/authService';
import { getStoredToken, setStoredToken } from '@/services/api';

const USER_KEY = 'ada_user';

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeStoredUser(user: User | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    themePreference?: ThemePreference;
  }) => Promise<void>;
  guest: () => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((nextToken: string, nextUser: User) => {
    setStoredToken(nextToken);
    writeStoredUser(nextUser);
    setToken(nextToken);
    setUserState(nextUser);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    writeStoredUser(null);
    setToken(null);
    setUserState(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const t = getStoredToken();
      if (!t) {
        setLoading(false);
        return;
      }
      try {
        const u = await meApi();
        if (!cancelled) {
          setUserState(u);
          writeStoredUser(u);
          setToken(t);
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginApi({ email, password });
      persistSession(res.token, res.user);
    },
    [persistSession]
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      themePreference?: ThemePreference;
    }) => {
      const res = await registerApi(input);
      persistSession(res.token, res.user);
    },
    [persistSession]
  );

  const guest = useCallback(async () => {
    const res = await guestApi();
    persistSession(res.token, res.user);
  }, [persistSession]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    writeStoredUser(u);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      guest,
      logout,
      setUser,
    }),
    [user, token, loading, login, register, guest, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
