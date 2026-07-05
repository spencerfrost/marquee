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

  const { searchQuery, year, minRating, sortBy, genreIds, companyIds, networkIds, page } = req.query;

  try {
    const yearKey = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    const sort = (sortBy as string) || 'popularity.desc';

    // TMDB rejects pages outside 1-500
    const parsedPage = parseInt(page as string, 10);
    const pageNumber = Number.isNaN(parsedPage) ? 1 : Math.min(Math.max(parsedPage, 1), 500);

    // Rating sort needs a vote floor, or one-vote 10/10 obscurities rank first
    const voteFloor = sort.startsWith('vote_average')
      ? (mediaType === 'movie' ? '200' : '50')
      : undefined;

    const data = await tmdbFetch(`/discover/${mediaType}`, {
      language: 'en-US',
      sort_by: sort,
      'vote_count.gte': voteFloor,
      include_adult: 'false',
      include_video: 'false',
      page: pageNumber,
      with_original_language: 'en',
      [yearKey]: year as string | undefined,
      'vote_average.gte': minRating as string | undefined,
      with_genres: genreIds as string | undefined,
      with_companies: companyIds as string | undefined,
      // TV-only: TMDB ignores with_networks on /discover/movie, and the
      // client only sends it for tv.
      with_networks: networkIds as string | undefined,
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