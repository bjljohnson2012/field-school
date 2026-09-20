import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cream, LOCK} from "./brand";
import {AudioBed, Bed, CaptionsBand, HeadDock, Letterbox, LowerThird, OverlayLock} from "./layers";
import {Layer, Stack} from "./Stack";
import type {Caption} from "./types";

const DEMO_CAPTIONS: Caption[] = [
  {text: "You", startMs: 0, endMs: 280},
  {text: "Can", startMs: 280, endMs: 520},
  {text: "Just", startMs: 520, endMs: 860},
  {text: "Do", startMs: 860, endMs: 1100},
  {text: "Things", startMs: 1100, endMs: 1700},
  {text: "Type", startMs: 2200, endMs: 2600},
  {text: "draws", startMs: 2600, endMs: 3000},
  {text: "the", startMs: 3000, endMs: 3180},
  {text: "idea.", startMs: 3180, endMs: 3800},
  {text: "You", startMs: 4200, endMs: 4480},
  {text: "will", startMs: 4480, endMs: 4720},
  {text: "be", startMs: 4720, endMs: 4900},
  {text: "able", startMs: 4900, endMs: 5200},
  {text: "to", startMs: 5200, endMs: 5400},
  {text: "draw", startMs: 5400, endMs: 5720},
  {text: "one", startMs: 5720, endMs: 5960},
  {text: "idea", startMs: 5960, endMs: 6300},
  {text: "per", startMs: 6300, endMs: 6500},
  {text: "beat", startMs: 6500, endMs: 7200},
];

/** Isolate karaoke line packing on CaptionsBand. LessonSpine order is untouched. */
export const CaptionDensityDemo: React.FC = () => {
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
