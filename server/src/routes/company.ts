import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';

const router = Router();

// GET /api/company/search?query=
router.get('/search', async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  try {
    const data = await tmdbFetch('/search/company', {
      query: query as string,
      page: 1,
    });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to search companies' });
  }
});

// GET /api/company/:id - Fetch company details by ID (for verification)
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'id parameter is required' });
  }

  try {
    const data = await tmdbFetch(`/company/${id}`);
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch company details' });
  }
});

export default router;