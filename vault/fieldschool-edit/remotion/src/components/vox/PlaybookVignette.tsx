import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {blue, ink, sansFace} from "../../brand/tokens";
import {PaperCard} from "./PaperCard";

type PlaybookVignetteProps = {
  open: number;
  write: number;
  solo: number;
};

export const PlaybookVignette: React.FC<PlaybookVignetteProps> = ({open, write, solo}) => {
  const frame = useCurrentFrame();
  const flutter = Math.sin(frame / 8) * 1.2 * open;
  const a = interpolate(write, [0.05, 0.22], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const b = interpolate(write, [0.28, 0.45], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const c = interpolate(write, [0.5, 0.7], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <PaperCard open={open} kicker="A playbook" caption="Write the next step." solo={solo}>
      <Img
        src={staticFile("vox/playbook-book.png")}
        style={{
          width: 360,
          height: 248,
          objectFit: "contain",
          objectPosition: "center",
          transform: `translateY(${flutter}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 8,
          fontFamily: sansFace,
          fontSize: 13,
          color: ink,
          lineHeight: 1.55,
        }}
      >
        <div style={{opacity: a}}>1  Name it</div>
        <div style={{opacity: b}}>2  Next step</div>
        <div style={{opacity: c, color: blue}}>3  Do it</div>
      </div>
    </PaperCard>
  );
};
