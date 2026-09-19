import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {DefinitionBoard} from "./DefinitionBoard";
import {Opener} from "./Opener";
import {QuizBumper} from "./QuizBumper";
import {RecapCard} from "./RecapCard";
import {TalkingHeadCard} from "./TalkingHeadCard";
import {SPINE_BEATS, spineLayout} from "./lessonSpine";
import type {LessonSpineProps} from "./types";

/** Sequences existing plates. No Cap A-roll. Fixture content only. */
export const LessonSpine: React.FC<LessonSpineProps> = ({
  sting,
  slate,
  objective,
  recap,
  nextUp,
}) => {
  const layout = spineLayout(SPINE_BEATS);
  const from = Object.fromEntries(layout.map((row) => [row.id, row]));

  return (
    <AbsoluteFill>
      <Sequence
        from={from.sting.from}
        durationInFrames={from.sting.frames}
        name="sting"
      >
        <Opener {...sting} />
      </Sequence>
      <Sequence
        from={from.slate.from}
        durationInFrames={from.slate.frames}
        name="slate"
      >
        <TalkingHeadCard {...slate} />
      </Sequence>
      <Sequence
        from={from.objective.from}
        durationInFrames={from.objective.frames}
        name="objective"
      >
        <DefinitionBoard {...objective} />
      </Sequence>
      <Sequence
        from={from.recap.from}
        durationInFrames={from.recap.frames}
        name="recap"
      >
        <RecapCard {...recap} />
      </Sequence>
      <Sequence
        from={from.nextUp.from}
        durationInFrames={from.nextUp.frames}
        name="next-up"
      >
        <QuizBumper {...nextUp} />
      </Sequence>
    </AbsoluteFill>
  );
};
