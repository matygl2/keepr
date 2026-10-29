import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from './errors';

/** Los tres documentos que puede tener un producto, y dónde se guarda cada uno. */
export const DOCUMENT_TYPES = ['receipt', 'warranty', 'manual'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_COLUMNS = {
  receipt: 'receiptImage',
  warranty: 'warrantyImage',
  manual: 'manualImage',
} as const satisfies Record<DocumentType, string>;

/** Nombre del documento en la lista `documentation` del producto. */
export const DOCUMENT_NAMES: Record<DocumentType, string> = {
  receipt: 'Receipt',
  warranty: 'Warranty document',
  manual: 'Manual',
};

export function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

/** Tamaño máximo del archivo (foto o PDF) ya decodificado. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Límite del cuerpo JSON de la subida: el base64 pesa ~33% más que la imagen.
 * 7 MB cubre una foto de 5 MB en base64 (~6,7 MB) con margen.
 */
export const PHOTO_JSON_LIMIT = '7mb';

/** Formatos aceptados para un documento: foto JPEG o PDF. */
export type DocumentExtension = 'jpg' | 'pdf';

// Los nombres de archivo los genera el servidor (UUID + extensión). Se vuelven a
// validar antes de tocar el disco para que nunca se pueda salir de la carpeta de fotos.
const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|pdf)$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Convierte el base64 recibido en bytes y comprueba que sea un JPEG o un PDF de tamaño
 * razonable. No se confía en lo que diga el cliente: se mira el contenido real.
 */
export function decodeDocument(base64: string): { bytes: Buffer; extension: DocumentExtension } {
  const fail = (message: string): never => {
    throw new HttpError(400, 'Invalid data.', { image: [message] });
  };

  if (base64.startsWith('data:')) fail('Send the raw base64 data, without the "data:" prefix.');
  if (base64.length % 4 !== 0 || !BASE64.test(base64)) fail('The file is not valid base64.');

  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > MAX_PHOTO_BYTES) {
    fail(`The file is too large (max ${MAX_PHOTO_BYTES / 1024 / 1024} MB).`);
  }
  // Los JPEG empiezan con los bytes FF D8 FF; los PDF, con el texto "%PDF-".
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { bytes, extension: 'jpg' };
  }
  if (bytes.subarray(0, 5).toString('latin1') === '%PDF-') {
    return { bytes, extension: 'pdf' };
  }
  return fail('Only JPEG images or PDF files are accepted.');
}

/** Guarda el archivo en `dir` con un nombre nuevo y devuelve ese nombre. */
export async function savePhoto(
  dir: string,
  bytes: Buffer,
  extension: DocumentExtension
): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(dir, fileName), bytes, { flag: 'wx' });
  return fileName;
}

/** Borra una foto. Si ya no existe o el nombre no es válido, no hace nada. */
export async function deletePhoto(dir: string, fileName: string): Promise<void> {
  if (!FILE_NAME.test(fileName)) return;
  await fs.rm(path.join(dir, fileName), { force: true }).catch(() => {});
}

/** Ruta absoluta de una foto guardada, o null si el nombre no es válido. */
export function photoFilePath(dir: string, fileName: string): string | null {
  return FILE_NAME.test(fileName) ? path.resolve(dir, fileName) : null;
}

/** Tipo de contenido con el que se devuelve el archivo según su extensión. */
export function documentContentType(fileName: string): 'application/pdf' | 'image/jpeg' {
  return fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
}
