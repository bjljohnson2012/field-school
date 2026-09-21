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
  KeyClaim,
  Letterbox,
  LowerThird,
  OverlayLock,
  ProgressRail,
  TransitionLuma,
} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Lock", startMs: 400, endMs: 800},
  {text: "one", startMs: 800, endMs: 1200},
  {text: "claim.", startMs: 1200, endMs: 2000},
];

/** Isolate the thesis / claim lock after sting/objective path. LessonSpine length is untouched. */
export const KeyClaimDemo: React.FC = () => {
  const frame = useCurrentFrame();
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
          <ProgressRail beat="objective" />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat="objective" />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat="objective" />
        </Layer>
        <Layer name="transition">
          <TransitionLuma />
        </Layer>
        <Layer name="claim">
          <KeyClaim />
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
