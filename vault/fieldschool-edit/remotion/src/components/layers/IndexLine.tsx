import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {blue} from "../../brand/tokens";

type IndexLineProps = {
  solo: number;
};

export const IndexLine: React.FC<IndexLineProps> = ({solo}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 16], [0, 1], {extrapolateRight: "clamp"});
  const width = interpolate(solo, [0, 1], [88, 148], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const top = interpolate(solo, [0, 1], [818, 786], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: 1920,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: width * draw,
          height: 2,
          backgroundColor: blue,
          opacity: 0.88,
        }}
      />
    </div>
  );
};
