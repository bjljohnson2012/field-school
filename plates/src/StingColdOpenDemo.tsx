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
  StingColdOpen,
  TransitionLuma,
} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Start", startMs: 400, endMs: 900},
  {text: "on", startMs: 900, endMs: 1100},
  {text: "the", startMs: 1100, endMs: 1300},
  {text: "hook.", startMs: 1300, endMs: 2000},
];

/** Isolate the cold open / hook on the ORDER LOCK first beat. LessonSpine length is untouched. */
export const StingColdOpenDemo: React.FC = () => {
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
          <ProgressRail beat="sting" />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat="sting" />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat="sting" />
        </Layer>
        <Layer name="transition">
          <TransitionLuma />
        </Layer>
        <Layer name="cold-open">
          <StingColdOpen />
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
