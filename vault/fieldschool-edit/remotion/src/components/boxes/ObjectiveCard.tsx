import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper, sansFace} from "../../brand/tokens";

type ObjectiveCardProps = {
  text: string;
};

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 14, mass: 0.55}});
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 280,
        width: 1720,
        padding: "40px 48px",
        backgroundColor: paper,
        opacity: interpolate(pop, [0, 1], [0, 1]),
        transform: `translateY(${(1 - pop) * 24}px)`,
      }}
    >
      <div style={{fontFamily: sansFace, letterSpacing: "0.16em", textTransform: "uppercase", color: gold, fontSize: 16}}>
        You will be able to
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
    </div>
  );
};
