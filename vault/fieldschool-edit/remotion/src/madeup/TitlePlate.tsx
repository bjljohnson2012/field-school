import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {Img, interpolate, spring, staticFile, useDelayRender, useVideoConfig} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {TYPE_COL, displayFace, gold, paper, uiFace} from "./tokens";

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
    durationInFrames: 16,
    config: {damping: 15, mass: 0.6, stiffness: 150},
  });
  const hold = interpolate(local, [70, 96], [1, 0.22], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
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
    durationInFrames: 20,
    config: {damping: 16, mass: 0.65, stiffness: 140},
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
        src={staticFile("brand/logo.svg")}
        style={{
          width: 140,
          height: 140,
          objectFit: "contain",
          marginBottom: 28,
          scale: `${0.82 + enter * 0.18}`,
        }}
      />
      <div style={{width: 96, height: 3, backgroundColor: gold, marginBottom: 28, opacity: enter}} />
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

export const StingLockup: React.FC<{local: number}> = ({local}) => {
  const {fps} = useVideoConfig();
  const enter = spring({
    frame: local,
    fps,
    durationInFrames: 22,
    config: {damping: 14, mass: 0.55, stiffness: 160},
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: enter,
      }}
    >
      <Img
        src={staticFile("brand/logo.svg")}
        style={{
          width: 240,
          height: 240,
          objectFit: "contain",
          scale: `${interpolate(enter, [0, 1], [1.18, 1])}`,
        }}
      />
      <div
        style={{
          marginTop: 28,
          fontFamily: uiFace,
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: "0.22em",
          color: gold,
          opacity: interpolate(local, [12, 24], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        }}
      >
        FIELD SCHOOL
      </div>
    </div>
  );
};
