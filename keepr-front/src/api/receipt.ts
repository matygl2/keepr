import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Product } from '../types';
import { api, apiUrl, getAuthHeaders } from './client';

// Una foto de celular pesa varios MB. Para leer un ticket alcanza con ~1600 px
// de lado largo: la achicamos antes de subirla (más rápido y ocupa menos).
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;
const UPLOAD_TIMEOUT_MS = 30_000;

/** Achica la foto y la devuelve como JPEG en base64 (sin el prefijo "data:"). */
async function toBase64Jpeg(uri: string): Promise<string> {
  // maxWidth/maxHeight reducen la imagen mientras se decodifica: no se carga
  // la foto completa en memoria. Se mantiene la proporción.
  const rendered = await ImageManipulator.manipulate(uri, {
    maxWidth: MAX_SIDE,
    maxHeight: MAX_SIDE,
  }).renderAsync();
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
  const image = await toBase64Jpeg(photoUri);
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
