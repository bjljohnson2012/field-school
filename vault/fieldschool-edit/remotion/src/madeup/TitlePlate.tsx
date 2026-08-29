import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {Img, interpolate, staticFile, useDelayRender} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {TYPE_COL, displayFace, gold, ink} from "./tokens";

type TitlePlateProps = {
  text: string;
  local: number;
  docked: boolean;
};

export const TitlePlate: React.FC<TitlePlateProps> = ({text, local: _local, docked}) => {
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
  if (!ready && !text) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 88,
        top: 96,
        width,
        opacity: 1,
      }}
    >
      <div style={{width: 96, height: 5, backgroundColor: gold, marginBottom: 18}} />
      <div
        style={{
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize,
          lineHeight: 0.95,
          letterSpacing: "-0.035em",
          color: ink,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const CTA_LINES = ["CHANGE IT", "WITH THE REASON", "IN HAND"];

export const CtaCard: React.FC<{text: string; local: number}> = ({text, local}) => {
  const leave = interpolate(local, [160, 200], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
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
        opacity: leave,
      }}
    >
      <Img
        src={staticFile("wordmark-transparent.png")}
        style={{
          width: 1100,
          height: 200,
          objectFit: "contain",
          marginBottom: 22,
        }}
      />
      <div style={{width: 160, height: 4, backgroundColor: gold, marginBottom: 28}} />
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
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

export {BrandLockup as StingLockup} from "./BrandLockup";
