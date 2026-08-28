import React from "react";
import {Img, interpolate, staticFile} from "remotion";
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
  const wash = interpolate(local, [0, 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const push = interpolate(local, [0, 90], [1, 1.02], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: paper, opacity: wash, scale: `${push}`}}>
      {text ? (
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 56,
            color: ink,
            maxWidth: 1500,
            letterSpacing: "-0.03em",
          }}
        >
          {text}
        </div>
      ) : null}
      <div style={{position: "absolute", left: 72, top: text ? 220 : 120, display: "flex", gap: 28, flexWrap: "wrap", width: 1780}}>
        {assets.map((src, i) => {
          const enter = interpolate(local, [2 + i * 4, 6 + i * 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const marked = stamps > i;
          return (
            <div
              key={src}
              style={{
                width: assets.length > 3 ? 320 : 480,
                height: assets.length > 3 ? 240 : 320,
                backgroundColor: paper,
                outline: `3px solid ${ink}`,
                overflow: "hidden",
                opacity: enter,
                translate: `0px ${(1 - enter) * 28}px`,
                rotate: `${(1 - enter) * -2}deg`,
                position: "relative",
              }}
            >
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
                  }}
                >
                  X
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {list && list.length > 0 ? (
        <div style={{position: "absolute", left: 120, top: 200, width: 1600}}>
          {list.map((line, i) => {
            const enter = interpolate(local, [2 + i * 4, 6 + i * 4], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const hot = spoken.some((needle) => line.toLowerCase().includes(needle));
            return (
              <div
                key={line}
                style={{
                  fontFamily: displayFace,
                  fontWeight: 700,
                  fontSize: 42,
                  color: hot ? gold : ink,
                  opacity: enter,
                  marginBottom: 28,
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      ) : null}
      {chips && chips.length > 0 ? (
        <div style={{position: "absolute", left: 72, bottom: 200, display: "flex", gap: 16, flexWrap: "wrap", width: 1700}}>
          {chips.map((chip, i) => {
            const enter = interpolate(local, [10 + i * 4, 14 + i * 4], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={chip}
                style={{
                  fontFamily: uiFace,
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "0.12em",
                  color: paper,
                  backgroundColor: ink,
                  padding: "12px 18px",
                  opacity: enter,
                }}
              >
                {chip}
              </div>
            );
          })}
        </div>
      ) : null}
      {annotation ? (
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: 180,
            fontFamily: uiFace,
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: "0.14em",
            color: wine,
            opacity: interpolate(local, [18, 26], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
            outline: `3px solid ${gold}`,
            padding: "10px 16px",
          }}
        >
          {annotation}
        </div>
      ) : null}
    </div>
  );
};

export const VoxWall = CollageBeat;
