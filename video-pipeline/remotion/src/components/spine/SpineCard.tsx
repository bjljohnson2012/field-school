import React from "react";
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, olive, paper, sansFace, serifFace} from "../../brand";
import {glideCard} from "../../sceneMotionMath";
import type {LessonChapter} from "../../schema/episode";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const SpineCard: React.FC<{
  chapter: LessonChapter;
  course: string;
  moduleName: string;
  title: string;
}> = ({chapter, course, moduleName, title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = Math.max(0, Math.round((frame / fps - chapter.inSec) * fps));
  const glide = chapter.motion === "glide" ? glideCard(local) : {x: 0, opacity: 1};
  const screen = interpolate(local, [0, 14], [0.94, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  if (chapter.mode === "show") {
    return (
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 150,
          width: 980,
          height: 520,
          opacity: glide.opacity,
          translate: `${glide.x}px 0px`,
          scale: screen,
          backgroundColor: paper,
          borderRadius: 28,
          boxSizing: "border-box",
          padding: "48px 56px",
          border: `3px solid ${olive}`,
        }}
      >
        <div
          style={{
            fontFamily: sansFace,
            fontSize: 18,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: gold,
            marginBottom: 28,
          }}
        >
          {chapter.kicker}
        </div>
        <div
          style={{
            fontFamily: serifFace,
            fontWeight: 600,
            fontSize: 54,
            lineHeight: 1.15,
            color: ink,
            letterSpacing: "-0.02em",
          }}
        >
          {chapter.text}
        </div>
      </div>
    );
  }

  const headline = chapter.mode === "slate" ? title : chapter.text;
  const kicker =
    chapter.mode === "slate" ? `${course}  /  ${moduleName}` : chapter.kicker;

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: chapter.mode === "sting" ? 360 : 150,
        width: 1000,
        opacity: glide.opacity,
        translate: `${glide.x}px 0px`,
      }}
    >
      <div
        style={{
          fontFamily: sansFace,
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: gold,
          marginBottom: 18,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          width: interpolate(local, [0, 18], [0, 180], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          height: 3,
          backgroundColor: gold,
          marginBottom: 22,
        }}
      />
      <div
        style={{
          fontFamily: chapter.mode === "sting" ? displayFace : serifFace,
          fontWeight: 600,
          fontSize: chapter.mode === "sting" ? 84 : 58,
          lineHeight: 1.12,
          color: chapter.mode === "sting" ? paper : ink,
          letterSpacing: "-0.02em",
          backgroundColor: chapter.mode === "sting" ? "transparent" : paper,
          borderRadius: 24,
          padding: chapter.mode === "sting" ? 0 : "28px 32px",
          maxWidth: 980,
        }}
      >
        {headline}
      </div>
    </div>
  );
};
