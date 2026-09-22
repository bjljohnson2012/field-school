import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";
import {EDU_S01_OBJECTIVE} from "./objectiveSlate";
import {Opener} from "./Opener";
import {QuizBumper} from "./QuizBumper";
import {RecapCard} from "./RecapCard";
import {TalkingHeadCard} from "./TalkingHeadCard";
import {TRACK_B_CAPTIONS} from "./trackBCaptions";

const overlay = {
  title: "You Can Just Do Things",
  x: 1576,
  y: 24,
  w: 80,
  h: 64,
};

/**
 * Opener → TalkingHead → RecapCard → QuizBumper.
 * Each plate keeps the fixture caption clock. This composition does not render.
 */
export const TrackBMaster: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={1050} name="fixture-vo" premountFor={30}>
        <Audio src={staticFile("track-b-fixture.wav")} trimBefore={0} />
      </Sequence>
      <Sequence from={0} durationInFrames={300} name="Opener" premountFor={30}>
        <Opener
          kicker="Lesson"
          title="You Can Just Do Things"
          claim="Type draws the idea. The head stays docked."
          objective={EDU_S01_OBJECTIVE}
          durationSec={10}
          overlay={overlay}
          captions={TRACK_B_CAPTIONS}
        />
      </Sequence>
      <Sequence from={300} durationInFrames={240} name="TalkingHead" premountFor={30}>
        <TalkingHeadCard
          name="Teacher"
          role="Operator"
          line="The face stays docked. Type keeps the left."
          dock="dock-right"
          durationSec={8}
          overlay={overlay}
          captions={TRACK_B_CAPTIONS}
        />
      </Sequence>
      <Sequence from={540} durationInFrames={300} name="RecapCard" premountFor={30}>
        <RecapCard
          kicker="Recap"
          title="What stays on the card"
          points={["One claim per beat", "Head docked, never on type", "Cream, ink, Fraunces"]}
          objective={EDU_S01_OBJECTIVE}
          durationSec={10}
          overlay={overlay}
          captions={TRACK_B_CAPTIONS}
        />
      </Sequence>
      <Sequence from={840} durationInFrames={210} name="QuizBumper" premountFor={30}>
        <QuizBumper
          prompt="What did the card draw?"
          sourceUnitTitle="Explanatory motion"
          sourceUnitId="lesson-opener"
          durationSec={7}
          overlay={overlay}
          captions={TRACK_B_CAPTIONS}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
