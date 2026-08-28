import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {displayFace, gold, ink, paper, sansFace} from "../../brand/tokens";

type NextUpProps = {
  module: string;
  title: string;
};

export const NextUp: React.FC<NextUpProps> = ({module, title}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: paper, opacity: fade, padding: "120px 96px"}}>
      <div style={{fontFamily: sansFace, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, fontSize: 18}}>
        Next up
      </div>
      <div
        style={{
          fontFamily: sansFace,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: ink,
          fontSize: 16,
          marginTop: 10,
          opacity: 0.7,
        }}
      >
        {module}
      </div>
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 68,
          letterSpacing: "-0.03em",
          color: ink,
          marginTop: 32,
          maxWidth: 1400,
        }}
      >
        {title}
      </div>
    </div>
  );
};
