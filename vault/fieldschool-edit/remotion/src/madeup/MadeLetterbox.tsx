import React from "react";
import {interpolate} from "remotion";
import {gold, night} from "./tokens";

type MadeLetterboxProps = {
  mode: "none" | "hair" | "vox";
  local?: number;
};

export const MadeLetterbox: React.FC<MadeLetterboxProps> = ({mode, local = 20}) => {
  if (mode === "none") {
    return null;
  }
  const draw = interpolate(local, [0, 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (mode === "hair") {
    return (
      <>
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 36,
            width: 1760 * draw,
            height: 3,
            backgroundColor: gold,
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: 36,
            width: 1760 * draw,
            height: 3,
            backgroundColor: gold,
            opacity: 0.55,
          }}
        />
      </>
    );
  }
  return (
    <>
      <div style={{position: "absolute", left: 0, top: 0, width: 1920, height: 48, backgroundColor: night}} />
      <div style={{position: "absolute", left: 0, bottom: 0, width: 1920, height: 48, backgroundColor: night}} />
    </>
  );
};

export const Letterbox = MadeLetterbox;
