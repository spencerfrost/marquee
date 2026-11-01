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

export interface KeywordSummary {
  id: number;
  name: string;
}

export interface PersonSummary {
  id: number;
  name: string;
  profilePath: string | null;
  knownForDepartment: string;
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

// Discriminated union returned by /search/multi. TMDB's media_type can be
// values beyond these four — callers must default-case unknown kinds out
// rather than trusting the union.
export type SearchHit =
  | { kind: 'movie'; id: number; title: string; posterPath: string | null; year: string; rating: number }
  | { kind: 'tv'; id: number; title: string; posterPath: string | null; year: string; rating: number }
  | {
    kind: 'person';
    id: number;
    name: string;
    profilePath: string | null;
    knownForDepartment: string;
    knownFor: string[];
  }
  | { kind: 'collection'; id: number; name: string; posterPath: string | null };

// UI-level sort state; abstract so a selection survives movie/tv switches.
// `revenue` is movie-only — TMDB has no revenue sort for /discover/tv.
export type SortField = 'popularity' | 'rating' | 'date' | 'title' | 'revenue' | 'voteCount';
export type SortDirection = 'asc' | 'desc';

// TMDB sort_by keys. Movie and TV use different names for date and title sorts.
export type DiscoverSortBy =
  `${'popularity' | 'vote_average' | 'primary_release_date' | 'first_air_date' | 'title' | 'name' | 'revenue' | 'vote_count'}.${SortDirection}`;

export interface DiscoverFilterParams {
  mediaType: 'movie' | 'tv';
  searchQuery?: string;
  // 'YYYY-MM-DD'; mapped to primary_release_date (movie) or first_air_date (tv)
  dateFrom?: string;
  dateTo?: string;
  minRating?: number;
  minVoteCount?: number;    // 0 = no floor; undefined = server default (200 movie / 50 tv)
  originalLanguage?: string; // unset = all languages
  originCountry?: string;
  certification?: string;  // movie only; server pins certification_country to US
  runtimeMin?: number;      // minutes
  runtimeMax?: number;
  tvTypes?: number[];       // TV only; with_type
  tvStatuses?: number[];    // TV only; with_status
  sortBy?: DiscoverSortBy;
  genreIds?: number[];      // AND logic, comma-joined for with_genres
  companyIds?: number[];    // AND logic, comma-joined for with_companies
  networkIds?: number[];    // OR logic, pipe-joined for with_networks; TV only
  keywordIds?: number[];    // OR logic, pipe-joined for with_keywords
  excludeKeywordIds?: number[]; // pipe-joined for without_keywords
  personIds?: number[];     // OR logic, pipe-joined for with_people; movie only
  watchProviderIds?: number[]; // OR logic, pipe-joined for with_watch_providers
  watchRegion?: string;     // required alongside watchProviderIds; region-scoped
  page?: number;            // 1-based; TMDB caps at 500
}