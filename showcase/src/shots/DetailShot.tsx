import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BeatFrames, evenBeats } from "../beats";
import { BROWSER_BACK, Page } from "../components/AppUI";
import { Backdrop, Vignette } from "../components/Backdrop";
import { Camera, camAt, onScreen } from "../components/Camera";
import { CAPTION_SHIFT, Captions } from "../components/Caption";
import { Cursor } from "../components/Cursor";
import { DISCOVER_SPOTS as S, DISCOVER_ZOOM, DiscoverPage, NEVER } from "../components/DiscoverUI";
import { Laptop } from "../components/Laptop";
import { HEATMAP_SCROLL, TV_SPOTS, TvPage, TvTimeline } from "../components/TvUI";
import { DISCOVER, SHOW } from "../data";
import { clamp, snap } from "../theme";
import { HEATMAP_OPEN_CAM } from "./HeatmapShot";

/**
 * The show's page. The camera pulls out of the poster Discover dived into and
 * the hero cascades in within a beat ("Every detail on one page."). On 6 the
 * "Sci-Fi & Fantasy" chip is pressed ("Every tag is a search."): the page
 * slides over to Discover, the Filters open on 7.5 to show that genre set,
 * and the browser's Back on 10 slides the show back. On 11 it scrolls down to
 * "Episode ratings", already filled in, ready for the heatmap.
 */
export const DETAIL_SHOT_BEATS = 12;

export const DetailShot: React.FC<{ beats?: BeatFrames }> = ({ beats = evenBeats() }) => {
  const frame = useCurrentFrame();
  const b = beats;

  // Episode ratings is already on the page under the hero (no loading state).
  const t: TvTimeline = {
    poster: b[0],
    badges: b[0] + 6,
    title: b[0] + 8,
    tagline: b[0] + 11,
    genres: b[0] + 13,
    ring: b[0] + 16,
    overview: b[0] + 19,
    hotGenre: b[6] - 3,
    bars: -Infinity,
    peak: -Infinity,
    low: -Infinity,
    averages: -Infinity,
    expand: Infinity,
    season: () => Infinity,
  };

  const poster = TV_SPOTS.poster();
  const chip = TV_SPOTS.genre(0);
  const hero = onScreen(640, 300, 1.05);
  const cam = camAt(frame, [
    [b[0], onScreen(poster.x, poster.y, 3.1)],
    [b[0] + 10, hero],
    [b[5], onScreen(640, 300, 1.08)],
    [b[5] + 10, onScreen(chip.x + 120, chip.y - 20, 1.7)],
    [b[6], onScreen(chip.x + 120, chip.y - 20, 1.7)],
    // Steady while the page slides, then in on the genre badge once Filters opens.
    [b[6] + 4, onScreen(660, 330, 1.0)],
    [b[7] + 8, onScreen(660, 330, 1.0)],
    [b[8] + 2, onScreen(S.genres.x + 80, S.genres.y - 40, 1.55)],
    [b[9] + 8, onScreen(S.genres.x + 80, S.genres.y - 40, 1.55)],
    [b[10] - 2, onScreen(520, 200, 1.15)],
    [b[10] + 10, hero],
    [b[11], hero],
    [b[11] + 10, HEATMAP_OPEN_CAM],
  ]);

  // The page slides over to Discover on 6 and back with the browser's Back on 10.
  const slide = (from: number) => interpolate(frame, [from, from + 10], [0, 1], { ...clamp, easing: snap });
  const away = slide(b[6]) - slide(b[10]);
  const filtersOpen = frame >= b[7] + 9;
  const scroll = interpolate(frame, [b[11], b[11] + 10], [0, HEATMAP_SCROLL], { ...clamp, easing: snap });
  const path = away > 0.5 ? "/discover?type=tv&genres=10765" : `/tv/${SHOW.id}`;

  const cursor: [number, number, number][] = [
    [b[4], 820, 560],
    [b[6] - 4, chip.x, chip.y + 4],
    [b[6] + 6, chip.x, chip.y + 4],
    [b[7] + 6, S.filtersButton.x, S.filtersButton.y],
    [b[9] + 6, S.filtersButton.x, S.filtersButton.y],
    [b[10] - 3, BROWSER_BACK.x, BROWSER_BACK.y],
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop glow={0.16} />
      <Camera cam={cam} shift={CAPTION_SHIFT}>
        <Laptop>
          <Page path={path} scroll={scroll}>
            <div style={{ transform: `translateX(${-away * 1500}px)` }}>
              <TvPage frame={frame} t={t} />
            </div>
            <div style={{ position: "absolute", top: 0, left: 0, width: 1440 / DISCOVER_ZOOM, transformOrigin: "0 0", transform: `translateX(${(1 - away) * 1500}px) scale(${DISCOVER_ZOOM})` }}>
              {away > 0 && (
                <DiscoverPage
                  frame={frame}
                  t={{ ...NEVER, tv: -Infinity, genres: b[7] + 13 }}
                  grids={[{ at: b[6] + 4, items: DISCOVER.genre.items, total: DISCOVER.genre.total }]}
                  open={filtersOpen}
                  genreBadges={[DISCOVER.genre.name]}
                />
              )}
            </div>
          </Page>
          <Cursor
            frame={frame}
            path={cursor}
            clicks={[b[6], b[7] + 9, b[10]]}
            opacity={interpolate(frame, [b[4], b[4] + 4, b[10] + 6, b[10] + 10], [0, 1, 1, 0], clamp)}
          />
        </Laptop>
      </Camera>
      <Captions
        frame={frame}
        items={[
          { at: b[0], until: b[5], text: ["Every detail", "on one page."] },
          { at: b[5], until: b[11], text: ["Every tag", "is a search."] },
        ]}
      />
      <Vignette />
    </AbsoluteFill>
  );
};
