import React from "react";
import {interpolate} from "remotion";
import {cream, headReservedPx, ink, sansFace, stone} from "../../brand/tokens";

type PaperCardProps = {
  open: number;
  kicker: string;
  children: React.ReactNode;
  solo: number;
};

export const PaperCard: React.FC<PaperCardProps> = ({open, kicker, children, solo}) => {
  if (open <= 0) {
    return null;
  }
  const field = interpolate(solo, [0, 1], [1920 - headReservedPx(), 1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const top = interpolate(solo, [0, 1], [668, 702], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: field,
        display: "flex",
        justifyContent: "center",
        opacity: open,
        transform: `translateY(${(1 - open) * 28}px) rotate(${(1 - open) * -4}deg)`,
      }}
    >
      <div
        style={{
          width: 280,
          backgroundColor: cream,
          border: `2px solid ${stone}`,
          boxShadow: `6px 10px 0 ${ink}14`,
          padding: "16px 18px 18px",
          transform: `scaleX(${0.18 + open * 0.82})`,
          transformOrigin: "left center",
        }}
      >
        <div
          style={{
            fontFamily: sansFace,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: stone,
            marginBottom: 10,
          }}
        >
          {kicker}
        </div>
        <div style={{width: 72 * open, height: 2, backgroundColor: stone, marginBottom: 14}} />
        {children}
      </div>
    </div>
  );
};
