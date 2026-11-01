import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';
import { requireNumericParams } from '../params';

const router = Router();
requireNumericParams(router, 'seriesId', 'seasonNumber');

// GET /api/tv/:seriesId/season/:seasonNumber
router.get('/:seriesId/season/:seasonNumber', async (req: Request, res: Response) => {
  const { seriesId, seasonNumber } = req.params;

  try {
    const data = await tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}`, {
      language: 'en-US',
    });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch season details' });
  }
});

export default router;
