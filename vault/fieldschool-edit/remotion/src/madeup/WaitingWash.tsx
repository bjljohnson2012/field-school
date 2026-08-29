import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {gold, ink, paper} from "./tokens";

type WaitingWashProps = {
  open: number;
};

export const WaitingWash: React.FC<WaitingWashProps> = ({open}) => {
  if (open <= 0) {
    return null;
  }
  const opacity = interpolate(open, [0, 0.16, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(open, [0, 1], [1.16, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(open, [0, 1], [36, -28], {
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
          objectPosition: "50% 42%",
          scale: `${zoom}`,
          translate: `${drift}px 0px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${paper}f0 0%, ${paper}b8 34%, ${paper}66 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 28,
          outline: `3px solid ${ink}22`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 0,
          height: 0,
          borderLeft: `72px solid transparent`,
          borderTop: `72px solid ${gold}`,
          opacity: 0.85,
        }}
      />
    </div>
  );
};
