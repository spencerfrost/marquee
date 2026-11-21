import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BeatFrames, evenBeats } from "../beats";
import { Page } from "../components/AppUI";
import { Backdrop, Vignette } from "../components/Backdrop";
import { Camera, camAt, onScreen } from "../components/Camera";
import { CAPTION_SHIFT, Captions } from "../components/Caption";
import { Cursor } from "../components/Cursor";
import { DISCOVER_SPOTS as S, DISCOVER_ZOOM, DiscoverPage, DiscoverTimeline, NEVER } from "../components/DiscoverUI";
import { Laptop } from "../components/Laptop";
import { DISCOVER } from "../data";
import { clamp, snap, track } from "../theme";

/**
 * Discover ("Filter by anything."). TV Shows is picked on 1, and the filters
 * open with it (in the app that's a separate Filters button; the video skips
 * the cursor trip across the screen). From beat 3 a filter lands every 40
 * frames (off the beat grid, paced for a viewer to follow), each adding a
 * line to a second caption block as the grid flips under it: Drama + Sci-Fi &
 * Fantasy matching All ("Genre"), Crave ("Where it streams"), Min Rating 8.0
 * ("How good it is"). The camera pulls back to the six results, and on 10
 * Game of Thrones is picked and the camera dives into its poster.
 */
export const DISCOVER_SHOT_BEATS = 12;

/** The address bar after each filter, as filtersToParams writes it. */
const PATHS = [
  "/discover",
  "/discover?type=tv",
  "/discover?type=tv&gmatch=all&genres=18%2C10765",
  "/discover?type=tv&gmatch=all&genres=18%2C10765&providers=230",
  "/discover?type=tv&rating=8&gmatch=all&genres=18%2C10765&providers=230",
];

export const DiscoverShot: React.FC<{ beats?: BeatFrames }> = ({ beats = evenBeats() }) => {
  const frame = useCurrentFrame();
  const b = beats;

  // The filters aren't on the beat grid: they're spaced for a person to follow,
  // GAP frames apart (about 1.3 s), starting on beat 3.
  const GAP = 40;
  const G = b[3];
  const t: DiscoverTimeline = { ...NEVER, tv: b[1], genres: G, provider: G + GAP, rating: G + 2 * GAP };
  const [s0, s1, s2, s3] = DISCOVER.steps;
  const grids = [
    { at: -1, ...DISCOVER.start },
    { at: t.tv, ...s0 },
    { at: t.genres, ...s1 },
    { at: t.provider, ...s2 },
    { at: t.rating, ...s3 },
  ];
  // The slider drags up to 8.0 and lets go as the rating filter lands.
  const rating = track(frame, [
    [t.rating - 9, 0],
    [t.rating, 8],
  ]);
  const ring = (from: number, to: number) => interpolate(frame, [from - 3, from, to, to + 3], [0, 1, 1, 0], clamp);
  const focus = {
    genres: ring(t.genres - 2, t.genres + 18),
    provider: ring(t.provider - 2, t.provider + 18),
    rating: ring(t.rating - 9, t.rating + 18),
  };

  const card = S.card(0);
  // The six results in a row, with the count above them.
  const results = onScreen(card.x + 410, card.y - 40, 1.15);
  const control = (p: { x: number; y: number }) => onScreen(p.x + 60, 400, 1.6);
  const cam = camAt(frame, [
    [b[0], onScreen(560, 330, 1.9)],
    [b[0] + 8, onScreen(560, 330, 1.5)],
    [t.genres - 12, onScreen(560, 330, 1.5)],
    [t.genres - 2, control(S.genres)],
    [t.provider - 10, control(S.genres)],
    [t.provider, control(S.provider)],
    [t.rating - 18, control(S.provider)],
    [t.rating - 9, onScreen(S.slider(4).x, 400, 1.6)],
    [t.rating + 16, onScreen(S.slider(4).x, 400, 1.6)],
    [t.rating + 26, results],
    [b[10] - 2, results],
    [b[10] + 4, onScreen(card.x, card.y, 1.6)],
    [b[12], onScreen(card.x, card.y, 5.2)],
  ]);

  const step = [t.tv, t.genres, t.provider, t.rating].filter((at) => frame >= at).length;

  const cursor: [number, number, number][] = [
    [b[0], 760, 420],
    [b[1] - 3, S.tvToggle.x, S.tvToggle.y],
    [b[1] + 4, S.tvToggle.x, S.tvToggle.y],
    [t.genres - 3, S.genres.x, S.genres.y],
    [t.provider - 14, S.genres.x, S.genres.y],
    [t.provider - 3, S.provider.x, S.provider.y],
    [t.rating - 22, S.provider.x, S.provider.y],
    [t.rating - 10, S.slider(0).x, S.slider(0).y],
    [t.rating, S.slider(8).x, S.slider(8).y],
    [b[10] - 10, S.slider(8).x, S.slider(8).y],
    [b[10] - 2, card.x, card.y],
  ];
  const lift = interpolate(frame, [b[10], b[10] + 5], [0, 1], { ...clamp, easing: snap });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop glow={0.14} />
      <Camera cam={cam} shift={CAPTION_SHIFT}>
        <Laptop>
          <Page path={PATHS[step]} zoom={DISCOVER_ZOOM}>
            <DiscoverPage
              frame={frame}
              t={t}
              grids={grids}
              focus={focus}
              ratingValue={rating}
              open={frame >= b[1] + 2}
              lift={{ index: 0, style: { transform: `scale(${1 + 0.06 * lift})`, filter: `drop-shadow(0 0 ${30 * lift}px rgba(254,154,0,${0.5 * lift}))` } }}
            />
          </Page>
          <Cursor
            frame={frame}
            path={cursor}
            clicks={[b[1], t.genres, t.provider, t.rating - 10, b[10]]}
            opacity={interpolate(frame, [b[10] + 4, b[10] + 8], [1, 0], clamp)}
          />
        </Laptop>
      </Camera>
      <Captions
        frame={frame}
        items={[
          { at: b[0], until: t.genres, text: ["Filter by", "anything."] },
          {
            at: t.genres,
            until: b[10],
            text: ["", ""],
            lines: [
              { at: t.genres, text: "Genre" },
              { at: t.provider, text: "Where it streams" },
              { at: t.rating, text: "How good it is" },
            ],
          },
        ]}
      />
      <Vignette />
    </AbsoluteFill>
  );
};
