import React from "react";
import {OffthreadVideo, interpolate, staticFile} from "remotion";
import {HEAD_DOCK, HEAD_MAT_PX, HEAD_PIP, HEAD_PIP_GAP, HEAD_RIGHT_GAP, HEAD_RULE_PX, gold, ink, paper} from "./tokens";
import type {ShotLayout} from "./schema";

type MadeHeadProps = {
  src: string;
  layout: ShotLayout;
  local: number;
  solo?: number;
  fresh?: boolean;
};

export const MadeHead: React.FC<MadeHeadProps> = ({src, layout, local, solo = 0, fresh: _fresh = true}) => {
  const hidden = layout === "off";
  const pip = layout === "pip-tr";
  const letter = layout === "letterbox";
  const enter = 1;
  const tape = 1;
  const width = pip ? HEAD_PIP : letter ? 1680 : Math.round(1920 * HEAD_DOCK);
  const height = pip ? HEAD_PIP : letter ? 860 : 760;
  const left = pip ? 1920 - width - HEAD_PIP_GAP : letter ? 120 : 1920 - width - HEAD_RIGHT_GAP;
  const top = pip ? 72 : letter ? 90 : 150;
  const drop = interpolate(solo, [0, 1], [0, height + 160], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        padding: HEAD_MAT_PX,
        boxSizing: "border-box",
        backgroundColor: paper,
        outline: `${HEAD_RULE_PX}px solid ${ink}`,
        boxShadow: `0 28px 56px ${ink}55`,
        opacity: hidden ? 0 : enter * interpolate(solo, [0, 0.85], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        pointerEvents: "none",
        rotate: hidden ? "0deg" : `${(1 - enter) * -3.2}deg`,
        translate: hidden ? "0px 0px" : `0px ${(1 - enter) * 110 + drop}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -10,
          width: 108,
          height: 22,
          marginLeft: -54,
          backgroundColor: gold,
          opacity: 0.9 * tape,
          scale: `${0.4 + tape * 0.6}`,
        }}
      />
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={0}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 40%",
          filter: "contrast(1.06) saturate(1.04) brightness(1.02)",
        }}
      />
    </div>
  );
};

export const TalkingHead = MadeHead;
