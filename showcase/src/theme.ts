import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { Easing } from "remotion";

/**
 * Marquee's look. The app's shadcn CSS variables are the neutral defaults; the
 * real palette is Tailwind slate + amber in the component classes
 * (client/src/components/*.tsx), so these are Tailwind v4's values for them.
 */
export const color = {
  slate950: "#020618",
  slate900: "#0f172b",
  slate800: "#1d293d",
  slate700: "#314158",
  slate600: "#45556c",
  slate500: "#62748e",
  slate400: "#90a1b9",
  slate300: "#cad5e2",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  amber300: "#ffd236",
  amber400: "#ffb900",
  amber500: "#fe9a00",
  white: "#ffffff",
  /** The logo's ring colour (client/public/marquee-master.svg). */
  logoAmber: "#f59e0b",
  /** ScoreRing.tsx / MediaCard.tsx: >= 7, >= 4, below. */
  scoreHigh: "#4ADE80",
  scoreMid: "#FBBF24",
  scoreLow: "#F87171",
};

export const font = {
  sans: loadGeist("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"] }).fontFamily,
  /** The app's font-mono is the system stack (SF Mono on a Mac); Geist Mono stands in for it. */
  mono: loadGeistMono("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily,
};

/** The app's --radius (0.625rem) and Tailwind's rounded-xl on poster cards. */
export const radius = { md: 8, lg: 10, xl: 12 };

/** The sharp ease every zoom and entrance uses: fast out, hard settle. */
export const snap = Easing.bezier(0.6, 0, 0.15, 1);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const scoreColor = (score: number) =>
  score >= 7 ? color.scoreHigh : score >= 4 ? color.scoreMid : color.scoreLow;

/**
 * Piecewise tween through [frame, value] keys, each leg on the sharp ease.
 * Repeat a value to hold it.
 */
export const track = (frame: number, keys: [number, number][], ease: (t: number) => number = snap) => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (frame < t1) return v0 + (v1 - v0) * ease((frame - t0) / Math.max(1, t1 - t0));
  }
  return keys[keys.length - 1][1];
};

/** 0 → 1 over `len` frames from `at`, on the sharp ease. */
export const hit = (frame: number, at: number, len = 6) =>
  Math.min(1, Math.max(0, snap(Math.min(1, Math.max(0, (frame - at) / len)))));
