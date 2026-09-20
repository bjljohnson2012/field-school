import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cream, LOCK} from "./brand";
import {
  AudioBed,
  Bed,
  CalloutCard,
  CaptionsBand,
  ChapterChip,
  HeadDock,
  Letterbox,
  LowerThird,
  OverlayLock,
  ProgressRail,
  PROGRESS_RAIL_BEATS,
  TransitionLuma,
} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Wipe", startMs: 400, endMs: 800},
  {text: "names", startMs: 800, endMs: 1200},
  {text: "the", startMs: 1200, endMs: 1400},
  {text: "beat.", startMs: 1400, endMs: 2000},
];

/** Isolate the beat-to-beat wipe after callout. LessonSpine order is untouched. */
export const TransitionLumaDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = PROGRESS_RAIL_BEATS[Math.min(4, Math.floor(frame / 48))];
  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen" />
        <Layer name="talking-head card">
          <HeadDock motion="takeover" sceneFrame={frame} dock="dock-right" />
        </Layer>
        <Layer name="lower third">
          <LowerThird name="Teacher" role="Operator" />
        </Layer>
        <Layer name="captions">
          <CaptionsBand captions={DEMO_CAPTIONS} />
        </Layer>
        <Layer name="letterbox">
          <Letterbox />
        </Layer>
        <Layer name="progress">
          <ProgressRail beat={beat} />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat={beat} />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat={beat} />
        </Layer>
        <Layer name="transition">
          <TransitionLuma />
        </Layer>
        <Layer name="audio">
          <AudioBed />
        </Layer>
      </Stack>
      <OverlayLock
        overlay={{title: LOCK.title, x: LOCK.x, y: LOCK.y, w: LOCK.w, h: LOCK.h}}
      />
    </AbsoluteFill>
  );
};
