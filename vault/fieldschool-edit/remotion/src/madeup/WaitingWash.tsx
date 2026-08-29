import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {paper} from "./tokens";

type WaitingWashProps = {
  open: number;
};

export const WaitingWash: React.FC<WaitingWashProps> = ({open}) => {
  if (open <= 0) {
    return null;
  }
  const opacity = interpolate(open, [0, 0.22, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(open, [0, 1], [1.08, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(open, [0, 1], [0, -48], {
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
          background: `linear-gradient(180deg, ${paper}e6 0%, ${paper}99 38%, ${paper}55 100%)`,
        }}
      />
    </div>
  );
};
