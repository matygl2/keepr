import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { AppConfig } from './config';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFound } from './middleware/error';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';

export interface AppOptions {
  db: AppConfig['db'];
  jwtSecret: string;
  jwtExpiresInSeconds?: number;
  bcryptCost?: number;
  /** Carpeta de las fotos de garantías (por defecto ./uploads). */
  uploadsDir?: string;
  /** Limita intentos de login/registro por IP. Se desactiva solo en los tests. */
  rateLimit?: boolean;
}

export function createApp(options: AppOptions) {
  const config: AppConfig = {
    db: options.db,
    jwtSecret: options.jwtSecret,
    jwtExpiresInSeconds: options.jwtExpiresInSeconds ?? 60 * 60 * 24 * 7, // 7 días
    bcryptCost: options.bcryptCost ?? 12,
    uploadsDir: options.uploadsDir ?? path.resolve(process.cwd(), 'uploads'),
  };

  const app = express();
  app.use(helmet());
  app.use(cors()); // La API usa tokens en el header (no cookies), por eso se puede abrir.

  // Cuerpos chicos en todas las rutas, salvo la subida de fotos (PUT .../receipt),
  // que lleva su propio límite más grande y se activa recién DESPUÉS de comprobar
  // el login (ver routes/products.ts), así nadie sin sesión puede mandar 7 MB.
  const smallJson = express.json({ limit: '100kb' });
  const isReceiptUpload = (req: express.Request) =>
    req.method === 'PUT' && /^\/products\/[^/]+\/receipt\/?$/.test(req.path);
  app.use((req, res, next) => (isReceiptUpload(req) ? next() : smallJson(req, res, next)));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  if (options.rateLimit !== false) {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many attempts. Try again in a few minutes.' },
    });
    app.use(['/auth/register', '/auth/login'], authLimiter);
  }

  app.use('/auth', authRouter(config));
  app.use('/products', requireAuth(config), productsRouter(config));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
