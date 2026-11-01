import type {
  TMDBDiscoverResponse,
  MediaDetail,
  FetchMediaParams,
  MediaSummary,
  DiscoverFilterParams,
  Genre,
  CompanySummary,
  NetworkSummary,
  CollectionDetail,
  CastMember,
  CrewMember,
  Keyword,
  RegionWatchProviders,
  WatchProviderEntry,
  WatchRegion,
} from './types';

export const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
// Full-bleed hero backdrops need more than the poster's w500; w1280 is
// TMDB's next size up and avoids visibly soft/blurry detail-page heroes.
export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
// Company/provider logos render small — w185 is plenty and much lighter
// than reusing the w500 poster size for what's often a tiny wordmark.
export const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w185';

// TV credits come from append_to_response=aggregate_credits, not credits:
// it carries every episode's cast (hundreds of rows) instead of the ~8-person
// opening-credits list, but each entry has roles[]/jobs[] + a total episode
// count instead of a flat character/job. Movies keep the plain credits shape.
function mapCast(mediaType: 'movie' | 'tv', raw: any[] | undefined): CastMember[] {
  if (!Array.isArray(raw)) return [];
  if (mediaType === 'tv') {
    return raw
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.roles?.[0]?.character || '',
        profile_path: c.profile_path ? `${POSTER_BASE_URL}${c.profile_path}` : null,
        episodeCount: c.total_episode_count || 0,
      }))
      // Series regulars first — `order` on aggregate_credits reflects a
      // single (often unrepresentative) episode's billing, not the series.
      .sort((a, b) => (b.episodeCount ?? 0) - (a.episodeCount ?? 0));
  }
  return raw.map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path ? `${POSTER_BASE_URL}${c.profile_path}` : null,
  }));
}

function mapCrew(mediaType: 'movie' | 'tv', raw: any[] | undefined): CrewMember[] {
  if (!Array.isArray(raw)) return [];
  if (mediaType === 'tv') {
    return raw.map((c: any) => ({
      id: c.id,
      name: c.name,
      job: c.jobs?.[0]?.job || '',
      department: c.department || '',
    }));
  }
  return raw.map((c: any) => ({
    id: c.id,
    name: c.name,
    job: c.job,
    department: c.department,
  }));
}

function mapSummaries(mediaType: 'movie' | 'tv', raw: any): MediaSummary[] {
  const results = raw?.results;
  if (!Array.isArray(results)) return [];
  return results.map((item: any) => ({
    id: item.id,
    title: item.title || item.name || '',
    rating: item.vote_average || 0,
    releaseDate: item.release_date || item.first_air_date || '',
    posterPath: item.poster_path ? `${POSTER_BASE_URL}${item.poster_path}` : null,
    mediaType,
  }));
}

// Movie keyword payloads nest under `keywords`, TV under `results` — same
// append_to_response key, different shape.
function mapKeywords(raw: any): Keyword[] {
  const list = raw?.keywords || raw?.results;
  return Array.isArray(list) ? list.map((k: any) => ({ id: k.id, name: k.name })) : [];
}

function mapWatchProviders(raw: any): Record<string, RegionWatchProviders> {
  const results = raw?.results;
  if (!results || typeof results !== 'object') return {};

  const mapEntries = (entries: any[] | undefined): WatchProviderEntry[] | undefined =>
    Array.isArray(entries)
      ? entries.map((p: any) => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path ? `${LOGO_BASE_URL}${p.logo_path}` : null,
      }))
      : undefined;

  const byRegion: Record<string, RegionWatchProviders> = {};
  for (const [region, entry] of Object.entries(results) as [string, any][]) {
    byRegion[region] = {
      link: entry.link,
      flatrate: mapEntries(entry.flatrate),
      rent: mapEntries(entry.rent),
      buy: mapEntries(entry.buy),
    };
  }
  return byRegion;
}

function findTrailerKey(videos: any): string | null {
  const results = videos?.results;
  if (!Array.isArray(results)) return null;
  const trailer = results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer?.key ?? null;
}

