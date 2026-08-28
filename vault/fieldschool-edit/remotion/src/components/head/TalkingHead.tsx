import React from "react";
import {OffthreadVideo, staticFile} from "remotion";
import {HEAD_DOCK, gold} from "../../brand/tokens";

type TalkingHeadProps = {
  src: string;
  startFrom: number;
  dock?: "dock-right" | "dock-left";
  muted?: boolean;
};

export const TalkingHead: React.FC<TalkingHeadProps> = ({src, startFrom, dock = "dock-right", muted = true}) => {
  const width = Math.round(1920 * HEAD_DOCK);
  const left = dock === "dock-right" ? 1920 - width : 0;
  const name = src.includes("/") ? src.split("/").pop() || src : src;
  const file = src.startsWith("http") ? src : staticFile(name);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 140,
        width,
        height: 820,
        overflow: "hidden",
        borderRadius: 8,
        outline: `3px solid ${gold}`,
        outlineOffset: -3,
      }}
    >
      <OffthreadVideo
        src={file}
        startFrom={startFrom}
        muted={muted}
        style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top"}}
      />
    </div>
  );
};
