# Networks Filter — Design

**Date:** 2026-07-04
**Status:** Approved

## Problem

The Discover page can filter by production company (`with_companies`) but not by TV network (`with_networks`), even though networks are the more natural filter for TV ("show me HBO shows"). TMDB's REST API has no endpoint to list or search networks — `/search/network` and `/network/list` were probed on 2026-07-04 and both return 404. Only `/network/{id}` (details for a known ID) exists.

## Key finding: the daily ID export

TMDB publishes daily ID export files outside the REST API:

```
https://files.tmdb.org/p/exports/tv_network_ids_{MM_DD_YYYY}.json.gz
```

- Newline-delimited JSON, one `{"id": 49, "name": "HBO"}` record per line
- ~5,459 networks, ~50KB gzipped (verified 2026-07-04)
- Refreshed daily, published by ~8:00 UTC
- No API key required

This is the data source for the filter.

## Decisions

- **Data source:** Hybrid — curated quick-pick list in the client, plus full-coverage search backed by the daily export cached server-side.
- **TV-only:** `with_networks` only works on `/discover/tv`. The Networks selector renders only when media type is TV. Selections persist in client state when the user toggles to Movies (toggling back restores them), but are excluded from the active-filter count and never sent with movie requests.

## Server

### New route: `server/src/routes/network.ts`

`GET /api/network/search?query=` — mirrors `company.ts` in shape, but searches an in-memory copy of the daily export instead of proxying TMDB.

- **Lazy load + cache:** on first request, download the export, gunzip with Node's built-in `node:zlib`, parse into `{ id, name }[]`, cache in memory with a 24-hour TTL.
- **Date fallback:** try today's UTC date; if that 404s (export not yet published), fall back to yesterday's.
- **Stale-on-error:** if a refresh fails but stale data exists, serve the stale data rather than erroring.
- **Matching:** case-insensitive; prefix matches ranked before substring matches; capped at 20 results.
- **Response:** `{ results: [{ id, name }] }`.
- **400** if `query` is missing (same as company route).
- No new dependencies.

Register the route in `server/src/index.ts` alongside the other routes.

### Extend `server/src/routes/discoverFiltered.ts`

Accept a `networkIds` query param (pipe-joined IDs, OR semantics — same convention as `companyIds`) and pass it through to TMDB as `with_networks`.

## Client

### Types & API (`client/src/utils/types.ts`, `client/src/utils/api.ts`)

- `NetworkSummary = { id: number; name: string }` — the export carries no logos or countries.
- `searchNetworks(query: string): Promise<NetworkSummary[]>` calling `/api/network/search`.
- `DiscoverFilterParams` gains optional `networkIds: number[]`; `fetchDiscoverMediaWithFilters` sends it pipe-joined, only when present.

### New component: `client/src/components/NetworkSelector.tsx`

Near-copy of `CompanySelector.tsx` (same combobox + badge chips pattern):

- `TOP_NETWORKS` curated quick-picks shown when the query is ≤ 2 chars: Netflix, HBO, HBO Max, Disney+, Prime Video, Apple TV+, Hulu, Paramount+, BBC One, AMC, FX, Showtime, and similar. **IDs must be verified against the export during implementation, not written from memory.**
- 3+ chars triggers debounced (300ms) `searchNetworks` call.
- Selected networks render as removable amber badges; already-selected items are filtered out of the dropdown.

### `DiscoverControls.tsx` / `DiscoverPage.tsx`

- `DiscoverPage` owns `selectedNetworks: NetworkSummary[]` state and passes it down; includes `networkIds` in the fetch params only when `mediaType === 'tv'`.
- `DiscoverControls` renders a "Networks" labeled `NetworkSelector` in the Categorical Selectors grid, only when `mediaType === 'tv'`.
- `activeFilterCount` includes `selectedNetworks.length` only when `mediaType === 'tv'`.

## Error handling

- Export download failure with no cache: route returns 502 with `{ error }`; client selector shows its existing "No networks found." empty state.
- Malformed export lines: skip individual bad lines while parsing.

## Testing

- Unit tests for the network route with the export fetch stubbed: search matching/ranking, cache TTL behavior, date fallback, stale-on-error, missing-query 400.
- Manual end-to-end check: TV + HBO quick-pick returns HBO shows; search for an obscure network returns results; switching to Movies hides the selector and drops `networkIds` from the request.

## Out of scope

- Network logos (would require per-ID `/network/{id}/images` calls).
- Persisting the export to disk across server restarts.
- Networks filter for movies (not supported by TMDB).
