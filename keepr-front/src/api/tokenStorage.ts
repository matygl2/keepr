import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore guarda el token cifrado en el Keychain (iOS) / Keystore (Android).
// No funciona en web, así que ahí se usa AsyncStorage como alternativa.
const TOKEN_KEY = 'keepr_auth_token';
const useSecureStore = Platform.OS !== 'web';

export async function getToken(): Promise<string | null> {
  try {
    return useSecureStore
      ? await SecureStore.getItemAsync(TOKEN_KEY)
      : await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Lanza un error si no se pudo guardar (para no dejar una sesión "fantasma"). */
export async function saveToken(token: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (useSecureStore) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Si falla el borrado, igual se cierra la sesión en memoria.
  }
}
