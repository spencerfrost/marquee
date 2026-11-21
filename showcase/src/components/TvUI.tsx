import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { bandFor, Episode, episodeCode, MIN_RELIABLE_VOTES, RATING_BANDS, SHOW, STATS, UNRATED_BG } from "../data";
import { clamp, color, font, hit, radius, snap } from "../theme";
import { BAR_H, ChevronDown, ChevronUp, Column, colX, GridIcon, label, LinkChip } from "./AppUI";
import { ScoreRing } from "./ScoreRing";

/**
 * TvDetailView inside DetailContainer, for SHOW: the hero, then "Episode
 * ratings" (EpisodeHeatmap), "Top cast" and the start of the seasons list.
 * Shared by the detail and heatmap shots so the cut between them is seamless.
 * Every entrance takes the frame it lands on; -Infinity means already there.
 */

// Layout, in page CSS pixels (browser zoom 1).
const CONTAINER_TOP = 24 + 20 + 16;
const HERO_H = 400;
export const SECTION_TOP = CONTAINER_TOP + HERO_H + 1;
const HIGHLIGHT_H = 96;
const STRIP_TOP = SECTION_TOP + 24 + 44 + HIGHLIGHT_H + 20;
const STRIP_H = 56 + 12 + 32;
const GRID_ROWS = Math.max(...SHOW.seasons.map((s) => s.episodes.length));
const GRID_H = 24 + GRID_ROWS * 44 + 8 + 44;
const INNER_X = 32;
const INNER_W = 1232 - 64;
/** The heatmap's scroll position: the section just under the top of the screen. */
export const HEATMAP_SCROLL = SECTION_TOP - 16;

/** Screen pixels of a page point at a given scroll. */
const toScreen = (x: number, y: number, scroll: number) => ({ x: colX() + x, y: BAR_H + y - scroll });
export const TV_SPOTS = {
  poster: (scroll = 0) => toScreen(32 + 112, CONTAINER_TOP + 32 + 168, scroll),
  genre: (i: number, scroll = 0) => toScreen(32 + 224 + 24 + [62, 160, 254][i], CONTAINER_TOP + 32 + 45 + 36 + 40 + 32 + 12 + 12, scroll),
  heading: (scroll = HEATMAP_SCROLL) => toScreen(INNER_X + 80, SECTION_TOP + 24 + 14, scroll),
  showFull: (scroll = HEATMAP_SCROLL) => toScreen(INNER_X + INNER_W - 92, STRIP_TOP + 56 + 12 + 16, scroll),
  cell: (season: number, ep: number, scroll = HEATMAP_SCROLL) => toScreen(INNER_X + 40 + (season - 1) * 44 + 22, STRIP_TOP + 24 + (ep - 1) * 44 + 20, scroll),
  grid: (scroll = HEATMAP_SCROLL) => toScreen(INNER_X + 40 + (SHOW.seasons.length * 44) / 2, STRIP_TOP + GRID_H / 2 - 20, scroll),
  highlights: (scroll = HEATMAP_SCROLL) => toScreen(INNER_W / 2, SECTION_TOP + 24 + 44 + HIGHLIGHT_H / 2, scroll),
};

export interface TvTimeline {
  // Hero
  poster: number;
  badges: number;
  title: number;
  tagline: number;
  genres: number;
  ring: number;
  overview: number;
  /** "Sci-Fi & Fantasy" chip hovered (amber). */
  hotGenre: number;
  // Episode ratings
  /** Data arrives: the skeleton gives way and the strip's bars rise. */
  bars: number;
  peak: number;
  low: number;
  averages: number;
  expand: number;
  /** Each season's column flips in from its frame. */
  season: (n: number) => number;
  tooltip?: { episode: Episode; at: number; until: number };
}

const shown = (at: number, frame: number, len = 6) => (at === -Infinity ? 1 : hit(frame, at, len));
const rise = (t: number, px = 24): React.CSSProperties => ({ opacity: t, transform: `translateY(${(1 - t) * px}px)` });

