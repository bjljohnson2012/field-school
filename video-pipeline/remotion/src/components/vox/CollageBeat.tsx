import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {ink, paper, sansFace} from "../../brand";
import type {LessonCue} from "../../schema/episode";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** One pill at a time. The current pill leaves before the next one enters. */
export const CollageBeat: React.FC<{cues: LessonCue[]}> = ({cues}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const vox = cues.filter((cue) => cue.vox);
  const ms = (frame / fps) * 1000;
  let index = -1;
  for (let i = 0; i < vox.length; i += 1) {
    if (ms >= vox[i].fromMs) {
      index = i;
    }
  }
  if (index < 0) {
    return null;
  }
  const cue = vox[index];
  const next = vox[index + 1];
  const start = (cue.fromMs / 1000) * fps;
  const local = frame - start;
  const enter = spring({
    frame: Math.max(0, local),
    fps,
    config: {damping: 200},
    durationInFrames: 10,
  });
  const exitEnd = next ? (next.fromMs / 1000) * fps : start + 2.4 * fps + 8;
  const exitStart = exitEnd - 8;
  const exitT = interpolate(frame, [exitStart, exitEnd], [0, 1], clamp);
  if (enter <= 0.01 && exitT >= 1) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 520 + (1 - enter) * 10 + exitT * -12,
        opacity: enter * (1 - exitT),
        backgroundColor: paper,
        color: ink,
        fontFamily: sansFace,
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "12px 22px",
        borderRadius: 14,
      }}
    >
      {cue.text}
    </div>
  );
};
