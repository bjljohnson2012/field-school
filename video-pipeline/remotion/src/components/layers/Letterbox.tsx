import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {bg} from "../../brand";
import type {LessonChapter} from "../../schema/episode";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
  easing: Easing.bezier(0.16, 1, 0.3, 1),
};

/** Close-in on card beats, and a short pulse where an 800ms gap was a Vox enter. */
export const Letterbox: React.FC<{
  chapter: LessonChapter;
  previousBars: number;
  voxEnterMs: number[];
}> = ({chapter, previousBars, voxEnterMs}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const into = frame - chapter.inSec * fps;
  const eased = interpolate(into, [0, 12], [previousBars, chapter.letterbox], clamp);
  let pulse = 0;
  for (const ms of voxEnterMs) {
    const at = frame - (ms / 1000) * fps;
    pulse = Math.max(pulse, interpolate(at, [0, 6, 16], [0, 64, 0], clamp));
  }
  const height = Math.max(0, eased, pulse);
  if (height < 0.5) {
    return null;
  }
  const bar = {
    position: "absolute" as const,
    left: 0,
    width,
    height,
    backgroundColor: bg,
  };
  return (
    <AbsoluteFill>
      <div style={{...bar, top: 0}} />
      <div style={{...bar, bottom: 0}} />
    </AbsoluteFill>
  );
};
