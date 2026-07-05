# Marquee Codebase Guide

## Overview

Marquee is a React + TypeScript application for browsing popular movies and TV shows from The Movie Database (TMDB). It features a list-based discovery view and detailed pages for movies, TV series, individual episodes, and people. It uses Tailwind CSS for styling and a set of reusable UI components.

The app is split into two parts:

* **`client/`** — the React frontend (everything user-facing)
* **`server/`** — a minimal Express proxy that holds the TMDB API key and forwards requests to TMDB on the client's behalf

This split exists for one reason: the app used to call TMDB directly from the browser, which meant the TMDB API key was bundled into the client JS and visible to anyone via dev tools. The server now holds the key; the client never sees it.

## Repository Structure

```
marquee/
├── client/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   │   ├── api.ts   # calls the server's /api/* routes
│   │   │   └── types.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
├── server/              # Express proxy
│   ├── src/
│   │   ├── routes/      # one file per TMDB resource
│   │   ├── tmdb.ts      # the only file that reads TMDB_API_KEY
│   │   └── index.ts
│   └── package.json
├── ecosystem.config.js  # PM2 config for the server process
└── deploy.sh
```

## Routing and Main Entry Points

* `client/src/index.tsx`
  * App entry point; renders `<App/>` inside `React.StrictMode`.

* `client/src/App.tsx`
  * Defines routing using `react-router-dom`.
  * Maps routes:
    * `/` → `DiscoverPage.tsx`
    * `/:mediaType/:id` → `DetailPage.tsx`
    * `/person/:id` → `PersonDetailView.tsx`
    * `/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber` → `EpisodeDetailView.tsx`

## Key Modules and Components (Client)

### `client/src/components/DiscoverPage.tsx`

* The core discovery interface.
* Manages state for `mediaType`, search query, year filtering, and minimum rating.
* Orchestrates the grid display using `MediaCard.tsx`, with `DiscoverControls.tsx` handling the filter UI above it.

### `client/src/components/DetailPage.tsx`

* A wrapper/controller component for individual media.
* Extracts `mediaType` and `id` from URL parameters.
* Dynamically renders either `MovieDetailView.tsx` or `TvDetailView.tsx`, wrapped in `DetailContainer`.

### `client/src/components/MovieDetailView.tsx` & `TvDetailView.tsx`

* Render deep-dive information for specific media.
* `TvDetailView.tsx` additionally supports season selection, episode list navigation, and renders `EpisodeHeatmap.tsx`.
* Both utilize `CastAndCrew.tsx` to display credit information.

### `client/src/components/EpisodeDetailView.tsx`

* Fetches and displays detailed info for a specific TV episode, including a still-image gallery (`ImageGallery.tsx` + `Lightbox.tsx`).
* Uses the shared `DetailContainer` wrapper and "Back" button navigation.

### `client/src/components/PersonDetailView.tsx`

* Displays biography, photo, and a "Known for" credits rail sorted newest-first, linking back into movie/TV detail pages.

### `client/src/utils/api.ts`

* Centralized API utilities — but note these now call the **local `/api/*` routes**, not TMDB directly. TMDB's response shape is mapped into the app's own types here (e.g. building full poster URLs, defaulting missing fields).
* Includes specialized functions:
  * `fetchMediaDetails`: Gets movie/TV metadata + credits via `/api/media/:mediaType/:id`.
  * `fetchDiscoverMedia`: Discovery/search fetcher via `/api/discover/:mediaType`.
  * `fetchSeasonDetails`: Episode lists for a season via `/api/tv/:seriesId/season/:seasonNumber`.
  * `fetchEpisodeDetails`: Metadata for a specific episode via `/api/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber`.
  * `fetchPersonDetails`: Person bio + combined credits via `/api/person/:id`.

### `client/src/utils/types.ts`

* Comprehensive data models including `MediaDetail`, `MediaSummary`, `TvSeason`, `TvEpisode`, `EpisodeDetail`, and `PersonDetail`.

## Key Modules (Server)

### `server/src/tmdb.ts`

* The single chokepoint for talking to TMDB. `TMDB_API_KEY` is read from `process.env` here and nowhere else.
* Exposes `tmdbFetch(path, searchParams)`, which builds the TMDB URL, injects the key, and returns the parsed JSON response untouched (no shaping — that stays in the client).

### `server/src/routes/`

* One route file per TMDB resource, each a thin wrapper around `tmdbFetch`:
  * `discover.ts` → `GET /api/discover/:mediaType` (branches between TMDB's `search` and `discover` endpoints depending on whether a search query is present)
  * `media.ts` → `GET /api/media/:mediaType/:id`
  * `season.ts` → `GET /api/tv/:seriesId/season/:seasonNumber`
  * `episode.ts` → `GET /api/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber`
  * `person.ts` → `GET /api/person/:id`

### `server/src/index.ts`

* Express entry point. Mounts all route files, exposes `GET /api/health` for basic liveness checks, and throws on boot if `TMDB_API_KEY` is missing.

## Styling and Layout

* **Global Theme**: Dark-themed aesthetic (`bg-slate-950`, `bg-slate-900`, `text-white`) applied consistently across all detail and discovery pages.
* **Layout Consistency**: `DetailContainer` (`client/src/components/DetailContainer.tsx`) wraps every detail view, providing standard padding, `max-w-7xl` constraints, the ambient background texture, and a persistent "Back" button driven by `useNavigate(-1)`.

## Development Concepts

### Fetch Flow

* Discovery data is fetched via the client's `fetchDiscoverMedia`, which calls the server's `/api/discover/:mediaType`, which in turn calls TMDB's `discover` or `search` endpoint and returns raw results back up the chain. The client maps results into `MediaSummary` for the grid.
* Detail views use `useParams` to trigger `useEffect` hooks, fetching data based on the URL context through the same client → server → TMDB chain.

### Navigation

* Uses `useNavigate` from `react-router-dom` to handle history-based "Back" button functionality.

## Local Development

Two processes run side by side, on **different ports from production** so you can develop locally without colliding with (or needing to stop) the live site:

```bash
# Terminal 1 — server (dev port 3223, hardcoded in the npm script)
cd server
npm run dev

# Terminal 2 — client (CRA dev server, proxies /api/* to localhost:3223)
cd client
npm start
```

The proxy is configured via the `"proxy"` field in `client/package.json` — no CORS setup needed since requests are forwarded server-side by the CRA dev server.

## Deployment

* `deploy.sh` builds both `client/` and `server/`, copies the client's static build and the server's compiled output to `/var/www/marquee`, and restarts the server process via `pm2 startOrRestart ecosystem.config.js`.
* The production server runs on **port 3224** (see `ecosystem.config.js` and `server/.env` on the host). This is intentionally different from the dev port (3223).
* Nginx serves the client's static build directly and proxies `/api/*` to `http://localhost:3224`.

## Notes

* `server/.env` (not committed) must define `TMDB_API_KEY`, `TMDB_BASE_URL`, and `PORT`. See `server/.env.example`.
* `client/.env` only needs `VITE_POSTER_BASE_URL` — there is no API key or base URL on the client side anymore.
* New detail views should be wrapped in the standard `DetailContainer` layout to maintain visual consistency across the app.
* New TMDB-backed features should add a route on the server (in `server/src/routes/`) rather than calling TMDB directly from the client.