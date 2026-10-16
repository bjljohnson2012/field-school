import React from "react";
import {AbsoluteFill, useVideoConfig} from "remotion";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import type {Caption} from "@remotion/captions";
import {navy} from "./brand";
import {KaraokePlate} from "./components/boxes/KaraokePlate";
import {NavyCard} from "./components/cards/NavyCard";
import {TalkingHead} from "./components/head/TalkingHead";
import {LessonAudio} from "./components/layers/LessonAudio";
import captionsJson from "./lesson/captions.json";
import {SCENE_START, sceneDurations} from "./lesson/timeline";
import type {LessonProps} from "./schema/lessonProps";

const captions = captionsJson as Caption[];

export const LessonFlow: React.FC<LessonProps> = (props) => {
  const {fps} = useVideoConfig();
  const fadeFrames = props.crossfadeFrames;
  const dur = sceneDurations(fadeFrames);
  const timing = linearTiming({durationInFrames: fadeFrames});
  const presentation = fade();

  return (
    <AbsoluteFill style={{backgroundColor: navy}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={dur.intro} premountFor={fps}>
          <NavyCard kicker={props.course.toUpperCase()} text={props.moduleName} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.cam} premountFor={fps}>
          <TalkingHead
            trimBefore={SCENE_START.cam}
            zoomCap={props.zoomCap}
            durationInFrames={dur.cam}
            temperature={props.temperature}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.teach} premountFor={fps}>
          <NavyCard kicker="TEACH" text="Invest in the people you lead." />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.show} premountFor={fps}>
          <NavyCard kicker="SHOW" text="Your actions influence the people around you." />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.do} premountFor={fps}>
          <NavyCard kicker="DO" text="Lead yourself and think for yourself." />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.outro} premountFor={fps}>
          <NavyCard kicker="FIELD SCHOOL" text="Rule yourself first." />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {props.captions ? (
        <KaraokePlate
          captions={captions}
          fromFrame={SCENE_START.cam + fadeFrames}
          untilFrame={SCENE_START.teach - fadeFrames}
        />
      ) : null}
      <LessonAudio props={props} captions={captions} pillMs={[]} />
    </AbsoluteFill>
  );
};
