import React from "react";
import {CalculateMetadataFunction, Composition} from "remotion";
import {FieldSchoolLesson, durationFrames} from "./FieldSchoolLesson";
import {INTRO_SEC} from "./brand";
import type {Props} from "./types";
import {defaultProps} from "./types";

const calc: CalculateMetadataFunction<Props> = ({props}) => {
  return {
    durationInFrames: durationFrames(props),
    fps: 30,
    width: 1920,
    height: 1080,
  };
};

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
        defaultProps={defaultProps}
        calculateMetadata={calc}
      />
      <Composition
        id="FieldSchoolPreview"
        component={FieldSchoolLesson}
        durationInFrames={Math.round((INTRO_SEC + 18) * 30)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={() => ({
          durationInFrames: Math.round((INTRO_SEC + 18) * 30),
          fps: 30,
          width: 1920,
          height: 1080,
        })}
      />
    </>
  );
};
