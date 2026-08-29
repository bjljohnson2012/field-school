import React from "react";
import {interpolate, spring, useVideoConfig} from "remotion";
import {gold, paper} from "./tokens";

export type CutKind = "wipe" | "flash" | "slide";

type PaperCutProps = {
  local: number;
  kind?: CutKind;
};

export const PaperCut: React.FC<PaperCutProps> = ({local, kind = "flash"}) => {
  if (local < 0 || local > 16) {
    return null;
  }
  const {fps} = useVideoConfig();
  const wipe = spring({
    frame: local,
    fps,
    durationInFrames: kind === "flash" ? 6 : 10,
    config: {damping: 12, mass: 0.38, stiffness: 280},
  });
  if (kind === "flash") {
    const flash = interpolate(local, [0, 2, 5], [0.7, 0.28, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: gold,
          opacity: flash,
          pointerEvents: "none",
        }}
      />
    );
  }
  if (kind === "slide") {
    const sheet = interpolate(local, [0, 12], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          backgroundColor: paper,
          opacity: sheet,
          translate: `${(1 - wipe) * -640}px 0px`,
          pointerEvents: "none",
        }}
      />
    );
  }
  const bar = interpolate(wipe, [0, 1], [-120, 2040]);
  return (
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
  );
};
