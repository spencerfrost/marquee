import { Router, Request, Response } from 'express';
import { tmdbFetch } from '../tmdb';
import { sendError } from '../errors';
import { requireNumericParams } from '../params';

const router = Router();
requireNumericParams(router, 'id');

// GET /api/collection/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await tmdbFetch(`/collection/${id}`, {
      language: 'en-US',
    });
    res.json(data);
  } catch (err) {
    sendError(req, res, err, 'Failed to fetch collection details');
  }
});

export default router;
