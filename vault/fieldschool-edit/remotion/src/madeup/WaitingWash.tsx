import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {ink, paper} from "./tokens";

const SRC_W = 1536;
const SRC_H = 1024;
const FOCUS_X = 0.82;
const FOCUS_Y = 0.46;

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
  const zoom = interpolate(open, [0, 1], [2.08, 1.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(open, [0, 1], [18, -22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const width = SRC_W * zoom;
  const height = SRC_H * zoom;
  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", opacity}}>
      <Img
        src={staticFile("vox/wait-broll.png")}
        style={{
          position: "absolute",
          width,
          height,
          left: 1920 / 2 - width * FOCUS_X + drift,
          top: 1080 / 2 - height * FOCUS_Y,
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
