import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigationType, useSearchParams } from 'react-router-dom';
import { fetchDiscoverMediaWithFilters, fetchGenres, fetchPersonTvCredits, fetchWatchProviders, POSTER_BASE_URL } from '@/utils/api';
import { useDocumentTitle } from '@/utils/useDocumentTitle';
import type {
  Genre,
  MediaSummary,
  CompanySummary,
  NetworkSummary,
  KeywordSummary,
  PersonSummary,
  SortField,
  SortDirection,
  DiscoverSortBy,
  GenreMatch,
  WatchMonetizationType,
  WatchProviderEntry,
} from '@/utils/types';
import MediaCard from './MediaCard';
import { DiscoverControls } from './DiscoverControls';
import { SortSelector } from './SortSelector';
import { OmniSearch } from './OmniSearch';
import { HomeRails } from './HomeRails';
import { RegionPicker, useWatchRegion } from './RegionPicker';
import { SeerrSettings } from './SeerrSettings';
import { Alert, AlertDescription } from './ui/alert';

// TMDB uses different sort_by keys for movies vs TV; the UI stores the
// abstract field so the selection survives switching media type. `null`
// means the sort has no TMDB equivalent for that media type (e.g. revenue
// for TV) — callers must fall back rather than send a wrong key.
export const SORT_KEYS: Record<SortField, { movie: string; tv: string | null }> = {
  popularity: { movie: 'popularity', tv: 'popularity' },
  rating: { movie: 'vote_average', tv: 'vote_average' },
  date: { movie: 'primary_release_date', tv: 'first_air_date' },
  title: { movie: 'title', tv: 'name' },
  revenue: { movie: 'revenue', tv: null },
  voteCount: { movie: 'vote_count', tv: 'vote_count' },
};

// The filter state that drives a discover request. Collapsed here from 19
// separate useState hooks so DiscoverControls doesn't have to take 19 props.
export interface DiscoverFilters {
  mediaType: 'movie' | 'tv';
  searchQuery: string;
  releaseDateFrom: string | null; // 'YYYY-MM-DD'
  releaseDateTo: string | null;
  minRating: number;
  minVoteCount: number | null;
  runtimeMin: number | null;
  runtimeMax: number | null;
  originalLanguage: string | null;
  originCountry: string | null;
  certification: string | null; // movie only
  tvTypes: number[]; // TV only
  tvStatuses: number[]; // TV only
  genreIds: number[];
  genreMatch: GenreMatch;
  excludeGenreIds: number[];
  companies: CompanySummary[];
  excludeCompanies: CompanySummary[];
  networks: NetworkSummary[];
  sortField: SortField;
  sortDirection: SortDirection;
  keywords: KeywordSummary[];
  excludeKeywords: KeywordSummary[];
  // TV has no with_people discover param: selecting a person while
  // mediaType is 'tv' switches the grid to that person's TV credits
  // instead of filtering, so only one is kept for TV (see fetchPage).
  people: PersonSummary[];
  // Region-scoped (see useWatchRegion) — both lists are cleared when the
  // region changes, since a provider id valid in one region may match
  // nothing in another.
  watchProviderIds: number[];
  excludeWatchProviderIds: number[];
  // How the included providers must offer it; never empty
  watchMonetization: WatchMonetizationType[];
}

const initialFilters: DiscoverFilters = {
  mediaType: 'movie',
  searchQuery: '',
  releaseDateFrom: null,
  releaseDateTo: null,
  minRating: 0,
  minVoteCount: null,
  runtimeMin: null,
  runtimeMax: null,
  originalLanguage: null,
  originCountry: null,
  certification: null,
  tvTypes: [],
  tvStatuses: [],
  genreIds: [],
  genreMatch: 'any',
  excludeGenreIds: [],
  companies: [],
  excludeCompanies: [],
  networks: [],
  sortField: 'popularity',
  sortDirection: 'desc',
  keywords: [],
  excludeKeywords: [],
  people: [],
  watchProviderIds: [],
  excludeWatchProviderIds: [],
  watchMonetization: ['flatrate'],
};

