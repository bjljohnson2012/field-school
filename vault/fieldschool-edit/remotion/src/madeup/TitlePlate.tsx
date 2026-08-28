import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {displayFace, gold} from "./tokens";

type TitlePlateProps = {
  text: string;
  local: number;
  docked: boolean;
};

export const TitlePlate: React.FC<TitlePlateProps> = ({text, local, docked}) => {
  const enter = interpolate(local, [0, 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 220,
        width: docked ? 980 : 1760,
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: docked ? 64 : 88,
        lineHeight: 0.95,
        letterSpacing: "-0.03em",
        color: gold,
        opacity: enter,
        translate: `0px ${(1 - enter) * 28}px`,
      }}
    >
      {text}
    </div>
  );
};

export const CtaCard: React.FC<{text: string; local: number}> = ({text, local}) => {
  const enter = interpolate(local, [0, 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: enter,
      }}
    >
      <Img src={staticFile("brand/logo.svg")} style={{width: 160, height: 160, objectFit: "contain", marginBottom: 36}} />
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 64,
          color: gold,
          maxWidth: 1500,
          letterSpacing: "-0.03em",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const StingLockup: React.FC<{local: number}> = ({local}) => {
  const enter = interpolate(local, [0, 10], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: enter,
      }}
    >
      <Img src={staticFile("brand/logo.svg")} style={{width: 220, height: 220, objectFit: "contain"}} />
    </div>
  );
};
