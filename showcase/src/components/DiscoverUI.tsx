import React from "react";
import { interpolate } from "remotion";
import { Title } from "../titles";
import { clamp, color, font, hit, radius } from "../theme";
import { BAR_H, ChevronDown, Column, COL_W, colX, label, SiteHeader, ToggleChip, XIcon } from "./AppUI";
import { MediaCard } from "./MediaCard";

/**
 * DiscoverPage with DiscoverControls' filters open, redrawn at fixed row
 * heights so shots can aim the cursor and camera at each control. Only the
 * controls the video uses are drawn: the top row, Release Date and Min Rating,
 * Genres / Exclude Genres and Where to Watch / Exclude Services.
 *
 * Every control takes the frame it's set on (`Infinity` = never), so the page
 * animates itself from one `frame`.
 */
export interface DiscoverTimeline {
  tv: number;
  genres: number;
  exclude: number;
  provider: number;
  dates: number;
  rating: number;
}
export const NEVER: DiscoverTimeline = { tv: Infinity, genres: Infinity, exclude: Infinity, provider: Infinity, dates: Infinity, rating: Infinity };

/** The browser zoom the discover page is shown at, so the grid fits under the filters. */
export const DISCOVER_ZOOM = 0.75;

// Layout, in page CSS pixels.
const PANEL_TOP = 112;
const PAD = 17;
const ROW_A = PANEL_TOP + PAD; // Type / Title contains / Apply / Filters
const ROW_B = ROW_A + 58 + 16 + 8 + 1 + 16; // Release Date, Min Rating
const ROW_C = ROW_B + 36 + 24; // Genres | Exclude Genres
const SELECT_H = 20 + 8 + 26 + 8 + 36;
const ROW_D = ROW_C + SELECT_H + 24; // Where to Watch | Exclude Services
const PANEL_BOTTOM = ROW_D + SELECT_H + 34 + PAD;
const GRID_TOP = PANEL_BOTTOM + 12 + 36 + 12;
const INNER_W = COL_W - 2 * PAD;
const HALF = (INNER_W - 24) / 2;
const CARD_W = (COL_W - 5 * 16) / 6;

/** A point on the discover page (CSS px) → screen pixels at DISCOVER_ZOOM. */
const toScreen = (x: number, y: number) => ({ x: (colX(DISCOVER_ZOOM) + x) * DISCOVER_ZOOM, y: BAR_H + y * DISCOVER_ZOOM });
/** Where things are on screen, for the cursor and the camera. */
export const DISCOVER_SPOTS = {
  tvToggle: toScreen(PAD + 118, ROW_A + 40),
  titleRow: toScreen(COL_W / 2, ROW_A + 30),
  dates: toScreen(PAD + 260, ROW_B + 18),
  slider: (v: number) => toScreen(PAD + 545 + 72 + 16 + (192 * v) / 10, ROW_B + 18),
  genres: toScreen(PAD + 120, ROW_C + 72),
  genreAll: toScreen(PAD + HALF - 20, ROW_C + 10),
  exclude: toScreen(PAD + HALF + 24 + 120, ROW_C + 72),
  provider: toScreen(PAD + 120, ROW_D + 72),
  filtersButton: toScreen(PAD + INNER_W - 48, ROW_A + 40),
  count: toScreen(COL_W - 70, PANEL_BOTTOM + 30),
  card: (i: number) => toScreen((i % 6) * (CARD_W + 16) + CARD_W / 2, GRID_TOP + Math.floor(i / 6) * (CARD_W * 1.5 + 16) + CARD_W * 0.75),
  cardW: CARD_W * DISCOVER_ZOOM,
};

const field: React.CSSProperties = {
  height: 36,
  borderRadius: radius.md,
  border: `1px solid ${color.slate700}`,
  background: "rgba(29,41,61,0.8)",
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  fontSize: 14,
  color: color.slate100,
  boxSizing: "border-box",
};
const placeholder: React.CSSProperties = { color: color.slate500 };
const focusRing = (on: number): React.CSSProperties =>
  on > 0 ? { borderColor: "rgba(254,154,0,0.6)", boxShadow: `0 0 0 ${3 * on}px rgba(254,154,0,${0.4 * on})` } : {};

/** A selector's badge (amber include, red exclude), popping in from `at`. */
const Badge: React.FC<{ text: string; exclude?: boolean; frame: number; at: number }> = ({ text, exclude, frame, at }) => {
  const t = hit(frame, at, 6);
  if (t <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        height: 22,
        padding: "0 6px 0 9px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
        background: exclude ? "rgba(239,68,68,0.2)" : color.amber500,
        color: exclude ? "#fca5a5" : color.slate950,
        border: exclude ? "1px solid rgba(239,68,68,0.4)" : "1px solid transparent",
        transform: `scale(${0.4 + 0.6 * t})`,
        opacity: t,
      }}
    >
      {text}
      <XIcon size={12} />
    </div>
  );
};

