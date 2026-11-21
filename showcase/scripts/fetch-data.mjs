// Pulls everything the home-search, discover, detail and heatmap shots show,
// through Marquee's own dev server (so the TMDB key never leaves server/):
//   src/data/search.json    - the header search's results for SEARCH_QUERY
//   src/data/discover.json  - the discover grid after each filter is added
//   src/data/show.json      - SHOW_ID's detail page and every episode rating
//   public/posters/*.jpg, public/backdrops/*.jpg, public/logos/*.png (git-ignored)
// Run with the server up: `npm run dev` in server/, then `pnpm data`.
import { mkdir, writeFile, access } from "node:fs/promises";

const API = process.env.MARQUEE_API ?? "http://localhost:3223/api";
const IMG = "https://image.tmdb.org/t/p";
const SEARCH_QUERY = "hardy";
const SHOW_ID = 1399; // Game of Thrones
const REGION = "CA"; // RegionPicker's default
const GRID = 12;

const exists = (p) => access(p).then(() => true, () => false);
for (const dir of ["public/posters", "public/backdrops", "public/logos"]) await mkdir(dir, { recursive: true });

const get = async (path) => {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
};
const save = async (tmdbPath, file, size = "w500") => {
  if (!tmdbPath) return null;
  if (!(await exists(`public/${file}`))) {
    const img = await fetch(`${IMG}/${size}${tmdbPath}`);
    await writeFile(`public/${file}`, Buffer.from(await img.arrayBuffer()));
  }
  return file;
};

// --- Search -----------------------------------------------------------------
const search = await get(`/search/multi?query=${SEARCH_QUERY}&page=1`);
const hits = [];
for (const r of search.results) {
  if (!["movie", "tv", "person"].includes(r.media_type)) continue;
  const person = r.media_type === "person";
  hits.push({
    kind: r.media_type,
    id: r.id,
    title: r.title || r.name,
    sub: person ? r.known_for_department || "" : (r.release_date || r.first_air_date || "").slice(0, 4),
    poster: await save(person ? r.profile_path : r.poster_path, `posters/${r.media_type}-${r.id}.jpg`),
  });
}
await writeFile("src/data/search.json", JSON.stringify({ query: SEARCH_QUERY, hits }, null, 2) + "\n");

// --- Discover ---------------------------------------------------------------
// Each step adds one filter to the last, the way DiscoverControls builds a query.
const STEPS = [
  { label: "TV Shows", q: {} },
  { label: "Genres: Drama + Sci-Fi & Fantasy (All)", q: { genreIds: "18,10765" } },
  { label: "Where to Watch: Crave", q: { watchProviderIds: "230", watchMonetization: "flatrate", watchRegion: REGION } },
  { label: "Min Rating: 8.0", q: { minRating: "8" } },
];
const toItems = async (results, mediaType = "tv") => {
  const items = [];
  for (const r of results.filter((r) => r.poster_path).slice(0, GRID)) {
    items.push({
      id: r.id,
      mediaType,
      title: r.name ?? r.title,
      year: (r.first_air_date || r.release_date || "").slice(0, 4),
      rating: r.vote_average,
      poster: await save(r.poster_path, `posters/${mediaType}-${r.id}.jpg`),
    });
  }
  return items;
};
const steps = [];
let q = {};
for (const step of STEPS) {
  q = { ...q, ...step.q };
  const data = await get(`/discover-filtered/tv?${new URLSearchParams(q)}`);
  steps.push({ label: step.label, total: data.total_results, items: await toItems(data.results) });
}
// The detail page's genre chip opens Discover with only that genre set.
const genreOnly = await get(`/discover-filtered/tv?genreIds=10765`);
// Discover opens on Movies (initialFilters) before the type is switched.
const movies = await get(`/discover-filtered/movie`);
const start = { label: "Movies", total: movies.total_results, items: await toItems(movies.results, "movie") };
const discover = { start, steps, genre: { name: "Sci-Fi & Fantasy", total: genreOnly.total_results, items: await toItems(genreOnly.results) } };
await writeFile("src/data/discover.json", JSON.stringify(discover, null, 2) + "\n");

// --- The show ---------------------------------------------------------------
const d = await get(`/media/tv/${SHOW_ID}`);
const numbers = d.seasons.map((s) => s.season_number).filter((n) => n > 0);
const seasonsData = await get(`/tv/${SHOW_ID}/seasons?numbers=${numbers.join(",")}`);
const providers = d["watch/providers"]?.results?.[REGION]?.flatrate ?? [];
const show = {
  id: d.id,
  name: d.name,
  tagline: d.tagline,
  status: d.status,
  certification: d.content_ratings?.results?.find((r) => r.iso_3166_1 === "US")?.rating ?? "",
  year: (d.first_air_date || "").slice(0, 4),
  rating: d.vote_average,
  numberOfSeasons: d.number_of_seasons,
  numberOfEpisodes: d.number_of_episodes,
  overview: d.overview,
  genres: d.genres.map((g) => ({ id: g.id, name: g.name })),
  networks: d.networks.map((n) => n.name),
  keywords: (d.keywords?.results ?? []).slice(0, 8).map((k) => k.name),
  poster: await save(d.poster_path, `posters/tv-${d.id}.jpg`),
  backdrop: await save(d.backdrop_path, `backdrops/tv-${d.id}.jpg`, "w1280"),
  providers: await Promise.all(
    providers.map(async (p) => ({ name: p.provider_name, logo: await save(p.logo_path, `logos/provider-${p.provider_id}.png`, "w92") })),
  ),
  // CastAndCrew's "Top cast": series regulars first (api.ts mapCast).
  cast: await Promise.all(
    [...(d.aggregate_credits?.cast ?? [])]
      .sort((a, b) => (b.total_episode_count ?? 0) - (a.total_episode_count ?? 0))
      .slice(0, 10)
      .map(async (c) => ({
        name: c.name,
        character: c.roles?.[0]?.character ?? "",
        episodes: c.total_episode_count,
        photo: await save(c.profile_path, `posters/person-${c.id}.jpg`),
      })),
  ),
  seasons: numbers.map((n) => ({
    number: n,
    episodes: seasonsData[`season/${n}`].episodes.map((e) => ({
      season: e.season_number,
      episode: e.episode_number,
      name: e.name,
      rating: e.vote_average,
      votes: e.vote_count,
      airDate: e.air_date,
    })),
  })),
};
await writeFile("src/data/show.json", JSON.stringify(show, null, 2) + "\n");

console.log(`search: ${hits.length} hits; discover: ${steps.map((s) => s.total).join(" → ")}; show: ${show.name}`);
console.log("final grid:", steps.at(-1).items.map((i) => i.title).join(", "));
