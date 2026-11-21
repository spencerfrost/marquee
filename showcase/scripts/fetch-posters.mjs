// Pulls the home page's rails through Marquee's own dev server (so the TMDB
// key never leaves server/) and saves:
//   src/data/titles.json  - each rail's titles (committed: ids, names, years, ratings)
//   public/posters/*.jpg  - their posters (git-ignored: the studios own them)
// Run with the server up: `npm run dev` in server/, then `pnpm posters`.
import { mkdir, writeFile, access } from "node:fs/promises";

const API = process.env.MARQUEE_API ?? "http://localhost:3223/api";
const IMG = "https://image.tmdb.org/t/p/w500";
const PER_RAIL = 14;

// Same keys and titles as client/src/components/HomeRails.tsx.
const RAILS = [
  ["trending-week", "Trending this week"],
  ["movie-now-playing", "Now playing"],
  ["tv-on-the-air", "On the air"],
  ["movie-popular", "Popular movies"],
  ["tv-popular", "Popular TV"],
  ["movie-top-rated", "Top rated movies"],
  ["tv-top-rated", "Top rated TV"],
  ["movie-upcoming", "Upcoming movies"],
];

const exists = (p) => access(p).then(() => true, () => false);
await mkdir("public/posters", { recursive: true });

const rails = [];
for (const [key, title] of RAILS) {
  const res = await fetch(`${API}/trending/${key}`);
  if (!res.ok) throw new Error(`${key}: ${res.status}`);
  const { results } = await res.json();
  const items = [];
  for (const r of results.filter((r) => r.poster_path && r.media_type !== "person").slice(0, PER_RAIL)) {
    const mediaType = r.media_type ?? (key.startsWith("tv") ? "tv" : "movie");
    const file = `posters/${mediaType}-${r.id}.jpg`;
    if (!(await exists(`public/${file}`))) {
      const img = await fetch(IMG + r.poster_path);
      await writeFile(`public/${file}`, Buffer.from(await img.arrayBuffer()));
    }
    items.push({
      id: r.id,
      mediaType,
      title: r.title ?? r.name,
      year: (r.release_date ?? r.first_air_date ?? "").slice(0, 4),
      rating: Math.round((r.vote_average ?? 0) * 10) / 10,
      poster: file,
    });
  }
  rails.push({ key, title, items });
  console.log(`${title}: ${items.length}`);
}
await writeFile("src/data/titles.json", JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), rails }, null, 2) + "\n");