export type FilterAction =
  | { type: 'SET_MEDIA_TYPE'; value: 'movie' | 'tv' }
  | { type: 'SET_SEARCH_QUERY'; value: string }
  | { type: 'SET_DATE_RANGE'; from: string | null; to: string | null }
  | { type: 'SET_MIN_RATING'; value: number }
  | { type: 'SET_MIN_VOTE_COUNT'; value: number | null }
  | { type: 'SET_RUNTIME_RANGE'; min: number | null; max: number | null }
  | { type: 'SET_ORIGINAL_LANGUAGE'; value: string | null }
  | { type: 'SET_ORIGIN_COUNTRY'; value: string | null }
  | { type: 'SET_CERTIFICATION'; value: string | null }
  | { type: 'SET_TV_TYPES'; value: number[] }
  | { type: 'SET_TV_STATUSES'; value: number[] }
  | { type: 'SET_GENRE_IDS'; value: number[] }
  | { type: 'SET_GENRE_MATCH'; value: GenreMatch }
  | { type: 'SET_EXCLUDE_GENRE_IDS'; value: number[] }
  | { type: 'SET_COMPANIES'; value: CompanySummary[] }
  | { type: 'SET_EXCLUDE_COMPANIES'; value: CompanySummary[] }
  | { type: 'SET_NETWORKS'; value: NetworkSummary[] }
  | { type: 'SET_SORT_FIELD'; value: SortField }
  | { type: 'SET_SORT_DIRECTION'; value: SortDirection }
  | { type: 'SET_KEYWORDS'; value: KeywordSummary[] }
  | { type: 'SET_EXCLUDE_KEYWORDS'; value: KeywordSummary[] }
  | { type: 'SET_PEOPLE'; value: PersonSummary[] }
  | { type: 'SET_WATCH_PROVIDER_IDS'; value: number[] }
  | { type: 'SET_EXCLUDE_WATCH_PROVIDER_IDS'; value: number[] }
  | { type: 'SET_WATCH_MONETIZATION'; value: WatchMonetizationType[] };

function filtersReducer(state: DiscoverFilters, action: FilterAction): DiscoverFilters {
  switch (action.type) {
    case 'SET_MEDIA_TYPE': {
      // Genres don't carry across (the id space differs per media type).
      // Companies/networks persist in state but are only sent to the API
      // for the types they support (see fetchPage below).
      const sortStillValid = SORT_KEYS[state.sortField][action.value] !== null;
      return {
        ...state,
        mediaType: action.value,
        genreIds: [],
        excludeGenreIds: [],
        sortField: sortStillValid ? state.sortField : 'popularity',
        // TV has no with_people equivalent — a person selection there means
        // "show this person's TV credits," which only makes sense for one.
        people: action.value === 'tv' ? state.people.slice(0, 1) : state.people,
      };
    }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.value };
    case 'SET_DATE_RANGE':
      return { ...state, releaseDateFrom: action.from, releaseDateTo: action.to };
    case 'SET_MIN_RATING':
      return { ...state, minRating: action.value };
    case 'SET_MIN_VOTE_COUNT':
      return { ...state, minVoteCount: action.value };
    case 'SET_RUNTIME_RANGE':
      return { ...state, runtimeMin: action.min, runtimeMax: action.max };
    case 'SET_ORIGINAL_LANGUAGE':
      return { ...state, originalLanguage: action.value };
    case 'SET_ORIGIN_COUNTRY':
      return { ...state, originCountry: action.value };
    case 'SET_CERTIFICATION':
      return { ...state, certification: action.value };
    case 'SET_TV_TYPES':
      return { ...state, tvTypes: action.value };
    case 'SET_TV_STATUSES':
      return { ...state, tvStatuses: action.value };
    case 'SET_GENRE_IDS':
      return { ...state, genreIds: action.value };
    case 'SET_GENRE_MATCH':
      return { ...state, genreMatch: action.value };
    case 'SET_EXCLUDE_GENRE_IDS':
      return { ...state, excludeGenreIds: action.value };
    case 'SET_COMPANIES':
      return { ...state, companies: action.value };
    case 'SET_EXCLUDE_COMPANIES':
      return { ...state, excludeCompanies: action.value };
    case 'SET_NETWORKS':
      return { ...state, networks: action.value };
    case 'SET_KEYWORDS':
      return { ...state, keywords: action.value };
    case 'SET_EXCLUDE_KEYWORDS':
      return { ...state, excludeKeywords: action.value };
    case 'SET_PEOPLE':
      return { ...state, people: state.mediaType === 'tv' ? action.value.slice(0, 1) : action.value };
    case 'SET_WATCH_PROVIDER_IDS':
      return { ...state, watchProviderIds: action.value };
    case 'SET_EXCLUDE_WATCH_PROVIDER_IDS':
      return { ...state, excludeWatchProviderIds: action.value };
    case 'SET_WATCH_MONETIZATION':
      // Unticking the last type would mean "no way to watch it"; keep it
      return action.value.length > 0 ? { ...state, watchMonetization: action.value } : state;
    case 'SET_SORT_FIELD':
      return { ...state, sortField: action.value };
    case 'SET_SORT_DIRECTION':
      return { ...state, sortDirection: action.value };
    default:
      return state;
  }
}

