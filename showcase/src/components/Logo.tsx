import React from "react";
import { color, font } from "../theme";

/**
 * client/public/marquee-master.svg rebuilt so it can animate: `ring` (0–1)
 * sweeps the amber arc to its 75 %, `letter` (0–1) brings in the M.
 */
export const Logo: React.FC<{ size?: number; ring?: number; letter?: number }> = ({ size = 512, ring = 1, letter = 1 }) => {
  const c = 2 * Math.PI * 170;
  const arc = 801 * ring;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512">
      <rect width="512" height="512" rx="100" fill={color.slate900} />
      <circle cx="256" cy="256" r="170" fill="none" stroke={color.slate800} strokeWidth="44" />
      <circle
        cx="256"
        cy="256"
        r="170"
        fill="none"
        stroke={color.logoAmber}
        strokeWidth="44"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${c}`}
        opacity={ring > 0.001 ? 1 : 0}
        transform="rotate(-90 256 256)"
      />
      <text
        x="256"
        y="300"
        textAnchor="middle"
        fontFamily={font.sans}
        fontSize="190"
        fontWeight="900"
        fill={color.white}
        opacity={letter}
        transform={`translate(256 256) scale(${0.6 + 0.4 * letter}) translate(-256 -256)`}
      >
        M
      </text>
    </svg>
  );
};
