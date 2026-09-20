import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cream, LOCK} from "./brand";
import {AudioBed, Bed, CaptionsBand, HeadDock, Letterbox, LowerThird, OverlayLock} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "Bed", startMs: 400, endMs: 800},
  {text: "is", startMs: 800, endMs: 1000},
  {text: "silent.", startMs: 1000, endMs: 1800},
  {text: "Letterbox", startMs: 2200, endMs: 2800},
  {text: "stays", startMs: 2800, endMs: 3200},
  {text: "above.", startMs: 3200, endMs: 4000},
];

/** Isolate the audio layer after letterbox. LessonSpine order is untouched. */
export const AudioBedDemo: React.FC = () => {
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
