import React from "react";
import {interpolate} from "remotion";
import {bg} from "./tokens";

type MadeLetterboxProps = {
  close: number;
};

export const MadeLetterbox: React.FC<MadeLetterboxProps> = ({close}) => {
  const bar = interpolate(close, [0, 1], [36, 88], {extrapolateRight: "clamp"});
  return (
    <>
      <div style={{position: "absolute", left: 0, top: 0, width: 1920, height: bar, backgroundColor: bg}} />
      <div style={{position: "absolute", left: 0, bottom: 0, width: 1920, height: bar, backgroundColor: bg}} />
    </>
  );
};

export const Letterbox = MadeLetterbox;
