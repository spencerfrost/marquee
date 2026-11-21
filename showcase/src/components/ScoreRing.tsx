import React from "react";
import { scoreColor } from "../theme";

/**
 * client/src/components/ScoreRing.tsx, drawn at any size. `fill` (0–1) sweeps
 * the ring and counts the number up, so it can animate in.
 */
export const ScoreRing: React.FC<{ score: number; size?: number; fill?: number }> = ({ score, size = 38, fill = 1 }) => {
  const shown = Math.max(0, Math.min(10, score)) * fill;
  const radius = size / 2 - 3 * (size / 38);
  const stroke = 2.5 * (size / 38);
  const c = 2 * Math.PI * radius;
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }}>
      <circle cx={center} cy={center} r={radius} fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.12)" strokeWidth={2 * (size / 38)} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={scoreColor(score)}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - shown / 10)}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center + size * 0.03} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={size * 0.28} fontWeight={700}>
        {shown.toFixed(1)}
      </text>
    </svg>
  );
};
