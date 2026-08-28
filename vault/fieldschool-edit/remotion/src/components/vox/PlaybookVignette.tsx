import React from "react";
import {interpolate} from "remotion";
import {blue, ink, stone} from "../../brand/tokens";
import {PaperCard} from "./PaperCard";

type PlaybookVignetteProps = {
  open: number;
  solo: number;
};

export const PlaybookVignette: React.FC<PlaybookVignetteProps> = ({open, solo}) => {
  const line = interpolate(open, [0.2, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <PaperCard open={open} kicker="A playbook" solo={solo}>
      <svg width="240" height="168" viewBox="0 0 240 168" fill="none">
        <rect x="38" y="12" width="130" height="144" stroke={ink} strokeWidth="3" />
        <path d="M168 12 L202 28 L202 156 L168 156" stroke={stone} strokeWidth="2.5" />
        <path d="M56 40 H158" stroke={stone} strokeWidth="2" strokeDasharray="120" strokeDashoffset={120 * (1 - line)} />
        <path d="M56 64 H150" stroke={stone} strokeWidth="2" strokeDasharray="94" strokeDashoffset={94 * (1 - Math.max(0, line - 0.15) / 0.85)} />
        <path d="M56 88 H142" stroke={blue} strokeWidth="2" strokeDasharray="86" strokeDashoffset={86 * (1 - Math.max(0, line - 0.35) / 0.65)} />
        <path d="M56 112 H136" stroke={stone} strokeWidth="2" strokeDasharray="80" strokeDashoffset={80 * (1 - Math.max(0, line - 0.55) / 0.45)} />
        <g transform={`translate(${56 + 86 * line} ${88}) rotate(${-18 + line * 8})`}>
          <path d="M0 0 L28 -10" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M28 -10 L32 -18" stroke={blue} strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </PaperCard>
  );
};
