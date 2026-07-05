import React, { useCallback, useEffect, useState } from 'react';
import { fetchDiscoverMediaWithFilters, fetchGenres, POSTER_BASE_URL } from '@/utils/api';
import type { Genre, MediaSummary, CompanySummary } from '@/utils/types';
import MediaCard from './MediaCard';
import { DiscoverControls } from './DiscoverControls';
import { Alert, AlertDescription } from './ui/alert';

export const DiscoverPage: React.FC = () => {
  const [items, setItems] = useState<MediaSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fetchByYear, setFetchByYear] = useState<boolean>(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [minRating, setMinRating] = useState<number>(0);
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanySummary[]>([]);


  useEffect(() => {
    setGenreIds([]); // Clear selected genres when switching type
    fetchGenres(mediaType).then(setGenres).catch(console.error);
  }, [mediaType]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDiscoverMediaWithFilters({
        mediaType,
        searchQuery: searchQuery.trim() || undefined,
        year: fetchByYear ? year : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        genreIds: genreIds.length > 0 ? genreIds : undefined,
        companyIds: selectedCompanies.length > 0 ? selectedCompanies.map(c => c.id) : undefined,
      });

      const processedData: MediaSummary[] = data.results
        .filter((item: any) => {
          const releaseDate = new Date(item.release_date || item.first_air_date);
          return !fetchByYear || releaseDate.getFullYear() === year;
        })
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          rating: item.vote_average,
          releaseDate: item.release_date || item.first_air_date,
          posterPath: item.poster_path ? `${POSTER_BASE_URL}${item.poster_path}` : null,
          mediaType,
        }));

      const sortedData = processedData.sort((a, b) => b.rating - a.rating);
      setItems(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [mediaType, searchQuery, fetchByYear, year, minRating, genreIds, selectedCompanies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          fetchByYear={fetchByYear}
          setFetchByYear={setFetchByYear}
          year={year}
          setYear={setYear}
          minRating={minRating}
          setMinRating={setMinRating}
          genreIds={genreIds}
          setGenreIds={setGenreIds}
          selectedCompanies={selectedCompanies}
          setSelectedCompanies={setSelectedCompanies}
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

        {!loading && (
          <div className="my-3 flex items-center justify-end">
            <p className="font-mono text-xs text-slate-500">
              {items.length} {items.length === 1 ? 'result' : 'results'}
            </p>
          </div>
        )}

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
          </div>
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