import React from "react";
import {Img, staticFile} from "remotion";
import {displayFace, gold, ink, uiFace} from "./tokens";

type BrandLockupProps = {
  local: number;
  title?: string;
  duration?: number;
};

const SLOGAN = "Lead yourself. Learn yourself. Do the work.";

export const BrandLockup: React.FC<BrandLockupProps> = ({local, title = "Everything Is Made Up", duration = 154}) => {
  if (local < 0 || local >= duration) {
    return null;
  }
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
        opacity: 1,
      }}
    >
      <Img
        src={staticFile("isolated-seal.png")}
        style={{
          width: 128,
          height: 128,
          objectFit: "contain",
          marginBottom: 18,
        }}
      />
      <Img
        src={staticFile("wordmark-transparent.png")}
        style={{
          width: 1320,
          height: 240,
          objectFit: "contain",
          objectPosition: "center",
        }}
      />
      <div
        style={{
          marginTop: 16,
          fontFamily: uiFace,
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: "0.08em",
          color: ink,
        }}
      >
        {SLOGAN}
      </div>
      <div
        style={{
          width: 240,
          height: 4,
          marginTop: 24,
          backgroundColor: gold,
        }}
      />
      <div
        style={{
          marginTop: 20,
          width: 1500,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 72,
          letterSpacing: "-0.04em",
          color: ink,
        }}
      >
        {title}
      </div>
    </div>
  );
};

export const BrandBug: React.FC<{open: number}> = ({open}) => {
  if (open <= 0) {
    return null;
  }
  return (
    <Img
      src={staticFile("isolated-seal.png")}
      style={{
        position: "absolute",
        right: 36,
        bottom: 28,
        width: 84,
        height: 84,
        objectFit: "contain",
        opacity: 0.72 * open,
      }}
    />
  );
};
