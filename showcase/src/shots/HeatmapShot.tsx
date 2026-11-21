import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BeatFrames, evenBeats } from "../beats";
import { Page } from "../components/AppUI";
import { Backdrop, Vignette } from "../components/Backdrop";
import { Cam, Camera, camAt, onScreen } from "../components/Camera";
import { CAPTION_SHIFT, Captions } from "../components/Caption";
import { Cursor } from "../components/Cursor";
import { Laptop } from "../components/Laptop";
import { HEATMAP_SCROLL, TV_SPOTS, TvPage, TvTimeline } from "../components/TvUI";
import { SHOW, STATS } from "../data";
import { clamp } from "../theme";

/**
 * "Episode ratings" ("Every episode, rated."), already on the page from the
 * detail shot: the strip, Peak / Low point and the season averages. On 2
 * "Show full heatmap" is pressed and the grid cascades out, each season
 * starting before the last has finished. On 5 the camera dives onto the peak
 * episode's tooltip ("The best…"), on 8 it whips to the low point's ("…and
 * the worst."), and on 11 it pulls back to the whole run.
 */
export const HEATMAP_SHOT_BEATS = 13;

/** Where the detail shot leaves the camera, and where this one picks up. */
export const HEATMAP_OPEN_CAM: Cam = onScreen(660, 330, 1.0);

export const HeatmapShot: React.FC<{ beats?: BeatFrames }> = ({ beats = evenBeats() }) => {
  const frame = useCurrentFrame();
  const b = beats;

  const t: TvTimeline = {
    poster: -Infinity,
    badges: -Infinity,
    title: -Infinity,
    tagline: -Infinity,
    genres: -Infinity,
    ring: -Infinity,
    overview: -Infinity,
    hotGenre: Infinity,
    bars: -Infinity,
    peak: -Infinity,
    low: -Infinity,
    averages: -Infinity,
    expand: b[2] + 1,
    // A cascade: each season starts 3 frames after the last, so the grid fills in diagonally.
    season: (n) => b[2] + 4 + (n - 1) * 3,
    tooltip:
      frame < b[8]
        ? { episode: STATS.best, at: b[5] + 3, until: b[8] }
        : { episode: STATS.worst, at: b[8] + 3, until: b[11] },
  };

  const peak = TV_SPOTS.cell(STATS.best.season, STATS.best.episode);
  const low = TV_SPOTS.cell(STATS.worst.season, STATS.worst.episode);
  const grid = TV_SPOTS.grid();
  const button = TV_SPOTS.showFull();
  const cam = camAt(frame, [
    [b[0], HEATMAP_OPEN_CAM],
    [b[2] - 4, onScreen(button.x - 200, button.y - 60, 1.5)],
    [b[2] + 2, onScreen(button.x - 200, button.y - 60, 1.5)],
    [b[2] + 10, onScreen(grid.x + 140, grid.y - 10, 1.45)],
    [b[5], onScreen(grid.x + 140, grid.y - 10, 1.55)],
    [b[5] + 6, onScreen(peak.x + 20, peak.y - 50, 3.2)],
    [b[8], onScreen(peak.x + 20, peak.y - 50, 3.3)],
    [b[8] + 6, onScreen(low.x - 40, low.y - 50, 3.2)],
    [b[11], onScreen(low.x - 40, low.y - 50, 3.3)],
    [b[11] + 7, onScreen(grid.x + 190, grid.y - 90, 1.3)],
  ]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop glow={0.16} />
      <Camera cam={cam} shift={CAPTION_SHIFT}>
        <Laptop>
          <Page path={`/tv/${SHOW.id}`} scroll={HEATMAP_SCROLL}>
            <TvPage frame={frame} t={t} />
          </Page>
          <Cursor
            frame={frame}
            path={[
              [b[0], 900, 600],
              [b[2] - 3, button.x, button.y + 4],
            ]}
            clicks={[b[2]]}
            opacity={interpolate(frame, [b[0], b[0] + 4, b[2] + 5, b[2] + 8], [0, 1, 1, 0], clamp)}
          />
        </Laptop>
      </Camera>
      <Captions
        frame={frame}
        items={[
          { at: b[0], until: b[5], text: ["Every episode,", "rated."] },
          { at: b[5], until: b[8], text: ["", "The best…"] },
          { at: b[8], until: b[12], text: ["", "…and the worst."] },
        ]}
      />
      <Vignette />
    </AbsoluteFill>
  );
};
