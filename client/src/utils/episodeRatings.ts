import { useEffect, useState } from 'react';
import { fetchSeasonsEpisodes } from './api';
import type { TvEpisode, TvSeason } from './types';

// --- Colour scale -----------------------------------------------------------
// One list drives both the cells and the legend, so they can't drift apart.

export interface RatingBand {
  min: number;
  label: string;
  bg: string;
  fg: string;
}

export const RATING_BANDS: RatingBand[] = [
  { min: 9, label: '9+', bg: '#16a34a', fg: '#f0fdf4' },
  { min: 8, label: '8', bg: '#65a30d', fg: '#f7fee7' },
  { min: 7, label: '7', bg: '#ca8a04', fg: '#1c1917' },
  { min: 6, label: '6', bg: '#ea580c', fg: '#1c1917' },
  { min: 5, label: '5', bg: '#dc2626', fg: '#fef2f2' },
  { min: 0, label: '<5', bg: '#7f1d1d', fg: '#fecaca' },
];

export const UNRATED_BG = '#334155';

export const bandFor = (rating: number): RatingBand =>
  RATING_BANDS.find((b) => rating >= b.min) ?? RATING_BANDS[RATING_BANDS.length - 1];

// Below this many votes a rating is mostly noise; such cells are drawn faded
// and ignored for best/worst picks (unless nothing else qualifies).
export const MIN_RELIABLE_VOTES = 10;

export const isRated = (e: TvEpisode) => e.vote_average > 0;
export const isReliable = (e: TvEpisode) => isRated(e) && e.vote_count >= MIN_RELIABLE_VOTES;

// --- Stats ------------------------------------------------------------------

export interface SeasonAverage {
  seasonNumber: number;
  average: number;
}

export interface SeriesStats {
  best: TvEpisode | null;
  worst: TvEpisode | null;
  bestSeason: SeasonAverage | null;
  worstSeason: SeasonAverage | null;
  seasonAverages: Map<number, number>;
  ratedCount: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function computeStats(bySeason: Record<number, TvEpisode[]>): SeriesStats {
  const all = Object.values(bySeason).flat();
  const rated = all.filter(isRated);
  const reliable = rated.filter(isReliable);
  // Fall back to everything rated for obscure shows where nothing clears the vote floor
  const pool = reliable.length > 0 ? reliable : rated;

  let best: TvEpisode | null = null;
  let worst: TvEpisode | null = null;
  for (const e of pool) {
    if (!best || e.vote_average > best.vote_average) best = e;
    if (!worst || e.vote_average < worst.vote_average) worst = e;
  }

  const seasonAverages = new Map<number, number>();
  for (const [season, eps] of Object.entries(bySeason)) {
    const ratings = eps.filter(isRated).map((e) => e.vote_average);
    if (ratings.length > 0) seasonAverages.set(Number(season), mean(ratings));
  }

  let bestSeason: SeasonAverage | null = null;
  let worstSeason: SeasonAverage | null = null;
  for (const [seasonNumber, average] of seasonAverages) {
    if (!bestSeason || average > bestSeason.average) bestSeason = { seasonNumber, average };
    if (!worstSeason || average < worstSeason.average) worstSeason = { seasonNumber, average };
  }

  return {
    best,
    // Only interesting when it differs from the best
    worst: worst && best && worst.id !== best.id ? worst : null,
    bestSeason,
    worstSeason:
      worstSeason && bestSeason && worstSeason.seasonNumber !== bestSeason.seasonNumber ? worstSeason : null,
    seasonAverages,
    ratedCount: rated.length,
  };
}

export const episodeCode = (e: Pick<TvEpisode, 'season_number' | 'episode_number'>) =>
  `S${e.season_number}E${e.episode_number}`;

// --- Data -------------------------------------------------------------------

interface SeriesEpisodesState {
  key: string;
  episodes: Record<number, TvEpisode[]>;
  loading: boolean;
  error: boolean;
}

/** Fetches every regular season (Specials excluded) for the heatmap and the hero strip. */
export function useSeriesEpisodes(seriesId: number, seasons: TvSeason[] | undefined) {
  const seasonNumbers = (seasons ?? []).map((s) => s.season_number).filter((n) => n > 0);
  // A stable string key, so the effect only re-runs when the show or its seasons change
  const key = `${seriesId}:${seasonNumbers.join(',')}`;

  const [state, setState] = useState<SeriesEpisodesState>({ key: '', episodes: {}, loading: false, error: false });

  useEffect(() => {
    const numbers = key.split(':')[1].split(',').filter(Boolean).map(Number);
    if (numbers.length === 0) return;

    let cancelled = false;
    setState({ key, episodes: {}, loading: true, error: false });
    fetchSeasonsEpisodes(seriesId, numbers)
      .then((episodes) => {
        if (!cancelled) setState({ key, episodes, loading: false, error: false });
      })
      .catch((err) => {
        console.error('Failed to load episode ratings', err);
        if (!cancelled) setState({ key, episodes: {}, loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key, seriesId]);

  // Until the effect catches up with a new show, don't show the previous show's data
  const current = state.key === key;
  return {
    seasonNumbers,
    episodes: current ? state.episodes : {},
    loading: current ? state.loading : seasonNumbers.length > 0,
    error: current && state.error,
  };
}
