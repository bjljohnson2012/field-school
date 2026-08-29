import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {ink, paper} from "./tokens";

const SRC_W = 1536;
const SRC_H = 1024;
const FOCUS_X = 0.86;
const FOCUS_Y = 0.40;

type WaitingWashProps = {
  open: number;
};

export const WaitingWash: React.FC<WaitingWashProps> = ({open}) => {
  if (open <= 0) {
    return null;
  }
  const opacity = interpolate(open, [0, 0.12, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(open, [0, 1], [1.96, 1.88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(open, [0, 1], [12, -14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const width = SRC_W * zoom;
  const height = SRC_H * zoom;
  const left = Math.min(0, Math.max(1920 - width, 1920 / 2 - width * FOCUS_X + drift));
  const top = Math.min(0, Math.max(1080 - height, 1080 / 2 - height * FOCUS_Y));
  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", opacity}}>
      <Img
        src={staticFile("vox/wait-broll.png")}
        style={{
          position: "absolute",
          width,
          height,
          left,
          top,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${paper}66 0%, ${paper}2e 38%, ${paper}14 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 28,
          outline: `3px solid ${ink}33`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
