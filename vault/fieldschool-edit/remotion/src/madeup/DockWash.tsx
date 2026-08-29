import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {headReservedPx, ink, paper} from "./tokens";
import type {ShotLayout} from "./schema";

type DockWashProps = {
  src: string | null;
  layout: ShotLayout;
  local: number;
};

export const DockWash: React.FC<DockWashProps> = ({src, layout, local}) => {
  if (!src || layout === "off" || layout === "pip-tr") {
    return null;
  }
  const band = layout === "letterbox";
  const leftDock = layout === "dock-left";
  const reserved = headReservedPx();
  const open = interpolate(local, [0, 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const left = band ? 160 : leftDock ? reserved + 48 : 64;
  const width = band ? 1600 : 1920 - reserved - 112;
  const top = band ? 120 : 210;
  const height = band ? 620 : 620;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        opacity: open * (band ? 0.22 : 0.34),
        pointerEvents: "none",
        overflow: "hidden",
        outline: `3px solid ${ink}33`,
        backgroundColor: paper,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 45%",
          filter: "saturate(0.82) contrast(1.04)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${paper}55 0%, ${paper}14 38%, ${paper}66 100%)`,
        }}
      />
    </div>
  );
};
