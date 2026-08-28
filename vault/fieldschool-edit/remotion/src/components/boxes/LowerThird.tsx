import React from "react";
import {interpolate} from "remotion";
import {headReservedPx, ink, sansFace, stone} from "../../brand/tokens";

type LowerThirdProps = {
  title: string;
  kicker: string;
  solo: number;
};

export const LowerThird: React.FC<LowerThirdProps> = ({title, kicker, solo}) => {
  const openField = interpolate(solo, [0.88, 0.99], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fieldWidth = interpolate(openField, [0, 1], [1920 - headReservedPx(), 1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 64,
        width: fieldWidth,
        textAlign: "center",
        opacity: 1 - solo,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 13,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: stone,
        }}
      >
        {kicker}
      </div>
      <div style={{fontFamily: sansFace, fontSize: 22, fontWeight: 400, color: ink, marginTop: 6}}>{title}</div>
    </div>
  );
};
