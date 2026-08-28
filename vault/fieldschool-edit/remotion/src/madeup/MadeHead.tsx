import React from "react";
import {OffthreadVideo, interpolate, staticFile} from "remotion";
import {HEAD_DOCK, HEAD_PIP, HEAD_PIP_GAP, HEAD_RIGHT_GAP, ink, paper} from "./tokens";
import type {ShotLayout} from "./schema";

type MadeHeadProps = {
  src: string;
  layout: ShotLayout;
  local: number;
};

export const MadeHead: React.FC<MadeHeadProps> = ({src, layout, local}) => {
  const hidden = layout === "off";
  const pip = layout === "pip-tr";
  const enter = interpolate(local, [0, pip ? 10 : 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const width = pip ? HEAD_PIP : Math.round(1920 * HEAD_DOCK);
  const height = pip ? HEAD_PIP : 800;
  const left = pip ? 1920 - width - HEAD_PIP_GAP : 1920 - width - HEAD_RIGHT_GAP;
  const top = pip ? HEAD_PIP_GAP : 140;
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
        opacity: hidden ? 0 : enter,
        pointerEvents: "none",
        translate: hidden ? "0px 0px" : `0px ${(1 - enter) * (pip ? 24 : 40)}px`,
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={0}
        muted
        style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%"}}
      />
    </div>
  );
};

export const TalkingHead = MadeHead;
