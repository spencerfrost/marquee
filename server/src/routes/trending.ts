import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';

const router = Router();

// One route fronts every landing-page rail instead of six near-identical
// route files. `list` is validated against this map rather than passed
// through to tmdbFetch, so the client can never reach an arbitrary path.
const LIST_PATHS: Record<string, string> = {
  'trending-week': '/trending/all/week',
  'movie-now-playing': '/movie/now_playing',
  'tv-on-the-air': '/tv/on_the_air',
  'movie-popular': '/movie/popular',
  'movie-top-rated': '/movie/top_rated',
  'movie-upcoming': '/movie/upcoming',
  'tv-popular': '/tv/popular',
  'tv-top-rated': '/tv/top_rated',
};

// GET /api/trending/:list
router.get('/:list', async (req: Request, res: Response) => {
  const { list } = req.params;
  const path = LIST_PATHS[list];

  if (!path) {
    return res.status(400).json({ error: `Unknown list "${list}"` });
  }

  try {
    const data = await tmdbFetch(path, { language: 'en-US', page: 1 });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch trending data' });
  }
});

export default router;
