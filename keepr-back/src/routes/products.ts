import express, { Router } from 'express';
import type { AppConfig } from '../config';
import { HttpError, parse } from '../lib/errors';
import {
  decodeReceipt,
  deleteReceipt,
  receiptContentType,
  receiptFilePath,
  RECEIPT_JSON_LIMIT,
  saveReceipt,
} from '../lib/receipts';
import { toProduct } from '../lib/serialize';
import {
  CATEGORIES,
  createProductSchema,
  maintenanceInputSchema,
  receiptUploadSchema,
  updateProductSchema,
} from '../schemas';

const CATEGORY_ICONS: Record<(typeof CATEGORIES)[number], string> = {
  Tech: '📱',
  Home: '🏠',
  Fashion: '👟',
  Other: '📦',
};

const DEFAULT_DOCUMENTATION = [
  { name: 'Receipt', uploaded: false },
  { name: 'Warranty document', uploaded: false },
  { name: 'Manual', uploaded: false },
];

const include = { maintenanceHistory: true } as const;

export function productsRouter(config: AppConfig) {
  const router = Router();
  const { db } = config;

  /** Busca un producto SOLO si es del usuario logueado; si no, 404 (no revela que existe). */
  async function getOwned(id: string, userId: string) {
    const product = await db.product.findFirst({ where: { id, userId }, include });
    if (!product) throw new HttpError(404, 'Product not found.');
    return product;
  }

  router.get('/', async (_req, res) => {
    const products = await db.product.findMany({
      where: { userId: res.locals.userId },
      include,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products: products.map(toProduct) });
  });

  router.post('/', async (req, res) => {
    const input = parse(createProductSchema, req.body);

    // Igual que en la app: si no se manda historial, se registra la compra.
    const history = input.maintenanceHistory ?? [
      {
        date: input.purchaseDate,
        title: 'Product purchased',
        provider: input.store,
        cost: input.price,
        type: 'purchase' as const,
      },
    ];

    const product = await db.product.create({
      data: {
        userId: res.locals.userId,
        name: input.name,
        brand: input.brand ?? '',
        model: input.model ?? '',
        category: input.category,
        subCategory: input.subCategory || input.category,
        icon: input.icon || CATEGORY_ICONS[input.category],
        store: input.store,
        purchaseDate: input.purchaseDate,
        price: input.price,
        warrantyExpiryDate: input.warrantyExpiryDate,
        serialNumber: input.serialNumber || 'N/A',
        documentation: input.documentation ?? DEFAULT_DOCUMENTATION,
        calendarEventId: input.calendarEventId ?? null,
        maintenanceHistory: {
          create: history.map((h) => ({
            date: h.date,
            title: h.title,
            provider: h.provider ?? '',
            cost: h.cost ?? 0,
            type: h.type,
          })),
        },
      },
      include,
    });

    res.status(201).json({ product: toProduct(product) });
  });

  router.get('/:id', async (req, res) => {
    const product = await getOwned(req.params.id, res.locals.userId);
    res.json({ product: toProduct(product) });
  });

  router.patch('/:id', async (req, res) => {
    const patch = parse(updateProductSchema, req.body);
    if (Object.keys(patch).length === 0) throw new HttpError(400, 'Nothing to update.');

    const current = await getOwned(req.params.id, res.locals.userId);

    // En un PATCH puede venir solo una de las dos fechas: comparamos contra la guardada.
    const purchase = patch.purchaseDate ?? current.purchaseDate;
    const expiry = patch.warrantyExpiryDate ?? current.warrantyExpiryDate;
    if (expiry <= purchase) {
      throw new HttpError(400, 'Invalid data.', {
        warrantyExpiryDate: ['Warranty expiry must be after the purchase date.'],
      });
    }

    const updated = await db.product.update({
      where: { id: current.id },
      data: patch,
      include,
    });
    res.json({ product: toProduct(updated) });
  });

  router.delete('/:id', async (req, res) => {
    const current = await getOwned(req.params.id, res.locals.userId);
    await db.product.delete({ where: { id: current.id } });
    if (current.receiptImage) await deleteReceipt(config.uploadsDir, current.receiptImage);
    res.status(204).end();
  });

  // Sube (o reemplaza) el recibo. Cuerpo: { "image": "<base64 de un JPEG o de un PDF>" }.
  // El campo se sigue llamando "image" para no romper la subida desde la cámara.
  router.put('/:id/receipt', express.json({ limit: RECEIPT_JSON_LIMIT }), async (req, res) => {
    const { image } = parse(receiptUploadSchema, req.body);
    const { bytes, extension } = decodeReceipt(image);
    const current = await getOwned(req.params.id, res.locals.userId);

    const fileName = await saveReceipt(config.uploadsDir, bytes, extension);
    try {
      const updated = await db.product.update({
        where: { id: current.id },
        data: { receiptImage: fileName },
        include,
      });
      if (current.receiptImage) await deleteReceipt(config.uploadsDir, current.receiptImage);
      res.json({ product: toProduct(updated) });
    } catch (err) {
      // Si no se pudo anotar en la base, no dejamos el archivo huérfano.
      await deleteReceipt(config.uploadsDir, fileName);
      throw err;
    }
  });

  // Devuelve el recibo (foto o PDF), solo a su dueño (la app manda el token en el header).
  router.get('/:id/receipt', async (req, res, next) => {
    const current = await getOwned(req.params.id, res.locals.userId);
    const file = current.receiptImage ? receiptFilePath(config.uploadsDir, current.receiptImage) : null;
    if (!file) throw new HttpError(404, 'This product has no receipt.');

    res.set('Cache-Control', 'private, max-age=3600');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.type(receiptContentType(file));
    res.sendFile(file, (err) => {
      if (err && !res.headersSent) next(new HttpError(404, 'Receipt not found.'));
    });
  });

  router.post('/:id/maintenance', async (req, res) => {
    const entry = parse(maintenanceInputSchema, req.body);
    const current = await getOwned(req.params.id, res.locals.userId);

    await db.maintenanceEntry.create({
      data: {
        productId: current.id,
        date: entry.date,
        title: entry.title,
        provider: entry.provider ?? '',
        cost: entry.cost ?? 0,
        type: entry.type,
      },
    });

    const product = await getOwned(current.id, res.locals.userId);
    res.status(201).json({ product: toProduct(product) });
  });

  return router;
}
