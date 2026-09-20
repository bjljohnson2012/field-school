import React from "react";
import {Composition} from "remotion";
import {DefinitionBoard} from "./DefinitionBoard";
import {LessonSpine} from "./LessonSpine";
import {Opener} from "./Opener";
import {QuizBumper} from "./QuizBumper";
import {RecapCard} from "./RecapCard";
import {CaptionsDemo} from "./CaptionsDemo";
import {AudioBedDemo} from "./AudioBedDemo";
import {LetterboxDemo} from "./LetterboxDemo";
import {ProgressRailDemo} from "./ProgressRailDemo";
import {LowerThirdDemo} from "./LowerThirdDemo";
import {TalkingHeadCard} from "./TalkingHeadCard";
import {LOCK} from "./brand";
import {spineDurationFrames} from "./lessonSpine";
import {EDU_S01_OBJECTIVE} from "./objectiveSlate";
import {clampBand, clampPlateSec} from "./sceneMotionMath";
import type {LessonSpineProps} from "./types";

function plateMetadata({props}: {props: {durationSec?: number}}) {
  const sec = clampPlateSec(props.durationSec ?? 10);
  return {
    durationInFrames: Math.max(1, Math.round(sec * 30)),
    fps: 30,
    width: 1920,
    height: 1080,
  };
}

function boardMetadata({props}: {props: {durationSec?: number}}) {
  const sec = clampBand(props.durationSec ?? 6, 6, 6);
  return {
    durationInFrames: Math.max(1, Math.round(sec * 30)),
    fps: 30,
    width: 1920,
    height: 1080,
  };
}

function bumperMetadata({props}: {props: {durationSec?: number}}) {
  const sec = clampBand(props.durationSec ?? 7, 6, 8);
  return {
    durationInFrames: Math.max(1, Math.round(sec * 30)),
    fps: 30,
    width: 1920,
    height: 1080,
  };
}

function spineMetadata() {
  return {
    durationInFrames: spineDurationFrames(),
    fps: 30,
    width: 1920,
    height: 1080,
  };
}

const overlay = {
  title: LOCK.title,
  x: LOCK.x,
  y: LOCK.y,
  w: LOCK.w,
  h: LOCK.h,
};

