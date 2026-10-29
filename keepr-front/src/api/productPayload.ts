import { Product } from '../types';

/**
 * Arma el cuerpo del PATCH /products/:id a partir de los cambios.
 * - Nunca manda `id`, `maintenanceHistory`, `receiptPhotoId` ni `receiptType` (el servidor no
 *   los acepta acá; el recibo se sube aparte con PUT /products/:id/receipt).
 * - `calendarEventId: undefined` se manda como `null`, que es como el servidor lo borra
 *   (JSON ignora los `undefined`, así que sin esto el campo nunca se limpiaría).
 */
const NEVER_SENT = ['id', 'maintenanceHistory', 'receiptPhotoId', 'receiptType'];

export function toPatchBody(patch: Partial<Product>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (NEVER_SENT.includes(key)) continue;
    body[key] = value;
  }
  if ('calendarEventId' in patch && patch.calendarEventId === undefined) {
    body.calendarEventId = null;
  }
  return body;
}
