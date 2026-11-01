// --- Base Shared Types ---

interface MediaBase {
  id: number;
  rating: number;
  posterPath: string | null;
  mediaType: 'movie' | 'tv';
}

// --- List/Summary Types (Used for grids/cards) ---

export interface MediaSummary extends MediaBase {
  title: string;
  releaseDate: string;
}

// --- Detail Types (Used for detailed views) ---

export interface MediaDetail extends MediaBase {
  title: string;
  name: string;
  originalTitle: string;
  originalLanguage: string;
  tagline: string;
  overview: string;
  voteCount: number;
  releaseDate: string;
  firstAirDate: string;
  backdropPath: string | null;
  runtime: number | null;
  episodeRunTime: number | null;
  numberOfEpisodes: number | null;
  numberOfSeasons: number | null;
  seasons?: TvSeason[];
  genres: { id: number; name: string }[];
  homepage: string;
  status: string;
  budget: number | null;
  revenue: number | null;
  productionCompanies: {
    id: number;
    logoPath: string | null;
    name: string;
    originCountry: string;
  }[];
  productionCountries: { iso_3166_1: string; name: string }[];
  spokenLanguages: { englishName: string; iso639_1: string; name: string }[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  keywords: Keyword[];
  recommendations: MediaSummary[];
  // Keyed by ISO 3166-1 country code (TMDB returns every region in one call).
  watchProviders: Record<string, RegionWatchProviders>;
  trailerKey: string | null;
  certification: string;
  // Movie only. Reuses CollectionSummary since collection.ts already defines
  // the shape this needs (id/name/posterPath).
  collection: CollectionSummary | null;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface WatchProviderEntry {
  providerId: number;
  providerName: string;
  logoPath: string | null;
}

export interface RegionWatchProviders {
  link?: string;
  flatrate?: WatchProviderEntry[];
  rent?: WatchProviderEntry[];
  buy?: WatchProviderEntry[];
}

export interface WatchRegion {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

// --- API Response Mappings (TMDB Raw Structure) ---

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
}

export interface TMDBDiscoverResponse {
  page: number;
  results: TMDBResult[];
  total_pages: number;
  total_results: number;
}

// --- TV Specific Sub-Types ---

export interface TvEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
}

export interface TvSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
  overview: string;
  episodes?: TvEpisode[];
}

export interface EpisodeDetail extends Omit<TvEpisode, 'runtime'> {
  runtime: number;
  crew: { name: string; job: string; department: string }[];
  guest_stars: { id: number; name: string; character: string; profile_path: string | null }[];
  images?: { stills: { file_path: string }[] };
}

// --- Shared Entity Types ---

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  // TV only, from aggregate_credits — total episodes across all of this
  // person's roles on the show; drives the series-regulars-first sort.
  episodeCount?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface PersonCredit {
  id: number;
  title?: string; // Used for movies
  name?: string; // Used for TV shows
  character: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  credit_id: string;
}

export interface PersonCombinedCredits {
  cast: PersonCredit[];
  crew: PersonCredit[];
}

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  imdb_id: string;
  combined_credits?: PersonCombinedCredits;
}

export interface FetchMediaParams {
  mediaType: "movie" | "tv";
  searchQuery?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CompanySummary {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry?: string; // Optional, as not all companies may have this info
}

// Sourced from TMDB's daily network id export, which carries no logos or
// countries — just id and name.
export interface NetworkSummary {
  id: number;
  name: string;
}

export interface CollectionSummary {
  id: number;
  name: string;
  posterPath: string | null;
}

export interface CollectionDetail {
  id: number;
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  parts: MediaSummary[];
}

// UI-level sort state; abstract so a selection survives movie/tv switches
export type SortField = 'popularity' | 'rating' | 'date' | 'title';
export type SortDirection = 'asc' | 'desc';

// TMDB sort_by keys. Movie and TV use different names for date and title sorts.
export type DiscoverSortBy =
  `${'popularity' | 'vote_average' | 'primary_release_date' | 'first_air_date' | 'title' | 'name'}.${SortDirection}`;

export interface DiscoverFilterParams {
  mediaType: 'movie' | 'tv';
  searchQuery?: string;
  year?: number;
  minRating?: number;
  minVoteCount?: number;    // 0 = no floor; undefined = server default (200 movie / 50 tv)
  sortBy?: DiscoverSortBy;
  genreIds?: number[];      // AND logic, comma-joined for with_genres
  companyIds?: number[];    // AND logic, comma-joined for with_companies
  networkIds?: number[];    // OR logic, pipe-joined for with_networks; TV only
  page?: number;            // 1-based; TMDB caps at 500
}