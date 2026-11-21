import discoverData from "./data/discover.json";
import searchData from "./data/search.json";
import showData from "./data/show.json";
import { Title } from "./titles";

/** scripts/fetch-data.mjs: the header search, the discover steps and the show. */

export interface Hit {
  kind: "movie" | "tv" | "person";
  id: number;
  title: string;
  /** Year, or a person's department. */
  sub: string;
  poster: string | null;
}
export const SEARCH = searchData as { query: string; hits: Hit[] };

export interface DiscoverStep {
  label: string;
  total: number;
  items: Title[];
}
export const DISCOVER = discoverData as { start: DiscoverStep; steps: DiscoverStep[]; genre: { name: string; total: number; items: Title[] } };

export interface Episode {
  season: number;
  episode: number;
  name: string;
  rating: number;
  votes: number;
  airDate: string;
}
export const SHOW = showData as {
  id: number;
  name: string;
  tagline: string;
  status: string;
  certification: string;
  year: string;
  rating: number;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  overview: string;
  genres: { id: number; name: string }[];
  networks: string[];
  keywords: string[];
  poster: string;
  backdrop: string;
  providers: { name: string; logo: string }[];
  cast: { name: string; character: string; episodes: number; photo: string | null }[];
  seasons: { number: number; episodes: Episode[] }[];
};

// --- client/src/utils/episodeRatings.ts ---------------------------------------

export const RATING_BANDS = [
  { min: 9, label: "9+", bg: "#16a34a", fg: "#f0fdf4" },
  { min: 8, label: "8", bg: "#65a30d", fg: "#f7fee7" },
  { min: 7, label: "7", bg: "#ca8a04", fg: "#1c1917" },
  { min: 6, label: "6", bg: "#ea580c", fg: "#1c1917" },
  { min: 5, label: "5", bg: "#dc2626", fg: "#fef2f2" },
  { min: 0, label: "<5", bg: "#7f1d1d", fg: "#fecaca" },
];
export const UNRATED_BG = "#334155";
export const MIN_RELIABLE_VOTES = 10;
export const bandFor = (rating: number) => RATING_BANDS.find((b) => rating >= b.min) ?? RATING_BANDS[RATING_BANDS.length - 1];
export const episodeCode = (e: Episode) => `S${e.season}E${e.episode}`;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** computeStats, for the one show. */
export const STATS = (() => {
  const all = SHOW.seasons.flatMap((s) => s.episodes);
  const rated = all.filter((e) => e.rating > 0);
  const reliable = rated.filter((e) => e.votes >= MIN_RELIABLE_VOTES);
  const pool = reliable.length ? reliable : rated;
  let best = pool[0];
  let worst = pool[0];
  for (const e of pool) {
    if (e.rating > best.rating) best = e;
    if (e.rating < worst.rating) worst = e;
  }
  const seasonAverages = SHOW.seasons.map((s) => ({ number: s.number, average: mean(s.episodes.filter((e) => e.rating > 0).map((e) => e.rating)) }));
  const shown = (x: number) => x.toFixed(1);
  const bestShown = shown(Math.max(...seasonAverages.map((s) => s.average)));
  const lowShown = shown(Math.min(...seasonAverages.map((s) => s.average)));
  return { best, worst, seasonAverages, bestShown, lowShown, episodeCount: all.length };
})();
