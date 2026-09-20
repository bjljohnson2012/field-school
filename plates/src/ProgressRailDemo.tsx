import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cream, LOCK} from "./brand";
import {
  AudioBed,
  Bed,
  CaptionsBand,
  HeadDock,
  Letterbox,
  LowerThird,
  OverlayLock,
  ProgressRail,
  PROGRESS_RAIL_BEATS,
} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Progress", startMs: 400, endMs: 900},
  {text: "marks", startMs: 900, endMs: 1200},
  {text: "the", startMs: 1200, endMs: 1400},
  {text: "beat.", startMs: 1400, endMs: 2000},
];

/** Isolate the progress rail after letterbox. LessonSpine order is untouched. */
export const ProgressRailDemo: React.FC = () => {
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
