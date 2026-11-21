import { Router, Request, Response } from 'express';
import { tmdbFetch } from '../tmdb';
import { sendError } from '../errors';
import { requireNumericParams } from '../params';

const router = Router();
requireNumericParams(router, 'seriesId', 'seasonNumber');

// GET /api/tv/:seriesId/seasons?numbers=1,2,3
// Up to 20 seasons in one TMDB call via append_to_response (TMDB's cap), so
// the episode heatmap costs one request per 20 seasons instead of one per
// season. Returns the series object with `season/N` keys, untouched.
const MAX_BATCH = 20;
router.get('/:seriesId/seasons', async (req: Request, res: Response) => {
  const { seriesId } = req.params;
  const numbers = String(req.query.numbers ?? '').split(',').filter(Boolean);

  if (numbers.length === 0 || numbers.length > MAX_BATCH || !numbers.every((n) => /^\d+$/.test(n))) {
    return res.status(400).json({ error: `numbers must be 1-${MAX_BATCH} comma-separated season numbers` });
  }

  try {
    const data = await tmdbFetch(`/tv/${seriesId}`, {
      language: 'en-US',
      append_to_response: numbers.map((n) => `season/${n}`).join(','),
    });
    res.json(data);
  } catch (err) {
    sendError(req, res, err, 'Failed to fetch seasons');
  }
});

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
