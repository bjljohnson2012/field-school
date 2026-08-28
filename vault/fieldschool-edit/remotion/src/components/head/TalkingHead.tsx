import React from "react";
import {OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {HEAD_DOCK, HEAD_MAT_PX, HEAD_RIGHT_GAP, HEAD_RULE_PX, cream, ink, stone} from "../../brand/tokens";

type TalkingHeadProps = {
  src: string;
  startFrom: number;
  dock?: "dock-right" | "dock-left";
  muted?: boolean;
  solo?: number;
};

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  src,
  startFrom,
  dock = "dock-right",
  muted = true,
  solo = 0,
}) => {
  const width = Math.round(1920 * HEAD_DOCK);
  const height = 800;
  const left = dock === "dock-right" ? 1920 - width - HEAD_RIGHT_GAP : HEAD_RIGHT_GAP;
  const name = src.includes("/") ? src.split("/").pop() || src : src;
  const file = src.startsWith("http") ? src : staticFile(name);
  const side = dock === "dock-right" ? 1 : -1;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    durationInFrames: 20,
    config: {damping: 15, mass: 0.6},
  });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 132,
        width,
        height,
        padding: HEAD_MAT_PX,
        boxSizing: "border-box",
        backgroundColor: cream,
        border: `${HEAD_RULE_PX}px solid ${stone}`,
        borderRadius: 4,
        boxShadow: `0 22px 48px ${ink}2e`,
        overflow: "hidden",
        transform: `translateY(${solo * (height + 140) + (1 - enter) * 72}px) translateX(${solo * side * 36}px)`,
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
            objectPosition: "50% 42%",
            transform: "scale(1.02)",
            transformOrigin: "50% 40%",
          }}
        />
      </div>
    </div>
  );
};
