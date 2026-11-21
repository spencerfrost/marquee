import React from "react";
import { Img, staticFile } from "remotion";
import { Title } from "../titles";
import { color, font, radius } from "../theme";
import { ScoreRing } from "./ScoreRing";

/**
 * client/src/components/MediaCard.tsx: a 2:3 poster with the score ring top
 * left and the title and year over a dark bottom scrim. Sized by `width`;
 * everything inside scales with it from the app's ~200 px card.
 */
export const MediaCard: React.FC<{ item: Title; width: number; ring?: number; style?: React.CSSProperties }> = ({
  item,
  width,
  ring = 1,
  style,
}) => {
  const k = width / 200;
  return (
    <div
      style={{
        position: "relative",
        width,
        height: width * 1.5,
        borderRadius: radius.xl * k,
        overflow: "hidden",
        background: color.slate900,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.45)",
        flexShrink: 0,
        ...style,
      }}
    >
      <Img src={staticFile(item.poster)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          inset: "40% 0 0 0",
          background: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.55) 45%, transparent)",
        }}
      />
      <div style={{ position: "absolute", left: 10 * k, top: 10 * k }}>
        <ScoreRing score={item.rating} size={38 * k} fill={ring} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12 * k, fontFamily: font.sans }}>
        <div
          style={{
            fontSize: 14 * k,
            fontWeight: 600,
            lineHeight: 1.35,
            color: color.white,
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </div>
        <div style={{ marginTop: 4 * k, fontSize: 12 * k, fontWeight: 500, color: color.slate300 }}>{item.year || "Unknown year"}</div>
      </div>
    </div>
  );
};