// Filters live in the URL so Back from a detail page lands on the same grid,
// and searches can be bookmarked or shared. Only non-default values are
// written. Named selections (companies, keywords…) are stored as `id:name`
// so their badges render without a lookup; repeated params, since names can
// contain commas. A URL with no params at all is the home-rails view, so an
// unfiltered grid needs the explicit `all` marker.
const ALL_MARKER = 'all';

const MONETIZATION_TYPES = ['flatrate', 'free', 'ads', 'rent', 'buy'] as const;

const NUMBER_LIST_PARAMS = {
  genres: 'genreIds',
  xgenres: 'excludeGenreIds',
  tvtype: 'tvTypes',
  tvstatus: 'tvStatuses',
  providers: 'watchProviderIds',
  xproviders: 'excludeWatchProviderIds',
} as const;

const NAMED_LIST_PARAMS = {
  company: 'companies',
  xcompany: 'excludeCompanies',
  network: 'networks',
  keyword: 'keywords',
  exclude: 'excludeKeywords',
  person: 'people',
} as const;

function filtersToParams(filters: DiscoverFilters): URLSearchParams {
  const params = new URLSearchParams();
  const setIf = (key: string, value: string | number | null, unless?: string | number) => {
    if (value !== null && value !== '' && value !== unless) params.set(key, String(value));
  };

  setIf('type', filters.mediaType, initialFilters.mediaType);
  setIf('q', filters.searchQuery);
  setIf('from', filters.releaseDateFrom);
  setIf('to', filters.releaseDateTo);
  setIf('rating', filters.minRating, 0);
  setIf('votes', filters.minVoteCount);
  setIf('rtmin', filters.runtimeMin);
  setIf('rtmax', filters.runtimeMax);
  setIf('lang', filters.originalLanguage);
  setIf('country', filters.originCountry);
  setIf('cert', filters.certification);
  setIf('sort', filters.sortField, initialFilters.sortField);
  setIf('dir', filters.sortDirection, initialFilters.sortDirection);
  setIf('gmatch', filters.genreMatch, initialFilters.genreMatch);
  setIf('how', filters.watchMonetization.join(','), initialFilters.watchMonetization.join(','));

  for (const [key, field] of Object.entries(NUMBER_LIST_PARAMS)) {
    if (filters[field].length > 0) params.set(key, filters[field].join(','));
  }
  for (const [key, field] of Object.entries(NAMED_LIST_PARAMS)) {
    for (const { id, name } of filters[field]) params.append(key, `${id}:${name}`);
  }

  if ([...params.keys()].length === 0) params.set(ALL_MARKER, '1');
  return params;
}

// Link into Discover with only the given filters set — used by detail pages
// to turn genres, keywords, companies and networks into browsable links.
export function discoverHref(overrides: Partial<DiscoverFilters>): string {
  return `/?${filtersToParams({ ...initialFilters, ...overrides })}`;
}

