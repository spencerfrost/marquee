// The single chokepoint for talking to TMDB. The API key never leaves
// this file, and never reaches the client in any response body.

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export class TMDBError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'TMDBError';
  }
}

// In-memory response cache. Responses are shared between requests, so routes
// must pass them through untouched (they all do — shaping happens client-side).
// Map insertion order doubles as LRU order: hits are re-inserted at the end
// and the oldest entry is evicted once MAX_CACHE_ENTRIES is reached.
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MAX_CACHE_ENTRIES = 500;

// First match wins; anything unlisted (details, search, discover) gets an hour.
const CACHE_TTLS: [RegExp, number][] = [
  [/^\/(genre|watch\/providers)\//, DAY],
  [/^\/(trending\/|movie\/(now_playing|popular|top_rated|upcoming)$|tv\/(on_the_air|popular|top_rated)$)/, 10 * MINUTE],
];
const DEFAULT_CACHE_TTL = HOUR;

interface CacheEntry {
  // The promise itself is cached so concurrent identical requests share one
  // TMDB call; failed requests are removed so they aren't served from cache.
  data: Promise<any>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheTtlFor(path: string): number {
  return CACHE_TTLS.find(([pattern]) => pattern.test(path))?.[1] ?? DEFAULT_CACHE_TTL;
}

/**
 * Fetch from TMDB, injecting the API key server-side.
 * `path` should start with `/`, e.g. `/movie/123` or `/discover/tv`.
 * `searchParams` are query params EXCLUDING api_key (added automatically).
 */
export function tmdbFetch(
  path: string,
  searchParams: Record<string, string | number | undefined> = {}
): Promise<any> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  params.sort();
  // Built before the key is added, so the key never ends up in the cache.
  const cacheKey = `${path}?${params}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    cache.delete(cacheKey);
    if (cached.expiresAt > Date.now()) {
      cache.set(cacheKey, cached);
      return cached.data;
    }
  }

  const data = requestFromTmdb(path, params);
  const entry: CacheEntry = { data, expiresAt: Date.now() + cacheTtlFor(path) };
  cache.set(cacheKey, entry);
  if (cache.size > MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value!);
  }
  data.catch(() => {
    if (cache.get(cacheKey) === entry) cache.delete(cacheKey);
  });
  return data;
}

async function requestFromTmdb(path: string, params: URLSearchParams): Promise<any> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.search = params.toString();
  url.searchParams.set('api_key', process.env.TMDB_API_KEY as string);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new TMDBError(`TMDB request failed: ${response.statusText}`, response.status);
  }

  return response.json();
}
