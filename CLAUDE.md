# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marquee is a TMDB movie/TV discovery app: a React client (`client/`) and a minimal Express proxy (`server/`) whose sole reason for existing is to keep the TMDB API key server-side. There is no root package.json — `client/` and `server/` are separate npm packages, installed and run independently.

## Commands

Server (run from `server/`):
```bash
npm run dev     # ts-node-dev on port 3223 (dev port hardcoded in the script)
npm run build   # tsc → dist/
```
The server throws on boot if `TMDB_API_KEY` is missing from `server/.env` (see `server/.env.example`).

Client (run from `client/`):
```bash
npm run dev     # Vite on port 3001; proxies /api/* to localhost:3223
npm run build   # tsc -b && vite build → dist/
npm run lint    # oxlint
```

There is no test suite. Verify changes by running both dev servers and exercising the app.

Ports are intentionally split: dev server 3223, production server 3224 (PM2, `ecosystem.config.js`) so local dev doesn't collide with the self-hosted live site.

## Architecture

**Data flow (the one rule that matters):** client components → `client/src/utils/api.ts` (fetches the local `/api/*` routes and maps raw TMDB shapes into the app's types from `client/src/utils/types.ts`) → a route in `server/src/routes/` (thin wrapper, returns TMDB JSON untouched) → `server/src/tmdb.ts` (`tmdbFetch` — the only file that reads `TMDB_API_KEY`) → TMDB.

Consequences:
- New TMDB-backed features get a new route file in `server/src/routes/` plus a fetch function in `api.ts`. Never call TMDB from the client, and never read the API key outside `tmdb.ts`.
- Response shaping (poster URL building, field defaulting, type mapping) lives in `api.ts` on the client, not on the server.

**Server routes** (`server/src/routes/`, one file per resource, mounted in `index.ts`): discover, media, season, episode, person, genre, company, network, plus `discoverFiltered.ts`. The last one is experimental — it uses TMDB's undocumented `with_text_query` param to combine free-text search with discover filters (sort, year, genres, companies, networks, pagination, and a vote-count floor when sorting by rating). Its header comment explains the removal plan if TMDB drops the param.

**Client routing** (`client/src/App.tsx`): `/` → `DiscoverPage` (filter state + poster grid, with `DiscoverControls` and the various `*Selector` filter components), `/:mediaType/:id` → `DetailPage` which picks `MovieDetailView` or `TvDetailView`, plus person and episode routes. All detail views are wrapped in `DetailContainer` for shared chrome (back button, max-width, dark background) — new detail views should be too.

**Client stack:** React 19, Vite, Tailwind CSS v4 (via `@tailwindcss/vite`, no tailwind.config), shadcn/ui components in `client/src/components/ui/` built on `@base-ui/react`. Import alias `@/` → `client/src`.

## Docs and gotchas

- `docs/tmdb-api/` holds reference notes on the TMDB endpoints used (movie details, TV series/seasons/episodes).
- `README.md` and `codebase-guide.md` are fuller walkthroughs, but parts predate the CRA→Vite migration: references to `npm start`, the `"proxy"` field in `client/package.json`, and port 3000 are stale — the Vite config above is the source of truth for local dev.
- `deploy.sh` (PM2 + Nginx self-host deploy) copies `client/build/*`, but Vite outputs to `client/dist/` — check/fix this before relying on the script.
