import React from "react";
import {AbsoluteFill} from "remotion";
import {cream, displayFace, ink} from "./brand";

export const Intro: React.FC<{title: string}> = ({title}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: cream,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 72,
          color: ink,
          letterSpacing: "-0.03em",
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
