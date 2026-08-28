import React from "react";
import {Composition} from "remotion";
import {CLIP_FRAMES, Lesson, PREVIEW_FRAMES, defaultEpisode} from "./Lesson";
import {MadeUp, defaultMadeUp} from "./madeup/MadeUp";
import {calcMadeUp, calcMadeUpHook} from "./madeup/calc";
import {HOOK_FRAMES, MASTER_FRAMES} from "./madeup/tokens";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="FieldSchoolPreview"
        component={Lesson}
        durationInFrames={PREVIEW_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultEpisode}
      />
      <Composition
        id="FieldSchoolClip"
        component={Lesson}
        durationInFrames={CLIP_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultEpisode}
      />
      <Composition
        id="EverythingMadeUpHook"
        component={MadeUp}
        durationInFrames={HOOK_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultMadeUp}
        calculateMetadata={calcMadeUpHook}
      />
      <Composition
        id="EverythingMadeUp"
        component={MadeUp}
        durationInFrames={MASTER_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultMadeUp}
        calculateMetadata={calcMadeUp}
      />
    </>
  );
};
