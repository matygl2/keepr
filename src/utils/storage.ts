import AsyncStorage from '@react-native-async-storage/async-storage';

/** Every AsyncStorage key used by Keepr lives here so they never collide. */
export const KEYS = {
  onboarded: 'keepr:onboarded',
  accounts: 'keepr:accounts',
  session: 'keepr:session',
  products: (userId: string) => `keepr:products:${userId}`,
};

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
