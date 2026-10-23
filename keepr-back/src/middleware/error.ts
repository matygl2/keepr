import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/errors';

export const notFound: RequestHandler = () => {
  throw new HttpError(404, 'Route not found.');
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.fields ? { fields: err.fields } : {}) });
    return;
  }

  // Errores de express.json() (JSON mal formado, cuerpo demasiado grande, etc.)
  const status = typeof err?.status === 'number' ? err.status : 500;
  if (status >= 400 && status < 500) {
    res.status(status).json({
      error: err.type === 'entity.parse.failed' ? 'Request body is not valid JSON.' : 'Bad request.',
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
};
