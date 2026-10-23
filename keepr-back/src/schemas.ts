import { z } from 'zod';
import { isValidISODate } from './lib/validation';

const isoDate = z.string().refine(isValidISODate, 'Use the format YYYY-MM-DD with a real date.');
const text = (max: number) => z.string().trim().max(max);

// ---------- Auth ----------

const password = z
  .string()
  .min(6, 'Use at least 6 characters.')
  // bcrypt solo mira los primeros 72 bytes: lo rechazamos en vez de truncar en silencio.
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password is too long (max 72 bytes).');

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.'));

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(200),
});

// ---------- Productos ----------

export const CATEGORIES = ['Tech', 'Home', 'Fashion', 'Other'] as const;

export const maintenanceInputSchema = z.object({
  date: isoDate,
  title: z.string().trim().min(1).max(120),
  provider: text(120).optional(),
  cost: z.number().int().min(0).max(2_000_000_000).optional(),
  type: z.enum(['purchase', 'maintenance']),
});

const productBase = z.object({
  name: z.string().trim().min(1, 'Enter the product name.').max(120),
  brand: text(80).optional(),
  model: text(80).optional(),
  category: z.enum(CATEGORIES),
  subCategory: text(80).optional(),
  icon: text(16).optional(),
  store: z.string().trim().min(1, 'Enter the store.').max(120),
  purchaseDate: isoDate,
  price: z.number().int().positive('Price must be greater than 0.').max(2_000_000_000),
  warrantyExpiryDate: isoDate,
  serialNumber: text(80).optional(),
  documentation: z
    .array(z.object({ name: z.string().trim().min(1).max(80), uploaded: z.boolean() }))
    .max(20)
    .optional(),
  calendarEventId: z.string().max(200).nullable().optional(),
});

export const createProductSchema = productBase
  .extend({ maintenanceHistory: z.array(maintenanceInputSchema).max(200).optional() })
  .refine((p) => p.warrantyExpiryDate > p.purchaseDate, {
    path: ['warrantyExpiryDate'],
    message: 'Warranty expiry must be after the purchase date.',
  });

// Sin .refine() a propósito: la comparación de fechas se hace en la ruta,
// porque en un PATCH puede venir solo una de las dos fechas.
export const updateProductSchema = productBase.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
