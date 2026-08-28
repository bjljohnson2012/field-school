import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {cream} from "../../brand/tokens";

type WaitingBrollProps = {
  open: number;
};

export const WaitingBroll: React.FC<WaitingBrollProps> = ({open}) => {
  if (open <= 0) {
    return null;
  }
  const opacity = interpolate(open, [0, 0.22, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(open, [0, 1], [1.05, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(open, [0, 1], [0, -28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wash = interpolate(open, [0, 1], [0.42, 0.32], {
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
          transform: `translateX(${drift}px) scale(${zoom})`,
          transformOrigin: "50% 45%",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${cream}e6 0%, ${cream}99 38%, ${cream}55 100%)`,
          opacity: wash + 0.35,
        }}
      />
    </div>
  );
};
