import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BeatFrames, evenBeats } from "../beats";
import { Column, COL_W, colX, HitCard, Page, SEARCH_BOX_CENTER, DISCOVER_NAV_CENTER, BAR_H, SiteHeader } from "../components/AppUI";
import { Backdrop, Vignette } from "../components/Backdrop";
import { Camera, camAt, onScreen } from "../components/Camera";
import { CAPTION_SHIFT, Captions } from "../components/Caption";
import { Cursor } from "../components/Cursor";
import { Laptop } from "../components/Laptop";
import { MediaCard } from "../components/MediaCard";
import { Hit, SEARCH } from "../data";
import { clamp, color, hit, snap } from "../theme";
import { rail } from "../titles";

/**
 * Home, on the groove (song beat 20). The laptop slams in on the home page
 * and the first three rails fill in, one per beat ("Everything trending, at a
 * glance."). On 4 the camera dives into the header search ("Search movies,
 * shows and people.") and "hardy" types in; on 6 it's the results page, and
 * on 8 the People tab is picked. On 11 "Discover" is pressed in the nav.
 */
export const HOME_SHOT_BEATS = 12;

const RAILS = [
  { title: "Trending this week", items: rail("trending-week") },
  { title: "Now playing", items: rail("movie-now-playing") },
  { title: "On the air", items: rail("tv-on-the-air") },
];
const CARD = 160;

