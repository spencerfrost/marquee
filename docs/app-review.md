# Marquee app review

Reviewed 2026-11-01 · Spencer Frost

## Summary

Marquee is in good shape. Data only goes through `client/src/utils/api.ts`, `server/src/tmdb.ts` is the single place that touches TMDB, and the trickier spots have comments explaining why.

The review found 5 bugs, 7 feature ideas and 4 housekeeping items. Two fixes came first:

1. A shared date helper, which fixes dates showing a day early for anyone west of UTC.
2. Discover filters stored in the URL, which fixes lost state on Back and makes the clickable-metadata feature possible.

All 5 bugs and all housekeeping items are now fixed. Four of the seven features are done; watchlist, region-aware ratings and polish are still open.

## Bugs

Five bugs, most visible first. The date bug was confirmed by running the parsing code under Toronto time.

| # | Bug | Where | Impact | Fix | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | `new Date("YYYY-MM-DD")` parses as UTC midnight, so dates land a day early west of UTC | 7 calls in `MediaCard`, `MovieDetailView`, `TvDetailView`, `EpisodeDetailView`, `PersonDetailView` | `2024-01-01` shows as 2023 / 2023-12-31 in Canada; Jan 1 releases show the wrong year | One helper: `slice(0, 4)` for years, `new Date(y, m-1, d)` for full dates | Fixed — `client/src/utils/date.ts`; the `PersonDetailView` sort was left as is, since a uniform offset doesn't change ordering |
| 2 | Discover filters live only in `useReducer`, and `browsing` starts `true` | `DiscoverPage.tsx` | Back from a detail page drops filters, results and scroll; lands on home rails | Store filters in the URL with `useSearchParams` | Fixed — filters are search params; Back also restores loaded pages and scroll position |
| 3 | Scroll isn't reset on navigation; `BrowserRouter` doesn't do it and nothing calls `scrollTo` | `App.tsx` | Clicking a recommendation opens the new title still scrolled to the bottom | Small `ScrollToTop` component keyed on `pathname` | Fixed — `client/src/components/ScrollToTop.tsx` |
| 4 | Detail fetches have no cancel or ignore-stale guard | `MovieDetailView`, `TvDetailView` and siblings | A slow earlier response can overwrite the title you navigated to | `let cancelled = false` guard, as in `HomeRails` | Fixed — all detail views plus `SearchResultsPage` |
| 5 | Route params go straight into the TMDB path without validation | `media.ts`, `person.ts`, `season.ts`, `episode.ts`, `collection.ts` | Crafted paths could reach other TMDB endpoints with your key | Reject anything not matching `/^\d+$/` with a 400 | Fixed — `server/src/params.ts`; `trending.ts` also now ignores inherited keys like `constructor` |

## Suggested features

Seven additions, ordered by value for effort. The first unlocks the second.

| Feature | What it involves | Why | Status |
| --- | --- | --- | --- |
| Filters in the URL | Sync `DiscoverFilters` to search params with `useSearchParams` | Fixes bug 2; searches become shareable and bookmarkable | Done (with bug 2) |
| Clickable metadata | Keywords, genres, companies and networks on detail pages link to Discover with that filter set | Filters already exist; this links them up for rich browsing at low cost | Done — `client/src/components/MetadataLinks.tsx`; genres sit under the tagline, networks/studios/keywords replace the old keyword list |
| Server-side cache | In-memory cache with expiry in `tmdbFetch`, plus `Cache-Control` headers; genres, regions, providers ~1 day, trending ~10 min | Faster pages; protects TMDB quota | Done — 500-entry LRU in `server/src/tmdb.ts` that shares in-flight requests and skips failures; everything else is cached 1 hour; matching headers set in `index.ts` |
| Proxy hardening | `express-rate-limit`, `compression`, and logging `err` in route `catch` blocks | The public proxy uses your key; errors are swallowed and PM2 logs show nothing | Done — 120 requests/min per IP with `trust proxy` set to loopback; routes log through `server/src/errors.ts`; `compression` skipped because Nginx already gzips JSON |
| Watchlist and seen flags | localStorage first, then a "hide seen" Discover filter | Turns a browser into something used regularly | Open |
| Region-aware ratings | `findCertification` reads the selected region, falling back to US | Matches watch-provider behaviour (default region is CA) | Open |
| Polish | Per-page `document.title`; a 404 route; `youtube-nocookie.com` and `loading="lazy"` on the trailer iframe; Seerr URL from an env var | Small fixes; removes the hardcoded personal domain in `MediaCard` | Open |

## Housekeeping

- [x] Add `client/dist/` to `.gitignore`; it lists `client/build/` but Vite outputs to `dist`.
- [x] Remove the stale `deploy.sh` warning from CLAUDE.md; the script already copies `client/dist`.
- [x] Delete or move `marquee.json` and `scrollbar-check.png`, which sat untracked in the repo root.
- [x] Commit the ~1,500 lines of uncommitted work in logical chunks: search, home rails, collections, watch providers, keyword and person filters.

## Found since

- `MediaCard` nests the TMDB link `<a>` inside the card's `<a>`, which is invalid HTML; React logs a nesting error on every grid render.
