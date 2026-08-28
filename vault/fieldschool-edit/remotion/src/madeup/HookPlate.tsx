import React from "react";
import {interpolate} from "remotion";
import {displayFace, gold, paper} from "./tokens";

type HookPlateProps = {
  text: string;
  local: number;
  second?: boolean;
};

export const HookPlate: React.FC<HookPlateProps> = ({text, local, second = false}) => {
  const enter = interpolate(local, [0, 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: second ? 520 : 280,
        width: 1760,
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: second ? 92 : 108,
        lineHeight: 0.95,
        letterSpacing: "-0.04em",
        color: second ? gold : paper,
        opacity: enter,
        translate: `0px ${(1 - enter) * 36}px`,
      }}
    >
      {text}
    </div>
  );
};
