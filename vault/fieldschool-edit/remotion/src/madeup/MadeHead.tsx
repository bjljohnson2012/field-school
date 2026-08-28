import React from "react";
import {OffthreadVideo, interpolate, staticFile} from "remotion";
import {HEAD_DOCK, HEAD_RIGHT_GAP, ink, paper} from "./tokens";
import type {ShotLayout} from "./schema";

type MadeHeadProps = {
  src: string;
  layout: ShotLayout;
  local: number;
  fromFrame: number;
};

export const MadeHead: React.FC<MadeHeadProps> = ({src, layout, local, fromFrame}) => {
  const hidden = layout === "off";
  const pip = layout === "pip-tr";
  const enter = interpolate(local, [0, pip ? 10 : 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const width = pip ? 420 : Math.round(1920 * HEAD_DOCK);
  const height = pip ? 420 : 800;
  const left = pip ? 1920 - width - 48 : 1920 - width - HEAD_RIGHT_GAP;
  const top = pip ? 48 : 140;
  if (hidden) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        padding: 10,
        boxSizing: "border-box",
        backgroundColor: paper,
        outline: `2px solid ${ink}`,
        opacity: enter,
        translate: `0px ${(1 - enter) * (pip ? 24 : 40)}px`,
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={fromFrame}
        muted
        style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%"}}
      />
    </div>
  );
};

export const TalkingHead = MadeHead;
