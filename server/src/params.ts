import { Router } from 'express';

// Route params are interpolated straight into TMDB paths, and Express decodes
// them first — so `/api/media/movie/..%2F..%2Fsomething` would otherwise
// reach an arbitrary TMDB endpoint with our key. Every id-like param is a
// plain non-negative integer (season 0 is "Specials"), so reject the rest.
export function requireNumericParams(router: Router, ...names: string[]) {
  for (const name of names) {
    router.param(name, (_req, res, next, value) => {
      if (/^\d+$/.test(value)) return next();
      res.status(400).json({ error: `${name} must be a numeric id` });
    });
  }
}
