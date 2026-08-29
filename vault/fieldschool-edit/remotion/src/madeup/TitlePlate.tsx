import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {Img, interpolate, spring, staticFile, useDelayRender, useVideoConfig} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {TYPE_COL, displayFace, gold, ink} from "./tokens";

type TitlePlateProps = {
  text: string;
  local: number;
  docked: boolean;
};

export const TitlePlate: React.FC<TitlePlateProps> = ({text, local, docked}) => {
  const {fps} = useVideoConfig();
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender("title-fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    waitMadeUpFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [continueRender, handle]);
  const width = docked ? TYPE_COL : 1680;
  const cap = docked ? 72 : 96;
  const fontSize = useMemo(() => {
    if (!ready) {
      return cap;
    }
    try {
      return Math.min(
        cap,
        fitText({
          text,
          withinWidth: width,
          fontFamily: displayFace,
          fontWeight: "700",
        }).fontSize,
      );
    } catch {
      return cap;
    }
  }, [cap, ready, text, width]);
  const enter = spring({
    frame: local,
    fps,
    durationInFrames: 10,
    config: {damping: 8, mass: 0.4, stiffness: 250},
  });
  const rule = spring({
    frame: local - 2,
    fps,
    durationInFrames: 10,
    config: {damping: 14, mass: 0.4, stiffness: 220},
  });
  const hold = interpolate(local, [180, 240], [1, 0.72], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (!ready) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 88,
        top: 96,
        width,
        opacity: enter * hold,
        translate: `0px ${(1 - enter) * 36}px`,
      }}
    >
      <div style={{width: 96, height: 5, backgroundColor: gold, marginBottom: 18, scale: `${rule} 1`}} />
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize,
          lineHeight: 0.95,
          letterSpacing: "-0.035em",
          color: gold,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const CTA_LINES = ["CHANGE IT", "WITH THE REASON", "IN HAND"];

export const CtaCard: React.FC<{text: string; local: number}> = ({text, local}) => {
  const {fps} = useVideoConfig();
  const enter = spring({
    frame: local,
    fps,
    durationInFrames: 14,
    config: {damping: 8, mass: 0.42, stiffness: 240},
  });
  const lines = text === "CHANGE IT WITH THE REASON IN HAND" ? CTA_LINES : [text];
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
      <Img
        src={staticFile("wordmark-transparent.png")}
        style={{
          width: 980,
          height: 180,
          objectFit: "contain",
          marginBottom: 22,
          scale: `${interpolate(enter, [0, 1], [1.18, 1])}`,
        }}
      />
      <div style={{width: 160, height: 4, backgroundColor: gold, marginBottom: 28, scale: `${enter} 1`}} />
      {lines.map((line, i) => (
        <div
          key={line}
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: i === 1 ? 72 : 88,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: i === 1 ? gold : ink,
            translate: `0px ${(1 - enter) * (20 + i * 8)}px`,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

export {BrandLockup as StingLockup} from "./BrandLockup";
