import React from "react";
import {interpolate} from "remotion";
import {stone} from "../../brand/tokens";

type LetterboxProps = {
  close: number;
};

export const Letterbox: React.FC<LetterboxProps> = ({close}) => {
  const bar = interpolate(close, [0, 1], [40, 88], {extrapolateRight: "clamp"});
  const opacity = interpolate(close, [0, 1], [0.1, 0.22], {extrapolateRight: "clamp"});
  return (
    <>
      <div style={{position: "absolute", left: 0, top: 0, width: 1920, height: bar, backgroundColor: stone, opacity}} />
      <div
        style={{position: "absolute", left: 0, bottom: 0, width: 1920, height: bar, backgroundColor: stone, opacity}}
      />
    </>
  );
};