const Selector: React.FC<{ title: string; placeholder: string; children?: React.ReactNode; extra?: React.ReactNode; focus?: number; below?: React.ReactNode }> = ({
  title,
  placeholder: ph,
  children,
  extra,
  focus = 0,
  below,
}) => (
  <div style={{ width: HALF, height: SELECT_H, position: "relative" }}>
    <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={label}>{title}</div>
      {extra}
    </div>
    <div style={{ height: 26, marginTop: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>{children}</div>
    <div style={{ ...field, marginTop: 8, ...focusRing(focus) }}>
      <span style={placeholder}>{ph}</span>
    </div>
    {below && <div style={{ position: "absolute", top: SELECT_H + 8 }}>{below}</div>}
  </div>
);

/** One grid cell swapping from `from` to `to` with a quick flip from `at`. */
const GridCell: React.FC<{ from?: Title; to?: Title; frame: number; at: number }> = ({ from, to, frame, at }) => {
  const same = from?.poster === to?.poster;
  const t = same ? 1 : hit(frame, at, 7);
  return (
    <div style={{ position: "relative", width: CARD_W, height: CARD_W * 1.5, perspective: 800 }}>
      {from && !same && t < 1 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - t, transform: `scale(${1 - 0.15 * t}) rotateY(${-70 * t}deg)` }}>
          <MediaCard item={from} width={CARD_W} />
        </div>
      )}
      {to && (
        <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, t * 1.6), transform: `scale(${0.85 + 0.15 * t}) rotateY(${70 * (1 - t)}deg)` }}>
          <MediaCard item={to} width={CARD_W} ring={same ? 1 : interpolate(frame, [at + 3, at + 12], [0, 1], clamp)} />
        </div>
      )}
    </div>
  );
};

