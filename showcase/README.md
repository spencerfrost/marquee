# Showcase video

The Marquee showcase video, made with [Remotion](https://www.remotion.dev/) (React → MP4).
The screens are redrawn in the app's theme (Tailwind slate + amber, Geist), not recorded from the app.

```bash
pnpm install
pnpm posters         # real titles and posters, through the dev server (see below)
pnpm data            # search results, discover grids and the show, same way
pnpm studio          # scrub and edit in the browser
pnpm render          # full video → out/showcase.mp4
pnpm render:shot OpenShot out/open-shot.mp4   # one shot
```

## Shots

| Shot | File | What happens |
|---|---|---|
| Open | `src/shots/OpenShot.tsx` | Over a tilted wall of real posters, "Browse movies," / "shows and cast." / "None of the clutter." slam in on the three stabs; the wall and headline punch out past the camera and the logo lands, its ring sweeping round with the swoop |
| Home | `src/shots/HomeShot.tsx` | "Everything trending, at a glance.": the laptop slams in and three rails fill in, one per beat. "Search movies, shows and people.": the camera dives into the header search, "hardy" types in, the results land and the People tab is picked. "Discover" is pressed in the nav |
| Discover | `src/shots/DiscoverShot.tsx` | "Filter by anything.": TV Shows is picked and the filters open with it. Then a second caption builds a line per filter, the filters landing about 1.3 s apart (off the beat grid) as the grid flips: "Genre" (Drama + Sci-Fi & Fantasy, All), "Where it streams" (Crave), "How good it is" (Min Rating 8.0). A pull back to the six results, then the camera dives into Game of Thrones' poster |
| Detail | `src/shots/DetailShot.tsx` | "Every detail on one page.": pulls out of the poster as the hero cascades in. "Every tag is a search.": the "Sci-Fi & Fantasy" chip slides the page over to Discover, Filters opens to show that genre set, and the browser's Back slides the show back. Scrolls to "Episode ratings" |
| Heatmap | `src/shots/HeatmapShot.tsx` | "Every episode, rated.": all 73 bars ripple up, Peak / Low point and the season averages land, "Show full heatmap" is pressed and the grid cascades out diagonally. "The best…" dives onto the peak's tooltip, "…and the worst." whips to the low point's, then it pulls back |
| Close | `src/shots/CloseShot.tsx` | Logo and "Marquee", "None of the clutter." and marquee.mrspinn.ca, fading out with the music |

Shared pieces in `src/components/`: `AppUI.tsx` (browser bar, site header, chips), `DiscoverUI.tsx` and `TvUI.tsx`
(the discover and TV pages, animated from one frame number), `Camera.tsx` (framing tweens), `Cursor.tsx` and `Caption.tsx` (the captions in a fixed left column; app shots shift the camera right by `CAPTION_SHIFT` to clear it).

`src/Showcase.tsx` puts them in order. Every cut sits on the song's beat grid (`src/beats.ts`): the shots are
laid end to end in beats from song beat 8, so changing a shot's length in beats moves the ones after it. Rendered on its own, a shot runs on evenly spaced beats at the song's tempo.

## Soundtrack

"Ruff Money" by The Grey Room / Clark Sims (royalty-free), about 99 bpm. It isn't committed (the licence covers
use in the video, not redistribution): put it at `public/audio/ruff-money.mp3` to render.

The intro riff repeats every 8 beats, so the video starts on its second pass (beat 8) to reach the logo fast,
and plays to beat 83 (about 45 s). Only the open is timed to the song's features; after that the shots run as long as they need, cutting on beats. Downbeats fall on every 4th
beat from beat 0, in 16-beat phrases:

| Beats | Time | Music | Shot |
|---|---|---|---|
| 0–7 | 0:00–0:04.9 | Intro riff, first pass (not used) | |
| 8–15 | 0:04.9–0:09.7 | Intro riff again: chord stabs with gaps, biggest hits on 8, 10, 13 | Open: "Browse movies," / "shows and cast." / "None of the clutter." |
| 16–21 | 0:09.7–0:13.2 | The groove stops; a rising swoop from 18; the groove is back on 20 | Open: logo, ring filling over 18–21 then holding |
| 22 | 0:13.2 | | Home |
| 34 | 0:20.4 | | Discover |
| 46 | 0:27.4 | | Detail |
| 58 | 0:34.6 | | Heatmap |
| 71–83 | 0:42.4–0:49.5 | Fades out over the last 3 beats | Close |

## Data

- `src/data/titles.json`: the home page's rails (same lists as `client/src/components/HomeRails.tsx`) with
  ids, titles, years and ratings, from `scripts/fetch-posters.mjs`. It goes through Marquee's own dev server
  (`npm run dev` in `server/`), so the TMDB key stays in `server/.env`.
- `public/posters/`: the posters for those titles, from the same script. Git-ignored because the studios own
  them, so run `pnpm posters` before rendering.
- `src/data/search.json`, `discover.json`, `show.json`: the header search for "hardy", the discover grid after
  each of the three filters (region CA, the app's default), and Game of Thrones' page, cast and every episode rating, from
  `scripts/fetch-data.mjs` (`pnpm data`) through the dev server the same way. Its images go to `public/posters/`,
  `public/backdrops/` and `public/logos/`, all git-ignored.
- `src/data/beats.json`: the song's beat grid (`librosa.beat.beat_track` on the full mix).
