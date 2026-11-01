import { Router, Request, Response } from 'express';
import { tmdbFetch } from '../tmdb';
import { sendError } from '../errors';

const router = Router();

// GET /api/watch-providers/regions
// Must come before /:mediaType so "regions" isn't swallowed as a media type.
router.get('/regions', async (req: Request, res: Response) => {
  try {
    const data = await tmdbFetch('/watch/providers/regions', { language: 'en-US' });
    res.json(data);
  } catch (err) {
    sendError(req, res, err, 'Failed to fetch watch provider regions');
  }
});

// GET /api/watch-providers/:mediaType?watch_region=CA
router.get('/:mediaType', async (req: Request, res: Response) => {
  const { mediaType } = req.params;
  const { watch_region } = req.query;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const data = await tmdbFetch(`/watch/providers/${mediaType}`, {
      language: 'en-US',
      watch_region: watch_region as string | undefined,
    });
    res.json(data);
  } catch (err) {
    sendError(req, res, err, 'Failed to fetch watch providers');
  }
});

export default router;
