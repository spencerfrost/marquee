import { Router, Request, Response } from 'express';
import { gunzipSync } from 'node:zlib';

// TMDB has no /search/network endpoint (probed 2026-07-04: 404), but it
// publishes a daily export of every network id+name. We download that file
// (~50KB gzipped, no API key needed), hold it in memory for a day, and do
// name matching locally.
const EXPORT_BASE_URL = 'https://files.tmdb.org/p/exports';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RESULTS = 20;

interface NetworkRecord {
  id: number;
  name: string;
}

let cache: { networks: NetworkRecord[]; fetchedAt: number } | null = null;
let inflight: Promise<NetworkRecord[]> | null = null;

function exportUrlFor(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${EXPORT_BASE_URL}/tv_network_ids_${mm}_${dd}_${date.getUTCFullYear()}.json.gz`;
}

async function downloadExport(): Promise<NetworkRecord[]> {
  // The export publishes around 8:00 UTC, so today's file may not exist yet.
  for (const daysAgo of [0, 1]) {
    const response = await fetch(exportUrlFor(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)));
    if (!response.ok) continue;

    const text = gunzipSync(Buffer.from(await response.arrayBuffer())).toString('utf8');
    const networks: NetworkRecord[] = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const { id, name } = JSON.parse(line);
        if (typeof id === 'number' && typeof name === 'string') {
          networks.push({ id, name });
        }
      } catch {
        // Skip malformed lines; the rest of the file is still usable.
      }
    }
    if (networks.length > 0) return networks;
  }
  throw new Error('TMDB network export unavailable');
}

async function getNetworks(): Promise<NetworkRecord[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.networks;
  }
  if (!inflight) {
    inflight = downloadExport()
      .then((networks) => {
        cache = { networks, fetchedAt: Date.now() };
        return networks;
      })
      .finally(() => {
        inflight = null;
      });
  }
  try {
    return await inflight;
  } catch (err) {
    // Refresh failed — serve the stale list if we ever had one.
    if (cache) return cache.networks;
    throw err;
  }
}

const router = Router();

// GET /api/network/search?query=
router.get('/search', async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  try {
    const networks = await getNetworks();
    const q = query.trim().toLowerCase();

    const prefixMatches: NetworkRecord[] = [];
    const substringMatches: NetworkRecord[] = [];
    for (const network of networks) {
      const name = network.name.toLowerCase();
      if (name.startsWith(q)) {
        prefixMatches.push(network);
      } else if (name.includes(q)) {
        substringMatches.push(network);
      }
      if (prefixMatches.length >= MAX_RESULTS) break;
    }

    res.json({ results: [...prefixMatches, ...substringMatches].slice(0, MAX_RESULTS) });
  } catch (err) {
    res.status(502).json({ error: 'Failed to load network list' });
  }
});

export default router;
