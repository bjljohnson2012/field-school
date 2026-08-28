import React from "react";
import {interpolate} from "remotion";
import {sansFace, stone} from "../../brand/tokens";

type WaitingTrapProps = {
  solo: number;
};

export const WaitingTrap: React.FC<WaitingTrapProps> = ({solo}) => {
  if (solo <= 0) {
    return null;
  }
  const rise = interpolate(solo, [0, 1], [12, 0], {extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 214,
        width: 1920,
        textAlign: "center",
        opacity: solo,
        transform: `translateY(${rise}px)`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontSize: 15,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: stone,
        }}
      >
        Waiting Trap
      </div>
    </div>
  );
};
