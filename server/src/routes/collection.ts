import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';

const router = Router();

// GET /api/collection/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await tmdbFetch(`/collection/${id}`, {
      language: 'en-US',
    });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch collection details' });
  }
});

export default router;
