import React from "react";
import {Rect} from "@remotion/shapes";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {navy, paper, sansFace} from "../../brand";

/** One tag. The parent Sequence is the only thing that times it. */
export const TagPill: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const width = Math.max(160, text.length * 22 + 56);
  return (
    <div style={{position: "absolute", left: 72, top: 64, opacity}}>
      <Rect width={width} height={64} cornerRadius={32} fill={paper} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: sansFace,
          fontWeight: 600,
          fontSize: 28,
          color: navy,
          letterSpacing: "0.01em",
        }}
      >
        {text}
      </div>
    </div>
  );
};
