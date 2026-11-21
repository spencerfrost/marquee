import data from "./data/titles.json";

/** One title from the home rails (scripts/fetch-posters.mjs). */
export interface Title {
  id: number;
  mediaType: string;
  title: string;
  year: string;
  rating: number;
  poster: string;
}

export const RAILS: { key: string; title: string; items: Title[] }[] = data.rails;
export const rail = (key: string) => RAILS.find((r) => r.key === key)!.items;
/** Every title once, in rail order, for poster walls. */
export const ALL_TITLES: Title[] = [...new Map(RAILS.flatMap((r) => r.items).map((t) => [t.poster, t])).values()];
