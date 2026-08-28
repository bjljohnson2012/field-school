import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {blue, ink, sansFace, stone} from "../../brand/tokens";
import {along, dash} from "../../draw";
import {PaperCard} from "./PaperCard";
import {PencilTip} from "./PencilTip";

type PlaybookVignetteProps = {
  open: number;
  write: number;
  solo: number;
};

export const PlaybookVignette: React.FC<PlaybookVignetteProps> = ({open, write, solo}) => {
  const frame = useCurrentFrame();
  const spread = interpolate(open, [0.08, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line = (late: number) =>
    interpolate(write, [late, Math.min(1, late + 0.2)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const a = line(0);
  const b = line(0.22);
  const c = line(0.44);
  const check = interpolate(write, [0.78, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flutter = Math.sin(frame / 7) * 1.4 * spread;
  const pencilOn = interpolate(write, [0.02, 0.1, 0.86, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const px = along(write, [168, 300, 168, 292, 168, 280]);
  const py = along(write, [78, 78, 114, 114, 150, 150]);
  const angle = along(write, [-14, 6, -12, 8, -10, 4]);
  return (
    <PaperCard open={open} kicker="A playbook" caption="Write the next step." solo={solo}>
      <svg width="360" height="200" viewBox="0 0 360 200" fill="none">
        <g transform={`translate(${flutter} 0)`}>
          <g transform={`translate(154 0) scale(${0.12 + spread * 0.88}, 1) translate(-154 0)`}>
            <path d="M154 18 H40 V182 H154" stroke={ink} strokeWidth="3" />
            <path d="M56 44 H138" stroke={stone} strokeWidth="2" opacity={spread} />
            <path d="M56 70 H128" stroke={stone} strokeWidth="2" {...dash(72, a)} />
            <path d="M56 96 H122" stroke={stone} strokeWidth="2" {...dash(66, b)} />
            <path d="M56 122 H116" stroke={stone} strokeWidth="2" {...dash(60, c)} />
          </g>
          <path d="M154 18 V182" stroke={ink} strokeWidth="3.2" opacity={spread} />
          <path d="M154 18 H300 V182 H154" stroke={ink} strokeWidth="3" opacity={0.4 + spread * 0.6} />
          <path d="M300 18 L332 36 V182 H300" stroke={stone} strokeWidth="2.4" opacity={spread} />
          <path d="M174 48 H278" stroke={stone} strokeWidth="2" opacity={spread} />
          <path d="M248 158 L260 170 L286 140" stroke={blue} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" {...dash(48, check)} />
        </g>
        <PencilTip x={px} y={py} angle={angle} show={pencilOn} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 176,
          top: 56,
          fontFamily: sansFace,
          fontSize: 13,
          color: ink,
          lineHeight: 1.7,
        }}
      >
        <div style={{opacity: a}}>1  Name it</div>
        <div style={{opacity: b}}>2  Next step</div>
        <div style={{opacity: c, color: blue}}>3  Do it</div>
      </div>
    </PaperCard>
  );
};
