import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Misma lógica que src/lib/dbUrl.ts (se repite acá a propósito para que la
// configuración de Prisma no dependa de ningún otro archivo). Convierte
// "file:./dev.db" en una ruta absoluta para que la CLI de Prisma y el servidor
// siempre usen EL MISMO archivo, sin importar desde qué carpeta se ejecuten.
function resolveDatabaseUrl(raw: string = "file:./dev.db"): string {
  if (!raw.startsWith("file:")) return raw;
  const filePath = raw.slice("file:".length);
  if (path.isAbsolute(filePath)) return raw;
  return "file:" + path.resolve(process.cwd(), filePath).replace(/\\/g, "/");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDatabaseUrl(process.env["DATABASE_URL"]),
  },
});
