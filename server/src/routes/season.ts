import { Router, Request, Response } from 'express';
import { tmdbFetch } from '../tmdb';
import { sendError } from '../errors';
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
    sendError(req, res, err, 'Failed to fetch season details');
  }
});

export default router;
