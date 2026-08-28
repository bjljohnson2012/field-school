import React from "react";
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {FPS, bg, displayFace, gold, paper} from "./brand/tokens";
import {Fonts} from "./Fonts";
import {ObjectiveCard} from "./components/boxes/ObjectiveCard";
import {KaraokePlate} from "./components/boxes/KaraokePlate";
import {LowerThird} from "./components/boxes/LowerThird";
import {Slate} from "./components/boxes/Slate";
import {TalkingHead} from "./components/head/TalkingHead";
import {Letterbox} from "./components/layers/Letterbox";
import {Stack} from "./components/layers/Stack";
import {CollageBeat} from "./components/vox/CollageBeat";
import type {CaptionPage, Episode} from "./schema/episode";

export const PREVIEW_FRAMES = 150;
export const TEACH_FROM = 70;
export const SOURCE_START_MS = 2400;

export const defaultEpisode: Episode = {
  course: "Field School",
  module: "Authored processes",
  title: "You Can Just Do Things",
  objective: "Separate a memo from a law, then take the next step.",
  src: "a_roll.mp4",
  durationSec: 5,
  captions: [],
  cues: [],
};

export const Lesson: React.FC<Episode> = (episode) => {
  const firstCue = episode.cues[0];
  const cueFrame = firstCue
    ? TEACH_FROM + Math.round(((firstCue.fromMs - SOURCE_START_MS) / 1000) * FPS)
    : 96;
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Fonts />
      <Stack>
        <AbsoluteFill style={{backgroundColor: bg}} />
        <Img
          src={staticFile("isolated-seal.png")}
          style={{position: "absolute", right: 80, top: 80, width: 220, height: 220, objectFit: "contain", opacity: 0.14}}
        />
        <Sequence from={cueFrame} durationInFrames={36} layout="none">
          <CollageBeat word={firstCue ? firstCue.word : "things"} fromFrame={0} />
        </Sequence>
        <Sequence from={TEACH_FROM} layout="none">
          <TalkingHead src={episode.src} startFrom={Math.round((SOURCE_START_MS / 1000) * FPS)} dock="dock-right" />
        </Sequence>
        <Sequence from={TEACH_FROM} layout="none">
          <LowerThird kicker={episode.module} title={episode.title} />
        </Sequence>
        <Sequence from={TEACH_FROM} layout="none">
          <ClockKaraoke pages={episode.captions} />
        </Sequence>
        <Letterbox close={0} />
        <Sequence from={20} durationInFrames={32} layout="none">
          <Slate course={episode.course} module={episode.module} title={episode.title} />
        </Sequence>
        <Sequence from={48} durationInFrames={24} layout="none">
          <ObjectiveCard text={episode.objective} />
        </Sequence>
        <Sequence from={0} durationInFrames={24} layout="none">
          <Sting />
        </Sequence>
        <Audio src={staticFile("sfx/sting.wav")} />
        <Audio src={staticFile("sfx/bed.wav")} volume={0.12} />
        {firstCue ? (
          <Sequence from={cueFrame} durationInFrames={12} layout="none">
            <Audio src={staticFile("sfx/tick.wav")} />
          </Sequence>
        ) : null}
      </Stack>
    </AbsoluteFill>
  );
};

const ClockKaraoke: React.FC<{pages: CaptionPage[]}> = ({pages}) => {
  const frame = useCurrentFrame();
  const nowMs = SOURCE_START_MS + (frame / FPS) * 1000;
  return <KaraokePlate pages={pages} nowMs={nowMs} originMs={SOURCE_START_MS} />;
};

const Sting: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 4, 18, 24], [0, 1, 1, 0], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", inset: 0, backgroundColor: paper, opacity: fade}}>
      <Img
        src={staticFile("lockup-wide-cream-slogan.png")}
        style={{position: "absolute", left: 460, top: 380, width: 1000, height: 200, objectFit: "contain"}}
      />
      <div style={{position: "absolute", left: 0, top: 0, width: 18, height: 1080, backgroundColor: gold}} />
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 80,
          fontFamily: displayFace,
          fontSize: 22,
          color: gold,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Field School
      </div>
    </div>
  );
};
