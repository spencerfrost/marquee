import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { clamp, color, font, hit } from "../theme";

/**
 * The captions that say what's happening on screen, in the open's headline
 * style. They sit in a fixed column on the left; app shots frame the laptop
 * to the right (see CAPTION_SHIFT) and a dark fade behind the column keeps
 * the text readable over it. Each caption slams in on `at` and gets out of
 * the way fast at `until`.
 */
export interface CaptionItem {
  at: number;
  until: number;
  /** White lead-in, then the amber part. Either can be empty. */
  text: [string, string];
  /**
   * A list that builds under the caption, one line at a time. The newest
   * line is amber and earlier ones turn white, so it reads like a checklist.
   */
  lines?: { at: number; text: string }[];
}

/** How far right app shots put the camera's focus, to clear the caption column. */
export const CAPTION_SHIFT = 290;

const Line: React.FC<{ item: CaptionItem; frame: number }> = ({ item, frame }) => {
  const t = hit(frame, item.at, 6);
  const out = interpolate(frame, [item.until - 4, item.until], [0, 1], clamp);
  if (frame < item.at || frame >= item.until) return null;
  const [lead, accent] = item.text;
  // With a list, pin the block's top so it doesn't drift as lines are added.
  const top = item.lines ? (lead || accent ? 300 : 380) : 540;
  const shown = (item.lines ?? []).filter((l) => frame >= l.at);
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top,
        width: 560,
        transform: `translateY(${item.lines ? 0 : -50}%) translateY(${-30 * out}px) scale(${1.5 - 0.5 * t})`,
        transformOrigin: "0 50%",
        opacity: Math.min(interpolate(frame, [item.at, item.at + 2], [0, 1], clamp), 1 - out),
        fontFamily: font.sans,
        fontWeight: 900,
        fontSize: 68,
        lineHeight: 1.02,
        letterSpacing: "-0.04em",
        color: color.white,
      }}
    >
      {lead}
      {lead && accent ? " " : ""}
      <span style={{ color: color.amber400 }}>{accent}</span>
      {shown.length > 0 && (
        <div style={{ marginTop: lead || accent ? 36 : 0, fontSize: lead || accent ? 56 : 68, lineHeight: 1.08 }}>
          {shown.map((l, i) => {
            const p = hit(frame, l.at, 6);
            const latest = i === shown.length - 1;
            return (
              <div
                key={l.text}
                style={{
                  color: latest ? color.amber400 : color.white,
                  opacity: interpolate(frame, [l.at, l.at + 2], [0, 1], clamp),
                  transform: `translateX(${(1 - p) * -40}px) scale(${1.25 - 0.25 * p})`,
                  transformOrigin: "0 50%",
                }}
              >
                {l.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Captions: React.FC<{ frame: number; items: CaptionItem[] }> = ({ frame, items }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        background: "linear-gradient(to right, rgba(2,6,24,0.94) 0%, rgba(2,6,24,0.88) 30%, rgba(2,6,24,0.4) 42%, transparent 52%)",
      }}
    />
    {items.map((item, i) => (
      <Line key={i} item={item} frame={frame} />
    ))}
  </AbsoluteFill>
);
