import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from './errors';

/** Tamaño máximo de la foto ya decodificada. */
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/**
 * Límite del cuerpo JSON de la subida: el base64 pesa ~33% más que la imagen.
 * 7 MB cubre una foto de 5 MB en base64 (~6,7 MB) con margen.
 */
export const RECEIPT_JSON_LIMIT = '7mb';

// Los nombres de archivo los genera el servidor (UUID). Se vuelven a validar
// antes de tocar el disco para que nunca se pueda salir de la carpeta de fotos.
const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Convierte el base64 recibido en bytes y comprueba que sea un JPEG de tamaño
 * razonable. No se confía en lo que diga el cliente: se mira el contenido real.
 */
export function decodeJpeg(base64: string): Buffer {
  const fail = (message: string): never => {
    throw new HttpError(400, 'Invalid data.', { image: [message] });
  };

  if (base64.startsWith('data:')) fail('Send the raw base64 data, without the "data:" prefix.');
  if (base64.length % 4 !== 0 || !BASE64.test(base64)) fail('The image is not valid base64.');

  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > MAX_RECEIPT_BYTES) {
    fail(`The image is too large (max ${MAX_RECEIPT_BYTES / 1024 / 1024} MB).`);
  }
  // Los JPEG empiezan siempre con los bytes FF D8 FF.
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    fail('Only JPEG images are accepted.');
  }
  return bytes;
}

/** Guarda la foto en `dir` con un nombre nuevo y devuelve ese nombre. */
export async function saveReceipt(dir: string, bytes: Buffer): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}.jpg`;
  await fs.writeFile(path.join(dir, fileName), bytes, { flag: 'wx' });
  return fileName;
}

/** Borra una foto. Si ya no existe o el nombre no es válido, no hace nada. */
export async function deleteReceipt(dir: string, fileName: string): Promise<void> {
  if (!FILE_NAME.test(fileName)) return;
  await fs.rm(path.join(dir, fileName), { force: true }).catch(() => {});
}

/** Ruta absoluta de una foto guardada, o null si el nombre no es válido. */
export function receiptFilePath(dir: string, fileName: string): string | null {
  return FILE_NAME.test(fileName) ? path.resolve(dir, fileName) : null;
}
