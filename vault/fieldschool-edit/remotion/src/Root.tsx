import React from "react";
import {Composition} from "remotion";
import {Lesson, PREVIEW_FRAMES, defaultEpisode} from "./Lesson";

export const Root: React.FC = () => {
  return (
    <Composition
      id="FieldSchoolPreview"
      component={Lesson}
      durationInFrames={PREVIEW_FRAMES}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultEpisode}
    />
  );
};
