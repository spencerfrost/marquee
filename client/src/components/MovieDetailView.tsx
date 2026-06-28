import React, { useEffect, useState } from 'react';
import { fetchMediaDetails } from '@/utils/api';
import type { MediaDetail } from '@/utils/types';
import { Alert, AlertDescription } from './ui/alert';
import { CastAndCrew } from './CastAndCrew';
import { ScoreRing } from './ScoreRing';

interface MovieDetailViewProps {
  id: number;
}

const MovieDetailView: React.FC<MovieDetailViewProps> = ({ id }) => {
  const [movie, setMovie] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchMediaDetails('movie', id);
        setMovie(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading movie...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!movie) return <div className="text-center py-12 text-gray-400">Movie not found</div>;

return (
  <div className="overflow-hidden rounded-xl bg-slate-900">
    {/* Hero: backdrop + poster + core info */}
    <div className="relative">
      {/* Backdrop layer */}
      <div className="absolute inset-0 h-full w-full">
        {movie.backdropPath ? (
          <img
            src={movie.backdropPath}
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
        ) : (
          <div className="h-full w-full bg-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-transparent" />
      </div>

      {/* Foreground content */}
      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:p-8">
        <div className="w-40 flex-shrink-0 md:w-56">
          {movie.posterPath ? (
            <img
              src={movie.posterPath}
              alt={movie.title}
              className="w-full rounded-lg object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10"
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-slate-700 text-sm text-slate-400">
              No Image
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-end">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-600/60 bg-slate-800/80 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
              {movie.status}
            </span>
            <span className="text-sm text-slate-400">
              {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'TBD'}
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
            {movie.title}
          </h1>

          {movie.tagline && (
            <p className="mt-2 italic text-slate-400">{movie.tagline}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-6">
            {typeof movie.rating === 'number' && (
              <div className="flex items-center gap-2">
                <ScoreRing score={movie.rating} size={48} />
                <div className="text-sm">
                  <p className="font-medium text-slate-200">{movie.rating.toFixed(1)} / 10</p>
                  <p className="text-xs text-slate-500">
                    {movie.voteCount ? `${movie.voteCount.toLocaleString()} votes` : 'TMDB rating'}
                  </p>
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-slate-700" />

            <div className="flex gap-6 text-sm">
              <div>
                <p className="font-mono text-base font-semibold text-white">
                  {movie.runtime ? `${movie.runtime}` : '—'}
                </p>
                <p className="text-xs text-slate-500">
                  {movie.runtime ? 'Minutes' : 'Runtime'}
                </p>
              </div>
              <div>
                <p className="font-mono text-base font-semibold text-white">
                  {movie.releaseDate
                    ? new Date(movie.releaseDate).toLocaleDateString()
                    : '—'}
                </p>
                <p className="text-xs text-slate-500">Released</p>
              </div>
            </div>
          </div>

          {movie.overview && (
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300">
              {movie.overview}
            </p>
          )}

          {movie.homepage && (
            <a
              href={movie.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-amber-400"
            >
              Visit homepage
            </a>
          )}
        </div>
      </div>
    </div>

    {/* Budget / Revenue strip */}
    {(movie.budget || movie.revenue) && (
      <div className="grid grid-cols-2 divide-x divide-slate-800 border-t border-slate-800">
        <div className="px-6 py-4 md:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget</p>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-100">
            {movie.budget ? `$${movie.budget.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="px-6 py-4 md:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Revenue</p>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-100">
            {movie.revenue ? `$${movie.revenue.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>
    )}

    {movie.credits && (
      <div className="border-t border-slate-800 px-6 py-6 md:px-8">
        <CastAndCrew media={movie} />
      </div>
    )}
  </div>
);
};

export default MovieDetailView;