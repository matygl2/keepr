import type { Db } from './lib/prisma';

/** Dependencias que reciben las rutas (así se pueden probar con otra base). */
export interface AppConfig {
  db: Db;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  bcryptCost: number;
  /** Carpeta donde se guardan las fotos de las garantías. */
  uploadsDir: string;
}
