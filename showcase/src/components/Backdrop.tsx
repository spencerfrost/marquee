import React from "react";
import { AbsoluteFill } from "remotion";
import { color } from "../theme";

/** BrowseLayout's page: slate-950 with the faint dotted texture. */
export const Backdrop: React.FC<{ glow?: number }> = ({ glow = 0.12 }) => (
  <AbsoluteFill style={{ background: color.slate950 }}>
    <AbsoluteFill
      style={{
        opacity: 0.05,
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }}
    />
    <AbsoluteFill
      style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(254,154,0,${glow}), transparent 60%)` }}
    />
  </AbsoluteFill>
);

/** A soft vignette over everything, so the frame edges sit back. */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))" }}
  />
);
