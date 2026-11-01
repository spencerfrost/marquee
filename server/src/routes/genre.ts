import { Router, Request, Response } from 'express';
import { tmdbFetch } from '../tmdb';
import { sendError } from '../errors';

const router = Router();

// GET /api/genre/:mediaType  (mediaType = 'movie' | 'tv')
router.get('/:mediaType', async (req: Request, res: Response) => {
  const { mediaType } = req.params;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const data = await tmdbFetch(`/genre/${mediaType}/list`, { language: 'en-US' });
    res.json(data);
  } catch (err) {
    sendError(req, res, err, 'Failed to fetch genres');
  }
});

export default router;