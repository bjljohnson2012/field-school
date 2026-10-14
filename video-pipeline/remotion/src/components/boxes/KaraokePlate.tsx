import React, {useMemo} from "react";
import {createTikTokStyleCaptions, type Caption} from "@remotion/captions";
import {measureText} from "@remotion/layout-utils";
import {createRoundedTextBox} from "@remotion/rounded-text-box";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {gold, ink, paper, sansFace} from "../../brand";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** Words fade in at fromMs (3 frames). Active word is gold at 1.06. Inactive at 70%. */
export const KaraokePlate: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: 1400,
      }).pages,
    [captions],
  );
  const page = pages.find((item) => ms >= item.startMs && ms < item.startMs + item.durationMs);
  const plate = useMemo(() => {
    if (!page) {
      return null;
    }
    const fontSize = measureText({
      text: page.text,
      fontFamily: sansFace,
      fontSize: 42,
      fontWeight: "500",
    }).width > 960
      ? 32
      : 42;
    const line = measureText({
      text: page.text,
      fontFamily: sansFace,
      fontSize,
      fontWeight: "500",
    });
    const box = createRoundedTextBox({
      textMeasurements: [line],
      textAlign: "left",
      horizontalPadding: 22,
      borderRadius: 18,
    });
    return {fontSize, line, box};
  }, [page]);

  if (!page || !plate) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 88,
        width: plate.box.boundingBox.width,
        height: plate.box.boundingBox.height,
      }}
    >
      <svg
        width={plate.box.boundingBox.width}
        height={plate.box.boundingBox.height}
        style={{position: "absolute", left: 0, top: 0}}
      >
        <path d={plate.box.d} fill={paper} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 0,
          height: plate.line.height,
          display: "flex",
          alignItems: "center",
          fontFamily: sansFace,
          fontWeight: 500,
          fontSize: plate.fontSize,
          whiteSpace: "pre",
        }}
      >
        {page.tokens.map((token, index) => {
          const local = ((ms - token.fromMs) / 1000) * fps;
          const fade = interpolate(local, [0, 3], [0, 1], clamp);
          const active = ms >= token.fromMs && ms < token.toMs;
          return (
            <span
              key={`${token.fromMs}-${index}`}
              style={{
                opacity: fade * (active ? 1 : 0.7),
                color: active ? gold : ink,
                scale: active ? 1.06 : 1,
                display: "inline-block",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
