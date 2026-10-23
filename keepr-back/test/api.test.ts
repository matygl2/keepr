import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createPrisma } from '../src/lib/prisma';
import { defineApiTests } from './suite';

// Base de datos SOLO para los tests: se crea limpia y se borra al terminar.
const dbFile = path.resolve(process.cwd(), 'test.db');
const databaseUrl = `file:${dbFile.replace(/\\/g, '/')}`;

function removeDbFiles() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    fs.rmSync(dbFile + suffix, { force: true });
  }
}

defineApiTests(async () => {
  if (!fs.existsSync(path.resolve(process.cwd(), 'prisma/migrations'))) {
    throw new Error('No hay migraciones todavía. Corré primero: npx prisma migrate dev --name init');
  }
  removeDbFiles();
  // Crea las tablas en test.db aplicando tus migraciones.
  execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  const db = createPrisma(databaseUrl);
  return {
    db,
    teardown: async () => {
      await db.$disconnect();
      removeDbFiles();
    },
  };
});
