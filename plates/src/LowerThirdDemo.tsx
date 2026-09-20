import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {cream} from "./brand";
import {AudioBed, Bed, HeadDock, Letterbox, LowerThird, OverlayLock} from "./layers";
import {Layer, Stack} from "./Stack";
import {LOCK} from "./brand";

/** Isolate lower-third craft. Does not change LessonSpine beat order. */
export const LowerThirdDemo: React.FC = () => {
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
        <Layer name="captions" />
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