export const DiscoverPage: React.FC<{
  frame: number;
  t: DiscoverTimeline;
  /** Grid contents, oldest first, each with the frame it lands on. */
  grids: { at: number; items: Title[]; total: number }[];
  /** Per-control focus rings (0–1), keyed like the timeline. */
  focus?: Partial<Record<keyof DiscoverTimeline, number>>;
  ratingValue?: number;
  /** Extra transform on one grid card (the pick at the end). */
  lift?: { index: number; style: React.CSSProperties };
  /** The Filters panel (closed by default in the app). */
  open?: boolean;
  /** The Genres selector's badges, popping in one after another from `t.genres`. */
  genreBadges?: string[];
}> = ({ frame, t, grids, focus = {}, ratingValue = 0, lift, open = true, genreBadges = ["Drama", "Sci-Fi & Fantasy"] }) => {
  const on = (at: number) => frame >= at;
  const tv = on(t.tv);
  const cur = grids.filter((g) => frame >= g.at).pop() ?? grids[0];
  const prevIndex = grids.indexOf(cur) - 1;
  const prev = prevIndex >= 0 ? grids[prevIndex] : undefined;
  const total = Math.round(
    prev ? interpolate(frame, [cur.at, cur.at + 10], [prev.total, cur.total], clamp) : cur.total,
  );
  const filterCount = [t.genres, t.exclude, t.provider, t.dates, t.rating].filter(on).length + (on(t.genres) ? 1 : 0);

  return (
    <Column>
      <SiteHeader discover={1} />
      {/* DiscoverControls */}
      <div
        style={{
          position: "relative",
          borderRadius: radius.xl,
          border: `1px solid ${color.slate800}`,
          background: "rgba(15,23,43,0.8)",
          padding: PAD - 1,
          height: open ? PANEL_BOTTOM - PANEL_TOP : 2 * PAD + 58,
          boxSizing: "border-box",
          boxShadow: "0 10px 15px rgba(0,0,0,0.3)",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 58 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={label}>Type</div>
            <div style={{ display: "flex", gap: 2 }}>
              {["Movies", "TV Shows"].map((m, i) => {
                const active = (i === 1) === tv;
                return (
                  <div
                    key={m}
                    style={{
                      height: 36,
                      padding: "0 12px",
                      borderRadius: radius.md,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 14,
                      fontWeight: 500,
                      background: active ? "rgba(255,255,255,0.1)" : "transparent",
                      color: active ? color.white : color.slate400,
                    }}
                  >
                    {m}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={label}>Title contains</div>
            <div style={field}>
              <span style={placeholder}>Filter by title, e.g. Batman…</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ ...field, border: "none", background: color.amber500, color: color.slate950, fontWeight: 500, padding: "0 16px" }}>Apply</div>
            <div
              style={{
                ...field,
                background: open ? color.slate800 : "transparent",
                border: `1px solid ${open ? color.slate600 : color.slate700}`,
                color: open ? color.white : color.slate300,
                fontWeight: 500,
                padding: "0 14px",
              }}
            >
              Filters
              {filterCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: "rgba(254,154,0,0.2)",
                    color: color.amber400,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {filterCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {open && (
          <>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: ROW_B - PANEL_TOP - 16 - 1, borderTop: `1px solid ${color.slate800}` }} />

        {/* Release Date, Min Rating */}
        <div style={{ position: "absolute", left: PAD, top: ROW_B - PANEL_TOP, display: "flex", alignItems: "center", gap: 32, height: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: color.slate300 }}>Release Date</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {["2010-01-01", "2019-12-31"].map((d, i) => (
                <React.Fragment key={d}>
                  {i === 1 && <span style={{ color: color.slate500 }}>–</span>}
                  <div style={{ ...field, width: 144, ...focusRing(focus.dates ?? 0) }}>
                    {on(t.dates + i * 2) ? <span style={{ fontFamily: font.mono }}>{d}</span> : <span style={{ ...placeholder, fontFamily: font.mono }}>yyyy-mm-dd</span>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: color.slate300, whiteSpace: "nowrap" }}>
              Min Rating: <span style={{ fontFamily: font.mono, color: color.amber400, marginLeft: 4 }}>{ratingValue.toFixed(1)}</span>
            </div>
            <div style={{ position: "relative", width: 192, height: 12, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", height: 4, borderRadius: 2, background: color.slate700, overflow: "hidden" }}>
                <div style={{ width: `${ratingValue * 10}%`, height: "100%", background: color.amber500 }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: `calc(${ratingValue * 10}% - ${(12 * ratingValue) / 10}px)`,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  background: color.amber400,
                  border: `1px solid ${color.amber500}`,
                  boxShadow: `0 0 0 ${3 * (focus.rating ?? 0)}px rgba(254,154,0,0.4)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Genres | Exclude Genres */}
        <div style={{ position: "absolute", left: PAD, top: ROW_C - PANEL_TOP, display: "flex", gap: 24 }}>
          <Selector
            title="Genres"
            placeholder="Search or select a genre..."
            focus={focus.genres}
            extra={
              genreBadges.length > 1 && on(t.genres + 2) && (
                <div style={{ display: "flex", gap: 4 }}>
                  <ToggleChip active={0} small>Any</ToggleChip>
                  <ToggleChip active={on(t.genres + 5) ? 1 : 0} small>All</ToggleChip>
                </div>
              )
            }
          >
            {genreBadges.map((g, i) => (
              <Badge key={g} text={g} frame={frame} at={t.genres + i * 2} />
            ))}
          </Selector>
          <Selector title="Exclude Genres" placeholder="e.g. Horror..." focus={focus.exclude}>
            <Badge text="Animation" exclude frame={frame} at={t.exclude} />
          </Selector>
        </div>

        {/* Where to Watch | Exclude Services */}
        <div style={{ position: "absolute", left: PAD, top: ROW_D - PANEL_TOP, display: "flex", gap: 24 }}>
          <Selector
            title="Where to Watch"
            placeholder="Search or select a service..."
            focus={focus.provider}
            below={
              on(t.provider) && (
                <div style={{ display: "flex", gap: 8, opacity: hit(frame, t.provider + 2, 5) }}>
                  {["Subscription", "Free", "With ads", "Rent", "Buy"].map((m, i) => (
                    <ToggleChip key={m} active={i === 0 ? 1 : 0}>
                      {m}
                    </ToggleChip>
                  ))}
                </div>
              )
            }
          >
            <Badge text="Crave" frame={frame} at={t.provider} />
          </Selector>
          <Selector title="Exclude Services" placeholder="e.g. Netflix..." />
        </div>
          </>
        )}
      </div>

      {/* Sort row */}
      <div style={{ margin: "12px 0", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={label}>Sort by</div>
          <div style={{ ...field, gap: 24 }}>
            Popularity <ChevronDown size={16} color={color.slate500} />
          </div>
        </div>
        <div style={{ fontFamily: font.mono, fontSize: 12, color: color.slate500 }}>
          {Math.min(20, total)} of {total.toLocaleString("en-US")} {total === 1 ? "result" : "results"}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(6, ${CARD_W}px)`, gap: 16 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={lift?.index === i ? { ...lift.style, position: "relative", zIndex: 10 } : undefined}>
            <GridCell from={prev?.items[i]} to={cur.items[i]} frame={frame} at={cur.at + (i % 6) + Math.floor(i / 6) * 2} />
          </div>
        ))}
      </div>
    </Column>
  );
};
