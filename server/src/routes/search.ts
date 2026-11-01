import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';

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
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to search' });
  }
});

export default router;
