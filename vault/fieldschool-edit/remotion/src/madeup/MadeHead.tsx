import React from "react";
import {OffthreadVideo, interpolate, spring, staticFile, useVideoConfig} from "remotion";
import {HEAD_DOCK, HEAD_MAT_PX, HEAD_PIP, HEAD_PIP_GAP, HEAD_RIGHT_GAP, HEAD_RULE_PX, gold, ink, paper} from "./tokens";
import type {ShotLayout} from "./schema";

type MadeHeadProps = {
  src: string;
  layout: ShotLayout;
  local: number;
  solo?: number;
  fresh?: boolean;
};

export const MadeHead: React.FC<MadeHeadProps> = ({src, layout, local, solo = 0, fresh = true}) => {
  const {fps} = useVideoConfig();
  const hidden = layout === "off";
  const pip = layout === "pip-tr";
  const letter = layout === "letterbox";
  const leftDock = layout === "dock-left";
  const enter = fresh
    ? spring({
        frame: local,
        fps,
        durationInFrames: 10,
        config: {damping: 16, mass: 0.55, stiffness: 240},
      })
    : 1;
  const width = pip ? HEAD_PIP : letter ? 1680 : Math.round(1920 * HEAD_DOCK);
  const height = pip ? HEAD_PIP : letter ? 780 : 640;
  const zoom = pip ? 1.72 : letter ? 1.78 : 2.38;
  const focus = pip ? "50% 10%" : letter ? "50% 14%" : "50% 20%";
  const left = pip
    ? 1920 - width - HEAD_PIP_GAP
    : letter
      ? 120
      : leftDock
        ? HEAD_RIGHT_GAP
        : 1920 - width - HEAD_RIGHT_GAP;
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
        scale: hidden ? 1 : 0.94 + enter * 0.06,
        translate: hidden ? "0px 0px" : `0px ${drop}px`,
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
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: HEAD_MAT_PX,
          overflow: "hidden",
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={0}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: focus,
            scale: `${zoom}`,
            filter: "contrast(1.06) saturate(1.04) brightness(1.02)",
          }}
        />
      </div>
    </div>
  );
};

export const TalkingHead = MadeHead;
