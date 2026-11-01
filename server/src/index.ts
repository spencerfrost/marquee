import 'dotenv/config';
import express from 'express';
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

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Marquee TMDB proxy listening on port ${PORT}`);
});
