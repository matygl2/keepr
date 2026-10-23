import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

/** Lee y valida el .env. Si algo falta, corta el arranque con un mensaje claro. */
export function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid .env configuration:');
    console.error(z.flattenError(result.error).fieldErrors);
    console.error('Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
  return result.data;
}
