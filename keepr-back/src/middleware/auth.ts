import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { AppConfig } from '../config';
import { HttpError } from '../lib/errors';

export function signToken(userId: string, config: AppConfig): string {
  return jwt.sign({}, config.jwtSecret, {
    subject: userId,
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresInSeconds,
  });
}

/** Exige "Authorization: Bearer <token>" y deja el id del usuario en res.locals.userId. */
export function requireAuth(config: AppConfig): RequestHandler {
  return async (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Authentication required.');
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload.sub) throw new Error('bad payload');
      userId = payload.sub;
    } catch {
      throw new HttpError(401, 'Invalid or expired session.');
    }

    // El token puede ser válido pero la cuenta ya no existir.
    const user = await config.db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new HttpError(401, 'Invalid or expired session.');

    res.locals.userId = userId;
    next();
  };
}
