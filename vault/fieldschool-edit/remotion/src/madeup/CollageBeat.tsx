import React from "react";
import {Img, interpolate, staticFile} from "remotion";
import {
  INSET,
  VOX_CARDS_BOTTOM,
  VOX_CARDS_TOP,
  VOX_HEADLINE_TOP,
  VOX_META_TOP,
  displayFace,
  gold,
  ink,
  paper,
  uiFace,
  wine,
} from "./tokens";

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
  const n = Math.max(assets.length, 1);
  const cardW = n > 3 ? 300 : n === 3 ? 520 : 640;
  const cardH = n > 3 ? 200 : 360;
  const push = interpolate(local, [0, 90], [1, 1.02], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: paper, opacity: wash}}>
      {text ? (
        <div
          style={{
            position: "absolute",
            left: INSET,
            top: VOX_HEADLINE_TOP,
            width: 1600,
            height: 128,
            overflow: "hidden",
            fontFamily: displayFace,
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.15,
            color: ink,
            letterSpacing: "-0.03em",
          }}
        >
          {text}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: INSET,
          top: VOX_CARDS_TOP,
          width: 1776,
          height: VOX_CARDS_BOTTOM - VOX_CARDS_TOP,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignContent: "flex-start",
          overflow: "hidden",
        }}
      >
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
                width: cardW,
                height: cardH,
                backgroundColor: paper,
                outline: `3px solid ${ink}`,
                overflow: "hidden",
                opacity: enter,
                translate: `0px ${(1 - enter) * 28}px`,
                position: "relative",
              }}
            >
              <Img
                src={staticFile(`episodes/everything-made-up/${src}`)}
                style={{width: "100%", height: "100%", objectFit: "cover", scale: `${push}`}}
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
                    fontSize: 160,
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
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 200,
            width: 1600,
            height: 640,
            overflow: "hidden",
          }}
        >
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
                  fontSize: 40,
                  lineHeight: 1.2,
                  color: hot ? gold : ink,
                  opacity: enter,
                  marginBottom: 22,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      ) : null}
      {chips && chips.length > 0 ? (
        <div
          style={{
            position: "absolute",
            left: INSET,
            top: VOX_META_TOP,
            width: 1400,
            height: 80,
            display: "flex",
            gap: 16,
            overflow: "hidden",
          }}
        >
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
            top: VOX_META_TOP,
            maxWidth: 520,
            overflow: "hidden",
            fontFamily: uiFace,
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: "0.14em",
            color: wine,
            opacity: interpolate(local, [18, 26], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
            outline: `3px solid ${gold}`,
            padding: "10px 16px",
            whiteSpace: "nowrap",
          }}
        >
          {annotation}
        </div>
      ) : null}
    </div>
  );
};

export const VoxWall = CollageBeat;
