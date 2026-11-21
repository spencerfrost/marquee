import React from "react";
import { Composition } from "remotion";
import { evenBeats } from "./beats";
import { FPS, SHOWCASE_FRAMES, Showcase } from "./Showcase";
import { CLOSE_SHOT_BEATS, CloseShot } from "./shots/CloseShot";
import { DETAIL_SHOT_BEATS, DetailShot } from "./shots/DetailShot";
import { DISCOVER_SHOT_BEATS, DiscoverShot } from "./shots/DiscoverShot";
import { HEATMAP_SHOT_BEATS, HeatmapShot } from "./shots/HeatmapShot";
import { HOME_SHOT_BEATS, HomeShot } from "./shots/HomeShot";
import { OPEN_SHOT_BEATS, OpenShot } from "./shots/OpenShot";

const SIZE = { fps: FPS, width: 1920, height: 1080 } as const;
/** A shot rendered on its own runs on evenly spaced beats at the song's tempo. */
const beatsLong = (n: number) => evenBeats(FPS)[n];

export const Root: React.FC = () => (
  <>
    <Composition id="Showcase" component={Showcase} durationInFrames={SHOWCASE_FRAMES} {...SIZE} />
    <Composition id="OpenShot" component={OpenShot} durationInFrames={beatsLong(OPEN_SHOT_BEATS)} {...SIZE} />
    <Composition id="HomeShot" component={HomeShot} durationInFrames={beatsLong(HOME_SHOT_BEATS)} {...SIZE} />
    <Composition id="DiscoverShot" component={DiscoverShot} durationInFrames={beatsLong(DISCOVER_SHOT_BEATS)} {...SIZE} />
    <Composition id="DetailShot" component={DetailShot} durationInFrames={beatsLong(DETAIL_SHOT_BEATS)} {...SIZE} />
    <Composition id="HeatmapShot" component={HeatmapShot} durationInFrames={beatsLong(HEATMAP_SHOT_BEATS)} {...SIZE} />
    <Composition id="CloseShot" component={CloseShot} durationInFrames={beatsLong(CLOSE_SHOT_BEATS)} {...SIZE} />
  </>
);
