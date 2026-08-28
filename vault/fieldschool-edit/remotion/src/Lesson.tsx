import React, {useMemo} from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {FPS, INTRO_FRAMES, bg} from "./brand/tokens";
import {Fonts} from "./Fonts";
import {KaraokePlate} from "./components/boxes/KaraokePlate";
import {LowerThird} from "./components/boxes/LowerThird";
import {ShowLabel, plateTitle} from "./components/boxes/ShowLabel";
import {TalkingHead} from "./components/head/TalkingHead";
import {LockupIntro} from "./components/intro/LockupIntro";
import {FieldGraphic} from "./components/layers/FieldGraphic";
import {Letterbox} from "./components/layers/Letterbox";
import {Stack} from "./components/layers/Stack";
import {emphasisDropOff, useSolo, type DropOff} from "./dropOff";
import type {Episode} from "./schema/episode";

export const PREVIEW_FRAMES = 151;
export const CLIP_FRAMES = 750;
export const TEACH_FROM = 180;
export const SOURCE_START_MS = 2400;

export const defaultEpisode: Episode = {
  course: "Field School",
  module: "Authored processes",
  title: "You Can Just Do Things",
  objective: "Separate a memo from a law, then take the next step.",
  hook: "Most of what blocks you is waiting.",
  doPrompt: "Name the thing you are waiting on. Then do the next step anyway.",
  recap: [
    {kicker: "1", text: "Waiting is a memo."},
    {kicker: "2", text: "You can just do things."},
    {kicker: "3", text: "Ask if it is a law."},
  ],
  nextUp: {module: "Authored processes", title: "Made up is not fake"},
  showSrc: "01-the-waiting-trap.png",
  src: "a_roll.mp4",
  voSrc: "vo.wav",
  durationSec: 25,
  words: [],
  cues: [],
  silences: [],
};

export const Lesson: React.FC<Episode> = (episode) => {
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Fonts />
      <Stack>
        <AbsoluteFill style={{backgroundColor: bg}} />
        <Sequence from={TEACH_FROM} layout="none">
          <Teach episode={episode} />
        </Sequence>
        <Sequence from={0} durationInFrames={INTRO_FRAMES} layout="none">
          <LockupIntro course={episode.course} module={episode.module} title={episode.title} />
        </Sequence>
        <Bed />
        <Sequence from={0} durationInFrames={30} layout="none">
          <Audio src={staticFile("sfx/sting.wav")} volume={0.16} />
        </Sequence>
        <Sequence from={162} durationInFrames={18} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.18} />
        </Sequence>
        <Sequence from={TEACH_FROM} layout="none">
          <Audio src={staticFile(episode.voSrc)} startFrom={Math.round((SOURCE_START_MS / 1000) * FPS)} />
        </Sequence>
      </Stack>
    </AbsoluteFill>
  );
};

const Teach: React.FC<{episode: Episode}> = ({episode}) => {
  const drop = useMemo(() => emphasisDropOff(episode.words), [episode.words]);
  const solo = useSolo(drop, SOURCE_START_MS);
  return (
    <>
      <FieldGraphic solo={solo} />
      <TalkingHead
        src={episode.src}
        startFrom={Math.round((SOURCE_START_MS / 1000) * FPS)}
        dock="dock-right"
        muted
        solo={solo}
      />
      <LowerThird kicker={episode.module} title={episode.title} solo={solo} />
      <ShowLabel text={plateTitle(episode.showSrc)} solo={solo} />
      <ClockKaraoke words={episode.words} solo={solo} drop={drop} />
      <Letterbox close={solo} />
      <DropAudio drop={drop} />
    </>
  );
};

const ClockKaraoke: React.FC<{words: Episode["words"]; solo: number; drop: DropOff | null}> = ({
  words,
  solo,
  drop,
}) => {
  const frame = useCurrentFrame();
  const nowMs = SOURCE_START_MS + (frame / FPS) * 1000;
  return <KaraokePlate words={words} nowMs={nowMs} originMs={SOURCE_START_MS} solo={solo} drop={drop} />;
};

const DropAudio: React.FC<{drop: DropOff | null}> = ({drop}) => {
  if (!drop) {
    return null;
  }
  const start = Math.round(((drop.fromMs - SOURCE_START_MS) / 1000) * FPS);
  const end = Math.round(((drop.fromMs + drop.durationMs - SOURCE_START_MS) / 1000) * FPS);
  return (
    <>
      <Sequence from={start} durationInFrames={16} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.18} />
      </Sequence>
      <Sequence from={start} durationInFrames={14} layout="none">
        <Audio src={staticFile("sfx/hit.wav")} volume={0.14} />
      </Sequence>
      <Sequence from={Math.max(0, end - 18)} durationInFrames={16} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.15} />
      </Sequence>
    </>
  );
};

const Bed: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 48, 150, 210], [0, 0.11, 0.11, 0.07], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <Audio src={staticFile("sfx/bed.wav")} volume={fade} />;
};
