import 'dotenv/config';
import express, { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import mediaRouter from './routes/media';
import seasonRouter from './routes/season';
import episodeRouter from './routes/episode';
import personRouter from './routes/person';
import discoverFilteredRouter from './routes/discoverFiltered';
import genreRouter from './routes/genre';
import companyRouter from './routes/company';
import networkRouter from './routes/network';
import searchRouter from './routes/search';
import keywordRouter from './routes/keyword';
import collectionRouter from './routes/collection';
import trendingRouter from './routes/trending';
import watchProvidersRouter from './routes/watchProviders';

const app = express();
const PORT = process.env.PORT || 3221;

if (!process.env.TMDB_API_KEY) {
  throw new Error('Missing required environment variable: TMDB_API_KEY');
}

// Production sits behind Nginx on the same host, which sets X-Forwarded-For.
// Trusting only loopback proxies gives the rate limiter the real client IP
// without letting a direct caller spoof the header.
app.set('trust proxy', 'loopback');

app.get('/api/health', (_req, res) => res.set('Cache-Control', 'no-store').json({ status: 'ok' }));

// The proxy spends our TMDB key on every uncached request, so cap each IP.
// The client debounces its search inputs; a page load is ~15 requests.
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}));

// Browser caching, mirroring the server-side TTLs in tmdb.ts. The generic
// header is set first so the more specific mounts below override it.
// sendError switches failures to no-store.
const cacheFor = (seconds: number): RequestHandler => (_req, res, next) => {
  res.set('Cache-Control', `public, max-age=${seconds}`);
  next();
};
app.use('/api', cacheFor(60 * 60));
app.use(['/api/genre', '/api/watch-providers'], cacheFor(24 * 60 * 60));
app.use('/api/trending', cacheFor(10 * 60));

app.use('/api/media', mediaRouter);
app.use('/api/tv', seasonRouter);
app.use('/api/tv', episodeRouter);
app.use('/api/person', personRouter);
app.use('/api/discover-filtered', discoverFilteredRouter);
app.use('/api/genre', genreRouter);
app.use('/api/company', companyRouter);
app.use('/api/network', networkRouter);
app.use('/api/search', searchRouter);
app.use('/api/keyword', keywordRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/watch-providers', watchProvidersRouter);

app.listen(PORT, () => {
  console.log(`Marquee TMDB proxy listening on port ${PORT}`);
});
