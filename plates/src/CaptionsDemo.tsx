import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cream, LOCK} from "./brand";
import {AudioBed, Bed, CaptionsBand, HeadDock, Letterbox, LowerThird, OverlayLock} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Type", startMs: 400, endMs: 800},
  {text: "keeps", startMs: 800, endMs: 1200},
  {text: "the", startMs: 1200, endMs: 1400},
  {text: "left.", startMs: 1400, endMs: 2000},
  {text: "Head", startMs: 2400, endMs: 2800},
  {text: "stays", startMs: 2800, endMs: 3200},
  {text: "docked.", startMs: 3200, endMs: 4000},
];

/** Isolate captions band over lower third. LessonSpine order is untouched. */
export const CaptionsDemo: React.FC = () => {
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