const Rail: React.FC<{ title: string; items: ReturnType<typeof rail>; frame: number; at: number }> = ({ title, items, frame, at }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ fontSize: 18, lineHeight: "28px", fontWeight: 600, color: color.slate100, marginBottom: 12 }}>{title}</div>
    <div style={{ position: "relative", display: "flex", gap: 16, height: CARD * 1.5 + 8, width: COL_W, overflow: "hidden" }}>
      {items.slice(0, 8).map((item, i) => {
        const t = hit(frame, at + i, 7);
        return (
          <div key={item.poster} style={{ position: "relative", width: CARD, height: CARD * 1.5, flexShrink: 0 }}>
            {/* The loading skeleton until the rail lands */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "rgba(29,41,61,0.6)", opacity: 1 - t }} />
            <div style={{ position: "absolute", inset: 0, opacity: t, transform: `translateX(${(1 - t) * 140}px)` }}>
              <MediaCard item={item} width={CARD} ring={interpolate(frame, [at + i + 3, at + i + 14], [0, 1], { ...clamp, easing: snap })} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// SearchResultsPage: tabs in TAB_ORDER (titles first); All keeps GROUP_ORDER's sections.
type Tab = "all" | Hit["kind"];
const LABELS: Record<Hit["kind"], string> = { person: "People", movie: "Movies", tv: "TV" };
const TABS: Tab[] = ["all", "movie", "tv", "person"];
const GROUPS: Hit["kind"][] = ["person", "movie", "tv"];
const count = (kind: Tab) => (kind === "all" ? SEARCH.hits.length : SEARCH.hits.filter((h) => h.kind === kind).length);
const HIT_W = (COL_W - 5 * 16) / 6;

const HitGrid: React.FC<{ hits: Hit[]; frame: number; at: number }> = ({ hits, frame, at }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(6, ${HIT_W}px)`, gap: 16 }}>
    {hits.map((h, i) => {
      const t = hit(frame, at + i * 0.7, 6);
      return <HitCard key={`${h.kind}-${h.id}`} hit={h} width={HIT_W} style={{ opacity: t, transform: `translateY(${(1 - t) * 40}px) scale(${0.92 + 0.08 * t})` }} />;
    })}
  </div>
);

const Results: React.FC<{ tab: Tab; frame: number; at: number; landed: number }> = ({ tab, frame, at, landed }) => {
  const visible = tab === "all" ? SEARCH.hits : SEARCH.hits.filter((h) => h.kind === tab);
  return (
    <div style={{ opacity: landed, transform: `translateY(${(1 - landed) * 24}px)` }}>
      <div style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600, letterSpacing: "-0.025em", color: color.slate100 }}>
        Search results for "{SEARCH.query}"
      </div>
      <div style={{ marginTop: 4, fontSize: 14, lineHeight: "20px", color: color.slate500 }}>
        {visible.length} results
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 4 }}>
        {TABS.map((k) => {
          const active = k === tab;
          return (
            <div
              key={k}
              style={{
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 500,
                background: active ? color.slate800 : "transparent",
                color: active ? color.amber400 : color.slate400,
              }}
            >
              {k === "all" ? "All" : LABELS[k]} <span style={{ color: color.slate500 }}>{count(k)}</span>
            </div>
          );
        })}
      </div>
      {tab === "all" ? (
        GROUPS.map((g) => (
          <div key={g} style={{ marginTop: 32 }}>
            <div style={{ marginBottom: 12, fontSize: 14, lineHeight: "20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em", color: color.slate500 }}>
              {LABELS[g]}
            </div>
            <HitGrid hits={SEARCH.hits.filter((h) => h.kind === g)} frame={frame} at={at} />
          </div>
        ))
      ) : (
        <div style={{ marginTop: 32 }}>
          <HitGrid hits={visible} frame={frame} at={at} />
        </div>
      )}
    </div>
  );
};

/** The People tab's centre in screen pixels, on the results page. */
const PEOPLE_TAB = { x: colX() + 68 + 88 + 60 + 44, y: BAR_H + 112 + 32 + 24 + 16 + 16 };

export const HomeShot: React.FC<{ beats?: BeatFrames }> = ({ beats = evenBeats() }) => {
  const frame = useCurrentFrame();
  const b = beats;

  // The laptop slams up into frame on the groove.
  const land = hit(frame, b[0], 9);
  const search = { x: SEARCH_BOX_CENTER.x, y: BAR_H + SEARCH_BOX_CENTER.y };
  const results = onScreen(560, 440, 1.25);
  const cam = camAt(frame, [
    [b[0], onScreen(720, 450, 0.86)],
    [b[4] - 1, onScreen(720, 450, 0.9)],
    [b[4] + 5, onScreen(search.x - 40, search.y + 40, 2.3)],
    [b[6] - 1, onScreen(search.x - 40, search.y + 40, 2.3)],
    [b[6] + 6, results],
    [b[10], results],
    [b[10] + 7, onScreen(480, 300, 1.4)],
  ]);

  // "hardy" types in between the dive and the results on 6.
  const typeFrom = b[4] + 5;
  const per = (b[6] - 4 - typeFrom) / SEARCH.query.length;
  const typed = SEARCH.query.slice(0, Math.max(0, Math.min(SEARCH.query.length, Math.floor((frame - typeFrom) / per) + 1)));
  const onResults = frame >= b[6];
  const tab: Tab = frame >= b[8] ? "person" : "all";
  const discover = interpolate(frame, [b[11], b[11] + 3], [0, 1], clamp);
  const path = frame >= b[11] ? "/discover" : !onResults ? "/" : `/search?query=${SEARCH.query}${tab === "all" ? "" : `&type=${tab}`}`;

  const nav = { x: DISCOVER_NAV_CENTER.x, y: BAR_H + DISCOVER_NAV_CENTER.y };
  const cursor: [number, number, number][] = [
    [b[3], 1000, 620],
    [b[4] + 2, search.x - 120, search.y + 6],
    [b[6] + 2, search.x - 120, search.y + 6],
    [b[8] - 4, PEOPLE_TAB.x, PEOPLE_TAB.y + 6],
    [b[10] + 2, PEOPLE_TAB.x, PEOPLE_TAB.y + 6],
    [b[11] - 4, nav.x, nav.y + 6],
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop glow={0.14} />
      <Camera cam={cam} shift={CAPTION_SHIFT}>
        <Laptop cy={540 + (1 - land) * 700} rotateX={(1 - land) * 35} scale={0.85 + 0.15 * land} glow={0.4 * (1 - land)}>
          <Page path={path}>
            <Column>
              <SiteHeader
                home={onResults ? 0 : 1}
                discover={discover}
                query={frame >= typeFrom ? typed : ""}
                focus={interpolate(frame, [b[4] + 2, b[4] + 4, b[6] + 4, b[6] + 8], [0, 1, 1, 0], clamp)}
                caret={frame >= b[4] + 2 && frame < b[6] + 4 && Math.floor(frame / 8) % 2 === 0}
              />
              {!onResults ? (
                RAILS.map((r, i) => <Rail key={r.title} title={r.title} items={r.items} frame={frame} at={b[i + 1]} />)
              ) : (
                <Results tab={tab} frame={frame} at={tab === "all" ? b[6] : b[8]} landed={hit(frame, b[6], 6)} />
              )}
            </Column>
          </Page>
          <Cursor frame={frame} path={cursor} clicks={[b[4] + 2, b[8], b[11]]} opacity={interpolate(frame, [b[3], b[3] + 4], [0, 1], clamp)} />
        </Laptop>
      </Camera>
      <Captions
        frame={frame}
        items={[
          { at: b[0], until: b[4], text: ["Everything trending,", "at a glance."] },
          { at: b[4], until: b[12] + 1, text: ["Search", "movies, shows and people."] },
        ]}
      />
      <Vignette />
    </AbsoluteFill>
  );
};
