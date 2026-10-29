import express, { Router } from 'express';
import type { AppConfig } from '../config';
import { HttpError, parse } from '../lib/errors';
import {
  DOCUMENT_COLUMNS,
  DOCUMENT_NAMES,
  DocumentType,
  decodeDocument,
  deletePhoto,
  documentContentType,
  isDocumentType,
  photoFilePath,
  PHOTO_JSON_LIMIT,
  savePhoto,
} from '../lib/documents';
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

/** Parámetros de las rutas de documentos (`type` falta en el camino anterior `/:id/receipt`). */
interface DocParams {
  id: string;
  type?: string;
}

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
    for (const column of Object.values(DOCUMENT_COLUMNS)) {
      const fileName = current[column];
      if (fileName) await deletePhoto(config.uploadsDir, fileName);
    }
    res.status(204).end();
  });

  /** Tipo de documento de la ruta. `/:id/receipt` es el camino anterior: equivale a `receipt`. */
  function documentType(req: express.Request<DocParams>): DocumentType {
    const type = req.params.type ?? 'receipt';
    if (!isDocumentType(type)) throw new HttpError(404, 'Unknown document type.');
    return type;
  }

  /** Marca el documento como subido (o no) en la lista `documentation` del producto. */
  function withDocumentFlag(documentation: unknown, type: DocumentType, uploaded: boolean) {
    if (!Array.isArray(documentation)) return documentation;
    return documentation.map((d) =>
      d && typeof d === 'object' && (d as { name?: unknown }).name === DOCUMENT_NAMES[type]
        ? { ...d, uploaded }
        : d
    );
  }

  // Sube (o reemplaza) la foto o el PDF de un documento. Cuerpo: { "image": "<base64 de un JPEG o PDF>" }.
  const upload = async (req: express.Request<DocParams>, res: express.Response) => {
    const type = documentType(req);
    const column = DOCUMENT_COLUMNS[type];
    const { image } = parse(receiptUploadSchema, req.body);
    const { bytes, extension } = decodeDocument(image);
    const current = await getOwned(req.params.id, res.locals.userId);

    const fileName = await savePhoto(config.uploadsDir, bytes, extension);
    try {
      const updated = await db.product.update({
        where: { id: current.id },
        data: {
          [column]: fileName,
          documentation: withDocumentFlag(current.documentation, type, true) as any,
        },
        include,
      });
      const old = current[column];
      if (old) await deletePhoto(config.uploadsDir, old);
      res.json({ product: toProduct(updated) });
    } catch (err) {
      // Si no se pudo anotar en la base, no dejamos el archivo huérfano.
      await deletePhoto(config.uploadsDir, fileName);
      throw err;
    }
  };
  const bigJson = express.json({ limit: PHOTO_JSON_LIMIT });
  router.put('/:id/documents/:type', bigJson, upload);
  router.put('/:id/receipt', bigJson, upload);

  // Devuelve la foto, solo a su dueño (la app manda el token en el header).
  const download = async (
    req: express.Request<DocParams>,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const type = documentType(req);
    const current = await getOwned(req.params.id, res.locals.userId);
    const stored = current[DOCUMENT_COLUMNS[type]];
    const file = stored ? photoFilePath(config.uploadsDir, stored) : null;
    if (!file) throw new HttpError(404, 'This document has no photo.');

    res.set('Cache-Control', 'private, max-age=3600');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.type(documentContentType(file));
    res.sendFile(file, (err) => {
      if (err && !res.headersSent) next(new HttpError(404, 'Photo not found.'));
    });
  };
  router.get('/:id/documents/:type', download);
  router.get('/:id/receipt', download);

  // Quita la foto de un documento y devuelve el producto actualizado.
  router.delete('/:id/documents/:type', async (req, res) => {
    const type = documentType(req);
    const column = DOCUMENT_COLUMNS[type];
    const current = await getOwned(req.params.id, res.locals.userId);
    if (!current[column]) throw new HttpError(404, 'This document has no photo.');

    const updated = await db.product.update({
      where: { id: current.id },
      data: {
        [column]: null,
        documentation: withDocumentFlag(current.documentation, type, false) as any,
      },
      include,
    });
    await deletePhoto(config.uploadsDir, current[column]!);
    res.json({ product: toProduct(updated) });
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
