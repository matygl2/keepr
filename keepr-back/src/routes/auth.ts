import bcrypt from 'bcryptjs';
import { Router } from 'express';
import type { AppConfig } from '../config';
import { HttpError, parse } from '../lib/errors';
import { toPublicUser } from '../lib/serialize';
import { requireAuth, signToken } from '../middleware/auth';
import { loginSchema, registerSchema } from '../schemas';

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

  return router;
}
