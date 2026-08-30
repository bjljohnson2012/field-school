import React from "react";
import {blue, ink} from "../../brand/tokens";

type PencilTipProps = {
  x: number;
  y: number;
  angle: number;
  show: number;
};

export const PencilTip: React.FC<PencilTipProps> = ({x, y, angle, show}) => {
  if (show <= 0.04) {
    return null;
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} opacity={show}>
      <path d="M0 0 L22 -8 L26 -18" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 -8 L26 -18" stroke={blue} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
};
