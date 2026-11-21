import React from "react";
import { Img, staticFile } from "remotion";
import { Hit } from "../data";
import { color, font, radius } from "../theme";

/**
 * Marquee's browse chrome, redrawn from client/src/components (SiteHeader,
 * OmniSearch, SearchResultsPage's HitCard, the filter chips). Sizes are the
 * app's Tailwind sizes in CSS pixels; the laptop screen is 1440 × 900.
 */

export const SCREEN_W = 1440;
export const SCREEN_H = 900;
/** The browser's toolbar at the top of the screen. */
export const BAR_H = 44;
/** The live site's address. */
export const HOST = "marquee.mrspinn.ca";
/** max-w-7xl (1280) with px-6, centred: the content column's left edge and width. */
export const COL_W = 1232;
export const colX = (zoom = 1) => (SCREEN_W / zoom - 1280) / 2 + 24;

// --- Icons (lucide, 24-unit paths) ---------------------------------------------

const Icon: React.FC<{ size?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  size = 16,
  color: stroke = "currentColor",
  children,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
    {children}
  </svg>
);
export const SearchIcon: React.FC<{ size?: number; color?: string }> = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);
export const ChevronDown: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = (p) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
export const ChevronUp: React.FC<{ size?: number; color?: string }> = (p) => (
  <Icon {...p}>
    <path d="m18 15-6-6-6 6" />
  </Icon>
);
export const GridIcon: React.FC<{ size?: number; color?: string }> = (p) => (
  <Icon {...p}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </Icon>
);
export const XIcon: React.FC<{ size?: number; color?: string }> = (p) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
export const UserIcon: React.FC<{ size?: number; color?: string }> = (p) => (
  <Icon {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

// --- Browser and page -----------------------------------------------------------

/** A plain browser toolbar: window dots and the address bar. */
export const BrowserBar: React.FC<{ path: string; highlight?: number }> = ({ path, highlight = 0 }) => (
  <div
    style={{
      position: "absolute",
      inset: "0 0 auto 0",
      height: BAR_H,
      background: "#11141b",
      borderBottom: "1px solid #1f2430",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 16px",
      zIndex: 50,
    }}
  >
    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
      <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
    ))}
    {/* Back and forward */}
    <div style={{ marginLeft: 12, display: "flex", gap: 8 }}>
      {["m15 18-6-6 6-6", "m9 18 6-6-6-6"].map((d, i) => (
        <svg key={d} width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={i === 0 ? color.slate300 : color.slate600} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={d} />
        </svg>
      ))}
    </div>
    <div
      style={{
        marginLeft: 12,
        flex: 1,
        marginRight: 120,
        height: 28,
        borderRadius: 8,
        background: "#070910",
        border: `1px solid rgba(254,154,0,${0.6 * highlight})`,
        boxShadow: `0 0 0 ${3 * highlight}px rgba(254,154,0,${0.3 * highlight})`,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        fontFamily: font.sans,
        fontSize: 13,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span style={{ color: color.slate500 }}>{HOST}</span>
      <span style={{ color: color.slate200 }}>{path}</span>
    </div>
  </div>
);

/** The browser's back button, in screen pixels. */
export const BROWSER_BACK = { x: 16 + 3 * 12 + 2 * 8 + 8 + 12 + 10, y: BAR_H / 2 };

/**
 * The laptop's screen: the browser bar over a BrowseLayout-style page.
 * `scroll` is in page pixels; `zoom` is the browser's zoom level.
 */
export const Page: React.FC<{ path: string; scroll?: number; zoom?: number; barHighlight?: number; children: React.ReactNode; overlay?: React.ReactNode }> = ({
  path,
  scroll = 0,
  zoom = 1,
  barHighlight,
  children,
  overlay,
}) => (
  <div style={{ position: "absolute", inset: 0, background: color.slate950, overflow: "hidden", fontFamily: font.sans }}>
    <BrowserBar path={path} highlight={barHighlight} />
    <div style={{ position: "absolute", top: BAR_H, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN_W / zoom, transformOrigin: "0 0", transform: `scale(${zoom}) translateY(${-scroll}px)` }}>
        {children}
      </div>
      {overlay}
    </div>
  </div>
);

/** The centred max-w-7xl column (BrowseLayout's pt-6 / DetailContainer's py-6). */
export const Column: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "relative", width: 1280, margin: "0 auto", padding: "24px 24px 64px" }}>{children}</div>
);

// --- Site header --------------------------------------------------------------

const NavItem: React.FC<{ label: string; active: number }> = ({ label, active }) => (
  <div
    style={{
      borderRadius: radius.md,
      padding: "6px 12px",
      fontSize: 14,
      lineHeight: "20px",
      fontWeight: 500,
      background: `rgba(29,41,61,${active})`,
      color: active > 0.5 ? color.amber400 : color.slate400,
    }}
  >
    {label}
  </div>
);

