import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';

const router = Router();

// GET /api/person/search?query=
// Must come before /:id so "search" isn't swallowed as a person id.
router.get('/search', async (req: Request, res: Response) => {
  const { query, page } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  try {
    const data = await tmdbFetch('/search/person', {
      query: query as string,
      page: (page as string) || '1',
      include_adult: 'false',
      language: 'en-US',
    });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to search people' });
  }
});

// GET /api/person/:id/tv_credits
// /discover/tv has no with_people equivalent, so TV person filtering falls
// back to rendering this credits list directly instead of narrowing a grid.
router.get('/:id/tv_credits', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await tmdbFetch(`/person/${id}/tv_credits`, {
      language: 'en-US',
    });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch TV credits' });
  }
});

// GET /api/person/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await tmdbFetch(`/person/${id}`, {
      language: 'en-US',
      append_to_response: 'combined_credits',
    });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch person details' });
  }
});

export default router;
