import * as Crypto from 'expo-crypto';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthUser, StoredAccount } from '../types';
import { KEYS, readJSON, removeKey, writeJSON } from '../utils/storage';

type AuthResult = { ok: true } | { ok: false; error: string };

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the app is reading its saved session from AsyncStorage. */
  loading: boolean;
  hasOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(account: StoredAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    initial: account.initial,
    plan: account.plan,
  };
}

function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore onboarding flag + last session on app start.
  useEffect(() => {
    let active = true;
    (async () => {
      const [onboarded, sessionId, accounts] = await Promise.all([
        readJSON<boolean>(KEYS.onboarded, false),
        readJSON<string | null>(KEYS.session, null),
        readJSON<StoredAccount[]>(KEYS.accounts, []),
      ]);
      if (!active) return;
      const account = sessionId ? accounts.find((a) => a.id === sessionId) : undefined;
      setHasOnboarded(onboarded);
      setUser(account ? toAuthUser(account) : null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasOnboarded(true);
    try {
      await writeJSON(KEYS.onboarded, true);
    } catch {
      // Non-critical: worst case the onboarding shows again next launch.
    }
  }, []);

  const register = useCallback(
    async ({ name, email, password }: RegisterInput): Promise<AuthResult> => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      try {
        const accounts = await readJSON<StoredAccount[]>(KEYS.accounts, []);
        if (accounts.some((a) => a.email === cleanEmail)) {
          return { ok: false, error: 'An account with this email already exists.' };
        }

        const salt = Crypto.randomUUID();
        const account: StoredAccount = {
          id: Crypto.randomUUID(),
          name: cleanName,
          email: cleanEmail,
          initial: cleanName.charAt(0).toUpperCase(),
          plan: 'Keepr Free',
          passwordHash: await hashPassword(password, salt),
          salt,
          createdAt: new Date().toISOString(),
        };

        await writeJSON(KEYS.accounts, [...accounts, account]);
        await writeJSON(KEYS.session, account.id);
        setUser(toAuthUser(account));
        return { ok: true };
      } catch {
        return { ok: false, error: 'Could not create the account. Please try again.' };
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const cleanEmail = email.trim().toLowerCase();
      const invalid: AuthResult = { ok: false, error: 'Incorrect email or password.' };
      try {
        const accounts = await readJSON<StoredAccount[]>(KEYS.accounts, []);
        const account = accounts.find((a) => a.email === cleanEmail);
        if (!account) return invalid;

        const hash = await hashPassword(password, account.salt);
        if (hash !== account.passwordHash) return invalid;

        await writeJSON(KEYS.session, account.id);
        setUser(toAuthUser(account));
        return { ok: true };
      } catch {
        return { ok: false, error: 'Could not sign in. Please try again.' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await removeKey(KEYS.session);
    } catch {
      // Ignore: the in-memory session is already cleared.
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, hasOnboarded, completeOnboarding, register, login, logout }),
    [user, loading, hasOnboarded, completeOnboarding, register, login, logout]
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
