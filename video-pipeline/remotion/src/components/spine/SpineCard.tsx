import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper, sansFace} from "../../brand";
import {glideCard} from "../../sceneMotionMath";
import type {LessonChapter} from "../../schema/episode";

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
  const headline = chapter.mode === "slate" ? title : chapter.text;
  const kicker = chapter.mode === "slate" ? `${course}  /  ${moduleName}` : chapter.kicker;
  const onField = chapter.mode === "sting";
  const size = chapter.mode === "sting" || chapter.mode === "slate" ? 72 : 64;

  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 0,
        width: 980,
        opacity: glide.opacity,
        translate: `${glide.x}px 0px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 152,
          fontFamily: sansFace,
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: gold,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 200,
          fontFamily: displayFace,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.08,
          color: onField ? paper : ink,
          letterSpacing: "-0.02em",
          backgroundColor: onField ? "transparent" : paper,
          borderRadius: 24,
          padding: onField ? 0 : "28px 36px",
          maxWidth: 960,
        }}
      >
        {headline}
      </div>
    </div>
  );
};
