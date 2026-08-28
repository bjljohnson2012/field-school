import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper, sansFace} from "../../brand/tokens";

type HookCardProps = {
  text: string;
};

export const HookCard: React.FC<HookCardProps> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 13, mass: 0.5}});
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 300,
        width: 1720,
        padding: "36px 48px",
        backgroundColor: paper,
        borderLeft: `10px solid ${gold}`,
        opacity: interpolate(pop, [0, 1], [0, 1]),
        transform: `translateY(${(1 - pop) * 28}px)`,
      }}
    >
      <div style={{fontFamily: sansFace, letterSpacing: "0.16em", textTransform: "uppercase", color: gold, fontSize: 16}}>
        Hook
      </div>
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 52,
          letterSpacing: "-0.03em",
          color: ink,
          marginTop: 14,
        }}
      >
        {text}
      </div>
    </div>
  );
};