function filtersFromParams(params: URLSearchParams): DiscoverFilters {
  const num = (key: string): number | null => {
    const raw = params.get(key);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  const numList = (key: string): number[] =>
    (params.get(key) ?? '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0);
  const named = (key: string): { id: number; name: string }[] =>
    params.getAll(key).flatMap(entry => {
      const sep = entry.indexOf(':');
      const id = Number(entry.slice(0, sep));
      return sep > 0 && Number.isInteger(id) ? [{ id, name: entry.slice(sep + 1) }] : [];
    });

  const mediaType = params.get('type') === 'tv' ? 'tv' : 'movie';
  const sortParam = params.get('sort');
  const sortField = sortParam && sortParam in SORT_KEYS && SORT_KEYS[sortParam as SortField][mediaType] !== null
    ? (sortParam as SortField)
    : initialFilters.sortField;
  const people = named('person').map(p => ({ ...p, profilePath: null, knownForDepartment: '' }));
  const monetization = (params.get('how') ?? '').split(',')
    .filter((t): t is WatchMonetizationType => (MONETIZATION_TYPES as readonly string[]).includes(t));

  return {
    mediaType,
    searchQuery: params.get('q') ?? '',
    releaseDateFrom: params.get('from'),
    releaseDateTo: params.get('to'),
    minRating: num('rating') ?? 0,
    minVoteCount: num('votes'),
    runtimeMin: num('rtmin'),
    runtimeMax: num('rtmax'),
    originalLanguage: params.get('lang'),
    originCountry: params.get('country'),
    certification: params.get('cert'),
    tvTypes: numList('tvtype'),
    tvStatuses: numList('tvstatus'),
    genreIds: numList('genres'),
    genreMatch: params.get('gmatch') === 'all' ? 'all' : 'any',
    excludeGenreIds: numList('xgenres'),
    companies: named('company').map(c => ({ ...c, logoPath: null })),
    excludeCompanies: named('xcompany').map(c => ({ ...c, logoPath: null })),
    networks: named('network'),
    sortField,
    sortDirection: params.get('dir') === 'asc' ? 'asc' : 'desc',
    keywords: named('keyword'),
    excludeKeywords: named('exclude'),
    people: mediaType === 'tv' ? people.slice(0, 1) : people,
    watchProviderIds: numList('providers'),
    excludeWatchProviderIds: numList('xproviders'),
    watchMonetization: monetization.length > 0 ? monetization : initialFilters.watchMonetization,
  };
}

// The last grid shown, kept across unmounts so Back from a detail page can
// put back every loaded page and the scroll position instead of refetching
// page 1 at the top. Keyed by the query string it was loaded for.
let gridCache: {
  key: string;
  items: MediaSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
  scrollY: number;
} | null = null;

export const DiscoverPage: React.FC = () => {
  useDocumentTitle();
  // The URL is the source of truth for filters; the reducer still computes
  // transitions and the result is written back as search params. `replace`
  // so tweaking filters doesn't pile up history entries ahead of Back.
  const [searchParams, setSearchParams] = useSearchParams();
  const queryKey = searchParams.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => filtersFromParams(searchParams), [queryKey]);

  // On Back (a POP) to the query the cache was saved for, start from the
  // cached grid instead of refetching page 1 — decided once per mount.
  const navigationType = useNavigationType();
  const [restored] = useState(() =>
    navigationType === 'POP' && gridCache?.key === queryKey ? gridCache : null
  );

  const [items, setItems] = useState<MediaSummary[]>(restored?.items ?? []);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state — not filter state, kept separate so the reducer stays
  // focused on what drives a discover request.
  const [page, setPage] = useState<number>(restored?.page ?? 1);
  const [totalPages, setTotalPages] = useState<number>(restored?.totalPages ?? 0);
  const [totalResults, setTotalResults] = useState<number>(restored?.totalResults ?? 0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Runs after ScrollToTop's reset; rAF waits for the restored grid to paint.
  useEffect(() => {
    if (restored) requestAnimationFrame(() => window.scrollTo(0, restored.scrollY));
  }, [restored]);
  const [genres, setGenres] = useState<Genre[]>([]);

  // `/` opens on trending rails, not an unfiltered discover query — the grid
  // (and its fetch) only kicks in once the user actually touches a filter,
  // which always writes at least one param.
  const browsing = queryKey === '';

  // Tracks the latest filters synchronously so two dispatches in one tick
  // build on each other rather than both on the last render's value.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const commitFilters = useCallback((next: DiscoverFilters) => {
    filtersRef.current = next;
    setSearchParams(filtersToParams(next), { replace: true });
  }, [setSearchParams]);
  const trackedDispatch = useCallback((action: FilterAction) => {
    commitFilters(filtersReducer(filtersRef.current, action));
  }, [commitFilters]);

  useEffect(() => {
    fetchGenres(filters.mediaType).then(setGenres).catch(console.error);
  }, [filters.mediaType]);

  // The app-wide watch region (RegionPicker) — not filter state, since it
  // also drives the per-title "where to stream" display on detail pages.
  const watchRegion = useWatchRegion();
  const [watchProviderOptions, setWatchProviderOptions] = useState<WatchProviderEntry[]>([]);

  useEffect(() => {
    fetchWatchProviders(filters.mediaType, watchRegion).then(setWatchProviderOptions).catch(console.error);
  }, [filters.mediaType, watchRegion]);

  // Read via a ref rather than a fetchPage dependency: watchRegion changing
  // shouldn't by itself invalidate fetchPage's identity (that would refetch
  // the grid on every region change even with no provider filter active).
  // It only matters when a provider list is non-empty, and the effect below
  // clears that selection the instant the region changes, so the two never
  // go stale together.
  const watchRegionRef = useRef(watchRegion);
  useEffect(() => {
    watchRegionRef.current = watchRegion;
  }, [watchRegion]);

  // Providers are region-scoped — a selection made in one region may match
  // nothing (or a different service) in another, so drop it on region change
  // rather than silently sending a filter that no longer means what the user
  // picked. A provider selection only exists off the home rails, so this
  // never pulls the page out of the browsing state.
  const prevWatchRegionRef = useRef(watchRegion);
  useEffect(() => {
    if (prevWatchRegionRef.current !== watchRegion) {
      prevWatchRegionRef.current = watchRegion;
      if (filters.watchProviderIds.length > 0) {
        trackedDispatch({ type: 'SET_WATCH_PROVIDER_IDS', value: [] });
      }
      if (filters.excludeWatchProviderIds.length > 0) {
        trackedDispatch({ type: 'SET_EXCLUDE_WATCH_PROVIDER_IDS', value: [] });
      }
    }
  }, [watchRegion, filters.watchProviderIds, filters.excludeWatchProviderIds, trackedDispatch]);

  const fetchPage = useCallback(async (pageToFetch: number): Promise<{
    results: MediaSummary[];
    totalPages: number;
    totalResults: number;
  }> => {
    const { mediaType } = filters;

    // /discover/tv has no with_people param. A person selection here means
    // "show this person's TV credits" instead — it replaces the grid rather
    // than narrowing it, and doesn't compose with sort/pagination.
    if (mediaType === 'tv' && filters.people.length > 0) {
      const results = await fetchPersonTvCredits(filters.people[0].id);
      return { results, totalPages: 1, totalResults: results.length };
    }

    const sortKey = SORT_KEYS[filters.sortField][mediaType] ?? SORT_KEYS.popularity[mediaType];

    const data = await fetchDiscoverMediaWithFilters({
      mediaType,
      searchQuery: filters.searchQuery.trim() || undefined,
      dateFrom: filters.releaseDateFrom ?? undefined,
      dateTo: filters.releaseDateTo ?? undefined,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      minVoteCount: filters.minVoteCount ?? undefined,
      originalLanguage: filters.originalLanguage ?? undefined,
      originCountry: filters.originCountry ?? undefined,
      // Movie only — TMDB has no discover-side certification filter for TV
      certification: mediaType === 'movie' ? (filters.certification ?? undefined) : undefined,
      runtimeMin: filters.runtimeMin ?? undefined,
      runtimeMax: filters.runtimeMax ?? undefined,
      // TV only — selections persist in state but are never sent for movies
      tvTypes: mediaType === 'tv' && filters.tvTypes.length > 0 ? filters.tvTypes : undefined,
      tvStatuses: mediaType === 'tv' && filters.tvStatuses.length > 0 ? filters.tvStatuses : undefined,
      sortBy: `${sortKey}.${filters.sortDirection}` as DiscoverSortBy,
      genreIds: filters.genreIds.length > 0 ? filters.genreIds : undefined,
      genreMatch: filters.genreMatch,
      excludeGenreIds: filters.excludeGenreIds.length > 0 ? filters.excludeGenreIds : undefined,
      companyIds: filters.companies.length > 0 ? filters.companies.map(c => c.id) : undefined,
      excludeCompanyIds: filters.excludeCompanies.length > 0 ? filters.excludeCompanies.map(c => c.id) : undefined,
      // Networks are TV-only in TMDB; selections persist in state but are
      // never sent for movie requests
      networkIds: mediaType === 'tv' && filters.networks.length > 0
        ? filters.networks.map(n => n.id)
        : undefined,
      keywordIds: filters.keywords.length > 0 ? filters.keywords.map(k => k.id) : undefined,
      excludeKeywordIds: filters.excludeKeywords.length > 0 ? filters.excludeKeywords.map(k => k.id) : undefined,
      // TV person selections are handled above via tv_credits, not this call
      personIds: mediaType === 'movie' && filters.people.length > 0
        ? filters.people.map(p => p.id)
        : undefined,
      watchProviderIds: filters.watchProviderIds.length > 0 ? filters.watchProviderIds : undefined,
      excludeWatchProviderIds: filters.excludeWatchProviderIds.length > 0 ? filters.excludeWatchProviderIds : undefined,
      watchMonetization: filters.watchMonetization,
      watchRegion: filters.watchProviderIds.length > 0 || filters.excludeWatchProviderIds.length > 0
        ? watchRegionRef.current
        : undefined,
      page: pageToFetch,
    });

    const results: MediaSummary[] = data.results
      .map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        rating: item.vote_average,
        releaseDate: item.release_date || item.first_air_date,
        posterPath: item.poster_path ? `${POSTER_BASE_URL}${item.poster_path}` : null,
        mediaType,
      }));

    return { results, totalPages: data.total_pages, totalResults: data.total_results };
  }, [filters]);

  // Guards against out-of-order responses: fetchData bumps this (it starts a
  // new query), loadMore only reads it (it continues the current one). If the
  // token a request captured no longer matches when it resolves, a newer
  // request has superseded it and its result is dropped.
  const requestSeq = useRef(0);

  // Fresh load: replaces the grid and resets pagination. Runs on mount and
  // whenever any filter/sort changes (fetchPage's identity tracks them all).
  const fetchData = useCallback(async () => {
    const token = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const { results, totalPages, totalResults } = await fetchPage(1);
      if (token !== requestSeq.current) return; // superseded, drop it
      // Ordering comes from TMDB via sort_by; render as-is
      setItems(results);
      setPage(1);
      setTotalPages(totalPages);
      setTotalResults(totalResults);
    } catch (err) {
      if (token !== requestSeq.current) return;
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      if (token === requestSeq.current) setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || page >= totalPages) return;
    const token = requestSeq.current;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { results } = await fetchPage(nextPage);
      if (token !== requestSeq.current) return; // superseded, drop it
      // TMDB pages can overlap slightly; dedupe so React keys stay unique
      setItems(prev => {
        const seen = new Set(prev.map(item => item.id));
        return [...prev, ...results.filter(item => !seen.has(item.id))];
      });
      setPage(nextPage);
    } catch (err) {
      if (token !== requestSeq.current) return;
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      if (token === requestSeq.current) setLoadingMore(false);
    }
  }, [fetchPage, loading, loadingMore, page, totalPages]);

  // Keep the observer callback pointed at the latest loadMore without
  // recreating the observer (a fresh observer fires immediately, which
  // caused rapid repeat fetches while the sentinel sat near the viewport).
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Remembers which query the grid holds, so a restored grid isn't refetched
  // on mount (and StrictMode's repeat effect run doesn't fetch twice).
  const loadedKeyRef = useRef<string | null>(restored ? queryKey : null);
  useEffect(() => {
    if (browsing || loadedKeyRef.current === queryKey) return;
    loadedKeyRef.current = queryKey;
    fetchData();
  }, [fetchData, browsing, queryKey]);

  // Snapshot for the gridCache restore above; scroll is read at unmount, when
  // the user leaves for a detail page. The ref keeps the cleanup from
  // capturing a stale grid. A layout effect, because a passive cleanup runs
  // after the grid's DOM is gone and scrollY has clamped to the new page.
  const gridSnapshotRef = useRef<Omit<NonNullable<typeof gridCache>, 'scrollY'> | null>(null);
  useEffect(() => {
    gridSnapshotRef.current = browsing || loading
      ? null
      : { key: queryKey, items, page, totalPages, totalResults };
  }, [browsing, loading, queryKey, items, page, totalPages, totalResults]);
  useLayoutEffect(() => () => {
    const snapshot = gridSnapshotRef.current;
    gridCache = snapshot ? { ...snapshot, scrollY: window.scrollY } : null;
  }, []);

  // Load the next page when the sentinel below the grid approaches the
  // viewport. Created once; loadMore's guards make extra firings harmless.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Ambient backdrop texture - subtle, fixed, doesn't scroll with content */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            <div className="flex items-center gap-2">
              <img src='logo192.png' alt="Logo" className="h-16 w-16" />
              Marquee

            </div>
          </h1>
          <div className="flex items-center gap-3">
            <OmniSearch />
            <RegionPicker />
            <SeerrSettings />
          </div>
        </header>

        <DiscoverControls
          filters={filters}
          dispatch={trackedDispatch}
          genres={genres}
          watchProviderOptions={watchProviderOptions}
          onSearch={() => { if (browsing) commitFilters(filtersRef.current); }}
          loading={loading}
        />

        {filters.mediaType === 'tv' && filters.people.length > 0 && (
          <Alert className="mb-6 border-amber-500/30 bg-amber-500/10 text-amber-200">
            <AlertDescription>
              Showing TV credits for {filters.people[0].name} — TMDB has no TV person filter,
              so this replaces the other filters rather than narrowing them.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 border-red-900/50 bg-red-950/40 text-red-200"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {browsing ? (
          <HomeRails />
        ) : (
          <>
            <div className="my-3 flex items-center justify-between">
              <SortSelector
                mediaType={filters.mediaType}
                sortField={filters.sortField}
                sortDirection={filters.sortDirection}
                onFieldChange={(value) => trackedDispatch({ type: 'SET_SORT_FIELD', value })}
                onDirectionChange={(value) => trackedDispatch({ type: 'SET_SORT_DIRECTION', value })}
              />
              {!loading && (
                <p className="font-mono text-xs text-slate-500">
                  {items.length} of {totalResults} {totalResults === 1 ? 'result' : 'results'}
                </p>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] animate-pulse rounded-xl bg-slate-800/60"
                    style={{ animationDelay: `${(i % 6) * 60}ms` }}
                  />
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
                {loadingMore &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`more-${i}`}
                      className="aspect-[2/3] animate-pulse rounded-xl bg-slate-800/60"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-20 text-center">
                <p className="text-sm font-medium text-slate-300">No results found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Try a different title, or loosen the date and rating filters.
                </p>
              </div>
            )}
          </>
        )}

        {/* Always mounted so the once-created IntersectionObserver stays
            attached; loadMore's guards decide whether a firing does anything */}
        <div ref={sentinelRef} className="h-px" />
      </div>
    </div>
  );
};