const RatingChip: React.FC<{ rating: number; w: number; h: number; size: number; ring?: boolean }> = ({ rating, w, h, size, ring }) => {
  const band = bandFor(rating);
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius.md,
        background: band.bg,
        color: band.fg,
        fontFamily: font.mono,
        fontWeight: 600,
        fontSize: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: ring ? `0 0 0 1px ${color.slate900}, 0 0 0 3px rgba(255,255,255,0.7)` : undefined,
      }}
    >
      {rating.toFixed(1)}
    </div>
  );
};

const Highlight: React.FC<{ title: string; e: Episode; t: number }> = ({ title, e, t }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, height: 40, ...rise(t, 0), transform: `translateX(${(1 - t) * -40}px)` }}>
    <div style={{ width: 72, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.025em", color: color.slate500 }}>{title}</div>
    <RatingChip rating={e.rating} w={44} h={28} size={14} />
    <div style={{ flex: 1, fontWeight: 500, color: color.slate200, fontSize: 16 }}>{e.name}</div>
    <div style={{ fontFamily: font.mono, fontSize: 12, color: color.slate500 }}>{episodeCode(e)}</div>
  </div>
);

const Tooltip: React.FC<{ e: Episode; x: number; y: number; t: number }> = ({ e, x, y, t }) => {
  const band = bandFor(e.rating);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 256,
        transform: `translate(-50%, calc(-100% - 8px)) scale(${0.9 + 0.1 * t})`,
        transformOrigin: "50% 100%",
        opacity: t,
        borderRadius: radius.lg,
        border: `1px solid ${color.slate700}`,
        background: "rgba(2,6,24,0.95)",
        padding: 12,
        boxShadow: "0 20px 25px rgba(0,0,0,0.5)",
        zIndex: 40,
      }}
    >
      <div style={{ fontFamily: font.mono, fontSize: 12, color: color.slate500 }}>{episodeCode(e)}</div>
      <div style={{ marginTop: 2, fontWeight: 600, color: color.white, fontSize: 16, lineHeight: 1.35 }}>{e.name}</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
        <span style={{ borderRadius: 4, padding: "2px 6px", fontFamily: font.mono, fontWeight: 600, background: band.bg, color: band.fg }}>{e.rating.toFixed(1)}</span>
        <span style={{ color: color.slate400 }}>{e.votes.toLocaleString("en-US")} votes</span>
        <span style={{ marginLeft: "auto", color: color.slate500 }}>{e.airDate}</span>
      </div>
    </div>
  );
};