// Movie: release_dates.results[].release_dates[].certification, US only.
// TV: content_ratings.results[].rating, US only.
function findCertification(mediaType: 'movie' | 'tv', data: any): string {
  if (mediaType === 'movie') {
    const us = data.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
    const withCert = us?.release_dates?.find((rd: any) => rd.certification);
    return withCert?.certification || '';
  }
  const us = data.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US');
  return us?.rating || '';
}

export const fetchMediaDetails = async (
  mediaType: "movie" | "tv",
  id: number
): Promise<MediaDetail> => {
  const response = await fetch(`/api/media/${mediaType}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch item details");
  const data = await response.json();

  const creditsRaw = mediaType === 'tv' ? data.aggregate_credits : data.credits;

  return {
    id: data.id,
    title: data.title || data.name || '',
    name: data.name || data.title || '',
    originalTitle: data.original_title || data.original_name || '',
    originalLanguage: data.original_language || '',
    tagline: data.tagline || '',
    overview: data.overview || '',
    rating: data.vote_average || 0,
    voteCount: data.vote_count || 0,
    releaseDate: data.release_date || data.first_air_date || '',
    firstAirDate: data.first_air_date || '',
    posterPath: data.poster_path ? `${POSTER_BASE_URL}${data.poster_path}` : null,
    backdropPath: data.backdrop_path ? `${BACKDROP_BASE_URL}${data.backdrop_path}` : null,
    mediaType,
    runtime: data.runtime || null,
    episodeRunTime: Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0 ? data.episode_run_time[0] : null,
    numberOfEpisodes: data.number_of_episodes || null,
    numberOfSeasons: data.number_of_seasons || null,
    seasons: Array.isArray(data.seasons)
      ? data.seasons.map((season: any) => ({
        id: season.id,
        name: season.name || '',
        season_number: season.season_number,
        episode_count: season.episode_count || 0,
        air_date: season.air_date || '',
        poster_path: season.poster_path ? `${POSTER_BASE_URL}${season.poster_path}` : null,
        overview: season.overview || '',
      }))
      : [],
    genres: data.genres || [],
    homepage: data.homepage || '',
    status: data.status || '',
    budget: data.budget || null,
    revenue: data.revenue || null,
    productionCompanies: Array.isArray(data.production_companies)
      ? data.production_companies.map((company: any) => ({
        id: company.id,
        logoPath: company.logo_path ? `${LOGO_BASE_URL}${company.logo_path}` : null,
        name: company.name || '',
        originCountry: company.origin_country || '',
      }))
      : [],
    productionCountries: Array.isArray(data.production_countries)
      ? data.production_countries.map((country: any) => ({
        iso_3166_1: country.iso_3166_1 || '',
        name: country.name || '',
      }))
      : [],
    spokenLanguages: Array.isArray(data.spoken_languages)
      ? data.spoken_languages.map((language: any) => ({
        englishName: language.english_name || '',
        iso639_1: language.iso_639_1 || '',
        name: language.name || '',
      }))
      : [],
    credits: creditsRaw ? {
      cast: mapCast(mediaType, creditsRaw.cast),
      crew: mapCrew(mediaType, creditsRaw.crew),
    } : undefined,
    keywords: mapKeywords(data.keywords),
    recommendations: mapSummaries(mediaType, data.recommendations),
    watchProviders: mapWatchProviders(data['watch/providers']),
    trailerKey: findTrailerKey(data.videos),
    certification: findCertification(mediaType, data),
    collection: data.belongs_to_collection ? {
      id: data.belongs_to_collection.id,
      name: data.belongs_to_collection.name || '',
      posterPath: data.belongs_to_collection.poster_path
        ? `${POSTER_BASE_URL}${data.belongs_to_collection.poster_path}`
        : null,
    } : null,
  };
};

export const fetchDiscoverMedia = async (
  params: FetchMediaParams
): Promise<TMDBDiscoverResponse> => {
  const { mediaType, searchQuery, year, minRating, sortBy = 'popularity.desc' } = params;

  const query = new URLSearchParams();
  if (searchQuery) query.set('searchQuery', searchQuery);
  if (year) query.set('year', String(year));
  if (minRating) query.set('minRating', String(minRating));
  query.set('sortBy', sortBy);

  const response = await fetch(`/api/discover/${mediaType}?${query.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch data");
  const data = await response.json();
  return data as TMDBDiscoverResponse;
};

export const fetchSeasonDetails = async (seriesId: number, seasonNumber: number) => {
  const response = await fetch(`/api/tv/${seriesId}/season/${seasonNumber}`);
  if (!response.ok) throw new Error('Failed to fetch season details');
  return response.json();
};

export const fetchEpisodeDetails = async (
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number
) => {
  const response = await fetch(`/api/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`);
  if (!response.ok) throw new Error('Failed to fetch episode details');
  return response.json();
};

export const fetchPersonDetails = async (personId: number) => {
  const response = await fetch(`/api/person/${personId}`);
  if (!response.ok) throw new Error('Failed to fetch person details');
  return response.json();
};

export const fetchDiscoverMediaWithFilters = async (
  params: DiscoverFilterParams
): Promise<TMDBDiscoverResponse> => {
  const { mediaType, searchQuery, year, minRating, minVoteCount, sortBy, genreIds, companyIds, networkIds, page } = params;

  const query = new URLSearchParams();
  if (searchQuery) query.set('searchQuery', searchQuery);
  if (page) query.set('page', String(page));
  if (year) query.set('year', String(year));
  if (minRating) query.set('minRating', String(minRating));
  // Not truthiness: an explicit 0 means "no floor" and must reach the server
  if (minVoteCount !== undefined) query.set('minVoteCount', String(minVoteCount));
  if (sortBy) query.set('sortBy', sortBy);
  
  // Pipe = OR within a param; genres and companies are AND'd across params
  if (genreIds?.length) query.set('genreIds', genreIds.join('|'));
  if (companyIds?.length) query.set('companyIds', companyIds.join('|'));
  if (networkIds?.length) query.set('networkIds', networkIds.join('|'));

  const response = await fetch(`/api/discover-filtered/${mediaType}?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch filtered discover data');
  return response.json();
};

export const fetchGenres = async (mediaType: 'movie' | 'tv'): Promise<Genre[]> => {
  const response = await fetch(`/api/genre/${mediaType}`);
  if (!response.ok) throw new Error('Failed to fetch genres');
  const data = await response.json();
  return (data.genres || []).map((g: any) => ({ id: g.id, name: g.name }));
};

export const searchNetworks = async (query: string): Promise<NetworkSummary[]> => {
  if (!query.trim()) return [];
  const response = await fetch(`/api/network/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search networks');
  const data = await response.json();
  return (data.results || []).map((n: any) => ({ id: n.id, name: n.name }));
};

export const searchCompanies = async (query: string): Promise<CompanySummary[]> => {
  if (!query.trim()) return [];
  const response = await fetch(`/api/company/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search companies');
  const data = await response.json();
  return (data.results || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    logoPath: c.logo_path ? `${POSTER_BASE_URL}${c.logo_path}` : null,
    originCountry: c.origin_country || '',
  }));
};

export const fetchCollectionDetails = async (id: number): Promise<CollectionDetail> => {
  const response = await fetch(`/api/collection/${id}`);
  if (!response.ok) throw new Error('Failed to fetch collection details');
  const data = await response.json();
  return {
    id: data.id,
    name: data.name || '',
    overview: data.overview || '',
    posterPath: data.poster_path ? `${POSTER_BASE_URL}${data.poster_path}` : null,
    backdropPath: data.backdrop_path ? `${BACKDROP_BASE_URL}${data.backdrop_path}` : null,
    parts: (data.parts || [])
      .filter((p: any) => p.media_type === 'movie' || p.media_type === 'tv' || p.title || p.release_date)
      .map((p: any) => ({
        id: p.id,
        title: p.title || p.name || '',
        rating: p.vote_average || 0,
        releaseDate: p.release_date || p.first_air_date || '',
        posterPath: p.poster_path ? `${POSTER_BASE_URL}${p.poster_path}` : null,
        mediaType: 'movie' as const,
      })),
  };
};

export const fetchWatchProviderRegions = async (): Promise<WatchRegion[]> => {
  const response = await fetch('/api/watch-providers/regions');
  if (!response.ok) throw new Error('Failed to fetch watch provider regions');
  const data = await response.json();
  return data.results || [];
};