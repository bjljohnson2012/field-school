import {fitText} from "@remotion/layout-utils";
import React, {useEffect, useMemo, useState} from "react";
import {Img, interpolate, spring, staticFile, useDelayRender, useVideoConfig} from "remotion";
import {waitMadeUpFonts} from "./fonts";
import {displayFace, gold, ink, paper, uiFace, wine} from "./tokens";

export type CollageBeatProps = {
  assets: string[];
  text: string;
  annotation?: string;
  chips?: string[];
  list?: string[];
  local: number;
  stamps?: number;
  spoken?: string[];
};

const cardSize = (n: number): {w: number; h: number} => {
  if (n <= 1) {
    return {w: 1080, h: 720};
  }
  if (n === 2) {
    return {w: 760, h: 500};
  }
  if (n === 3) {
    return {w: 540, h: 380};
  }
  if (n === 5) {
    return {w: 540, h: 360};
  }
  return {w: 400, h: 300};
};

export const CollageBeat: React.FC<CollageBeatProps> = ({
  assets,
  text,
  annotation,
  chips,
  list,
  local,
  stamps = 0,
  spoken = [],
}) => {
  const {fps} = useVideoConfig();
  const {delayRender, continueRender} = useDelayRender();
  const [handle] = useState(() => delayRender("vox-fonts"));
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
  const hero = /^(60 DAYS|FIVE QUESTIONS)$/i.test(text);
  const wash = interpolate(local, [0, 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const {w: cardW, h: cardH} = cardSize(assets.length);
  const headline = useMemo(() => {
    if (!ready || !text) {
      return 72;
    }
    try {
      return Math.min(
        list && list.length > 0 ? 96 : hero || assets.length === 1 ? 200 : assets.length > 3 ? 88 : 120,
        fitText({
          text,
          withinWidth: assets.length === 1 ? 1760 : 1680,
          fontFamily: displayFace,
          fontWeight: "700",
        }).fontSize,
      );
    } catch {
      return 72;
    }
  }, [assets.length, hero, list, ready, text]);
  if (!ready) {
    return null;
  }
  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: paper, opacity: wash}}>
      {text ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: /^60 DAYS$/i.test(text) ? 280 : 64,
            width: 1760,
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: headline,
            lineHeight: 0.92,
            color: ink,
            letterSpacing: "-0.04em",
            textAlign: /^60 DAYS$/i.test(text) ? "center" : "left",
          }}
        >
          {/^60 DAYS$/i.test(text) ? (
            <>
              <div style={{fontSize: 280, letterSpacing: "-0.06em"}}>60</div>
              <div style={{fontSize: 92, color: wine, letterSpacing: "0.12em"}}>DAYS</div>
            </>
          ) : (
            text
          )}
        </div>
      ) : null}
      {list && list.length > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 200,
            width: 1720,
            height: 760,
          }}
        >
          {list.map((line, i) => {
            const enter = spring({
              frame: Math.max(0, local - 2 - i * 4),
              fps,
              durationInFrames: 14,
              config: {damping: 16, mass: 0.6, stiffness: 150},
            });
            const hot = spoken.some((needle) => line.toLowerCase().includes(needle));
            return (
              <div
                key={line}
                style={{
                  fontFamily: displayFace,
                  fontWeight: 700,
                  fontSize: 64,
                  lineHeight: 1.18,
                  color: hot ? wine : ink,
                  opacity: enter,
                  translate: `0px ${(1 - enter) * 24}px`,
                  marginBottom: 18,
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      ) : assets.length > 0 && !/^60 DAYS$/i.test(text) ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: text ? 220 : 140,
            width: 1760,
            height: 720,
            display: "flex",
            gap: 28,
            flexWrap: "wrap",
            alignContent: "center",
            justifyContent: assets.length <= 1 ? "center" : "flex-start",
          }}
        >
          {assets.map((src, i) => {
            const enter = spring({
              frame: Math.max(0, local - 2 - i * 4),
              fps,
              durationInFrames: 16,
              config: {damping: 13, mass: 0.55, stiffness: 170},
            });
            const tilt = (i % 2 === 0 ? -1 : 1) * (1.6 + (i % 3));
            const marked = stamps > i;
            return (
              <div
                key={src}
                style={{
                  width: cardW,
                  height: cardH,
                  backgroundColor: paper,
                  padding: 14,
                  boxSizing: "border-box",
                  outline: `3px solid ${ink}`,
                  boxShadow: `0 18px 36px ${ink}2e`,
                  opacity: enter,
                  scale: `${0.86 + enter * 0.14}`,
                  rotate: `${tilt}deg`,
                  translate: `0px ${(1 - enter) * 36}px`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -8,
                    width: 92,
                    height: 18,
                    marginLeft: -46,
                    backgroundColor: gold,
                    opacity: 0.85,
                  }}
                />
                <Img
                  src={staticFile(`episodes/everything-made-up/${src}`)}
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
                {marked ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: displayFace,
                      fontWeight: 700,
                      fontSize: 180,
                      color: wine,
                      opacity: 0.92,
                      rotate: "-8deg",
                    }}
                  >
                    X
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {chips && chips.length > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 88,
            width: 1760,
            display: "flex",
            gap: 18,
          }}
        >
          {chips.map((chip, i) => {
            const enter = spring({
              frame: Math.max(0, local - 10 - i * 4),
              fps,
              durationInFrames: 12,
              config: {damping: 14, mass: 0.5, stiffness: 180},
            });
            return (
              <div
                key={chip}
                style={{
                  fontFamily: uiFace,
                  fontWeight: 600,
                  fontSize: 26,
                  letterSpacing: "0.14em",
                  color: paper,
                  backgroundColor: i === 0 ? wine : ink,
                  padding: "14px 22px",
                  opacity: enter,
                  rotate: `${(i % 2 === 0 ? -1 : 1) * 1.4}deg`,
                  scale: `${0.9 + enter * 0.1}`,
                }}
              >
                {chip}
              </div>
            );
          })}
        </div>
      ) : null}
      {annotation && !(chips && chips.length > 0) ? (
        <div
          style={{
            position: "absolute",
            right: 88,
            bottom: 96,
            fontFamily: uiFace,
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: "0.12em",
            color: wine,
            outline: `3px solid ${gold}`,
            padding: "12px 18px",
            opacity: interpolate(local, [16, 26], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
          }}
        >
          {annotation}
        </div>
      ) : null}
    </div>
  );
};

export const VoxWall = CollageBeat;
