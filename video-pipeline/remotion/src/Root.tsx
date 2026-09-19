import React from "react";
import {Composition} from "remotion";
import {FieldSchoolLesson, durationFrames} from "./FieldSchoolLesson";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="FieldSchoolLesson"
        component={FieldSchoolLesson}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          src: "fixture",
          cuts: [{in: 0, out: 8}],
          overlay: {
            logo: "isolated-seal.svg",
            x: 1576,
            y: 24,
            w: 80,
            h: 64,
            title: "SceneMotion fixture",
          },
          titleCards: [],
          scenes: [
            {
              id: "takeover-open",
              label: "Takeover",
              in: 0,
              out: 4,
              x: 72,
              y: 160,
              scale: 1,
              motion: "takeover",
              text: "Card owns the open. Then the head eases in from the right.",
            },
            {
              id: "glide-enter",
              label: "Glide",
              in: 4,
              out: 8,
              x: 72,
              y: 160,
              scale: 1,
              motion: "glide",
              text: "Type walks in from the left. Soft opacity. No bounce.",
            },
          ],
          durationSec: 8,
          phrases: [],
          introSec: 0,
          lessonTitle: "SceneMotion fixture",
        }}
        calculateMetadata={({props}) => ({
          durationInFrames: durationFrames(props),
        })}
      />
    </>
  );
};
