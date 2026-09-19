import React from "react";
import {Composition} from "remotion";
import {Opener} from "./Opener";
import {RecapCard} from "./RecapCard";
import {clampPlateSec} from "./sceneMotionMath";

function plateMetadata({props}: {props: {durationSec?: number}}) {
  const sec = clampPlateSec(props.durationSec ?? 10);
  return {
    durationInFrames: Math.max(1, Math.round(sec * 30)),
    fps: 30,
    width: 1920,
    height: 1080,
  };
}

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
          ],
        }}
        calculateMetadata={plateMetadata}
      />
    </>
  );
};
