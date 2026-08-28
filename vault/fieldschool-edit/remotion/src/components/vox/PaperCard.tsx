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
  const top = interpolate(solo, [0, 1], [648, 688], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const unfold = 0.1 + open * 0.9;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: field,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(open, [0, 0.18, 1], [0, 1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${(1 - open) * 36}px) rotate(${(1 - open) * -5}deg)`,
      }}
    >
      <div
        style={{
          width: 300,
          backgroundColor: cream,
          border: `2px solid ${stone}`,
          boxShadow: `${4 + open * 4}px ${8 + open * 6}px 0 ${ink}16`,
          padding: "20px 20px 18px",
          transform: `scaleX(${unfold})`,
          transformOrigin: "left center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            backgroundColor: `${stone}33`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 118,
            top: -7,
            width: 56,
            height: 12,
            backgroundColor: `${stone}55`,
            transform: "rotate(-3deg)",
          }}
        />
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
        <div style={{width: 80 * open, height: 2, backgroundColor: stone, marginBottom: 14}} />
        {children}
      </div>
    </div>
  );
};
