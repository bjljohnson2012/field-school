import React from "react";
import {AbsoluteFill, Sequence, useVideoConfig} from "remotion";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import type {Caption} from "@remotion/captions";
import {navy} from "./brand";
import {KaraokePlate} from "./components/boxes/KaraokePlate";
import {BrollCard} from "./components/cards/BrollCard";
import {NavyCard} from "./components/cards/NavyCard";
import {TagPill} from "./components/cards/TagPill";
import {TalkingHead} from "./components/head/TalkingHead";
import {LessonAudio} from "./components/layers/LessonAudio";
import captionsJson from "./lesson/captions.json";
import episodeJson from "./lesson/episode.json";
import {SCENE_START, lessonFrames, sceneDurations} from "./lesson/timeline";
import type {LessonProps} from "./schema/lessonProps";
import type {Episode} from "./schema/episode";

const captions = captionsJson as Caption[];
const episode = episodeJson as Episode;

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
          <NavyCard kicker={props.course.toUpperCase()} text={props.moduleName} showLogo />
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
          <BrollCard
            src="lesson60/broll-teach.mp4"
            kicker="TEACH"
            text="Invest in the people you lead."
            temperature={props.temperature}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.show} premountFor={fps}>
          <BrollCard
            src="lesson60/broll-show.mp4"
            kicker="SHOW"
            text="Your actions influence the people around you."
            temperature={props.temperature}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.do} premountFor={fps}>
          <NavyCard kicker="DO" text="Lead yourself and think for yourself." />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={presentation} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dur.outro} premountFor={fps}>
          <NavyCard kicker="FIELD SCHOOL" text="Rule yourself first." showLogo />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {episode.cues.map((cue, index) => {
        const next = episode.cues[index + 1];
        const from = Math.round((cue.fromMs / 1000) * fps);
        const until = next ? Math.round((next.fromMs / 1000) * fps) : from + Math.round(1.3 * fps);
        const span = Math.max(8, until - from);
        if (from >= lessonFrames()) {
          return null;
        }
        return (
          <Sequence key={cue.id} from={from} durationInFrames={span} premountFor={fps}>
            <TagPill text={cue.text} />
          </Sequence>
        );
      })}
      {props.captions ? <KaraokePlate captions={captions} /> : null}
      <LessonAudio props={props} captions={captions} pillMs={episode.cues.map((cue) => cue.fromMs)} />
    </AbsoluteFill>
  );
};
