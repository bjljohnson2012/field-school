import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {blue, ink, sansFace, stone} from "../../brand/tokens";
import {along, dash} from "../../draw";
import {PaperCard} from "./PaperCard";
import {PencilTip} from "./PencilTip";

type WaitingVignetteProps = {
  open: number;
  draw: number;
  solo: number;
};

export const WaitingVignette: React.FC<WaitingVignetteProps> = ({open, draw, solo}) => {
  const frame = useCurrentFrame();
  const live = interpolate(draw, [0.78, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tap = Math.sin(frame / 2.4) * 8 * live;
  const steam = (0.4 + 0.6 * Math.abs(Math.sin(frame / 5.2))) * live;
  const stamp = interpolate(draw, [0.88, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pencilOn = interpolate(draw, [0.02, 0.08, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const px = along(draw, [150, 150, 112, 188, 204]);
  const py = along(draw, [28, 86, 118, 138, 168]);
  const angle = along(draw, [-20, -8, 10, 16, 6]);
  const hour = (frame * 0.35) % 360;
  const minute = (frame * 2.4) % 360;
  const head = interpolate(draw, [0, 0.22], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const body = interpolate(draw, [0.2, 0.55], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const chair = interpolate(draw, [0, 0.18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const clock = interpolate(draw, [0.18, 0.42], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <PaperCard open={open} kicker="Waiting" caption="Still sitting there." solo={solo}>
      <svg width="360" height="200" viewBox="0 0 360 200" fill="none">
        <path d="M48 176 H250" stroke={stone} strokeWidth="2" {...dash(202, chair)} />
        <path d="M108 176 V132 H196 V176" stroke={stone} strokeWidth="2.6" {...dash(176, chair)} />
        <path d="M196 132 V78 H212 V176" stroke={stone} strokeWidth="2.6" {...dash(164, interpolate(draw, [0.08, 0.32], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <circle cx="150" cy="48" r="22" stroke={ink} strokeWidth="3.2" {...dash(138, head)} />
        <path d="M132 34 L146 44" stroke={ink} strokeWidth="3.6" strokeLinecap="round" {...dash(18, interpolate(draw, [0.16, 0.28], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M168 34 L154 44" stroke={ink} strokeWidth="3.6" strokeLinecap="round" {...dash(18, interpolate(draw, [0.18, 0.3], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <circle cx="141" cy="50" r="2.4" fill={ink} opacity={interpolate(draw, [0.24, 0.34], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
        <circle cx="159" cy="50" r="2.4" fill={ink} opacity={interpolate(draw, [0.26, 0.36], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
        <path d="M138 64 Q150 56 162 64" stroke={ink} strokeWidth="3" strokeLinecap="round" {...dash(28, interpolate(draw, [0.3, 0.42], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M150 70 L150 118" stroke={ink} strokeWidth="3.2" strokeLinecap="round" {...dash(48, body)} />
        <path d="M150 88 L108 104 L120 118 L150 100" stroke={ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" {...dash(108, interpolate(draw, [0.42, 0.64], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M150 88 L192 104 L180 118 L150 100" stroke={ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" {...dash(108, interpolate(draw, [0.46, 0.68], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <path d="M150 118 L124 172" stroke={ink} strokeWidth="3.2" strokeLinecap="round" {...dash(66, interpolate(draw, [0.58, 0.78], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}))} />
        <g transform={`translate(0 ${tap})`} opacity={interpolate(draw, [0.66, 0.86], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}>
          <path d="M150 118 L186 164" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M186 164 L204 158" stroke={blue} strokeWidth="3.4" strokeLinecap="round" />
        </g>
        <path d="M130 16 C124 6 136 2 140 14" stroke={stone} strokeWidth="2.2" strokeLinecap="round" opacity={steam} />
        <path d="M162 14 C158 2 172 0 174 13" stroke={stone} strokeWidth="2.2" strokeLinecap="round" opacity={steam} />
        <circle cx="292" cy="48" r="26" stroke={stone} strokeWidth="2.4" {...dash(164, clock)} />
        <path d="M292 26 V32" stroke={stone} strokeWidth="2" opacity={clock} />
        <path d="M292 64 V70" stroke={stone} strokeWidth="2" opacity={clock} />
        <path d="M270 48 H276" stroke={stone} strokeWidth="2" opacity={clock} />
        <path d="M308 48 H314" stroke={stone} strokeWidth="2" opacity={clock} />
        <g transform={`rotate(${minute} 292 48)`} opacity={interpolate(draw, [0.4, 0.55], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}>
          <path d="M292 48 L292 28" stroke={blue} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g transform={`rotate(${hour} 292 48)`} opacity={interpolate(draw, [0.4, 0.55], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}>
          <path d="M292 48 L306 54" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <PencilTip x={px} y={py} angle={angle} show={pencilOn} />
      </svg>
      <div
        style={{
          position: "absolute",
          right: 18,
          bottom: 8,
          border: `2.5px solid ${blue}`,
          color: blue,
          fontFamily: sansFace,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          padding: "5px 9px 4px",
          opacity: stamp,
          transform: `rotate(-12deg) scale(${0.74 + stamp * 0.26})`,
        }}
      >
        Wait
      </div>
    </PaperCard>
  );
};
