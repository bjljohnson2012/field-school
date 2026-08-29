import React from "react";
import {interpolate} from "remotion";
import {TYPE_HEAD_GAP, gold, headReservedPx, ink, paper, paperGrain} from "./tokens";

type PaperSheetProps = {
  open: number;
  solo: number;
};

export const PaperSheet: React.FC<PaperSheetProps> = ({open, solo}) => {
  if (open <= 0) {
    return null;
  }
  const field = interpolate(solo, [0.88, 0.99], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const width = interpolate(field, [0, 1], [1920 - headReservedPx() + 24, 1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: 1080,
        backgroundColor: paper,
        backgroundImage: paperGrain,
        opacity: open,
        boxShadow: `inset -18px 0 0 ${ink}14`,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 72,
          width: 3,
          height: 936,
          backgroundColor: ink,
          opacity: interpolate(field, [0, 1], [0.9, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 5,
          top: 72,
          width: 2,
          height: 936,
          backgroundColor: gold,
          opacity: interpolate(field, [0, 1], [0.7, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: TYPE_HEAD_GAP - 80,
          bottom: 48,
          width: 120,
          height: 3,
          backgroundColor: gold,
          opacity: 0.45,
        }}
      />
    </div>
  );
};
