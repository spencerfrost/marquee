import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Grid3x3 } from 'lucide-react';
import type { TvEpisode } from '@/utils/types';
import { formatDate } from '@/utils/date';
import {
    RATING_BANDS,
    UNRATED_BG,
    bandFor,
    computeStats,
    episodeCode,
    isRated,
    isReliable,
    MIN_RELIABLE_VOTES,
} from '@/utils/episodeRatings';

export const HEATMAP_ANCHOR = 'episode-ratings';

interface RatingsData {
    seriesId: number;
    seasonNumbers: number[];
    episodes: Record<number, TvEpisode[]>;
    loading: boolean;
    error: boolean;
}

const episodePath = (seriesId: number, e: TvEpisode) =>
    `/tv/${seriesId}/season/${e.season_number}/episode/${e.episode_number}`;

const cellStyle = (e: TvEpisode): React.CSSProperties => {
    if (!isRated(e)) return { backgroundColor: UNRATED_BG };
    const band = bandFor(e.vote_average);
    return {
        backgroundColor: band.bg,
        color: band.fg,
        opacity: isReliable(e) ? 1 : 0.45,
    };
};

// --- Collapsed strip ------------------------------------------------------
// The whole series at a glance: one bar per episode, coloured and sized by
// rating, grouped by season. This is the heatmap's collapsed state; clicking
// it expands the full grid.

