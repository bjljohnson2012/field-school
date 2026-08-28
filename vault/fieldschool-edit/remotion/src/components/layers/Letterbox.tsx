import React from "react";
import {interpolate} from "remotion";
import {bg} from "../../brand/tokens";

type LetterboxProps = {
  close: number;
};

export const Letterbox: React.FC<LetterboxProps> = ({close}) => {
  const bar = interpolate(close, [0, 1], [36, 72], {extrapolateRight: "clamp"});
  return (
    <>
      <div style={{position: "absolute", left: 0, top: 0, width: 1920, height: bar, backgroundColor: bg}} />
      <div style={{position: "absolute", left: 0, bottom: 0, width: 1920, height: bar, backgroundColor: bg}} />
    </>
  );
};
