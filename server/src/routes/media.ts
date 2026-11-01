import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';

const router = Router();

// GET /api/media/:mediaType/:id
router.get('/:mediaType/:id', async (req: Request, res: Response) => {
  const { mediaType, id } = req.params;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  // TMDB caps append_to_response at 20 sub-resources; one call here replaces
  // what would otherwise be nine separate requests. TV uses aggregate_credits
  // instead of credits — it carries every episode's cast (hundreds of rows,
  // with roles[]/total_episode_count) rather than the ~8-person opening
  // credits list, and content_ratings/release_dates differ by media type.
  const append = mediaType === 'movie'
    ? 'credits,videos,keywords,recommendations,watch/providers,release_dates,external_ids'
    : 'aggregate_credits,videos,keywords,recommendations,watch/providers,content_ratings,external_ids';

  try {
    const data = await tmdbFetch(`/${mediaType}/${id}`, {
      language: 'en-US',
      append_to_response: append,
    });
    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch media details' });
  }
});

export default router;
