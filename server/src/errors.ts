import { Request, Response } from 'express';
import { TMDBError } from './tmdb';

// Shared route catch handler: logs the real error (so it reaches the PM2
// logs) and sends the client a generic message. TMDB errors keep TMDB's
// status; anything else gets `fallbackStatus`. no-store overrides the
// Cache-Control set in index.ts so browsers don't cache a failure.
export function sendError(
  req: Request,
  res: Response,
  err: unknown,
  message: string,
  fallbackStatus = 500
) {
  console.error(`${req.method} ${req.originalUrl} — ${message}:`, err);
  const status = err instanceof TMDBError ? err.status : fallbackStatus;
  res.set('Cache-Control', 'no-store').status(status).json({ error: message });
}
