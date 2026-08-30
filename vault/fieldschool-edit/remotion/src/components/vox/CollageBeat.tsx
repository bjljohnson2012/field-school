import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper} from "../../brand/tokens";

type CollageBeatProps = {
  word: string;
  fromFrame: number;
};

export const CollageBeat: React.FC<CollageBeatProps> = ({word, fromFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - fromFrame;
  if (local < 0 || local > 36) {
    return null;
  }
  const pop = spring({frame: local, fps, config: {damping: 12, mass: 0.45}});
  const fade = interpolate(local, [0, 4, 28, 36], [0, 1, 1, 0], {extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 170,
        padding: "18px 28px",
        backgroundColor: paper,
        borderLeft: `8px solid ${gold}`,
        opacity: fade,
        transform: `translateY(${(1 - pop) * 36}px) rotate(${(1 - pop) * -2}deg)`,
      }}
    >
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 64,
          letterSpacing: "-0.03em",
          color: ink,
        }}
      >
        {word}
      </div>
    </div>
  );
};
