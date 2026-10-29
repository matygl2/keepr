import { Product } from '../types';

/**
 * Arma el cuerpo del PATCH /products/:id a partir de los cambios.
 * - Nunca manda `id`, `maintenanceHistory`, `documents` ni `receiptPhotoId` (el servidor no los
 *   acepta acá; las fotos se suben aparte con PUT /products/:id/documents/:tipo).
 * - `calendarEventId: undefined` se manda como `null`, que es como el servidor lo borra
 *   (JSON ignora los `undefined`, así que sin esto el campo nunca se limpiaría).
 */
export function toPatchBody(patch: Partial<Product>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (
      key === 'id' ||
      key === 'maintenanceHistory' ||
      key === 'documents' ||
      key === 'receiptPhotoId'
    ) {
      continue;
    }
    body[key] = value;
  }
  if ('calendarEventId' in patch && patch.calendarEventId === undefined) {
    body.calendarEventId = null;
  }
  return body;
}
