import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, olive, paper, sansFace} from "../../brand/tokens";

type DoCardProps = {
  text: string;
};

export const DoCard: React.FC<DoCardProps> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 14, mass: 0.5}});
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 260,
        width: 1720,
        padding: "44px 52px",
        backgroundColor: paper,
        opacity: interpolate(pop, [0, 1], [0, 1]),
        transform: `translateY(${(1 - pop) * 22}px)`,
      }}
    >
      <div style={{fontFamily: sansFace, letterSpacing: "0.18em", textTransform: "uppercase", color: olive, fontSize: 16}}>
        Do this now
      </div>
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 48,
          letterSpacing: "-0.03em",
          color: ink,
          marginTop: 16,
        }}
      >
        {text}
      </div>
      <div style={{marginTop: 28, height: 6, width: 120, backgroundColor: gold}} />
    </div>
  );
};
