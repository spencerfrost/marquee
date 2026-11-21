import React from "react";
import { color } from "../theme";

/** The laptop screen's size; screen content is laid out in these units (the app's max-w-7xl column fits). */
export const LAPTOP_SCREEN_W = 1440;
export const LAPTOP_SCREEN_H = 900;
const BEZEL = 22;
const W = LAPTOP_SCREEN_W + BEZEL * 2;
const H = LAPTOP_SCREEN_H + BEZEL * 2;

interface LaptopProps {
  /** Centre of the screen in stage pixels. */
  cx?: number;
  cy?: number;
  scale?: number;
  rotateX?: number;
  opacity?: number;
  glow?: number;
  children: React.ReactNode;
}

/** A plain laptop (lid and a sliver of base), positioned by the centre of its screen. */
export const Laptop: React.FC<LaptopProps> = ({ cx = 960, cy = 540, scale = 1, rotateX = 0, opacity = 1, glow = 0, children }) => (
  <div
    style={{
      position: "absolute",
      left: cx - W / 2,
      top: cy - H / 2,
      width: W,
      opacity,
      transform: `perspective(2400px) scale(${scale}) rotateX(${rotateX}deg)`,
      transformOrigin: "50% 50%",
    }}
  >
    <div
      style={{
        width: W,
        height: H,
        padding: BEZEL,
        borderRadius: 28,
        background: "#0b0d12",
        boxShadow: [
          "0 0 0 2px #262a33",
          "0 60px 120px rgba(0,0,0,0.7)",
          `0 0 ${80 + glow * 120}px rgba(254,154,0,${0.08 + glow * 0.3})`,
        ].join(", "),
      }}
    >
      <div
        style={{
          position: "relative",
          width: LAPTOP_SCREEN_W,
          height: LAPTOP_SCREEN_H,
          borderRadius: 6,
          overflow: "hidden",
          background: color.slate950,
        }}
      >
        {children}
      </div>
    </div>
    <div
      style={{
        margin: "0 auto",
        width: W + 160,
        marginLeft: -80,
        height: 26,
        borderRadius: "0 0 22px 22px",
        background: "linear-gradient(#2a2e37, #15171c)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
      }}
    />
  </div>
);
