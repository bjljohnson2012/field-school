import React from "react";
import {OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {HEAD_DOCK, HEAD_MAT_PX, HEAD_RIGHT_GAP, HEAD_RULE_PX, cream, ink, stone} from "../../brand/tokens";

export type HeadLayout = "dock-left" | "dock-right" | "pip-tl" | "pip-tr" | "off";

type TalkingHeadProps = {
  src: string;
  startFrom: number;
  dock?: "dock-right" | "dock-left";
  layout?: HeadLayout;
  muted?: boolean;
  solo?: number;
};

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  src,
  startFrom,
  dock = "dock-right",
  layout,
  muted = true,
  solo = 0,
}) => {
  const place: HeadLayout = layout ?? dock;
  if (place === "off") {
    return null;
  }
  const pip = place === "pip-tl" || place === "pip-tr";
  const width = pip ? 380 : Math.round(1920 * HEAD_DOCK);
  const height = pip ? 380 : 800;
  const left =
    place === "dock-left" || place === "pip-tl" ? HEAD_RIGHT_GAP : 1920 - width - HEAD_RIGHT_GAP;
  const name = src.includes("/") ? src.split("/").pop() || src : src;
  const file = src.startsWith("http") ? src : staticFile(name);
  const side = dock === "dock-right" ? 1 : -1;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    durationInFrames: 28,
    config: {damping: 18, mass: 0.75},
  });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: pip ? 72 : 132,
        width,
        height,
        padding: HEAD_MAT_PX,
        boxSizing: "border-box",
        backgroundColor: cream,
        border: `${HEAD_RULE_PX}px solid ${stone}`,
        borderRadius: 4,
        boxShadow: `0 22px 48px ${ink}2e`,
        overflow: "hidden",
        transform: `translateY(${solo * (height + 140) + (1 - enter) * 48}px) translateX(${solo * side * 20}px)`,
        opacity: enter,
      }}
    >
      <div style={{width: "100%", height: "100%", overflow: "hidden", borderRadius: 2}}>
        <OffthreadVideo
          src={file}
          startFrom={startFrom}
          muted={muted}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
            transform: "none",
            transformOrigin: "50% 50%",
            filter: "contrast(1.06) saturate(1.05) brightness(1.02)",
          }}
        />
      </div>
    </div>
  );
};
