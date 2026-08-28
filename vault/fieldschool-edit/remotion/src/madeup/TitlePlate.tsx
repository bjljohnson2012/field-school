import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {Img, interpolate, staticFile, useDelayRender} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {HOOK_FULL, INSET, TYPE_COL, displayFace, gold} from "./tokens";

type TitlePlateProps = {
  text: string;
  local: number;
  docked: boolean;
};

export const TitlePlate: React.FC<TitlePlateProps> = ({text, local, docked}) => {
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
  const width = docked ? TYPE_COL : HOOK_FULL;
  const cap = docked ? 64 : 88;
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
  const enter = interpolate(local, [0, 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (!ready) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: INSET,
        top: 200,
        width,
        overflow: "hidden",
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize,
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
