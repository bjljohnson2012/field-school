import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cream, LOCK} from "./brand";
import {AudioBed, Bed, CaptionsBand, HeadDock, Letterbox, LowerThird, OverlayLock} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Lock", startMs: 400, endMs: 900},
  {text: "holds", startMs: 900, endMs: 1300},
  {text: "the", startMs: 1300, endMs: 1500},
  {text: "seal.", startMs: 1500, endMs: 2200},
];

/** Isolate logo+title lock. LessonSpine order is untouched. */
export const OverlayLockDemo: React.FC = () => {
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
