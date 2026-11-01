import { Router, Request, Response } from 'express';
import { tmdbFetch } from '../tmdb';
import { sendError } from '../errors';

const router = Router();

// GET /api/search/multi?query=&page=
// Combined movie/tv/person search, each row tagged with media_type.
router.get('/multi', async (req: Request, res: Response) => {
  const { query, page } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  try {
    const data = await tmdbFetch('/search/multi', {
      query: query as string,
      page: (page as string) || '1',
      include_adult: 'false',
      language: 'en-US',
    });
    res.json(data);
  } catch (err) {
    sendError(req, res, err, 'Failed to search');
  }
});

export default router;
