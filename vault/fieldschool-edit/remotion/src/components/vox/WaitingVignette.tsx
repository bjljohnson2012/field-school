import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {blue, ink, stone} from "../../brand/tokens";
import {along, dash} from "../../draw";
import {PaperCard} from "./PaperCard";
import {PencilTip} from "./PencilTip";

type WaitingVignetteProps = {
  open: number;
  solo: number;
};

export const WaitingVignette: React.FC<WaitingVignetteProps> = ({open, solo}) => {
  const frame = useCurrentFrame();
  const draw = interpolate(open, [0.12, 0.78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const live = interpolate(draw, [0.72, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tap = Math.sin(frame / 2.4) * 8 * live;
  const steam = (0.45 + 0.55 * Math.abs(Math.sin(frame / 5.2))) * live;
  const stamp = interpolate(open, [0.82, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pencilOn = interpolate(draw, [0.02, 0.08, 0.92, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const px = along(draw, [118, 118, 88, 150, 162]);
  const py = along(draw, [22, 70, 100, 118, 148]);
  const angle = along(draw, [-22, -8, 12, 18, 8]);
  const hour = (frame * 0.35) % 360;
  const minute = (frame * 2.4) % 360;
  return (
    <PaperCard open={open} kicker="Waiting" solo={solo}>
      <svg width="260" height="176" viewBox="0 0 260 176" fill="none">
        <path d="M72 150 H168" stroke={stone} strokeWidth="2" {...dash(96, draw)} />
        <path d="M86 150 V118 H154 V150" stroke={stone} strokeWidth="2.5" {...dash(150, draw)} />
        <path d="M154 118 L176 86" stroke={stone} strokeWidth="2.5" {...dash(50, interpolate(draw, [0.15, 0.45], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <circle cx="120" cy="40" r="18" stroke={ink} strokeWidth="3" {...dash(114, interpolate(draw, [0, 0.28], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M108 32 L116 38" stroke={ink} strokeWidth="3" strokeLinecap="round" {...dash(12, interpolate(draw, [0.22, 0.34], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M132 32 L124 38" stroke={ink} strokeWidth="3" strokeLinecap="round" {...dash(12, interpolate(draw, [0.24, 0.36], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <circle cx="113" cy="42" r="2" fill={ink} opacity={interpolate(draw, [0.3, 0.4], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
        <circle cx="127" cy="42" r="2" fill={ink} opacity={interpolate(draw, [0.32, 0.42], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
        <path d="M111 52 Q120 46 129 52" stroke={ink} strokeWidth="2.5" strokeLinecap="round" {...dash(22, interpolate(draw, [0.36, 0.48], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M120 58 L120 96" stroke={ink} strokeWidth="3" strokeLinecap="round" {...dash(38, interpolate(draw, [0.4, 0.58], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M120 72 L86 86 L96 98 L120 84" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...dash(86, interpolate(draw, [0.5, 0.7], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M120 72 L154 86 L144 98 L120 84" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...dash(86, interpolate(draw, [0.54, 0.74], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M120 96 L98 148" stroke={ink} strokeWidth="3" strokeLinecap="round" {...dash(58, interpolate(draw, [0.62, 0.82], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <g transform={`translate(0 ${tap})`} opacity={interpolate(draw, [0.68, 0.86], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}>
          <path d="M120 96 L150 140" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M150 140 L164 136" stroke={blue} strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="M104 14 C100 6 108 2 112 10" stroke={stone} strokeWidth="2" strokeLinecap="round" opacity={steam} />
        <path d="M128 12 C126 3 136 1 138 10" stroke={stone} strokeWidth="2" strokeLinecap="round" opacity={steam} />
        <circle cx="210" cy="40" r="18" stroke={stone} strokeWidth="2" {...dash(114, interpolate(draw, [0.2, 0.5], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <g transform={`rotate(${minute} 210 40)`} opacity={interpolate(draw, [0.45, 0.6], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}>
          <path d="M210 40 L210 26" stroke={blue} strokeWidth="2" strokeLinecap="round" />
        </g>
        <g transform={`rotate(${hour} 210 40)`} opacity={interpolate(draw, [0.45, 0.6], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}>
          <path d="M210 40 L220 44" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        </g>
        <g transform={`translate(188 118) rotate(-12) scale(${0.72 + stamp * 0.28})`} opacity={stamp}>
          <rect x="-30" y="-16" width="60" height="32" stroke={blue} strokeWidth="2.5" />
          <path d="M-22 8 L-18 -8 L-14 4 L-10 -8 L-6 8" stroke={blue} strokeWidth="2" strokeLinejoin="round" />
          <path d="M0 8 L6 -8 L12 8 M2 2 H10" stroke={blue} strokeWidth="2" />
          <path d="M18 -8 V16" stroke={blue} strokeWidth="2" />
          <path d="M26 -8 H38 M32 -8 V8" stroke={blue} strokeWidth="2" />
        </g>
        <PencilTip x={px} y={py} angle={angle} show={pencilOn} />
      </svg>
    </PaperCard>
  );
};
