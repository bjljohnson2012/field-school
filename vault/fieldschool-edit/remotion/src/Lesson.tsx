import React, {useMemo} from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {FPS, INTRO_FRAMES, bg} from "./brand/tokens";
import {Fonts} from "./Fonts";
import {KaraokePlate} from "./components/boxes/KaraokePlate";
import {LowerThird} from "./components/boxes/LowerThird";
import {WaitingTrap} from "./components/boxes/WaitingTrap";
import {TalkingHead} from "./components/head/TalkingHead";
import {LockupIntro} from "./components/intro/LockupIntro";
import {FieldGraphic} from "./components/layers/FieldGraphic";
import {IndexLine} from "./components/layers/IndexLine";
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
  src: "head.mp4",
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
      <WaitingTrap solo={solo} />
      <ClockKaraoke words={episode.words} solo={solo} drop={drop} />
      <IndexLine solo={solo} />
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
  return (
    <Sequence from={start} durationInFrames={22} layout="none">
      <Audio src={staticFile("sfx/drop-note.wav")} volume={0.2} />
    </Sequence>
  );
};

const Bed: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 18, 150, 198], [0, 0.58, 0.5, 0.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <Audio src={staticFile("bed.wav")} volume={fade} />;
};
