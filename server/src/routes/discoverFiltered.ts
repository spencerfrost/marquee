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

  const {
    searchQuery, dateFrom, dateTo, minRating, minVoteCount, sortBy,
    genreIds, companyIds, networkIds, page,
    originalLanguage, originCountry, certification,
    runtimeMin, runtimeMax, tvTypes, tvStatuses,
    keywordIds, excludeKeywordIds, personIds,
    watchProviderIds, watchRegion,
  } = req.query;

  try {
    const dateFromKey = mediaType === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte';
    const dateToKey = mediaType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte';
    const sort = (sortBy as string) || 'popularity.desc';

    // TMDB rejects pages outside 1-500
    const parsedPage = parseInt(page as string, 10);
    const pageNumber = Number.isNaN(parsedPage) ? 1 : Math.min(Math.max(parsedPage, 1), 500);

    // Every sort needs a vote floor, or zero-vote obscurities dominate:
    // one-vote 10/10s top rating sort, unreleased junk tops date sort.
    // An explicit minVoteCount overrides the default; 0 means "no floor".
    const parsedFloor = parseInt(minVoteCount as string, 10);
    const voteFloor = !Number.isNaN(parsedFloor) && parsedFloor >= 0
      ? (parsedFloor > 0 ? String(parsedFloor) : undefined)
      : (mediaType === 'movie' ? '200' : '50');

    const data = await tmdbFetch(`/discover/${mediaType}`, {
      language: 'en-US',
      sort_by: sort,
      'vote_count.gte': voteFloor,
      include_adult: 'false',
      include_video: 'false',
      page: pageNumber,
      // Unset by default — anime, K-drama and world cinema are otherwise
      // invisible. Only pin a language when the client asks for one.
      with_original_language: originalLanguage as string | undefined,
      [dateFromKey]: dateFrom as string | undefined,
      [dateToKey]: dateTo as string | undefined,
      'vote_average.gte': minRating as string | undefined,
      with_genres: genreIds as string | undefined,
      with_companies: companyIds as string | undefined,
      // TV-only: TMDB ignores with_networks on /discover/movie, and the
      // client only sends it for tv.
      with_networks: networkIds as string | undefined,
      with_origin_country: originCountry as string | undefined,
      'with_runtime.gte': runtimeMin as string | undefined,
      'with_runtime.lte': runtimeMax as string | undefined,
      // Movie-only: TMDB has no discover-side certification filter for TV.
      // certification_country is required for certification.gte/.lte/exact
      // to take effect; the client only ever sends US ratings today.
      certification_country: mediaType === 'movie' && certification ? 'US' : undefined,
      certification: mediaType === 'movie' ? (certification as string | undefined) : undefined,
      // TV-only
      with_type: mediaType === 'tv' ? (tvTypes as string | undefined) : undefined,
      with_status: mediaType === 'tv' ? (tvStatuses as string | undefined) : undefined,
      with_keywords: keywordIds as string | undefined,
      without_keywords: excludeKeywordIds as string | undefined,
      // Movie-only: /discover/tv has no people parameter at all. The TV
      // person path is handled client-side via /person/{id}/tv_credits.
      with_people: mediaType === 'movie' ? (personIds as string | undefined) : undefined,
      // watch_region is required for TMDB to interpret with_watch_providers;
      // the client only ever sends it alongside a non-empty provider list.
      with_watch_providers: watchProviderIds as string | undefined,
      watch_region: watchProviderIds ? (watchRegion as string | undefined) : undefined,
      with_watch_monetization_types: watchProviderIds ? 'flatrate' : undefined,
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
