import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchEpisodeDetails } from '@/utils/api';
import { Alert, AlertDescription } from './ui/alert';
import type { EpisodeDetail } from '@/utils/types';
import { DetailContainer } from './DetailContainer';
import { ImageGallery } from './ImageGallery';

const EpisodeDetailView: React.FC = () => {
  const { seriesId, seasonNumber, episodeNumber } = useParams();
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEpisode = async () => {
      setLoading(true);
      try {
        const data = await fetchEpisodeDetails(Number(seriesId), Number(seasonNumber), Number(episodeNumber));
        setEpisode(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load episode');
      } finally {
        setLoading(false);
      }
    };
    loadEpisode();
  }, [seriesId, seasonNumber, episodeNumber]);

  if (loading) {
    return (
      <DetailContainer>
        <div className="overflow-hidden rounded-xl bg-slate-900">
          <div className="aspect-video w-full animate-pulse bg-slate-800" />
          <div className="space-y-3 p-6 md:p-8">
            <div className="h-8 w-1/2 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      </DetailContainer>
    );
  }

  if (error) {
    return (
      <DetailContainer>
        <Alert
          variant="destructive"
          className="border-red-900/50 bg-red-950/40 text-red-200"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DetailContainer>
    );
  }

  if (!episode) return null;

  return (
    <DetailContainer>
      <div className="overflow-hidden rounded-xl bg-slate-900">
        {/* Still image as a wide banner, not a side panel - it's landscape, not a poster */}
        <div className="relative max-h-[420px] w-full overflow-hidden bg-slate-800">
          {episode.still_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
              alt={episode.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
        </div>

        <div className="p-6 md:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Season {episode.season_number} &middot; Episode {episode.episode_number}
          </p>
          <h1 className="mt-1 text-3xl font-bold leading-tight text-white md:text-4xl">
            {episode.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-amber-400">
              {episode.vote_average.toFixed(1)}
            </span>
            <span className="font-mono text-sm text-slate-400">
              {episode.runtime ? `${episode.runtime} min` : 'Runtime unknown'}
            </span>
            <span className="text-sm text-slate-500">
              {episode.air_date
                ? new Date(episode.air_date).toLocaleDateString()
                : 'Air date TBD'}
            </span>
          </div>

          {episode.overview && (
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300">
              {episode.overview}
            </p>
          )}

          <div className="mt-8 grid gap-8 border-t border-slate-800 pt-8 md:grid-cols-2">
            {/* Detailed Crew */}
            {episode.crew && episode.crew.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Crew
                </h3>
                <div className="space-y-2">
                  {episode.crew.slice(0, 5).map((c, i) => (
                    <div
                      key={`${c.job}-${c.name}-${i}`}
                      className="flex items-center justify-between border-b border-slate-800 py-1.5 text-sm"
                    >
                      <span className="text-slate-500">{c.job}</span>
                      <span className="font-medium text-slate-200">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Stars */}
            {episode.guest_stars && episode.guest_stars.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Guest stars
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {episode.guest_stars.slice(0, 6).map((star) => (
                    <div key={star.name} className="flex items-center gap-2.5">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5">
                        {star.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${star.profile_path}`}
                            alt={star.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                            {star.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-200">
                          {star.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{star.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {episode.images && episode.images.stills && episode.images.stills.length > 0 && (
          <div className="border-t border-slate-800 p-6 md:p-8">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Gallery
            </h3>
            <ImageGallery images={episode.images.stills} />
          </div>
        )}
      </div>
    </DetailContainer>
  );
};

export default EpisodeDetailView;