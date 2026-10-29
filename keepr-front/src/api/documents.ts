import { File, Paths } from 'expo-file-system';
import { DocumentType, Product } from '../types';
import { api, apiUrl, getAuthHeaders } from './client';

const UPLOAD_TIMEOUT_MS = 30_000;

/** Los tres documentos de un producto, en el orden en que se muestran. */
export const DOCUMENT_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'receipt', label: 'Receipt' },
  { type: 'warranty', label: 'Warranty document' },
  { type: 'manual', label: 'Manual' },
];

/** Sube (o reemplaza) la foto de un documento. `image` es un JPEG en base64, sin el prefijo "data:". */
export async function uploadDocument(
  productId: string,
  type: DocumentType,
  image: string
): Promise<Product> {
  const { product } = await api.put<{ product: Product }>(
    `/products/${productId}/documents/${type}`,
    { image },
    { timeoutMs: UPLOAD_TIMEOUT_MS }
  );
  return product;
}

/** Quita la foto de un documento. Devuelve el producto actualizado. */
export async function removeDocument(productId: string, type: DocumentType): Promise<Product> {
  const { product } = await api.delete<{ product: Product }>(`/products/${productId}/documents/${type}`);
  return product;
}

/**
 * Fuente para <Image> de expo-image. La foto es privada: se pide con el token.
 * `photoId` cambia al reemplazar la foto, así no se muestra una versión vieja de la caché.
 */
export function documentImageSource(productId: string, type: DocumentType, photoId: string) {
  return {
    uri: apiUrl(`/products/${productId}/documents/${type}?v=${photoId}`),
    headers: getAuthHeaders(),
    cacheKey: `document-${productId}-${type}-${photoId}`,
  };
}

/** Lee un archivo del teléfono (por ejemplo un PDF elegido) y lo devuelve en base64. */
export async function readFileBase64(uri: string): Promise<string> {
  try {
    return await new File(uri).base64();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not read the file (${detail})`);
  }
}

/** Descarga el PDF de un documento a la caché con el token (es privado) y devuelve la ruta local. */
export async function downloadDocumentPdf(
  productId: string,
  type: DocumentType,
  photoId: string
): Promise<string> {
  const destination = new File(Paths.cache, `keepr-${type}-${photoId}.pdf`);
  const file = await File.downloadFileAsync(
    apiUrl(`/products/${productId}/documents/${type}?v=${photoId}`),
    destination,
    { headers: getAuthHeaders(), idempotent: true }
  );
  return file.uri;
}
