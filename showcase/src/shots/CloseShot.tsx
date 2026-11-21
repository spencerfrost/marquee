import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BeatFrames, evenBeats } from "../beats";
import { HOST } from "../components/AppUI";
import { Backdrop, Vignette } from "../components/Backdrop";
import { Logo } from "../components/Logo";
import { clamp, color, font, hit, snap } from "../theme";

/**
 * The sign-off. The logo slams in and its ring sweeps round
 * (0), "Marquee" lands (1), "None of the clutter." comes back from the open
 * (2) and the live site's address lands (4). It holds, then everything fades
 * with the music over the last three beats.
 */
export const CLOSE_SHOT_BEATS = 12;

export const CloseShot: React.FC<{ beats?: BeatFrames }> = ({ beats = evenBeats() }) => {
  const frame = useCurrentFrame();
  const b = beats;

  const logoIn = hit(frame, b[0], 7);
  const ring = interpolate(frame, [b[0] + 2, b[1]], [0, 1], { ...clamp, easing: snap });
  const letter = interpolate(frame, [b[0] + 2, b[0] + 8], [0, 1], { ...clamp, easing: snap });
  const word = hit(frame, b[1]);
  const tag = hit(frame, b[2], 6);
  const link = hit(frame, b[4], 6);
  // A slow push across the hold, so the last beats aren't a freeze.
  const drift = interpolate(frame, [b[2], b[12]], [1, 1.05], clamp);
  const fade = interpolate(frame, [b[9], b[12]], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: font.sans }}>
      <Backdrop glow={0.2 * logoIn} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fade, transform: `scale(${drift})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 48, transform: `translateY(${-70 * tag}px)` }}>
          <div style={{ opacity: logoIn, transform: `scale(${1.8 - 0.8 * logoIn})`, filter: `drop-shadow(0 0 ${60 * logoIn}px rgba(245,158,11,0.35))` }}>
            <Logo size={220} ring={ring} letter={letter} />
          </div>
          <div
            style={{
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: color.slate100,
              opacity: word,
              transform: `translateX(${(1 - word) * -60}px)`,
              width: 650 * word,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            Marquee
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 640,
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.045em",
            color: color.amber400,
            opacity: interpolate(frame, [b[2], b[2] + 2], [0, 1], clamp),
            transform: `scale(${2.2 - 1.2 * tag})`,
          }}
        >
          None of the clutter.
        </div>
        <div
          style={{
            position: "absolute",
            top: 780,
            padding: "14px 28px",
            borderRadius: 999,
            border: "1px solid rgba(254,154,0,0.4)",
            background: "rgba(254,154,0,0.1)",
            fontSize: 36,
            fontWeight: 500,
            color: color.slate200,
            opacity: link,
            transform: `translateY(${(1 - link) * 30}px)`,
          }}
        >
          {HOST}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};
