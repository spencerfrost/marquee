import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDiscoverMediaWithFilters, fetchGenres, POSTER_BASE_URL } from '@/utils/api';
import type {
  Genre,
  MediaSummary,
  CompanySummary,
  NetworkSummary,
  SortField,
  SortDirection,
  DiscoverSortBy,
} from '@/utils/types';
import MediaCard from './MediaCard';
import { DiscoverControls } from './DiscoverControls';
import { SortSelector } from './SortSelector';
import { Alert, AlertDescription } from './ui/alert';

// TMDB uses different sort_by keys for movies vs TV; the UI stores the
// abstract field so the selection survives switching media type.
const SORT_KEYS: Record<SortField, { movie: string; tv: string }> = {
  popularity: { movie: 'popularity', tv: 'popularity' },
  rating: { movie: 'vote_average', tv: 'vote_average' },
  date: { movie: 'primary_release_date', tv: 'first_air_date' },
  title: { movie: 'title', tv: 'name' },
};

export const DiscoverPage: React.FC = () => {
  const [items, setItems] = useState<MediaSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalResults, setTotalResults] = useState<number>(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filter States
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [year, setYear] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanySummary[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<NetworkSummary[]>([]);
  const [sortField, setSortField] = useState<SortField>('popularity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');


  useEffect(() => {
    setGenreIds([]); // Clear selected genres when switching type
    fetchGenres(mediaType).then(setGenres).catch(console.error);
  }, [mediaType]);

  const fetchPage = useCallback(async (pageToFetch: number): Promise<{
    results: MediaSummary[];
    totalPages: number;
    totalResults: number;
  }> => {
    const data = await fetchDiscoverMediaWithFilters({
      mediaType,
      searchQuery: searchQuery.trim() || undefined,
      year: year ?? undefined,
      minRating: minRating > 0 ? minRating : undefined,
      sortBy: `${SORT_KEYS[sortField][mediaType]}.${sortDirection}` as DiscoverSortBy,
      genreIds: genreIds.length > 0 ? genreIds : undefined,
      companyIds: selectedCompanies.length > 0 ? selectedCompanies.map(c => c.id) : undefined,
      // Networks are TV-only in TMDB; selections persist in state but are
      // never sent for movie requests
      networkIds: mediaType === 'tv' && selectedNetworks.length > 0
        ? selectedNetworks.map(n => n.id)
        : undefined,
      page: pageToFetch,
    });

    const results: MediaSummary[] = data.results
      .filter((item: any) => {
        const releaseDate = new Date(item.release_date || item.first_air_date);
        return year === null || releaseDate.getFullYear() === year;
      })
      .map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        rating: item.vote_average,
        releaseDate: item.release_date || item.first_air_date,
        posterPath: item.poster_path ? `${POSTER_BASE_URL}${item.poster_path}` : null,
        mediaType,
      }));

    return { results, totalPages: data.total_pages, totalResults: data.total_results };
  }, [mediaType, searchQuery, year, minRating, genreIds, selectedCompanies, selectedNetworks, sortField, sortDirection]);

  // Fresh load: replaces the grid and resets pagination. Runs on mount and
  // whenever any filter/sort changes (fetchPage's identity tracks them all).
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { results, totalPages, totalResults } = await fetchPage(1);
      // Ordering comes from TMDB via sort_by; render as-is
      setItems(results);
      setPage(1);
      setTotalPages(totalPages);
      setTotalResults(totalResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { results } = await fetchPage(nextPage);
      // TMDB pages can overlap slightly; dedupe so React keys stay unique
      setItems(prev => {
        const seen = new Set(prev.map(item => item.id));
        return [...prev, ...results.filter(item => !seen.has(item.id))];
      });
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, loading, loadingMore, page, totalPages]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load the next page when the sentinel below the grid approaches the viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            <div className="flex items-center gap-2">
              <img src='logo192.png' alt="Logo" className="h-16 w-16" />
              Marquee

            </div>
          </h1>
        </header>

        <DiscoverControls
          mediaType={mediaType}
          setMediaType={setMediaType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          year={year}
          setYear={setYear}
          minRating={minRating}
          setMinRating={setMinRating}
          genreIds={genreIds}
          setGenreIds={setGenreIds}
          selectedCompanies={selectedCompanies}
          setSelectedCompanies={setSelectedCompanies}
          selectedNetworks={selectedNetworks}
          setSelectedNetworks={setSelectedNetworks}
          genres={genres}
          onSearch={fetchData}
          loading={loading}
        />

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 border-red-900/50 bg-red-950/40 text-red-200"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="my-3 flex items-center justify-between">
          <SortSelector
            sortField={sortField}
            sortDirection={sortDirection}
            onFieldChange={setSortField}
            onDirectionChange={setSortDirection}
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
          <>
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
            {/* Sentinel: observed by IntersectionObserver to trigger loading
                the next page; loadMore's guards make extra firings harmless */}
            {page < totalPages && <div ref={sentinelRef} className="h-px" />}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-20 text-center">
            <p className="text-sm font-medium text-slate-300">No results found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different title, or loosen the year and rating filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};