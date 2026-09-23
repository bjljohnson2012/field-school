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
  RepairCard,
  TransitionLuma,
} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Name", startMs: 400, endMs: 800},
  {text: "the", startMs: 800, endMs: 1000},
  {text: "case", startMs: 1000, endMs: 1400},
  {text: "that", startMs: 1400, endMs: 1700},
  {text: "holds.", startMs: 1700, endMs: 2400},
];

/** Isolate the repair / case-that-holds after the counterexample foil. LessonSpine length is untouched. */
export const RepairCardDemo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Stack>
        <Layer name="bed">
          <Bed />
        </Layer>
        <Layer name="screen" />
        <Layer name="talking-head card">
          <HeadDock motion="glide" sceneFrame={frame} dock="dock-right" />
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
          <ProgressRail beat="recap" />
        </Layer>
        <Layer name="chapter">
          <ChapterChip beat="recap" />
        </Layer>
        <Layer name="callout">
          <CalloutCard beat="recap" />
        </Layer>
        <Layer name="transition">
          <TransitionLuma />
        </Layer>
        <Layer name="repair">
          <RepairCard />
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
