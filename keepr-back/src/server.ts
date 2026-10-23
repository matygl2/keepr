import { networkInterfaces } from 'node:os';
import { createApp } from './app';
import { loadEnv } from './env';
import { createPrisma } from './lib/prisma';

const env = loadEnv();
const db = createPrisma(env.DATABASE_URL);
const app = createApp({ db, jwtSecret: env.JWT_SECRET });

// 0.0.0.0 para que el celular (misma Wi-Fi) pueda llegar al servidor.
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Keepr API listening on port ${env.PORT}`);
  console.log(`  Local:      http://localhost:${env.PORT}`);
  console.log(`  Android emu: http://10.0.2.2:${env.PORT}`);
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  Red local:  http://${net.address}:${env.PORT}   <- usá esta en un celular real`);
      }
    }
  }
});

async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
