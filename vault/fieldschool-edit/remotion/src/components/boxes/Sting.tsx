import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {displayFace, gold, paper} from "../../brand/tokens";

export const Sting: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 4, 18, 24], [0, 1, 1, 0], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: paper, opacity: fade}}>
      <Img
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{position: "absolute", left: 460, top: 380, width: 1000, height: 200, objectFit: "contain"}}
      />
      <div style={{position: "absolute", left: 0, top: 0, width: 18, height: 1080, backgroundColor: gold}} />
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 80,
          fontFamily: displayFace,
          fontSize: 22,
          color: gold,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Field School
      </div>
    </div>
  );
};