export const TvPage: React.FC<{ frame: number; t: TvTimeline }> = ({ frame, t }) => {
  const ratings = SHOW.seasons.flatMap((s) => s.episodes.map((e) => e.rating));
  const hi = Math.max(...ratings);
  const lo = Math.min(Math.min(...ratings), hi - 1.5);
  const loaded = frame >= t.bars;
  const expand = shown(t.expand, frame, 7);
  const sectionInner = expand > 0 ? STRIP_H + (GRID_H - STRIP_H) * expand : STRIP_H;
  let barIndex = 0;

  return (
    <Column>
      {/* DetailContainer's back button */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 20, marginBottom: 16, fontSize: 14, fontWeight: 500, color: color.slate400 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12.5L5.5 8L10 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </div>

      <div style={{ borderRadius: radius.xl, background: color.slate900, overflow: "hidden" }}>
        {/* Hero */}
        <div style={{ position: "relative", height: HERO_H }}>
          <div style={{ position: "absolute", inset: 0, opacity: shown(t.poster, frame, 10) }}>
            <Img src={staticFile(SHOW.backdrop)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${color.slate900}, rgba(15,23,43,0.8), rgba(15,23,43,0.4))` }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(15,23,43,0.6), transparent, transparent)" }} />
          </div>
          <div style={{ position: "relative", display: "flex", gap: 24, padding: 32 }}>
            <Img
              src={staticFile(SHOW.poster)}
              style={{ width: 224, height: 336, borderRadius: radius.lg, objectFit: "cover", boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)" }}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, ...rise(shown(t.badges, frame)) }}>
                <span
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(69,85,108,0.6)",
                    background: "rgba(29,41,61,0.8)",
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.025em",
                    color: color.slate300,
                  }}
                >
                  {SHOW.status}
                </span>
                <span style={{ borderRadius: 4, border: "1px solid rgba(98,116,142,0.6)", padding: "2px 6px", fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: color.slate300 }}>
                  {SHOW.certification}
                </span>
                <span style={{ fontSize: 14, color: color.slate400 }}>{SHOW.year}</span>
              </div>
              <div
                style={{
                  fontSize: 36,
                  lineHeight: "40px",
                  fontWeight: 700,
                  color: color.white,
                  opacity: shown(t.title, frame, 2),
                  transform: `scale(${1.6 - 0.6 * shown(t.title, frame)})`,
                  transformOrigin: "0 50%",
                }}
              >
                {SHOW.name}
              </div>
              <div style={{ marginTop: 8, fontStyle: "italic", color: color.slate400, ...rise(shown(t.tagline, frame)) }}>{SHOW.tagline}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                {SHOW.genres.map((g, i) => {
                  const s = shown(t.genres === -Infinity ? -Infinity : t.genres + i * 2, frame, 5);
                  return (
                    <LinkChip key={g.id} hot={i === 0 && frame >= t.hotGenre ? 1 : 0} style={{ opacity: s, transform: `scale(${0.5 + 0.5 * s})` }}>
                      {g.name}
                    </LinkChip>
                  );
                })}
              </div>
              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 24, ...rise(shown(t.ring, frame, 4), 0) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ScoreRing score={SHOW.rating} size={48} fill={t.ring === -Infinity ? 1 : interpolate(frame, [t.ring, t.ring + 14], [0, 1], { ...clamp, easing: snap })} />
                  <div style={{ fontSize: 14 }}>
                    <div style={{ fontWeight: 500, color: color.slate200 }}>{SHOW.rating.toFixed(1)} / 10</div>
                    <div style={{ fontSize: 12, color: color.slate500 }}>TMDB rating</div>
                  </div>
                </div>
                <div style={{ width: 1, height: 32, background: color.slate700 }} />
                {[
                  [SHOW.numberOfSeasons, "Seasons"],
                  [SHOW.numberOfEpisodes, "Episodes"],
                ].map(([n, l]) => (
                  <div key={l} style={{ fontSize: 14 }}>
                    <div style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 600, color: color.white }}>
                      {t.ring === -Infinity ? n : Math.round(interpolate(frame, [t.ring + 2, t.ring + 14], [0, n as number], { ...clamp, easing: snap }))}
                    </div>
                    <div style={{ fontSize: 12, color: color.slate500 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, maxWidth: 768, fontSize: 14, lineHeight: 1.625, color: color.slate300, ...rise(shown(t.overview, frame, 8), 16) }}>
                {SHOW.overview}
              </div>
            </div>
          </div>
        </div>

        {/* Episode ratings */}
        <div style={{ borderTop: `1px solid ${color.slate800}`, padding: "24px 32px" }}>
          <div style={{ height: 28, marginBottom: 16, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, lineHeight: "28px", fontWeight: 600, color: color.white }}>Episode ratings</div>
            {expand > 0 && (
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: color.slate500, opacity: expand }}>
                {RATING_BANDS.map((band) => (
                  <span key={band.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: band.bg }} />
                    {band.label}
                  </span>
                ))}
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: RATING_BANDS[1].bg, opacity: 0.45 }} />
                  &lt;{MIN_RELIABLE_VOTES} votes
                </span>
              </div>
            )}
          </div>

          {!loaded ? (
            <div>
              <div style={{ height: 84, borderRadius: radius.lg, background: "rgba(29,41,61,0.6)" }} />
              <div style={{ marginTop: 20, height: 56, borderRadius: 4, background: "rgba(29,41,61,0.6)" }} />
            </div>
          ) : (
            <>
              {/* RatingHighlights */}
              <div style={{ height: HIGHLIGHT_H, marginBottom: 20, display: "grid", gridTemplateColumns: "5fr 7fr", columnGap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Highlight title="Peak" e={STATS.best} t={shown(t.peak, frame)} />
                  <Highlight title="Low point" e={STATS.worst} t={shown(t.low, frame)} />
                </div>
                <div style={{ borderLeft: `1px solid ${color.slate800}`, paddingLeft: 32, opacity: shown(t.averages, frame, 3) }}>
                  <div style={{ ...label, fontSize: 11, marginBottom: 8 }}>Season averages</div>
                  <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
                    {STATS.seasonAverages.map((s, i) => {
                      const avg = s.average.toFixed(1);
                      const mark = avg === STATS.bestShown ? { text: "▲ best", c: "#34d399" } : avg === STATS.lowShown ? { text: "▼ low", c: "#f87171" } : null;
                      const p = shown(t.averages === -Infinity ? -Infinity : t.averages + i * 1.5, frame, 5);
                      const m = shown(t.averages === -Infinity ? -Infinity : t.averages + 16, frame, 5);
                      return (
                        <div key={s.number} style={{ width: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
                          <span style={{ fontFamily: font.mono, fontSize: 10, color: color.slate500 }}>S{s.number}</span>
                          <RatingChip rating={s.average} w={44} h={28} size={12} ring={!!mark && m > 0.5} />
                          <span style={{ height: 12, fontSize: 10, lineHeight: "12px", fontWeight: 500, whiteSpace: "nowrap", color: mark?.c, opacity: m }}>{mark?.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ position: "relative", height: sectionInner }}>
                {/* RatingStrip, until expanded */}
                {expand < 1 && (
                  <div style={{ position: "absolute", inset: "0 0 auto 0", opacity: 1 - expand }}>
                    <div style={{ height: 56, display: "flex", alignItems: "flex-end", gap: 3, overflow: "hidden" }}>
                      {SHOW.seasons.map((s) => (
                        <div key={s.number} style={{ flexGrow: s.episodes.length, flexBasis: 0, height: "100%", display: "flex", alignItems: "flex-end", gap: 1 }}>
                          {s.episodes.map((e) => {
                            const i = barIndex++;
                            const h = 20 + ((e.rating - lo) / (hi - lo)) * 80;
                            const p = shown(t.bars === -Infinity ? -Infinity : t.bars + i * 0.16, frame, 6);
                            return (
                              <div
                                key={e.episode}
                                style={{ flex: 1, minWidth: 1, height: `${h * p}%`, borderTopLeftRadius: 1, borderTopRightRadius: 1, background: bandFor(e.rating).bg }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, height: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 12, color: color.slate500 }}>
                        {STATS.episodeCount} episodes across {SHOW.seasons.length} seasons
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          borderRadius: 999,
                          border: "1px solid rgba(254,154,0,0.4)",
                          background: "rgba(254,154,0,0.1)",
                          padding: "6px 14px",
                          fontSize: 14,
                          fontWeight: 500,
                          color: color.amber400,
                        }}
                      >
                        <GridIcon size={16} />
                        Show full heatmap
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                )}

                {/* The full grid */}
                {expand > 0 && (
                  <div style={{ position: "absolute", inset: "0 0 auto 0" }}>
                    <div style={{ display: "flex" }}>
                      <div style={{ width: 40 }} />
                      {SHOW.seasons.map((s) => (
                        <div
                          key={s.number}
                          style={{
                            width: 40,
                            margin: "0 2px 8px",
                            textAlign: "center",
                            fontFamily: font.mono,
                            fontSize: 12,
                            lineHeight: "16px",
                            fontWeight: 600,
                            color: color.slate500,
                            opacity: shown(t.season(s.number), frame, 4),
                          }}
                        >
                          S{s.number}
                        </div>
                      ))}
                    </div>
                    {Array.from({ length: GRID_ROWS }, (_, r) => (
                      <div key={r} style={{ display: "flex", marginBottom: 4 }}>
                        <div style={{ width: 40, paddingRight: 8, textAlign: "right", fontFamily: font.mono, fontSize: 12, lineHeight: "40px", color: color.slate500, opacity: expand }}>
                          {r + 1}
                        </div>
                        {SHOW.seasons.map((s) => {
                          const e = s.episodes[r];
                          if (!e) return <div key={s.number} style={{ width: 40, height: 40, margin: "0 2px" }} />;
                          const band = bandFor(e.rating);
                          const p = shown(t.season(s.number) + r * 0.7, frame, 6);
                          const isTip = t.tooltip?.episode === e && frame >= t.tooltip.at && frame < t.tooltip.until;
                          return (
                            <div
                              key={s.number}
                              style={{
                                width: 40,
                                height: 40,
                                margin: "0 2px",
                                borderRadius: radius.md,
                                background: e.rating > 0 ? band.bg : UNRATED_BG,
                                color: band.fg,
                                fontFamily: font.mono,
                                fontSize: 12,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: Math.min(1, p * 2) * (e.votes >= MIN_RELIABLE_VOTES ? 1 : 0.45),
                                transform: `perspective(300px) rotateX(${(1 - p) * 90}deg) scale(${isTip ? 1.1 : 1})`,
                                position: "relative",
                                zIndex: isTip ? 20 : undefined,
                                boxShadow: isTip ? "0 0 0 2px #fff, 0 8px 20px rgba(0,0,0,0.5)" : undefined,
                              }}
                            >
                              {e.rating > 0 ? e.rating.toFixed(1) : ""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", opacity: expand }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          borderRadius: 999,
                          border: `1px solid ${color.slate600}`,
                          background: "rgba(29,41,61,0.9)",
                          padding: "6px 14px",
                          fontSize: 14,
                          fontWeight: 500,
                          color: color.slate200,
                        }}
                      >
                        Hide heatmap
                        <ChevronUp size={16} />
                      </div>
                    </div>
                  </div>
                )}

                {t.tooltip && frame >= t.tooltip.at && frame < t.tooltip.until && (() => {
                  const e = t.tooltip!.episode;
                  return (
                    <Tooltip
                      e={e}
                      x={40 + (e.season - 1) * 44 + 22}
                      y={24 + (e.episode - 1) * 44}
                      t={hit(frame, t.tooltip!.at, 5)}
                    />
                  );
                })()}
              </div>
            </>
          )}
        </div>

        {/* Top cast */}
        <div style={{ borderTop: `1px solid ${color.slate800}`, padding: "24px 32px" }}>
          <div style={{ marginTop: 8, marginBottom: 12, fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em", color: color.slate500 }}>Top cast</div>
          <div style={{ display: "flex", gap: 16 }}>
            {SHOW.cast.map((c) => (
              <div key={c.name} style={{ width: 112, flexShrink: 0 }}>
                <div style={{ width: 112, height: 168, marginBottom: 8, borderRadius: radius.lg, overflow: "hidden", background: color.slate800 }}>
                  {c.photo && <Img src={staticFile(c.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: color.slate200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: color.slate500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.character} · {c.episodes} eps
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasons & Episodes */}
        <div style={{ borderTop: `1px solid ${color.slate800}`, padding: 32, display: "flex", gap: 32 }}>
          <div style={{ width: 224 }}>
            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em", color: color.slate500 }}>Seasons</div>
            {SHOW.seasons.map((s, i) => (
              <div
                key={s.number}
                style={{
                  marginBottom: 8,
                  borderRadius: radius.lg,
                  padding: "8px 12px",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  justifyContent: "space-between",
                  background: i === 0 ? color.amber500 : "rgba(29,41,61,0.6)",
                  color: i === 0 ? color.slate950 : color.slate300,
                }}
              >
                Season {s.number}
                <span style={{ fontFamily: font.mono, fontSize: 12, opacity: 0.7 }}>{s.episodes.length}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em", color: color.slate500 }}>Episodes</div>
            {SHOW.seasons[0].episodes.slice(0, 3).map((e) => (
              <div key={e.episode} style={{ marginBottom: 12, height: 112, borderRadius: radius.lg, border: `1px solid ${color.slate800}`, background: "rgba(29,41,61,0.4)", padding: 12, display: "flex", gap: 16 }}>
                <div style={{ width: 176, height: 99, borderRadius: radius.md, background: color.slate900 }} />
                <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600, color: color.white }}>
                    <span style={{ color: color.slate500 }}>{e.episode}.</span> {e.name}
                  </div>
                  <span style={{ height: 20, borderRadius: 999, background: color.slate900, padding: "0 8px", fontSize: 12, fontWeight: 500, color: color.amber400 }}>{e.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Column>
  );
};
