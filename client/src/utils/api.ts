import type {
  TMDBDiscoverResponse,
  MediaDetail,
  FetchMediaParams,
  DiscoverFilterParams,
  Genre,
  CompanySummary,
  NetworkSummary,
} from './types';

export const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export const fetchMediaDetails = async (
  mediaType: "movie" | "tv",
  id: number
): Promise<MediaDetail> => {
  const response = await fetch(`/api/media/${mediaType}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch item details");
  const data = await response.json();

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
    backdropPath: data.backdrop_path ? `${POSTER_BASE_URL}${data.backdrop_path}` : null,
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
        logoPath: company.logo_path ? `${POSTER_BASE_URL}${company.logo_path}` : null,
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
    credits: data.credits ? {
      cast: data.credits.cast.map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path ? `${POSTER_BASE_URL}${c.profile_path}` : null,
      })),
      crew: data.credits.crew.map((c: any) => ({
        id: c.id,
        name: c.name,
        job: c.job,
        department: c.department,
      })),
    } : undefined,
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
  const { mediaType, searchQuery, year, minRating, sortBy, genreIds, companyIds, networkIds, page } = params;

  const query = new URLSearchParams();
  if (searchQuery) query.set('searchQuery', searchQuery);
  if (page) query.set('page', String(page));
  if (year) query.set('year', String(year));
  if (minRating) query.set('minRating', String(minRating));
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