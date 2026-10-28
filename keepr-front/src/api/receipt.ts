import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Product } from '../types';
import { api, apiUrl, getAuthHeaders } from './client';

const JPEG_QUALITY = 0.6;
const UPLOAD_TIMEOUT_MS = 30_000;

// La cámara ya entrega la foto comprimida en base64 (ver scan.tsx). La guardamos
// acá, identificada por el nombre del archivo, para no depender de volver a abrir el archivo.
const capturedData = new Map<string, string>();
// Ruta original tal como la entregó la cámara (la navegación la puede alterar).
const capturedUris = new Map<string, string>();

// Identificamos la foto por el nombre del archivo (un UUID único), no por la ruta
// completa: la navegación puede codificar o decodificar partes de la ruta.
function photoKey(uri: string): string {
  return (uri.split(/\/|%2F/i).pop() ?? uri).toLowerCase();
}

/** Registra el base64 de una foto recién sacada con la cámara. */
export function rememberCapturedPhoto(uri: string, base64: string) {
  capturedData.clear(); // solo hace falta la última foto
  capturedUris.clear();
  capturedData.set(photoKey(uri), base64);
  capturedUris.set(photoKey(uri), uri);
}

/**
 * Al pasar la ruta de la foto por los parámetros de navegación, Expo Router la
 * decodifica y queda apuntando a un archivo que no existe (%2540 -> %40). Si es una
 * foto recién sacada, devuelve la ruta original; si no, la misma que recibió.
 */
export function resolvePhotoUri(uri: string): string {
  return capturedUris.get(photoKey(uri)) ?? uri;
}

/** Respaldo: achica la foto con expo-image-manipulator y la devuelve en base64. */
async function toBase64Jpeg(uri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });
  if (!result.base64) throw new Error('Could not prepare the photo.');
  return result.base64;
}

/** Sube (o reemplaza) la foto de la garantía de un producto. Devuelve el producto actualizado. */
export async function uploadReceipt(productId: string, photoUri: string): Promise<Product> {
  let image = capturedData.get(photoKey(photoUri));
  if (!image) {
    try {
      image = await toBase64Jpeg(photoUri);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Could not prepare the photo (${detail})`);
    }
  }
  const { product } = await api.put<{ product: Product }>(
    `/products/${productId}/receipt`,
    { image },
    { timeoutMs: UPLOAD_TIMEOUT_MS }
  );
  return product;
}

/**
 * Fuente para <Image> de expo-image. La foto es privada: se pide con el token.
 * `photoId` cambia al reemplazar la foto, así no se muestra una versión vieja de la caché.
 */
export function receiptImageSource(productId: string, photoId: string) {
  return {
    uri: apiUrl(`/products/${productId}/receipt?v=${photoId}`),
    headers: getAuthHeaders(),
    cacheKey: `receipt-${productId}-${photoId}`,
  };
}