const spineDefaults: LessonSpineProps = {
  sting: {
    kicker: "Lesson",
    title: "You Can Just Do Things",
    claim: "Type draws the idea. The head stays docked.",
    objective: EDU_S01_OBJECTIVE,
    durationSec: 10,
    overlay,
    captions: [
      {text: "You", startMs: 0, endMs: 280},
      {text: "Can", startMs: 280, endMs: 520},
      {text: "Just", startMs: 520, endMs: 860},
      {text: "Do", startMs: 860, endMs: 1100},
      {text: "Things", startMs: 1100, endMs: 1700},
      {text: "Type", startMs: 2200, endMs: 2600},
      {text: "draws", startMs: 2600, endMs: 3000},
      {text: "the", startMs: 3000, endMs: 3180},
      {text: "idea.", startMs: 3180, endMs: 3800},
      {text: "You", startMs: 4200, endMs: 4480},
      {text: "will", startMs: 4480, endMs: 4720},
      {text: "be", startMs: 4720, endMs: 4900},
      {text: "able", startMs: 4900, endMs: 5200},
      {text: "to", startMs: 5200, endMs: 5400},
      {text: "draw", startMs: 5400, endMs: 5720},
      {text: "one", startMs: 5720, endMs: 5960},
      {text: "idea", startMs: 5960, endMs: 6300},
      {text: "per", startMs: 6300, endMs: 6500},
      {text: "beat", startMs: 6500, endMs: 7200},
    ],
  },
  slate: {
    name: "Teacher",
    role: "Operator",
    line: "The face stays docked. Type keeps the left.",
    dock: "dock-right",
    durationSec: 8,
    overlay,
    captions: [
      {text: "Docked", startMs: 400, endMs: 900},
      {text: "not", startMs: 900, endMs: 1100},
      {text: "full-bleed", startMs: 1100, endMs: 1800},
      {text: "Type", startMs: 2200, endMs: 2500},
      {text: "keeps", startMs: 2500, endMs: 2900},
      {text: "the", startMs: 2900, endMs: 3100},
      {text: "left.", startMs: 3100, endMs: 3600},
    ],
  },
  objective: {
    term: "Explanatory motion",
    definition: "Each beat draws one idea. Type is the lesson, not a caption dump.",
    durationSec: 6,
    overlay,
    captions: [
      {text: "Explanatory", startMs: 0, endMs: 900},
      {text: "motion", startMs: 900, endMs: 1600},
      {text: "One", startMs: 2000, endMs: 2300},
      {text: "idea", startMs: 2300, endMs: 2800},
      {text: "per", startMs: 2800, endMs: 3000},
      {text: "beat", startMs: 3000, endMs: 3600},
    ],
  },
  recap: {
    kicker: "Recap",
    title: "What stays on the card",
    points: [
      "One claim per beat",
      "Head docked, never on type",
      "Cream, ink, Fraunces",
    ],
    objective: EDU_S01_OBJECTIVE,
    durationSec: 10,
    overlay,
    captions: [
      {text: "One", startMs: 800, endMs: 1100},
      {text: "claim", startMs: 1100, endMs: 1600},
      {text: "per", startMs: 1600, endMs: 1840},
      {text: "beat", startMs: 1840, endMs: 2400},
      {text: "Head", startMs: 2800, endMs: 3100},
      {text: "docked", startMs: 3100, endMs: 3700},
      {text: "Cream", startMs: 4800, endMs: 5300},
      {text: "ink", startMs: 5400, endMs: 5800},
      {text: "Fraunces", startMs: 5900, endMs: 6800},
      {text: "You", startMs: 7400, endMs: 7680},
      {text: "will", startMs: 7680, endMs: 7900},
      {text: "be", startMs: 7900, endMs: 8080},
      {text: "able", startMs: 8080, endMs: 8360},
      {text: "to", startMs: 8360, endMs: 8540},
      {text: "draw", startMs: 8540, endMs: 8840},
      {text: "one", startMs: 8840, endMs: 9080},
      {text: "idea", startMs: 9080, endMs: 9380},
      {text: "per", startMs: 9380, endMs: 9560},
      {text: "beat", startMs: 9560, endMs: 10000},
    ],
  },
  nextUp: {
    prompt: "What did the card draw?",
    sourceUnitTitle: "Explanatory motion",
    sourceUnitId: "lesson-opener",
    durationSec: 7,
    overlay,
    captions: [
      {text: "What", startMs: 400, endMs: 700},
      {text: "did", startMs: 700, endMs: 900},
      {text: "the", startMs: 900, endMs: 1100},
      {text: "card", startMs: 1100, endMs: 1500},
      {text: "draw?", startMs: 1500, endMs: 2200},
    ],
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Opener"
        component={Opener}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          kicker: "Lesson",
          title: "You Can Just Do Things",
          claim: "Type draws the idea. The head stays docked.",
          objective: EDU_S01_OBJECTIVE,
          durationSec: 10,
          overlay: {
            title: "You Can Just Do Things",
            x: 1576,
            y: 24,
            w: 80,
            h: 64,
          },
          captions: [
            {text: "You", startMs: 0, endMs: 280},
            {text: "Can", startMs: 280, endMs: 520},
            {text: "Just", startMs: 520, endMs: 860},
            {text: "Do", startMs: 860, endMs: 1100},
            {text: "Things", startMs: 1100, endMs: 1700},
            {text: "Type", startMs: 2200, endMs: 2600},
            {text: "draws", startMs: 2600, endMs: 3000},
            {text: "the", startMs: 3000, endMs: 3180},
            {text: "idea.", startMs: 3180, endMs: 3800},
            {text: "You", startMs: 4200, endMs: 4480},
            {text: "will", startMs: 4480, endMs: 4720},
            {text: "be", startMs: 4720, endMs: 4900},
            {text: "able", startMs: 4900, endMs: 5200},
            {text: "to", startMs: 5200, endMs: 5400},
            {text: "draw", startMs: 5400, endMs: 5720},
            {text: "one", startMs: 5720, endMs: 5960},
            {text: "idea", startMs: 5960, endMs: 6300},
            {text: "per", startMs: 6300, endMs: 6500},
            {text: "beat", startMs: 6500, endMs: 7200},
          ],
        }}
        calculateMetadata={plateMetadata}
      />
      <Composition
        id="RecapCard"
        component={RecapCard}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          kicker: "Recap",
          title: "What stays on the card",
          points: [
            "One claim per beat",
            "Head docked, never on type",
            "Cream, ink, Fraunces",
          ],
          objective: EDU_S01_OBJECTIVE,
          durationSec: 10,
          overlay: {
            title: "You Can Just Do Things",
            x: 1576,
            y: 24,
            w: 80,
            h: 64,
          },
          captions: [
            {text: "One", startMs: 800, endMs: 1100},
            {text: "claim", startMs: 1100, endMs: 1600},
            {text: "per", startMs: 1600, endMs: 1840},
            {text: "beat", startMs: 1840, endMs: 2400},
            {text: "Head", startMs: 2800, endMs: 3100},
            {text: "docked", startMs: 3100, endMs: 3700},
            {text: "Cream", startMs: 4800, endMs: 5300},
            {text: "ink", startMs: 5400, endMs: 5800},
            {text: "Fraunces", startMs: 5900, endMs: 6800},
            {text: "You", startMs: 7400, endMs: 7680},
            {text: "will", startMs: 7680, endMs: 7900},
            {text: "be", startMs: 7900, endMs: 8080},
            {text: "able", startMs: 8080, endMs: 8360},
            {text: "to", startMs: 8360, endMs: 8540},
            {text: "draw", startMs: 8540, endMs: 8840},
            {text: "one", startMs: 8840, endMs: 9080},
            {text: "idea", startMs: 9080, endMs: 9380},
            {text: "per", startMs: 9380, endMs: 9560},
            {text: "beat", startMs: 9560, endMs: 10000},
          ],
        }}
        calculateMetadata={plateMetadata}
      />
      <Composition
        id="DefinitionBoard"
        component={DefinitionBoard}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          term: "Explanatory motion",
          definition: "Each beat draws one idea. Type is the lesson, not a caption dump.",
          durationSec: 6,
          overlay: {
            title: "You Can Just Do Things",
            x: 1576,
            y: 24,
            w: 80,
            h: 64,
          },
          captions: [
            {text: "Explanatory", startMs: 0, endMs: 900},
            {text: "motion", startMs: 900, endMs: 1600},
            {text: "One", startMs: 2000, endMs: 2300},
            {text: "idea", startMs: 2300, endMs: 2800},
            {text: "per", startMs: 2800, endMs: 3000},
            {text: "beat", startMs: 3000, endMs: 3600},
          ],
        }}
        calculateMetadata={boardMetadata}
      />
      <Composition
        id="QuizBumper"
        component={QuizBumper}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          prompt: "What did the card draw?",
          sourceUnitTitle: "Explanatory motion",
          sourceUnitId: "lesson-opener",
          durationSec: 7,
          overlay: {
            title: "You Can Just Do Things",
            x: 1576,
            y: 24,
            w: 80,
            h: 64,
          },
          captions: [
            {text: "What", startMs: 400, endMs: 700},
            {text: "did", startMs: 700, endMs: 900},
            {text: "the", startMs: 900, endMs: 1100},
            {text: "card", startMs: 1100, endMs: 1500},
            {text: "draw?", startMs: 1500, endMs: 2200},
          ],
        }}
        calculateMetadata={bumperMetadata}
      />
      <Composition
        id="TalkingHeadCard"
        component={TalkingHeadCard}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          name: "Teacher",
          role: "Operator",
          line: "The face stays docked. Type keeps the left.",
          dock: "dock-right",
          durationSec: 8,
          overlay: {
            title: "You Can Just Do Things",
            x: 1576,
            y: 24,
            w: 80,
            h: 64,
          },
          captions: [
            {text: "Docked", startMs: 400, endMs: 900},
            {text: "not", startMs: 900, endMs: 1100},
            {text: "full-bleed", startMs: 1100, endMs: 1800},
            {text: "Type", startMs: 2200, endMs: 2500},
            {text: "keeps", startMs: 2500, endMs: 2900},
            {text: "the", startMs: 2900, endMs: 3100},
            {text: "left.", startMs: 3100, endMs: 3600},
          ],
        }}
        calculateMetadata={plateMetadata}
      />
      <Composition
        id="LowerThirdDemo"
        component={LowerThirdDemo}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CaptionsDemo"
        component={CaptionsDemo}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LetterboxDemo"
        component={LetterboxDemo}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AudioBedDemo"
        component={AudioBedDemo}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProgressRailDemo"
        component={ProgressRailDemo}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LessonSpine"
        component={LessonSpine}
        durationInFrames={1230}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={spineDefaults}
        calculateMetadata={spineMetadata}
      />
    </>
  );
};
