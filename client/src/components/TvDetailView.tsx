import React, { useEffect, useState } from 'react';
import { fetchMediaDetails, fetchSeasonDetails } from '@/utils/api';
import type { MediaDetail, TvSeason, TvEpisode } from '@/utils/types';
import { Alert, AlertDescription } from './ui/alert';
import { CastAndCrew } from './CastAndCrew';
import { EpisodeHeatmap } from './EpisodeHeatmap';
import { ScoreRing } from './ScoreRing';

interface TvDetailViewProps {
  id: number;
}

const TvDetailView: React.FC<TvDetailViewProps> = ({ id }) => {
  const [show, setShow] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(false);

  // Fetch the main TV show details
  useEffect(() => {
    const fetchTvShow = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchMediaDetails('tv', id);
        setShow(data);

        // Automatically select season 1 (or the first available season) if it exists
        if (data.seasons && data.seasons.length > 0) {
          const firstSeason = data.seasons.find((s: TvSeason) => s.season_number > 0) || data.seasons[0];
          setSelectedSeasonNumber(firstSeason.season_number);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTvShow();
  }, [id]);

  // Fetch episodes whenever the selected season changes
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (selectedSeasonNumber === null) return;

      setLoadingEpisodes(true);
      try {
        const seasonData = await fetchSeasonDetails(id, selectedSeasonNumber);
        setEpisodes(seasonData.episodes || []);
      } catch (err) {
        console.error("Failed to load episodes", err);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();
  }, [id, selectedSeasonNumber]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading TV show...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!show) return <div className="text-center py-12 text-gray-400">TV Show not found</div>;

  return (
    <div className="overflow-hidden rounded-xl bg-slate-900">
      {/* Hero: backdrop + poster + core info */}
      <div className="relative">
        {/* Backdrop layer */}
        <div className="absolute inset-0 h-full w-full">
          {show.backdropPath ? (
            <img
              src={show.backdropPath}
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
            {show.posterPath ? (
              <img
                src={show.posterPath}
                alt={show.name}
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
                {show.status}
              </span>
              <span className="text-sm text-slate-400">
                {show.releaseDate ? new Date(show.releaseDate).getFullYear() : 'TBD'}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              {show.name}
            </h1>

            {show.tagline && (
              <p className="mt-2 italic text-slate-400">{show.tagline}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-6">
              {/* Score ring, reused from MediaCard language */}
              {typeof show.rating === 'number' && (
                <div className="flex items-center gap-2">
                  <ScoreRing score={show.rating} size={48} />
                  <div className="text-sm">
                    <p className="font-medium text-slate-200">{show.rating.toFixed(1)} / 10</p>
                    <p className="text-xs text-slate-500">TMDB rating</p>
                  </div>
                </div>
              )}

              <div className="h-8 w-px bg-slate-700" />

              <div className="flex gap-6 text-sm">
                <div>
                  <p className="font-mono text-base font-semibold text-white">
                    {show.numberOfSeasons ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {show.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-base font-semibold text-white">
                    {show.numberOfEpisodes ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">Episodes</p>
                </div>
              </div>
            </div>

            {show.overview && (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300">
                {show.overview}
              </p>
            )}
          </div>
        </div>
      </div>

      {show.credits && (
        <div className="border-t border-slate-800 px-6 py-6 md:px-8">
          <CastAndCrew media={show} />
        </div>
      )}

      {show.seasons && show.seasons.length > 0 && (
        <div className="border-t border-slate-800">
          <EpisodeHeatmap seriesId={id} seasons={show.seasons} />
        </div>
      )}

      {/* Seasons & Episodes UI */}
      {show.seasons && show.seasons.length > 0 && (
        <div className="border-t border-slate-800 p-6 md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar: Season List */}
            <div className="lg:w-56 lg:flex-shrink-0">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Seasons
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                {show.seasons.map((season) => {
                  const isActive = selectedSeasonNumber === season.season_number;
                  return (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeasonNumber(season.season_number)}
                      className={`flex shrink-0 items-center justify-between whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full ${isActive
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                      <span>{season.name}</span>
                      <span
                        className={`ml-2 font-mono text-xs ${isActive ? 'text-slate-950/70' : 'text-slate-500'
                          }`}
                      >
                        {season.episode_count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content: Episode List */}
            <div className="min-w-0 flex-1">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Episodes
              </h2>

              {loadingEpisodes ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-lg bg-slate-800/60"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  ))}
                </div>
              ) : episodes.length > 0 ? (
                <div className="space-y-3">
                  {episodes.map((episode) => (
                    <a
                      href={`/tv/${id}/season/${episode.season_number}/episode/${episode.episode_number}`}
                      key={episode.id}
                      className="group flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-800/40 p-3 transition-colors hover:border-slate-700 hover:bg-slate-800/70 md:flex-row"
                    >
                      {/* Episode Image */}
                      <div className="w-full flex-shrink-0 md:w-44">
                        {episode.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                            alt={episode.name}
                            className="aspect-video w-full rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex aspect-video w-full items-center justify-center rounded-md bg-slate-900 text-xs text-slate-500">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Episode Details */}
                      <div className="flex-1">
                        <div className="mb-1.5 flex items-start justify-between gap-3">
                          <div
                            className="font-semibold leading-snug text-white transition-colors group-hover:text-amber-400"
                          >
                            <span className="text-slate-500">{episode.episode_number}.</span>{' '}
                            {episode.name}
                          </div>
                          <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-amber-400">
                            {episode.vote_average ? episode.vote_average.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        <p className="mb-2 font-mono text-xs text-slate-500">
                          {episode.air_date
                            ? new Date(episode.air_date).toLocaleDateString()
                            : 'TBD'}{' '}
                          · {episode.runtime ? `${episode.runtime} min` : 'Runtime unknown'}
                        </p>
                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">
                          {episode.overview || 'No overview available for this episode.'}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
                  No episodes found for this season.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TvDetailView;
