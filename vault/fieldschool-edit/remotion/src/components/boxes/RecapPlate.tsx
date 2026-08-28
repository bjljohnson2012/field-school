import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper, sansFace} from "../../brand/tokens";

type RecapPlateProps = {
  index: number;
  kicker: string;
  text: string;
};

export const RecapPlate: React.FC<RecapPlateProps> = ({index, kicker, text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 12, mass: 0.48}});
  return (
    <div
      style={{
        position: "absolute",
        left: 140 + index * 36,
        top: 300,
        width: 1480,
        padding: "40px 48px",
        backgroundColor: paper,
        opacity: interpolate(pop, [0, 1], [0, 1]),
        transform: `translateY(${(1 - pop) * 26}px) rotate(${(1 - pop) * -1.2}deg)`,
      }}
    >
      <div style={{fontFamily: sansFace, letterSpacing: "0.16em", textTransform: "uppercase", color: gold, fontSize: 16}}>
        {kicker}
      </div>
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 56,
          letterSpacing: "-0.03em",
          color: ink,
          marginTop: 12,
        }}
      >
        {text}
      </div>
    </div>
  );
};
