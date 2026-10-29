import bcrypt from 'bcryptjs';
import { Router } from 'express';
import type { AppConfig } from '../config';
import { DOCUMENT_COLUMNS, deletePhoto } from '../lib/documents';
import { HttpError, parse } from '../lib/errors';
import { toPublicUser } from '../lib/serialize';
import { requireAuth, signToken } from '../middleware/auth';
import { changePasswordSchema, deleteAccountSchema, loginSchema, registerSchema } from '../schemas';

/** Prisma marca con P2002 las violaciones de campos @unique. */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

export function authRouter(config: AppConfig) {
  const router = Router();

  // Hash falso para gastar el mismo tiempo cuando el email no existe, así no se
  // puede descubrir qué emails están registrados midiendo la demora del login.
  const dummyHash = bcrypt.hashSync('not-a-real-password', config.bcryptCost);

  router.post('/register', async (req, res) => {
    const { name, email, password } = parse(registerSchema, req.body);

    const existing = await config.db.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, 'An account with this email already exists.');

    const passwordHash = await bcrypt.hash(password, config.bcryptCost);
    try {
      const user = await config.db.user.create({ data: { name, email, passwordHash } });
      res.status(201).json({ token: signToken(user.id, config), user: toPublicUser(user) });
    } catch (err) {
      // Dos registros simultáneos con el mismo email: gana uno y el otro cae acá.
      if (isUniqueViolation(err)) throw new HttpError(409, 'An account with this email already exists.');
      throw err;
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);

    const user = await config.db.user.findUnique({ where: { email } });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
    if (!user || !valid) throw new HttpError(401, 'Incorrect email or password.');

    res.json({ token: signToken(user.id, config), user: toPublicUser(user) });
  });

  router.get('/me', requireAuth(config), async (_req, res) => {
    const user = await config.db.user.findUnique({ where: { id: res.locals.userId } });
    if (!user) throw new HttpError(401, 'Invalid or expired session.');
    res.json({ user: toPublicUser(user) });
  });

  // Cambia la contraseña de quien tiene la sesión abierta. Pide la actual para que
  // nadie que encuentre el teléfono desbloqueado pueda cambiarla sin conocerla.
  router.post('/change-password', requireAuth(config), async (req, res) => {
    const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);

    const user = await config.db.user.findUnique({ where: { id: res.locals.userId } });
    if (!user) throw new HttpError(401, 'Invalid or expired session.');

    // OJO: una contraseña actual incorrecta NO devuelve 401. La app interpreta
    // cualquier 401 como "la sesión venció" y cerraría la sesión del usuario.
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new HttpError(400, 'Invalid data.', { currentPassword: ['Incorrect current password.'] });
    }
    if (currentPassword === newPassword) {
      throw new HttpError(400, 'Invalid data.', {
        newPassword: ['Choose a password different from the current one.'],
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptCost);
    await config.db.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.status(204).end();
  });

  // Borra la cuenta y TODO lo que tiene: productos, mantenimientos y los archivos subidos.
  // Pide la contraseña para que nadie con el teléfono desbloqueado pueda borrarla por error o a propósito.
  router.post('/delete-account', requireAuth(config), async (req, res) => {
    const { password } = parse(deleteAccountSchema, req.body);

    const user = await config.db.user.findUnique({ where: { id: res.locals.userId } });
    if (!user) throw new HttpError(401, 'Invalid or expired session.');

    // Igual que en change-password: contraseña incorrecta = 400, nunca 401 (la app cerraría la sesión).
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(400, 'Invalid data.', { password: ['Incorrect password.'] });
    }

    // Anotamos los archivos ANTES de borrar: después ya no sabríamos cuáles eran.
    const products = await config.db.product.findMany({
      where: { userId: user.id },
      select: { receiptImage: true, warrantyImage: true, manualImage: true },
    });

    // Los productos y sus mantenimientos se borran solos (onDelete: Cascade en el esquema).
    await config.db.user.delete({ where: { id: user.id } });

    // Primero la base, después el disco (igual que al borrar un producto): si un archivo
    // no se puede borrar, no se bloquea la eliminación de la cuenta.
    for (const product of products) {
      for (const column of Object.values(DOCUMENT_COLUMNS)) {
        const fileName = product[column];
        if (fileName) await deletePhoto(config.uploadsDir, fileName);
      }
    }
    res.status(204).end();
  });

  return router;
}
