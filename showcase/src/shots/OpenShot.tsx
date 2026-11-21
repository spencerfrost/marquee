import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BeatFrames, evenBeats } from "../beats";
import { Backdrop, Vignette } from "../components/Backdrop";
import { Logo } from "../components/Logo";
import { clamp, color, font, snap } from "../theme";
import { ALL_TITLES } from "../titles";

/**
 * The open, from the intro riff's second pass (song beat 8): a tilted wall of
 * real posters racing past. "Browse movies," / "shows and cast." / "None of
 * the clutter." slam in two beats apart, on 0, 2 and 4. On 8 the groove stops: the wall and headline punch away
 * past the camera and the logo slams in, its ring fills across the swoop
 * over 10–13 and holds a beat, "Marquee" lands on 11, and it cuts to home on 14.
 */
export const OPEN_SHOT_BEATS = 14;

const COLS = 13;
const CARD_W = 230;
const CARD_H = CARD_W * 1.5;
const GAP = 22;
const PER_COL = 7;
/** The wall is a square centred on the frame, big enough to cover it at any tilt. */
const WALL = 3000;

const PosterWall: React.FC<{ frame: number }> = ({ frame }) => {
  const loop = PER_COL * (CARD_H + GAP);
  return (
    <div
      style={{
        position: "absolute",
        left: 960 - WALL / 2,
        top: 540 - WALL / 2,
        width: WALL,
        height: WALL,
        display: "flex",
        justifyContent: "center",
        gap: GAP,
        overflow: "hidden",
        transform: "rotate(-14deg)",
      }}
    >
      {Array.from({ length: COLS }, (_, c) => {
        const dir = c % 2 ? 1 : -1;
        const y = (((frame * 9 * dir + c * 140) % loop) + loop) % loop;
        return (
          <div key={c} style={{ display: "flex", flexDirection: "column", gap: GAP, flexShrink: 0, transform: `translateY(${y - loop}px)` }}>
            {Array.from({ length: PER_COL * 2 + 2 }, (_, r) => {
              const t = ALL_TITLES[(c * PER_COL + (r % PER_COL)) % ALL_TITLES.length];
              return (
                <Img
                  key={r}
                  src={staticFile(t.poster)}
                  style={{ width: CARD_W, height: CARD_H, borderRadius: 14, objectFit: "cover", boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** A line that slams down from oversize onto its beat. */
const slam = (frame: number, at: number): React.CSSProperties => {
  const t = interpolate(frame, [at, at + 6], [0, 1], { ...clamp, easing: snap });
  return { opacity: interpolate(frame, [at, at + 2], [0, 1], clamp), transform: `scale(${2.2 - 1.2 * t})` };
};

/** 0 → 1 over a few frames from `at`, on the sharp ease. */
const hit = (frame: number, at: number, len = 6) => interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: snap });

const headline: React.CSSProperties = { fontFamily: font.sans, fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 0.9, whiteSpace: "nowrap" };

export const OpenShot: React.FC<{ beats?: BeatFrames }> = ({ beats = evenBeats() }) => {
  const frame = useCurrentFrame();
  const b = beats;

  const out = interpolate(frame, [b[8] - 3, b[8] + 4], [0, 1], { ...clamp, easing: snap });
  // The wall dims under the headline; both punch out past the camera together on 8.
  const wallOpacity = interpolate(frame, [b[0], b[0] + 4], [0.8, 0.35], clamp);

  const logoIn = hit(frame, b[8], 7);
  // The ring fills across the swoop over three beats, then the full logo holds for one.
  const ring = interpolate(frame, [b[10], b[13]], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const letter = interpolate(frame, [b[8] + 2, b[8] + 8], [0, 1], { ...clamp, easing: snap });
  const word = hit(frame, b[11]);
  const flash = interpolate(frame, [b[8] - 1, b[8], b[8] + 8], [0, 0.4, 0], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop glow={0.08 + 0.12 * logoIn} />

      <AbsoluteFill style={{ transform: `scale(${1 + out * 1.6})`, opacity: 1 - out }}>
        <AbsoluteFill style={{ opacity: wallOpacity }}>
          <PosterWall frame={frame} />
        </AbsoluteFill>

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...headline, fontSize: 130, lineHeight: 1.02, letterSpacing: -4, textAlign: "center" }}>
            <div style={{ color: color.white, ...slam(frame, b[0]) }}>Browse movies,</div>
            <div style={{ color: color.white, ...slam(frame, b[2]) }}>shows and cast.</div>
            <div style={{ color: color.amber400, ...slam(frame, b[4]) }}>None of the clutter.</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Logo */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: logoIn }}>
        <div style={{ transform: `scale(${1.8 - 0.8 * logoIn}) translateY(${-60 * word}px)` }}>
          <div style={{ filter: `drop-shadow(0 0 ${60 * logoIn}px rgba(245,158,11,0.35))` }}>
            <Logo size={300} ring={ring} letter={letter} />
          </div>
        </div>
        <div
          style={{
            ...headline,
            position: "absolute",
            top: 720,
            fontSize: 120,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: color.slate100,
            opacity: word,
            transform: `translateY(${(1 - word) * 40}px)`,
          }}
        >
          Marquee
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: color.white, opacity: flash, pointerEvents: "none" }} />
      <Vignette />
    </AbsoluteFill>
  );
};