const RatingStrip: React.FC<{
    seasons: number[];
    episodes: Record<number, TvEpisode[]>;
    onExpand: () => void;
}> = ({ seasons, episodes, onExpand }) => {
    // Heights are scaled to this show's own range: an acclaimed show sits
    // entirely between ~7.5 and 9.5, and an absolute 0–10 scale would flatten it.
    // The 1.5-point minimum span stops a consistent show from looking wildly uneven.
    const ratings = seasons.flatMap((n) => episodes[n].filter(isRated).map((e) => e.vote_average));
    const hi = ratings.length ? Math.max(...ratings) : 10;
    const lo = ratings.length ? Math.min(Math.min(...ratings), hi - 1.5) : 0;
    const heightFor = (e: TvEpisode) => (isRated(e) ? 20 + ((e.vote_average - lo) / (hi - lo)) * 80 : 10);
    const episodeCount = seasons.reduce((sum, n) => sum + episodes[n].length, 0);

    return (
        <button
            type="button"
            onClick={onExpand}
            aria-expanded={false}
            aria-controls={HEATMAP_ANCHOR}
            className="group block w-full rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
        >
            <div className="flex h-14 items-end gap-[3px] overflow-hidden">
                {seasons.map((n) => (
                    <div key={n} className="flex h-full flex-1 items-end gap-px" style={{ flexGrow: episodes[n].length }}>
                        {episodes[n].map((e) => (
                            <div
                                key={e.id}
                                className="min-w-px flex-1 rounded-t-[1px] transition-opacity group-hover:opacity-80"
                                style={{ ...cellStyle(e), height: `${heightFor(e)}%` }}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="text-xs text-slate-500">
                    {episodeCount} episodes across {seasons.length} {seasons.length === 1 ? 'season' : 'seasons'}
                </p>
                {/* Styled as a button so it reads as the action; the whole strip is the click target */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-sm font-medium text-amber-400 transition-colors group-hover:border-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 group-focus-visible:border-amber-400">
                    <Grid3x3 className="h-4 w-4" aria-hidden />
                    Show full heatmap
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
                </span>
            </div>
        </button>
    );
};

// --- Full heatmap -----------------------------------------------------------

interface TooltipState {
    episode: TvEpisode;
    x: number;
    y: number;
    above: boolean;
}

const TOOLTIP_HALF_WIDTH = 128;

const Tooltip: React.FC<TooltipState> = ({ episode, x, y, above }) => (
    <div
        role="tooltip"
        className="pointer-events-none fixed z-50 w-64 rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-left shadow-xl shadow-black/50"
        style={{
            left: x,
            top: y,
            transform: `translate(-50%, ${above ? 'calc(-100% - 8px)' : '8px'})`,
        }}
    >
        <p className="font-mono text-xs text-slate-500">{episodeCode(episode)}</p>
        <p className="mt-0.5 font-semibold leading-snug text-white">{episode.name}</p>
        <div className="mt-2 flex items-center gap-3 text-xs">
            {isRated(episode) ? (
                <>
                    <span
                        className="rounded px-1.5 py-0.5 font-mono font-semibold"
                        style={{ backgroundColor: bandFor(episode.vote_average).bg, color: bandFor(episode.vote_average).fg }}
                    >
                        {episode.vote_average.toFixed(1)}
                    </span>
                    <span className="text-slate-400">
                        {episode.vote_count.toLocaleString()} {episode.vote_count === 1 ? 'vote' : 'votes'}
                    </span>
                </>
            ) : (
                <span className="text-slate-400">Not yet rated</span>
            )}
            {episode.air_date && <span className="ml-auto text-slate-500">{formatDate(episode.air_date)}</span>}
        </div>
        {isRated(episode) && !isReliable(episode) && (
            <p className="mt-2 text-xs text-amber-400/80">Few votes; this rating may not mean much.</p>
        )}
    </div>
);

const RatingChip: React.FC<{ rating: number; className?: string; title?: string }> = ({
    rating,
    className = '',
    title,
}) => {
    const band = bandFor(rating);
    return (
        <span
            title={title}
            className={`inline-flex shrink-0 items-center justify-center rounded-md font-mono font-semibold tabular-nums ${className}`}
            style={{ backgroundColor: band.bg, color: band.fg }}
        >
            {rating.toFixed(1)}
        </span>
    );
};

const EpisodeHighlight: React.FC<{ label: string; episode: TvEpisode; seriesId: number }> = ({
    label,
    episode,
    seriesId,
}) => (
    <Link
        to={episodePath(seriesId, episode)}
        className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-800/60"
    >
        <span className="w-18 shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {label}
        </span>
        <RatingChip rating={episode.vote_average} className="h-7 w-11 text-sm" />
        <span className="min-w-0 flex-1 truncate font-medium text-slate-200 transition-colors group-hover:text-amber-400">
            {episode.name}
        </span>
        <span className="shrink-0 font-mono text-xs text-slate-500">{episodeCode(episode)}</span>
    </Link>
);

// Peak/low episodes on the left; every season's average on the right, with the
// best and lowest marked, so the trend across seasons reads at a glance.
const RatingHighlights: React.FC<{
    seriesId: number;
    seasons: number[];
    stats: ReturnType<typeof computeStats>;
}> = ({ seriesId, seasons, stats }) => {
    const averaged = seasons.filter((n) => stats.seasonAverages.has(n));
    // Mark by the value as displayed, so two seasons that both read "8.4" get
    // the same mark rather than one being singled out on a hidden second decimal
    const shown = (x: number | undefined) => x?.toFixed(1);
    const bestShown = shown(stats.bestSeason?.average);
    const lowShown = shown(stats.worstSeason?.average);
    const hasSpread = bestShown !== undefined && lowShown !== undefined && bestShown !== lowShown;
    return (
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="flex flex-col justify-center">
                {stats.best && <EpisodeHighlight label="Peak" episode={stats.best} seriesId={seriesId} />}
                {stats.worst && <EpisodeHighlight label="Low point" episode={stats.worst} seriesId={seriesId} />}
            </div>

            {averaged.length > 1 && (
                <div className="min-w-0 lg:border-l lg:border-slate-800 lg:pl-8">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Season averages
                    </p>
                    <div className="-mx-1 flex gap-x-1.5 gap-y-2 overflow-x-auto px-1 pt-1 pb-1 lg:flex-wrap lg:overflow-visible">
                        {averaged.map((n) => {
                            const avg = stats.seasonAverages.get(n)!;
                            const mark = !hasSpread
                                ? null
                                : shown(avg) === bestShown
                                  ? { text: '▲ best', cls: 'text-emerald-400' }
                                  : shown(avg) === lowShown
                                      ? { text: '▼ low', cls: 'text-red-400' }
                                      : null;
                            return (
                                <div key={n} className="flex w-11 shrink-0 flex-col items-center gap-1">
                                    <span className="font-mono text-[10px] text-slate-500">S{n}</span>
                                    <RatingChip
                                        rating={avg}
                                        title={`Season ${n}: ${avg.toFixed(2)} average`}
                                        className={`h-7 w-11 text-xs ${mark ? 'ring-2 ring-white/70 ring-offset-1 ring-offset-slate-900' : ''}`}
                                    />
                                    <span className={`h-3 text-[10px] leading-3 font-medium whitespace-nowrap ${mark?.cls ?? ''}`}>
                                        {mark?.text}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const EpisodeHeatmap: React.FC<RatingsData> = ({ seriesId, seasonNumbers, episodes, loading, error }) => {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    // Keyed by show so navigating to another series starts collapsed again
    const [expandedFor, setExpandedFor] = useState<number | null>(null);
    const expanded = expandedFor === seriesId;

    const collapse = () => {
        setTooltip(null);
        setExpandedFor(null);
        // The button sits below a possibly very tall grid; once it shrinks away,
        // bring the section back into view rather than leaving the reader further down the page
        const section = document.getElementById(HEATMAP_ANCHOR);
        if (section && section.getBoundingClientRect().top < 0) {
            requestAnimationFrame(() => section.scrollIntoView({ block: 'start' }));
        }
    };
    const stats = useMemo(() => computeStats(episodes), [episodes]);

    // A fixed-position tooltip would float away from its cell on scroll, so just drop it
    useEffect(() => {
        if (!tooltip) return;
        const hide = () => setTooltip(null);
        window.addEventListener('scroll', hide, true);
        return () => window.removeEventListener('scroll', hide, true);
    }, [tooltip]);

    const showTooltip = (episode: TvEpisode, el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        const above = r.top > 140;
        const x = Math.min(
            Math.max(r.left + r.width / 2, TOOLTIP_HALF_WIDTH + 8),
            window.innerWidth - TOOLTIP_HALF_WIDTH - 8
        );
        setTooltip({ episode, x, y: above ? r.top : r.bottom, above });
    };

    const seasons = seasonNumbers.filter((n) => episodes[n]?.length);
    const maxEpisodes = Math.max(0, ...seasons.map((n) => Math.max(...episodes[n].map((e) => e.episode_number))));

    return (
        <section id={HEATMAP_ANCHOR} className="scroll-mt-4 px-6 py-6 md:px-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Episode ratings</h2>

                {expanded && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                        {RATING_BANDS.map((b) => (
                            <span key={b.label} className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: b.bg }} />
                                {b.label}
                            </span>
                        ))}
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-sm opacity-45" style={{ backgroundColor: RATING_BANDS[1].bg }} />
                            &lt;{MIN_RELIABLE_VOTES} votes
                        </span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="space-y-5">
                    <div className="h-21 animate-pulse rounded-lg bg-slate-800/60" />
                    <div className="h-14 animate-pulse rounded bg-slate-800/60" />
                </div>
            ) : error ? (
                <div className="rounded-lg border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
                    Couldn't load episode ratings.
                </div>
            ) : seasons.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
                    No episodes to rate yet.
                </div>
            ) : (
                <>
                    {stats.ratedCount > 0 && (
                        <RatingHighlights seriesId={seriesId} seasons={seasons} stats={stats} />
                    )}

                    {!expanded ? (
                        <RatingStrip seasons={seasons} episodes={episodes} onExpand={() => setExpandedFor(seriesId)} />
                    ) : (
                        <div className="overflow-x-auto pb-2">
                            <div className="min-w-max" onMouseLeave={() => setTooltip(null)}>
                                {/* Header row: seasons (x-axis) */}
                                <div className="flex">
                                    <div className="sticky left-0 z-10 w-8 shrink-0 bg-slate-900 sm:w-10" />
                                    {seasons.map((n) => (
                                        <div
                                            key={n}
                                            className="mx-0.5 mb-2 w-8 text-center font-mono text-[11px] font-semibold text-slate-500 sm:w-10 sm:text-xs"
                                        >
                                            S{n}
                                        </div>
                                    ))}
                                </div>

                                {/* Body: episodes (y-axis) */}
                                {Array.from({ length: maxEpisodes }).map((_, rowIndex) => {
                                    const episodeNum = rowIndex + 1;
                                    return (
                                        <div key={episodeNum} className="mb-1 flex">
                                            {/* Sticky so the episode axis stays visible when scrolled sideways */}
                                            <div className="sticky left-0 z-10 flex w-8 shrink-0 items-center justify-end bg-slate-900 pr-2 font-mono text-[11px] text-slate-500 sm:w-10 sm:text-xs">
                                                {episodeNum}
                                            </div>

                                            {seasons.map((n) => {
                                                const episode = episodes[n].find((e) => e.episode_number === episodeNum);
                                                if (!episode) {
                                                    return <div key={n} className="mx-0.5 h-8 w-8 sm:h-10 sm:w-10" />;
                                                }
                                                return (
                                                    <Link
                                                        key={n}
                                                        to={episodePath(seriesId, episode)}
                                                        aria-label={`${episodeCode(episode)} ${episode.name}: ${isRated(episode) ? episode.vote_average.toFixed(1) : 'not rated'}`}
                                                        onMouseEnter={(ev) => showTooltip(episode, ev.currentTarget)}
                                                        onFocus={(ev) => showTooltip(episode, ev.currentTarget)}
                                                        onBlur={() => setTooltip(null)}
                                                        className="mx-0.5 flex h-8 w-8 items-center justify-center rounded-md font-mono text-[10px] font-semibold transition-transform hover:z-20 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-400 sm:h-10 sm:w-10 sm:text-xs"
                                                        style={cellStyle(episode)}
                                                    >
                                                        {isRated(episode) ? episode.vote_average.toFixed(1) : ''}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {expanded && (
                        // Same spot as "Show full heatmap", so the toggle doesn't move. Sticky so a
                        // grid taller than the screen still has it in reach; pointer-events-none
                        // stops the full-width row from blocking clicks on cells behind it.
                        <div className="pointer-events-none sticky bottom-4 z-30 mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={collapse}
                                aria-expanded={true}
                                aria-controls={HEATMAP_ANCHOR}
                                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800/90 px-3.5 py-1.5 text-sm font-medium text-slate-200 shadow-lg shadow-black/50 backdrop-blur transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                            >
                                Hide heatmap
                                <ChevronUp className="h-4 w-4" aria-hidden />
                            </button>
                        </div>
                    )}
                </>
            )}

            {tooltip && <Tooltip {...tooltip} />}
        </section>
    );
};
