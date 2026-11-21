import React from "react";
import { interpolate } from "remotion";
import { clamp, track } from "../theme";

/**
 * A pointer drawn in screen pixels (so it zooms with the camera). It glides
 * through [frame, x, y] keys and clicks on each frame in `clicks`: a quick
 * press and an amber ripple.
 */
export const Cursor: React.FC<{ frame: number; path: [number, number, number][]; clicks?: number[]; opacity?: number }> = ({
  frame,
  path,
  clicks = [],
  opacity = 1,
}) => {
  const x = track(frame, path.map(([f, px]) => [f, px]));
  const y = track(frame, path.map(([f, , py]) => [f, py]));
  const last = clicks.filter((c) => c <= frame).pop();
  const since = last === undefined ? 99 : frame - last;
  const press = interpolate(since, [0, 2, 6], [0.8, 0.8, 1], clamp);
  const ring = interpolate(since, [0, 10], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none", zIndex: 100 }}>
      {since < 12 && (
        <div
          style={{
            position: "absolute",
            left: -26,
            top: -26,
            width: 52,
            height: 52,
            borderRadius: 26,
            border: "3px solid rgba(255,185,0,0.9)",
            transform: `scale(${0.3 + ring * 0.9})`,
            opacity: 1 - ring,
          }}
        />
      )}
      <svg width={26} height={32} viewBox="0 0 26 32" style={{ transform: `scale(${press})`, transformOrigin: "2px 2px", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.6))" }}>
        <path d="M2 2 L2 26 L8.5 20 L13 30 L17 28.2 L12.6 18.6 L21.5 18.6 Z" fill="white" stroke="#0b0d12" strokeWidth={1.8} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
