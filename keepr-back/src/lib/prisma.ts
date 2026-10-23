import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client';
import { resolveDatabaseUrl } from './dbUrl';

export type Db = PrismaClient;

export function createPrisma(databaseUrl: string): Db {
  const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl(databaseUrl) });
  return new PrismaClient({ adapter });
}
