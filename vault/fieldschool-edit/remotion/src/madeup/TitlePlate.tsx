import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {Img, interpolate, spring, staticFile, useDelayRender, useVideoConfig} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {TYPE_COL, displayFace, gold, paper} from "./tokens";

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
    durationInFrames: 12,
    config: {damping: 10, mass: 0.5, stiffness: 200},
  });
  const hold = interpolate(local, [90, 120], [1, 0.28], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
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
        translate: `0px ${(1 - enter) * 24}px`,
      }}
    >
      <div style={{width: 72, height: 4, backgroundColor: gold, marginBottom: 18}} />
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
    durationInFrames: 16,
    config: {damping: 11, mass: 0.5, stiffness: 190},
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
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{
          width: 920,
          height: 160,
          objectFit: "contain",
          marginBottom: 28,
          scale: `${0.86 + enter * 0.14}`,
        }}
      />
      <div style={{width: 120, height: 3, backgroundColor: gold, marginBottom: 28, opacity: enter}} />
      {lines.map((line, i) => (
        <div
          key={line}
          style={{
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: i === 1 ? 72 : 88,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: i === 1 ? gold : paper,
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
