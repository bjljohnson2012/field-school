import React from "react";
import {useCurrentFrame} from "remotion";
import {blue, ink, stone} from "../../brand/tokens";
import {PaperCard} from "./PaperCard";

type WaitingVignetteProps = {
  open: number;
  solo: number;
};

export const WaitingVignette: React.FC<WaitingVignetteProps> = ({open, solo}) => {
  const frame = useCurrentFrame();
  const tap = Math.sin(frame / 2.4) * 7;
  return (
    <PaperCard open={open} kicker="Waiting" solo={solo}>
      <svg width="240" height="168" viewBox="0 0 240 168" fill="none">
        <circle cx="120" cy="38" r="20" stroke={ink} strokeWidth="3" />
        <path d="M104 30 L116 36" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        <path d="M136 30 L124 36" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        <circle cx="112" cy="40" r="2.2" fill={ink} />
        <circle cx="128" cy="40" r="2.2" fill={ink} />
        <path d="M110 52 Q120 46 130 52" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M120 58 L120 104" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        <path d="M120 78 L86 94 L92 104" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 78 L154 94 L148 104" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 104 L96 150" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        <g transform={`translate(0 ${tap})`}>
          <path d="M120 104 L148 142" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M148 142 L160 138" stroke={blue} strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="196" cy="36" r="16" stroke={stone} strokeWidth="2" />
        <path d="M196 36 L196 26" stroke={blue} strokeWidth="2" strokeLinecap="round" />
        <path d="M196 36 L204 40" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </PaperCard>
  );
};
