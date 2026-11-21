# Showcase video plan

A ~48 s motion-graphics showcase of Marquee, cut to "Ruff Money" by The Grey Room / Clark Sims. It shows what the
app is and why it's good, so nobody has to open it to find out. The screens are redrawn in React with Remotion in the
app's own look (Tailwind slate + amber, Geist), not screen-recorded.

**The pitch:** Marquee is a movie and TV browser with none of the clutter. The video says that once in words (the open),
then shows it: a clean home page, a filter stack that finds anything, a detail page that links everywhere, and the
episode ratings heatmap as the payoff.

## Ground rules

- Flashy motion graphics: slams, fast zooms, UI that animates in time with the music. No live action or story about people.
- Every cut and every big entrance lands on a beat. Moves use the sharp ease (`snap` in `src/theme.ts`), not floaty springs.
- Shots follow the order a user actually moves through the app.
- Every label, placeholder and heading comes from the client source, not made up. The wording quoted below is from
  `client/src/components/`.
- Say what the app does, not what it beats. IMDb isn't named or hinted at.

## Soundtrack and timeline

~99 bpm, downbeats on every 4th beat from beat 0, phrases of 16 beats. The video starts on song beat 8 (the intro
riff's second pass) and runs to beat 83 (about 45 s).

| Song beats | Video time | Music | Shot | Status |
| --- | --- | --- | --- | --- |
| 8–15 | 0:00–0:04.8 | Intro riff: chord stabs with gaps, hits on 8, 10, 13 | Open: tagline | Built |
| 16–21 | 0:04.8–0:08.3 | The groove stops; a rising swoop from 18 | Open: logo | Built |
| 22–33 | 0:08.3–0:15.5 | Groove | Home | Built |
| 34–45 | 0:15.5–0:22.5 | | Discover | Built |
| 46–57 | 0:22.5–0:29.7 | | Detail | Built |
| 58–70 | 0:29.7–0:37.5 | | Heatmap | Built |
| 71–82 | 0:37.5–0:44.6 | Fades out over the last 3 beats | Close | Built |

Beat numbers in the shot plans below count from the start of the shot (beat 0 = the cut into it).

## Shots

### 1. Open (14 beats): built

`src/shots/OpenShot.tsx`

- **Throughout:** a wall of real posters (the home page's rails), tilted and racing past, columns scrolling in
  alternate directions, dimmed under the text.
- **Beat 0 (stab):** "Browse movies," slams in (white).
- **Beat 2 (stab):** "shows and cast." slams in (white).
- **Beat 4:** "None of the clutter." slams in (amber), the same two beats after the second line.
- **Beat 8 (the stop):** the wall and tagline punch out past the camera with a flash, and the logo slams in.
- **Beats 10–13 (the swoop):** the logo's amber ring fills slowly across the swoop, then the full logo holds a beat before the cut on 14.
- **Beat 11:** "Marquee" lands under the logo.

### 2. Home (12 beats)

`src/shots/HomeShot.tsx`

- **Beat 0 (the groove):** the laptop slams up into frame on the home page. Caption: "Everything trending, at a glance."
- **Beats 1–3:** "Trending this week", "Now playing" and "On the air" fill in, one per beat.
- **Beat 4:** the camera dives into the header search and "hardy" types in. Caption: "Search movies, shows and people."
- **Beat 6:** the results page. **Beat 8:** the People tab is picked.
- **Beat 11:** "Discover" is pressed in the nav.

### 3. Discover (12 beats)

`src/shots/DiscoverShot.tsx`

- **Beat 0:** caption "Filter by anything."
- **Beat 1:** Type → "TV Shows", and the Filters panel opens with it (the app has a separate Filters button; the
  video skips that cursor trip).
- **From beat 3, about 1.3 s apart (off the beat grid, paced for a first-time viewer):** a second caption block
  builds a line per filter as the grid flips: Genres → Drama + Sci-Fi & Fantasy, All ("Genre"); Where to Watch →
  Crave ("Where it streams"); the Min Rating slider to 8.0 ("How good it is"). Six shows left.
- **Then:** pull back to the results. **Beat 10:** Game of Thrones is picked and the camera dives into its poster.

### 4. Detail (12 beats)

`src/shots/DetailShot.tsx`

- **Beat 0:** pulls out of the poster as the hero cascades in within a beat. Caption: "Every detail on one page."
- **Beat 5:** caption "Every tag is a search." **Beat 6:** the "Sci-Fi & Fantasy" chip is pressed and the page slides
  over to Discover. **Beat 7.5:** Filters opens, showing that genre set. **Beat 10:** the browser's Back slides the show back.
- **Beat 11:** scrolls down to "Episode ratings", already filled in (it's on the page from the start).

### 5. Heatmap (13 beats)

`src/shots/HeatmapShot.tsx`. Caption: "Every episode, rated."

- **Beat 0:** the strip, Peak / Low point and the season averages are already there from the detail page (no loading or
  build-in).
- **Beat 2:** "Show full heatmap" is pressed and the grid cascades out diagonally.
- **Beat 5:** dive onto the peak's tooltip ("The best…"). **Beat 8:** whip to the low point's ("…and the worst.").
- **Beat 11:** pull back to the whole run.

### 6. Close (12 beats)

`src/shots/CloseShot.tsx`

- **Beat 0:** the logo slams in with the ring sweep. **Beat 1:** "Marquee". **Beat 2:** "None of the clutter."
- **Beat 4:** marquee.mrspinn.ca. **Beats 9–12:** fades out with the music.

## Decided

- **Captions:** a short line in a fixed column on the left says what each action is, so someone who's never seen
  the app can follow it. App shots frame the laptop to the right of it. Each shot does fewer things, about one
  action per caption: Home lost the Movies / TV tab flips, Discover went from six filters to three, Detail lost the
  loading hold. Captions are video copy, not app labels. Wording per shot is in `src/shots/*` and the README.
- **Length:** no part of the song after the groove (20) needs a shot lined up to it, so each shot runs as long as
  it needs, cutting on beats: Open 14, Home 12, Discover 12, Detail 12, Heatmap 13, Close 12. About 45 s. Inside a shot, actions don't
  have to sit on beats when a human pace reads better (Discover's filters).
- **Cut:** the "7,125 shows → 6" and "Every search is a link" beats (and the address-bar zoom). "Filter by anything." is its own
  caption; a second block then builds a line per filter.

- **Order:** Open → Home → Discover → Detail → Heatmap → Close, following the real app flow.
- **Search** is folded into Home. As its own shot near the end it felt squeezed in.
- **Song start:** song beat 8, not beat 0, so the open is 12 beats instead of 20 and there's no time to fill before the logo.
- **Tagline:** "Browse movies, / shows and cast. / None of the clutter." It's descriptive and true: the app browses
  data, and it doesn't play anything. "Cast", not "crew": the only crew the app shows is the director.
- **Tagline treatment:** a plain centred slam in Geist, on the stabs. The knockout version (posters showing through
  the letters) was tried and dropped.
- **Posters:** real TMDB posters, kept local and git-ignored (`pnpm posters` downloads them).

- **The show:** Game of Thrones. Eight seasons of green that crash into red in season 8 make the heatmap tell a
  story; its peak is "The Rains of Castamere" (S3E9, 9.3) and its low point "The Iron Throne" (S8E6, 4.5).
- **The close's link:** the live site, marquee.mrspinn.ca.
- **Changes from the plan while building:** search results have no Collections tab (TMDB's multi search doesn't
  return collections), so the tabs are Movies / TV / People. "Trailer" and "Where to watch" sit far down the real
  TV page, so Detail doesn't show them; "Episode ratings" sits right under the hero. Discover's streaming filter
  is Crave, where the show streams in Canada. The heatmap's last zoom goes to the low point, then pulls back.

## Open questions

- **The flash** when the logo lands: keep or drop?

## Working notes

- `pnpm studio` to scrub, `pnpm render` for the full video (`out/showcase.mp4`), `pnpm render:shot <Id> <out>` for one shot.
- Shot lengths are exported as `*_SHOT_BEATS`, and `src/Showcase.tsx` lays them end to end from song beat 8.
  Changing a length moves every later shot.
- Check stills at the biggest point of every slam for text running off the frame before handing over a render.
- See `README.md` for the soundtrack file location and where everything in `src/data/` comes from.
