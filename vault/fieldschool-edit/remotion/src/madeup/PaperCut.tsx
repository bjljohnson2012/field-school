import React from "react";
import {interpolate, spring, useVideoConfig} from "remotion";
import {gold, paper} from "./tokens";

type PaperCutProps = {
  local: number;
};

export const PaperCut: React.FC<PaperCutProps> = ({local}) => {
  if (local < 0 || local > 16) {
    return null;
  }
  const {fps} = useVideoConfig();
  const wipe = spring({
    frame: local,
    fps,
    durationInFrames: 10,
    config: {damping: 12, mass: 0.38, stiffness: 280},
  });
  const flash = interpolate(local, [0, 2, 7], [0.72, 0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bar = interpolate(wipe, [0, 1], [-120, 2040]);
  const sheet = interpolate(local, [0, 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: gold,
          opacity: flash,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          backgroundColor: paper,
          opacity: sheet * 0.55,
          translate: `${(1 - wipe) * -220}px 0px`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: bar,
          top: 0,
          width: 72,
          height: 1080,
          backgroundColor: gold,
          opacity: interpolate(local, [0, 8, 14], [1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />
    </>
  );
};
