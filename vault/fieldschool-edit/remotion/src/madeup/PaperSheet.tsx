import React from "react";
import {interpolate} from "remotion";
import {TYPE_HEAD_GAP, gold, headReservedPx, ink, paper, paperGrain} from "./tokens";
import type {ShotLayout} from "./schema";

type PaperSheetProps = {
  open: number;
  solo: number;
  layout?: ShotLayout;
};

export const PaperSheet: React.FC<PaperSheetProps> = ({open, solo, layout = "dock-right"}) => {
  if (open <= 0) {
    return null;
  }
  const field = interpolate(solo, [0.88, 0.99], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = interpolate(field, [0, 1], [0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        backgroundColor: paper,
        backgroundImage: paperGrain,
        opacity: open,
      }}
    >
      {layout === "dock-left" || layout === "dock-right" ? (
        <>
          <div
            style={{
              position: "absolute",
              ...(layout === "dock-left"
                ? {left: headReservedPx() - 24}
                : {right: headReservedPx() - 24}),
              top: 72,
              width: 3,
              height: 936,
              backgroundColor: ink,
              opacity: rule,
            }}
          />
          <div
            style={{
              position: "absolute",
              ...(layout === "dock-left"
                ? {left: headReservedPx() - 29}
                : {right: headReservedPx() - 29}),
              top: 72,
              width: 2,
              height: 936,
              backgroundColor: gold,
              opacity: rule * 0.78,
            }}
          />
        </>
      ) : null}
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
