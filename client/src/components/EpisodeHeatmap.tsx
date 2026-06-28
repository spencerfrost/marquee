import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSeasonDetails } from '@/utils/api';
import type { TvSeason, TvEpisode } from '@/utils/types';

interface EpisodeHeatmapProps {
    seriesId: number;
    seasons: TvSeason[];
}

export const EpisodeHeatmap: React.FC<EpisodeHeatmapProps> = ({ seriesId, seasons }) => {
    const [allEpisodes, setAllEpisodes] = useState<{ [seasonNumber: number]: TvEpisode[] }>({});
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Filter out 'Specials' (usually season 0) for a cleaner heatmap
    const standardSeasons = seasons.filter((s) => s.season_number > 0);

    useEffect(() => {
        if (!isOpen || Object.keys(allEpisodes).length > 0) return;

        const fetchAllSeasons = async () => {
            setLoading(true);
            try {
                const seasonPromises = standardSeasons.map((s) =>
                    fetchSeasonDetails(seriesId, s.season_number)
                );

                const seasonsData = await Promise.all(seasonPromises);

                const episodesMap: { [season: number]: TvEpisode[] } = {};
                seasonsData.forEach((data: any) => {
                    if (data.season_number && data.episodes) {
                        episodesMap[data.season_number] = data.episodes;
                    }
                });

                setAllEpisodes(episodesMap);
            } catch (err) {
                console.error('Failed to load heatmap data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllSeasons();
    }, [isOpen, seriesId, standardSeasons]);

    const getRatingColor = (rating?: number) => {
        // Unrated or unreleased
        if (!rating) return 'bg-gray-700';

        // The Good
        if (rating >= 8.5) return 'bg-green-500';
        if (rating >= 7.5) return 'bg-green-400';

        // The Average
        if (rating >= 6.5) return 'bg-yellow-500';
        if (rating >= 6.0) return 'bg-orange-400';

        // The Bad (< 6 gets deep orange, shifting into red)
        if (rating >= 5.0) return 'bg-orange-600';
        if (rating >= 3.0) return 'bg-red-600';

        // The Ugly
        return 'bg-red-800';
    };

    if (!isOpen) {
        return (
            <div className="flex justify-center py-4">
                <button
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-400"
                >
                    View episode rating heatmap
                </button>
            </div>
        );
    }

    // Find the maximum episode number across all fetched seasons to draw our Y-axis
    const maxEpisodes = Math.max(
        ...Object.values(allEpisodes).map((eps) => eps.length),
        0
    );

    return (
        <div className="pt-4 px-4">
            {loading ? (
                <div className="space-y-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-8 w-full animate-pulse rounded bg-slate-800/60"
                            style={{ animationDelay: `${i * 60}ms` }}
                        />
                    ))}
                </div>
            ) : (
                <>
                    {/* Legend */}
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Rating:</span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> 8.5+
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> 6.5&ndash;8.4
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-orange-600" /> 5.0&ndash;6.4
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-red-800" /> &lt;5.0
                        </span>
                    </div>

                    <div className="overflow-x-auto pb-2">
                        <div className="min-w-max">
                            {/* Header Row: Seasons (X-Axis) */}
                            <div className="flex">
                                <div className="w-10 flex-shrink-0" />
                                {standardSeasons.map((s) => (
                                    <div
                                        key={s.season_number}
                                        className="mb-2 w-10 text-center font-mono text-xs font-semibold text-slate-500"
                                    >
                                        S{s.season_number}
                                    </div>
                                ))}
                            </div>

                            {/* Body: Episodes (Y-Axis) */}
                            {Array.from({ length: maxEpisodes }).map((_, rowIndex) => {
                                const episodeNum = rowIndex + 1;
                                return (
                                    <div key={episodeNum} className="mb-1 flex">
                                        <div className="flex w-10 flex-shrink-0 items-center justify-end pr-2 font-mono text-xs text-slate-500">
                                            {episodeNum}
                                        </div>

                                        {standardSeasons.map((s) => {
                                            const seasonEps = allEpisodes[s.season_number] || [];
                                            const episode = seasonEps.find((e) => e.episode_number === episodeNum);

                                            if (!episode) {
                                                return (
                                                    <div
                                                        key={`${s.season_number}-${episodeNum}`}
                                                        className="mx-[2px] h-10 w-10 rounded-md bg-transparent"
                                                    />
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={`${s.season_number}-${episodeNum}`}
                                                    to={`/tv/${seriesId}/season/${s.season_number}/episode/${episode.episode_number}`}
                                                    title={`${episode.name} - ${episode.vote_average.toFixed(1)}`}
                                                    className={`mx-[2px] flex h-10 w-10 items-center justify-center rounded-md font-mono text-xs font-semibold text-gray-900 transition-transform hover:scale-110 ${getRatingColor(
                                                        episode.vote_average
                                                    )}`}
                                                >
                                                    {episode.vote_average > 0 ? episode.vote_average.toFixed(1) : ''}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-center border-t border-slate-800">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full p-2 rounded-md text-sm text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-slate-300"
                            aria-label="Collapse heatmap"
                        >
                            Collapse
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};