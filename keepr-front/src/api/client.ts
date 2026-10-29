// Cliente HTTP de la API de Keepr.
// La URL base sale de EXPO_PUBLIC_API_URL (ver .env.local) y se lee al iniciar
// Expo: si la cambiás, reiniciá con `npx expo start -c`.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 10_000;

/** status 0 = no se pudo contactar al servidor (sin red, apagado, timeout). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Se llama cuando el servidor rechaza el token (vencido o inválido). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
  timeoutMs = TIMEOUT_MS
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      'The API address is not configured. Set EXPO_PUBLIC_API_URL in .env.local and restart Expo.'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let status: number;
  let ok: boolean;
  let text: string;
  try {
    const res = await fetch(BASE_URL + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    status = res.status;
    ok = res.ok;
    text = await res.text();
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Respuesta que no es JSON (por ejemplo, una página de error de un proxy).
    }
  }

  if (!ok) {
    if (status === 401 && auth) onUnauthorized?.();
    throw new ApiError(status, data?.error ?? `Request failed (${status}).`, data?.fields);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown, options: { auth?: boolean } = {}) =>
    request<T>('POST', path, body, options.auth ?? true),
  // timeoutMs: subir una foto por Wi-Fi lenta puede tardar más que un pedido normal.
  put: <T>(path: string, body: unknown, options: { timeoutMs?: number } = {}) =>
    request<T>('PUT', path, body, true, options.timeoutMs),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};

/** URL completa de una ruta de la API (para mostrar imágenes protegidas). */
export function apiUrl(path: string): string {
  return BASE_URL + path;
}

/** Header de autenticación actual, para pedidos que no pasan por `api` (como las imágenes). */
export function getAuthHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

/** Convierte cualquier error en un texto para mostrarle al usuario. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const firstFieldError = err.fields ? Object.values(err.fields).flat()[0] : undefined;
    return firstFieldError ?? err.message;
  }
  return 'Something went wrong. Please try again.';
}
