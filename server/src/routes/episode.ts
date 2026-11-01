import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';
import { requireNumericParams } from '../params';

const router = Router();
requireNumericParams(router, 'seriesId', 'seasonNumber', 'episodeNumber');

// GET /api/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber
router.get(
  '/:seriesId/season/:seasonNumber/episode/:episodeNumber',
  async (req: Request, res: Response) => {
    const { seriesId, seasonNumber, episodeNumber } = req.params;

    try {
      const data = await tmdbFetch(
        `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
        { append_to_response: 'credits,images' }
      );
      res.json(data);
    } catch (err) {
      const status = err instanceof TMDBError ? err.status : 500;
      res.status(status).json({ error: 'Failed to fetch episode details' });
    }
  }
);

export default router;
