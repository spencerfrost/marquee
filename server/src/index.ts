import 'dotenv/config';
import express from 'express';
import discoverRouter from './routes/discover';
import mediaRouter from './routes/media';
import seasonRouter from './routes/season';
import episodeRouter from './routes/episode';
import personRouter from './routes/person';
import discoverFilteredRouter from './routes/discoverFiltered';
import genreRouter from './routes/genre';
import companyRouter from './routes/company';

const app = express();
const PORT = process.env.PORT || 3221;

if (!process.env.TMDB_API_KEY) {
  throw new Error('Missing required environment variable: TMDB_API_KEY');
}

app.use('/api/discover', discoverRouter);
app.use('/api/media', mediaRouter);
app.use('/api/tv', seasonRouter);
app.use('/api/tv', episodeRouter);
app.use('/api/person', personRouter);
app.use('/api/discover-filtered', discoverFilteredRouter);
app.use('/api/genre', genreRouter);
app.use('/api/company', companyRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Marquee TMDB proxy listening on port ${PORT}`);
});
