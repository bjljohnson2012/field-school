import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {blue, ink, stone} from "../../brand/tokens";
import {along, dash} from "../../draw";
import {PaperCard} from "./PaperCard";
import {PencilTip} from "./PencilTip";

type PlaybookVignetteProps = {
  open: number;
  solo: number;
};

export const PlaybookVignette: React.FC<PlaybookVignetteProps> = ({open, solo}) => {
  const frame = useCurrentFrame();
  const spread = interpolate(open, [0.08, 0.42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const write = interpolate(open, [0.36, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line = (late: number) =>
    interpolate(write, [late, Math.min(1, late + 0.22)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const a = line(0);
  const b = line(0.18);
  const c = line(0.38);
  const d = line(0.58);
  const check = interpolate(write, [0.82, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flutter = Math.sin(frame / 7) * 1.6 * spread;
  const pencilOn = interpolate(write, [0.02, 0.1, 0.88, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const px = along(write, [78, 168, 78, 160, 78, 152, 78, 146]);
  const py = along(write, [48, 48, 72, 72, 96, 96, 120, 120]);
  const angle = along(write, [-16, 6, -14, 8, -12, 10, -10, 4]);
  return (
    <PaperCard open={open} kicker="A playbook" solo={solo}>
      <svg width="260" height="176" viewBox="0 0 260 176" fill="none">
        <g transform={`translate(${flutter} 0)`}>
          <g transform={`translate(118 0) scale(${0.1 + spread * 0.9}, 1) translate(-118 0)`}>
            <path d="M118 16 H36 V160 H118" stroke={ink} strokeWidth="3" />
            <path d="M50 40 H104" stroke={stone} strokeWidth="2" {...dash(54, a)} />
            <path d="M50 64 H98" stroke={stone} strokeWidth="2" {...dash(48, b)} />
            <path d="M50 88 H92" stroke={stone} strokeWidth="2" {...dash(42, c)} />
          </g>
          <path d="M118 16 V160" stroke={ink} strokeWidth="3" opacity={spread} />
          <path d="M118 16 H200 V160 H118" stroke={ink} strokeWidth="3" opacity={0.35 + spread * 0.65} />
          <path d="M200 16 L228 30 V160 H200" stroke={stone} strokeWidth="2.5" opacity={spread} />
          <path d="M134 48 H190" stroke={stone} strokeWidth="2" {...dash(56, a)} />
          <path d="M134 72 H184" stroke={stone} strokeWidth="2" {...dash(50, b)} />
          <path d="M134 96 H176" stroke={blue} strokeWidth="2.5" {...dash(42, c)} />
          <path d="M134 120 H168" stroke={stone} strokeWidth="2" {...dash(34, d)} />
          <path d="M176 128 L186 138 L208 112" stroke={blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...dash(42, check)} />
        </g>
        <PencilTip x={px} y={py} angle={angle} show={pencilOn} />
      </svg>
    </PaperCard>
  );
};
