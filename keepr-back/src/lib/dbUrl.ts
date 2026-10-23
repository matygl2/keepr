import path from 'node:path';

/**
 * Convierte "file:./dev.db" en una ruta absoluta (relativa a la carpeta desde
 * donde se ejecuta el proyecto) para que la CLI de Prisma y el servidor usen
 * siempre el mismo archivo. Mantener igual a la función de prisma7.config.ts.
 */
export function resolveDatabaseUrl(raw: string): string {
  if (!raw.startsWith('file:')) return raw;
  const filePath = raw.slice('file:'.length);
  if (path.isAbsolute(filePath)) return raw;
  return 'file:' + path.resolve(process.cwd(), filePath).replace(/\\/g, '/');
}
