import React from "react";
import {interpolate} from "remotion";
import {cream, headReservedPx, ink, sansFace, stone} from "../../brand/tokens";

type PaperCardProps = {
  open: number;
  kicker: string;
  caption: string;
  children: React.ReactNode;
  solo: number;
};

export const PaperCard: React.FC<PaperCardProps> = ({open, kicker, caption, children, solo}) => {
  if (open <= 0) {
    return null;
  }
  const field = interpolate(solo, [0, 1], [1920 - headReservedPx(), 1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const top = interpolate(solo, [0, 1], [612, 652], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const unfold = 0.12 + open * 0.88;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: field,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(open, [0, 0.16, 1], [0, 1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${(1 - open) * 36}px) rotate(${(1 - open) * -5}deg)`,
      }}
    >
      <div
        style={{
          width: 400,
          backgroundColor: cream,
          border: `2px solid ${stone}`,
          boxShadow: `${4 + open * 4}px ${8 + open * 6}px 0 ${ink}16`,
          padding: "18px 20px 16px",
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
            left: 172,
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
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: stone,
            marginBottom: 8,
          }}
        >
          {kicker}
        </div>
        <div style={{width: 96 * open, height: 2, backgroundColor: stone, marginBottom: 12}} />
        <div style={{position: "relative"}}>{children}</div>
        <div
          style={{
            marginTop: 10,
            fontFamily: sansFace,
            fontSize: 15,
            letterSpacing: "-0.01em",
            color: ink,
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  );
};
