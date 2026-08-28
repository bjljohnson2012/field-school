import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {blue, sansFace} from "../../brand/tokens";
import {PaperCard} from "./PaperCard";

type WaitingVignetteProps = {
  open: number;
  draw: number;
  solo: number;
};

export const WaitingVignette: React.FC<WaitingVignetteProps> = ({open, draw, solo}) => {
  const frame = useCurrentFrame();
  const live = interpolate(draw, [0.35, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tap = Math.sin(frame / 3.2) * 3 * live;
  const stamp = interpolate(open, [0.55, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <PaperCard open={open} kicker="Waiting" caption="Still sitting there." solo={solo}>
      <Img
        src={staticFile("vox/wait-person.png")}
        style={{
          width: 360,
          height: 248,
          objectFit: "contain",
          objectPosition: "center",
          transform: `translateY(${tap}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 14,
          bottom: 8,
          border: `2.5px solid ${blue}`,
          color: blue,
          fontFamily: sansFace,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          padding: "5px 9px 4px",
          backgroundColor: "#f6f3eccc",
          opacity: stamp,
          transform: `rotate(-10deg) scale(${0.82 + stamp * 0.18})`,
        }}
      >
        Wait
      </div>
    </PaperCard>
  );
};
