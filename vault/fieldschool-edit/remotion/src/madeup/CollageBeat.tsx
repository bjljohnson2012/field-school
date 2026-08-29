import {fitText} from "@remotion/layout-utils";
import React, {useMemo} from "react";
import {Img, spring, staticFile, useVideoConfig} from "remotion";
import {hasHeard} from "./spoken";
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

const lineNeedles = (line: string): string[] => {
  const raw = line.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").trim();
  if (raw === "left out") {
    return ["left", "leave", "out"];
  }
  return raw.split(/\s+/).filter(Boolean);
};

const heardLine = (spoken: string[], line: string): boolean => {
  const raw = line.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").trim();
  if (raw === "left out") {
    return hasHeard(spoken, ["left", "leave"]) && hasHeard(spoken, ["out"]);
  }
  return hasHeard(spoken, lineNeedles(line));
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
  const enter = spring({
    frame: local,
    fps,
    durationInFrames: 8,
    config: {damping: 14, mass: 0.45, stiffness: 260},
  });
  const hero = /^(60 DAYS|FIVE QUESTIONS)$/i.test(text);
  const ask = /^ASK$/i.test(text);
  const giant = !list && assets.length === 0 && text.length > 0 && text.length <= 28 && !/^60 DAYS$/i.test(text);
  const {w: cardW, h: cardH} = cardSize(assets.length);
  const headline = useMemo(() => {
    if (!text) {
      return 72;
    }
    try {
      return Math.min(
        list && list.length > 0 ? 96 : giant ? 168 : hero || assets.length === 1 ? 200 : assets.length > 3 ? 88 : 120,
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
  }, [assets.length, giant, hero, list, text]);
  const visibleList = (list || []).filter((line) => heardLine(spoken, line));
  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: paper, opacity: 1, scale: `${0.94 + enter * 0.06}`}}>
      {text ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: /^60 DAYS$/i.test(text) ? 280 : giant ? 340 : 64,
            width: 1760,
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: headline,
            lineHeight: 0.92,
            color: ink,
            letterSpacing: "-0.04em",
            textAlign: /^60 DAYS$/i.test(text) || giant ? "center" : "left",
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
            left: ask ? 160 : 120,
            top: ask ? 240 : 200,
            width: 1680,
            height: 760,
          }}
        >
          {visibleList.map((line) => (
            <div
              key={line}
              style={{
                fontFamily: displayFace,
                fontWeight: 700,
                fontSize: ask ? 72 : 58,
                lineHeight: 1.16,
                color: wine,
                opacity: 1,
                marginBottom: ask ? 22 : 16,
              }}
            >
              {line}
            </div>
          ))}
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
                  rotate: `${tilt}deg`,
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
            const hot = hasHeard(spoken, lineNeedles(chip));
            return (
              <div
                key={chip}
                style={{
                  fontFamily: uiFace,
                  fontWeight: 600,
                  fontSize: 26,
                  letterSpacing: "0.14em",
                  color: paper,
                  backgroundColor: hot ? wine : ink,
                  padding: "14px 22px",
                  rotate: `${(i % 2 === 0 ? -1 : 1) * 1.4}deg`,
                  opacity: hot ? 1 : 0,
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
            opacity: 1,
          }}
        >
          {annotation}
        </div>
      ) : null}
    </div>
  );
};

export const VoxWall = CollageBeat;
