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
  StepsCard,
  TransitionLuma,
} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Do", startMs: 400, endMs: 800},
  {text: "this", startMs: 800, endMs: 1100},
  {text: "in", startMs: 1100, endMs: 1300},
  {text: "order.", startMs: 1300, endMs: 2200},
];

/** Isolate the numbered procedure / do-this-in-order after Recap before Quiz. LessonSpine length is untouched. */
export const StepsCardDemo: React.FC = () => {
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
        <Layer name="steps">
          <StepsCard />
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