/** OmniSearch's input. `focus` (0–1) lights the amber focus ring. */
export const SearchBox: React.FC<{ query?: string; focus?: number; caret?: boolean }> = ({ query = "", focus = 0, caret = false }) => (
  <div
    style={{
      position: "relative",
      width: 448,
      height: 38,
      borderRadius: radius.lg,
      border: `1px solid ${focus > 0.5 ? "rgba(254,154,0,0.6)" : color.slate700}`,
      background: "rgba(29,41,61,0.8)",
      boxShadow: `0 0 0 ${2 * focus}px rgba(254,154,0,${0.4 * focus})`,
      display: "flex",
      alignItems: "center",
      paddingLeft: 36,
      fontSize: 14,
    }}
  >
    <div style={{ position: "absolute", left: 12, top: 10, display: "flex" }}>
      <SearchIcon color={color.slate500} />
    </div>
    {query ? <span style={{ color: color.slate100 }}>{query}</span> : <span style={{ color: color.slate500 }}>Search people, movies, TV...</span>}
    {caret && <div style={{ width: 1.5, height: 18, background: color.slate100, marginLeft: query ? 1 : -186 }} />}
  </div>
);

/**
 * SiteHeader. `home` / `discover` (0–1) are each nav link's active state.
 */
export const SiteHeader: React.FC<{ home?: number; discover?: number; query?: string; focus?: number; caret?: boolean }> = ({
  home = 0,
  discover = 0,
  query,
  focus,
  caret,
}) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, height: 64 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em", color: color.slate100 }}>
        <Img src={staticFile("logo512.png")} style={{ width: 64, height: 64 }} />
        Marquee
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <NavItem label="Home" active={home} />
        <NavItem label="Discover" active={discover} />
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <SearchBox query={query} focus={focus} caret={caret} />
      <div
        style={{
          width: 144,
          height: 36,
          borderRadius: radius.lg,
          border: `1px solid ${color.slate700}`,
          background: "rgba(29,41,61,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px 0 12px",
          fontSize: 14,
          color: color.slate100,
        }}
      >
        Canada
        <ChevronDown size={16} color={color.slate500} />
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.lg,
          border: `1px solid ${color.slate700}`,
          background: "rgba(29,41,61,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 8, background: color.slate600, opacity: 0.6 }} />
      </div>
    </div>
  </div>
);

/** Header search box centre, in page pixels (zoom 1). */
export const SEARCH_BOX_CENTER = { x: colX() + COL_W - 32 - 12 - 144 - 12 - 224, y: 24 + 32 };
/** The Discover nav link's centre, in page pixels (zoom 1). */
export const DISCOVER_NAV_CENTER = { x: colX() + 64 + 8 + 107 + 24 + 69 + 4 + 46, y: 24 + 32 };

// --- Bits ----------------------------------------------------------------------

/** The section label style: text-xs uppercase tracking-wide slate-500. */
export const label: React.CSSProperties = {
  fontSize: 12,
  lineHeight: "16px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.025em",
  color: color.slate500,
};

/** The amber toggle chips (genre match, monetization, TV type). */
export const ToggleChip: React.FC<{ active: number; children: React.ReactNode; small?: boolean }> = ({ active, children, small }) => (
  <div
    style={{
      borderRadius: 999,
      border: `1px solid ${active > 0.5 ? "rgba(254,154,0,0.6)" : color.slate700}`,
      background: `rgba(254,154,0,${0.2 * active})`,
      color: active > 0.5 ? color.amber400 : color.slate300,
      padding: small ? "2px 10px" : "4px 12px",
      fontSize: 12,
      lineHeight: "16px",
      fontWeight: 500,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

/** MetadataLinks' chip (genres, networks, keywords). `hot` (0–1) is its hover state. */
export const LinkChip: React.FC<{ children: React.ReactNode; hot?: number; style?: React.CSSProperties }> = ({ children, hot = 0, style }) => (
  <div
    style={{
      borderRadius: 999,
      border: `1px solid ${hot > 0.5 ? "rgba(254,154,0,0.6)" : color.slate700}`,
      background: "rgba(29,41,61,0.6)",
      color: hot > 0.5 ? color.amber400 : color.slate300,
      padding: "4px 12px",
      fontSize: 12,
      lineHeight: "16px",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** SearchResultsPage's HitCard: a poster (or profile photo) with the name and year / department under it. */
export const HitCard: React.FC<{ hit: Hit; width: number; style?: React.CSSProperties }> = ({ hit, width, style }) => (
  <div style={{ width, display: "flex", flexDirection: "column", gap: 8, ...style }}>
    <div
      style={{
        width,
        height: width * 1.5,
        borderRadius: radius.lg,
        overflow: "hidden",
        background: color.slate800,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {hit.poster ? (
        <Img src={staticFile(hit.poster)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : hit.kind === "person" ? (
        <UserIcon size={32} color={color.slate600} />
      ) : (
        <span style={{ padding: 8, textAlign: "center", fontSize: 12, color: color.slate500 }}>{hit.title}</span>
      )}
    </div>
    <div>
      <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: color.slate200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {hit.title}
      </div>
      <div style={{ fontSize: 12, lineHeight: "16px", color: color.slate500 }}>{hit.sub}</div>
    </div>
  </div>
);
