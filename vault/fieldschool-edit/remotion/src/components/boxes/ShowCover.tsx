import React from "react";
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {gold, paper, sansFace} from "../../brand/tokens";

type ShowCoverProps = {
  src: string;
};

export const ShowCover: React.FC<ShowCoverProps> = ({src}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 14, mass: 0.55}});
  const fade = interpolate(pop, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 140,
        width: 1040,
        height: 720,
        backgroundColor: paper,
        overflow: "hidden",
        opacity: fade,
        transform: `translateX(${(1 - pop) * -48}px)`,
        outline: `3px solid ${gold}`,
        outlineOffset: -3,
      }}
    >
      <Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 20,
          fontFamily: sansFace,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: gold,
          fontSize: 14,
        }}
      >
        Show
      </div>
    </div>
  );
};
