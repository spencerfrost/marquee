import { Router, Request, Response } from 'express';
import { tmdbFetch, TMDBError } from '../tmdb';

const router = Router();

// GET /api/discover-filtered/:mediaType
// Experimental: layers in the undocumented `with_text_query` param to combine
// free-text search with full discover-style filters in a single request.
// See MARQ-142. If TMDB changes/drops this param, delete this file and the
// corresponding client function (fetchDiscoverMediaWithFilters) — nothing
// else in the app depends on this path.
router.get('/:mediaType', async (req: Request, res: Response) => {
  const { mediaType } = req.params;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  const { searchQuery, year, minRating, sortBy, genreIds, companyIds } = req.query;

  try {
    const yearKey = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';

    const data = await tmdbFetch(`/discover/${mediaType}`, {
      language: 'en-US',
      sort_by: (sortBy as string) || 'popularity.desc',
      include_adult: 'false',
      include_video: 'false',
      page: 1,
      with_original_language: 'en',
      [yearKey]: year as string | undefined,
      'vote_average.gte': minRating as string | undefined,
      with_genres: genreIds as string | undefined,
      with_companies: companyIds as string | undefined,
      // Undocumented param — combines free text with discover filters.
      // This is the experimental piece; everything else above is
      // standard, documented /discover behavior.
      with_text_query: searchQuery as string | undefined,
    });

    res.json(data);
  } catch (err) {
    const status = err instanceof TMDBError ? err.status : 500;
    res.status(status).json({ error: 'Failed to fetch filtered discover data' });
  }
});

export default router;