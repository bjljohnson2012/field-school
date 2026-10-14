import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {gold, ink, paper, sansFace} from "../../brand";
import type {LessonCue} from "../../schema/episode";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** Keyword cutouts. Each chip snaps on that word's fromMs. */
export const CollageBeat: React.FC<{cues: LessonCue[]}> = ({cues}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const live = cues.filter((cue) => cue.vox && ms >= cue.fromMs && ms < cue.fromMs + 2400).slice(-3);

  return (
    <>
      {live.map((cue, index) => {
        const local = ((ms - cue.fromMs) / 1000) * fps;
        const enter = spring({
          frame: local,
          fps,
          config: {damping: 200, mass: 0.6},
          durationInFrames: 12,
        });
        const y = 700 + index * 72;
        return (
          <div
            key={cue.id}
            style={{
              position: "absolute",
              left: 72,
              top: y,
              opacity: enter,
              translate: `${(1 - enter) * -48}px 0px`,
              backgroundColor: paper,
              color: ink,
              fontFamily: sansFace,
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 14,
              borderLeft: `8px solid ${gold}`,
            }}
          >
            {cue.text}
          </div>
        );
      })}
      {live.length ? (
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 668,
            width: interpolate(frame, [0, 40], [0, 280], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            height: 2,
            backgroundColor: gold,
          }}
        />
      ) : null}
    </>
  );
};
