import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import { BEATS, beatFramesFrom } from "./beats";
import { CLOSE_SHOT_BEATS, CloseShot } from "./shots/CloseShot";
import { DETAIL_SHOT_BEATS, DetailShot } from "./shots/DetailShot";
import { DISCOVER_SHOT_BEATS, DiscoverShot } from "./shots/DiscoverShot";
import { HEATMAP_SHOT_BEATS, HeatmapShot } from "./shots/HeatmapShot";
import { HOME_SHOT_BEATS, HomeShot } from "./shots/HomeShot";
import { OPEN_SHOT_BEATS, OpenShot } from "./shots/OpenShot";

export const FPS = 30;

/**
 * The soundtrack file in public/audio/ (git-ignored), or null to render silent.
 */
const SOUNDTRACK: string | null = "audio/ruff-money.mp3";

/**
 * The whole video runs on the soundtrack's beat grid ("Ruff Money", ~99 bpm,
 * downbeats on every 4th beat from beat 0). The intro riff repeats every 8
 * beats, so the video starts on its second pass (beat 8) to get to the logo
 * fast. Each shot follows the last, so every cut lands on a beat:
 *   8–15  intro stabs (hits on 8, 10, 13)            → open: headline
 *   16–19 the groove stops, a rising swoop on 18     → open: logo
 *   20    the groove kicks in                        → home
 * After that the shots just run as long as they need: discover, detail,
 * heatmap, close. The music fades over the close's last three beats.
 * Order follows the app: home, discover, a detail page, its heatmap.
 * Captions (src/components/Caption.tsx) say what each action is.
 */
const OPEN_BEAT = 8;
const HOME_BEAT = OPEN_BEAT + OPEN_SHOT_BEATS;
const DISCOVER_BEAT = HOME_BEAT + HOME_SHOT_BEATS;
const DETAIL_BEAT = DISCOVER_BEAT + DISCOVER_SHOT_BEATS;
const HEATMAP_BEAT = DETAIL_BEAT + DETAIL_SHOT_BEATS;
const CLOSE_BEAT = HEATMAP_BEAT + HEATMAP_SHOT_BEATS;

/** Where in the song the video starts, in frames (the audio's trim). */
const SONG_TRIM_FRAMES = Math.round(BEATS[OPEN_BEAT] * FPS);
const VIDEO_START = SONG_TRIM_FRAMES / FPS;
/** Video frame of a song beat. */
const atBeat = (beat: number) => Math.round((BEATS[beat] - VIDEO_START) * FPS);

const span = (beat: number, beats: number) => ({ from: atBeat(beat), to: atBeat(beat + beats), beat });
const SHOTS = {
  open: span(OPEN_BEAT, OPEN_SHOT_BEATS),
  home: span(HOME_BEAT, HOME_SHOT_BEATS),
  discover: span(DISCOVER_BEAT, DISCOVER_SHOT_BEATS),
  detail: span(DETAIL_BEAT, DETAIL_SHOT_BEATS),
  heatmap: span(HEATMAP_BEAT, HEATMAP_SHOT_BEATS),
  close: span(CLOSE_BEAT, CLOSE_SHOT_BEATS),
};
export const SHOWCASE_FRAMES = SHOTS.close.to;

/** A shot's beats as frames from its own start. */
const beatsOf = (shot: { from: number; beat: number }) => beatFramesFrom(shot.beat, shot.from, VIDEO_START, FPS);

/** The song fades out over the close card's last three beats. */
const FADE_FROM = atBeat(CLOSE_BEAT + CLOSE_SHOT_BEATS - 3);
const volume = (f: number) =>
  interpolate(f, [0, 2, FADE_FROM, SHOWCASE_FRAMES], [0, 0.9, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Shot: React.FC<{ span: { from: number; to: number }; children: React.ReactNode }> = ({ span, children }) => (
  <Sequence from={span.from} durationInFrames={span.to - span.from}>
    {children}
  </Sequence>
);

export const Showcase: React.FC = () => (
  <>
    {SOUNDTRACK && <Audio src={staticFile(SOUNDTRACK)} trimBefore={SONG_TRIM_FRAMES} volume={volume} />}
    <Shot span={SHOTS.open}><OpenShot beats={beatsOf(SHOTS.open)} /></Shot>
    <Shot span={SHOTS.home}><HomeShot beats={beatsOf(SHOTS.home)} /></Shot>
    <Shot span={SHOTS.discover}><DiscoverShot beats={beatsOf(SHOTS.discover)} /></Shot>
    <Shot span={SHOTS.detail}><DetailShot beats={beatsOf(SHOTS.detail)} /></Shot>
    <Shot span={SHOTS.heatmap}><HeatmapShot beats={beatsOf(SHOTS.heatmap)} /></Shot>
    <Shot span={SHOTS.close}><CloseShot beats={beatsOf(SHOTS.close)} /></Shot>
  </>
);
