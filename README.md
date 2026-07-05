# Marquee — TMDB Movie/TV Show Discovery App

A React app for discovering and browsing movies and TV shows using [The Movie Database (TMDB)](https://www.themoviedb.org/) API. Search or filter a poster grid, then drill into full detail pages for movies, TV shows, individual episodes, and cast/crew.

The app is split into a `client/` (React frontend) and a `server/` (a small Express proxy that holds the TMDB API key, so it's never exposed to the browser).

## Features

**Discover grid**
- Toggle between Movies and TV Shows
- Search by title, or filter by year and minimum rating
- Responsive poster grid with loading skeletons and empty/error states

**Movie details**
- Backdrop hero with poster, score, status, runtime, and release date
- Budget and revenue
- Top cast and director, with links to person pages

**TV show details**
- Same hero treatment, plus season and episode counts
- Per-season episode list with air dates, runtimes, and overviews
- Episode rating heatmap across all seasons, with clickable cells that jump straight to an episode
- Season picker for browsing episode lists in place

**Episode details**
- Full-width still image, overview, runtime, and air date
- Detailed crew list and guest stars
- Image gallery with a keyboard-navigable lightbox (arrow keys, escape, click-to-close)

**Person details**
- Biography, place of birth, and profile photo
- "Known for" credits, sorted newest first, linking back into movie/TV detail pages

**Cross-cutting**
- Each card and detail page links out to the title's TMDB page and to a self-hosted Seerr instance for requesting media
- Consistent dark UI with a shared rating-score component used across cards, hero sections, and the heatmap
- TMDB API key lives only on the server — never bundled into client JS or visible in the browser

## Technologies Used

**Client**
- React
- TypeScript
- React Router
- Tailwind CSS
- shadcn/ui components
- lucide-react (icons)

**Server**
- Express
- TypeScript

## Project Structure

```
marquee/
├── client/      # React frontend
├── server/      # Express proxy that holds the TMDB API key
├── ecosystem.config.js
└── deploy.sh
```

Key pieces, for orientation:

- `client/src/components/DiscoverPage.tsx` / `DiscoverControls.tsx` — search, filters, and the poster grid
- `client/src/components/MediaCard.tsx` — poster card used in the discover grid
- `client/src/components/MovieDetailView.tsx` / `TvDetailView.tsx` — top-level detail pages for each media type
- `client/src/components/EpisodeDetailView.tsx` — single episode page, including the image gallery
- `client/src/components/PersonDetailView.tsx` — cast/crew member page and filmography
- `client/src/components/CastAndCrew.tsx` — shared cast rail used on movie and TV detail pages
- `client/src/components/EpisodeHeatmap.tsx` — per-season episode rating grid on TV show pages
- `client/src/components/ImageGallery.tsx` / `Lightbox.tsx` — episode still thumbnails and full-screen viewer
- `client/src/components/DetailContainer.tsx` — shared page chrome (back navigation) wrapping all detail views
- `client/src/utils/api.ts` — calls to the server's `/api/*` routes, and response-to-app-type mapping
- `client/src/utils/types.ts` — shared types for media summaries, details, and TMDB response shapes
- `server/src/routes/` — one Express route per TMDB resource (discover, media, season, episode, person)
- `server/src/tmdb.ts` — the only place the TMDB API key is read and used

## Getting Started

### Prerequisites

- Node.js (v18 or later — the server uses native `fetch`)
- npm
- A [TMDB API key](https://www.themoviedb.org/settings/api)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/marquee.git
   cd marquee
   ```

2. Install dependencies for both the client and server:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

3. Set up the server's environment file:
   ```bash
   cd server
   cp .env.example .env
   ```
   Open `server/.env` and add your TMDB API key:
   ```text
   TMDB_API_KEY=your_tmdb_api_key_here
   TMDB_BASE_URL=https://api.themoviedb.org/3
   PORT=3221
   ```

4. Set up the client's environment file:
   ```bash
   cd ../client
   cp .env.example .env
   ```
   `client/.env` only needs the poster image base URL — there's no API key on the client side:
   ```text
   VITE_POSTER_BASE_URL=https://image.tmdb.org/t/p/w500
   ```

5. Start the server (in one terminal):
   ```bash
   cd server
   npm run dev
   ```

6. Start the client (in another terminal):
   ```bash
   cd client
   npm start
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app. The client's dev server proxies `/api/*` requests to the local server automatically (see the `"proxy"` field in `client/package.json`) — no CORS setup needed.

## Usage

- Use the toggle to switch between Movies and TV Shows on the discover page.
- Search by title, or check "Filter by Year" and/or adjust the minimum rating slider. Rating filtering is disabled while a search query is active.
- Click any poster to open its detail page in-app.
- On a TV show's page, pick a season from the sidebar to browse its episodes, or open the rating heatmap to see every season's episode scores at once and jump directly to one.
- Click a cast member, crew credit, or director to view their person page and filmography.
- Use the TMDB and Seerr icons on a card or detail page to open that title externally.

## Deployment

This app is self-hosted via PM2 + Nginx:

- `deploy.sh` builds both the client and server, copies the client's static build and the server's compiled JS to the deploy target, and restarts the server process with PM2.
- Nginx serves the client's static files directly and proxies `/api/*` requests to the server process (see `ecosystem.config.js` for the production port).
- The server's `.env` file (holding `TMDB_API_KEY`) is **not** committed to git and must be created manually on the host before the first deploy.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for providing the API
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [lucide-react](https://lucide.dev/) for icons