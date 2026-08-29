import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {ink, paper} from "./tokens";

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
  const zoom = interpolate(open, [0, 1], [1.14, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(open, [0, 1], [24, -16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", opacity}}>
      <Img
        src={staticFile("vox/wait-broll.png")}
        style={{
          width: 1920,
          height: 1080,
          objectFit: "cover",
          objectPosition: "78% 58%",
          scale: `${zoom}`,
          translate: `${drift}px 0px`,
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
