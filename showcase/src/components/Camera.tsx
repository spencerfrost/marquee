import React from "react";
import { AbsoluteFill } from "remotion";
import { track } from "../theme";

/** A camera framing: the stage point at the centre of the frame, and the zoom. */
export interface Cam {
  x: number;
  y: number;
  z: number;
}

/** The whole frame, unzoomed. */
export const WIDE: Cam = { x: 960, y: 540, z: 1 };

/** Where the laptop's screen starts on stage when it sits at rest (centred, scale 1). */
export const SCREEN_X = 240;
export const SCREEN_Y = 90;

/** A framing centred on a point of the laptop screen (screen pixels). */
export const onScreen = (sx: number, sy: number, z: number): Cam => ({ x: SCREEN_X + sx, y: SCREEN_Y + sy, z });

/** Tween a camera through [frame, framing] keys on the sharp ease. */
export const camAt = (frame: number, keys: [number, Cam][]): Cam => ({
  x: track(frame, keys.map(([f, c]) => [f, c.x])),
  y: track(frame, keys.map(([f, c]) => [f, c.y])),
  z: track(frame, keys.map(([f, c]) => [f, c.z])),
});

/**
 * Frames its children so `cam` sits at the centre of the frame at `cam.z`,
 * or `shift` pixels right of it (to leave room for a caption on the left).
 */
export const Camera: React.FC<{ cam: Cam; shift?: number; children: React.ReactNode }> = ({ cam, shift = 0, children }) => (
  <AbsoluteFill
    style={{
      transformOrigin: "0 0",
      transform: `translate(${960 + shift - cam.x * cam.z}px, ${540 - cam.y * cam.z}px) scale(${cam.z})`,
    }}
  >
    {children}
  </AbsoluteFill>
);
