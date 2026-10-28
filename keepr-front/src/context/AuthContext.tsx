import { Image } from 'expo-image';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  api,
  ApiError,
  errorMessage,
  setAuthToken,
  setUnauthorizedHandler,
} from '../api/client';
import { clearToken, getToken, saveToken } from '../api/tokenStorage';
import { AuthUser } from '../types';
import { KEYS, readJSON, writeJSON } from '../utils/storage';

type AuthResult = { ok: true } | { ok: false; error: string };

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * loading     -> leyendo el token guardado y consultando al servidor
 * ready       -> sabemos si hay sesión o no
 * unreachable -> hay un token guardado pero no se pudo contactar al servidor
 */
type AuthStatus = 'loading' | 'ready' | 'unreachable';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  hasOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  /** Reintenta restaurar la sesión (cuando el servidor no respondía). */
  retry: () => Promise<void>;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Cierra la sesión solo en este dispositivo (borra el token y el usuario).
  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    // Las fotos de garantías son privadas: se borran de la caché del teléfono.
    void Image.clearMemoryCache().catch(() => {});
    void Image.clearDiskCache().catch(() => {});
    await clearToken();
  }, []);

  // Si el servidor responde 401 en cualquier pedido, la sesión venció.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Al abrir la app: lee el token guardado y le pregunta al servidor quién es.
  const restore = useCallback(async () => {
    setStatus('loading');
    const [onboarded, token] = await Promise.all([
      readJSON<boolean>(KEYS.onboarded, false),
      getToken(),
    ]);
    setHasOnboarded(onboarded);

    if (!token) {
      setUser(null);
      setStatus('ready');
      return;
    }

    setAuthToken(token);
    try {
      const { user: me } = await api.get<{ user: AuthUser }>('/auth/me');
      setUser(me);
      setStatus('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Token vencido o cuenta borrada: hay que volver a iniciar sesión.
        await clearSession();
        setStatus('ready');
      } else {
        // Sin red o servidor caído: NO cerramos la sesión, dejamos reintentar.
        setStatus('unreachable');
      }
    }
  }, [clearSession]);

  useEffect(() => {
    void restore();
  }, [restore]);

  const completeOnboarding = useCallback(async () => {
    setHasOnboarded(true);
    try {
      await writeJSON(KEYS.onboarded, true);
    } catch {
      // No es crítico: en el peor caso el onboarding vuelve a aparecer.
    }
  }, []);

  const startSession = useCallback(async ({ token, user: me }: AuthResponse) => {
    await saveToken(token);
    setAuthToken(token);
    setUser(me);
  }, []);

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthResult> => {
      try {
        const res = await api.post<AuthResponse>('/auth/register', input, { auth: false });
        await startSession(res);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: errorMessage(err) };
      }
    },
    [startSession]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await api.post<AuthResponse>('/auth/login', { email, password }, { auth: false });
        await startSession(res);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: errorMessage(err) };
      }
    },
    [startSession]
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      hasOnboarded,
      completeOnboarding,
      register,
      login,
      logout,
      retry: restore,
    }),
    [user, status, hasOnboarded, completeOnboarding, register, login, logout, restore]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
