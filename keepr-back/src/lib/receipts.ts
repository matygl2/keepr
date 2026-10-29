import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from './errors';

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;


export const RECEIPT_JSON_LIMIT = '7mb';

export type ReceiptExtension = 'jpg' | 'pdf';

const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|pdf)$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function decodeReceipt(base64: string): { bytes: Buffer; extension: ReceiptExtension } {
  const fail = (message: string): never => {
    throw new HttpError(400, 'Invalid data.', { image: [message] });
  };

  if (base64.startsWith('data:')) fail('Send the raw base64 data, without the "data:" prefix.');
  if (base64.length % 4 !== 0 || !BASE64.test(base64)) fail('The file is not valid base64.');

  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > MAX_RECEIPT_BYTES) {
    fail(`The file is too large (max ${MAX_RECEIPT_BYTES / 1024 / 1024} MB).`);
  }
  // Los JPEG empiezan con FF D8 FF; los PDF, con el texto "%PDF-".
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { bytes, extension: 'jpg' };
  }
  if (bytes.subarray(0, 5).toString('latin1') === '%PDF-') {
    return { bytes, extension: 'pdf' };
  }
  return fail('Only JPEG images or PDF files are accepted.');
}

export async function saveReceipt(
  dir: string,
  bytes: Buffer,
  extension: ReceiptExtension
): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(dir, fileName), bytes, { flag: 'wx' });
  return fileName;
}

/** Borra un recibo. Si ya no existe o el nombre no es válido, no hace nada. */
export async function deleteReceipt(dir: string, fileName: string): Promise<void> {
  if (!FILE_NAME.test(fileName)) return;
  await fs.rm(path.join(dir, fileName), { force: true }).catch(() => {});
}

export function receiptFilePath(dir: string, fileName: string): string | null {
  return FILE_NAME.test(fileName) ? path.resolve(dir, fileName) : null;
}

export function receiptContentType(fileName: string): 'application/pdf' | 'image/jpeg' {
  return fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
}
