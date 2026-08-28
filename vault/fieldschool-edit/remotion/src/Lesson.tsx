import React from "react";
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {FPS, bg} from "./brand/tokens";
import {Fonts} from "./Fonts";
import {DoCard} from "./components/boxes/DoCard";
import {HookCard} from "./components/boxes/HookCard";
import {KaraokePlate} from "./components/boxes/KaraokePlate";
import {LowerThird} from "./components/boxes/LowerThird";
import {NextUp} from "./components/boxes/NextUp";
import {ObjectiveCard} from "./components/boxes/ObjectiveCard";
import {RecapPlate} from "./components/boxes/RecapPlate";
import {ShowCover} from "./components/boxes/ShowCover";
import {Slate} from "./components/boxes/Slate";
import {Sting} from "./components/boxes/Sting";
import {TalkingHead} from "./components/head/TalkingHead";
import {Letterbox} from "./components/layers/Letterbox";
import {Stack} from "./components/layers/Stack";
import {CollageBeat} from "./components/vox/CollageBeat";
import type {Episode, KeywordCue, Silence} from "./schema/episode";

export const PREVIEW_FRAMES = 151;
export const CLIP_FRAMES = 750;
export const TEACH_FROM = 80;
export const TEACH_UNTIL = 380;
export const SOURCE_START_MS = 2400;
export const SHOW_FROM = 380;
export const DO_FROM = 430;
export const RECAP_FROM = 485;
export const NEXT_FROM = 620;
export const TAIL_FROM = 690;

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

const toTeachFrame = (fromMs: number) => TEACH_FROM + Math.round(((fromMs - SOURCE_START_MS) / 1000) * FPS);

export const Lesson: React.FC<Episode> = (episode) => {
  const voxCues = episode.cues.filter((cue) => cue.kind === "vox");
  const hitCues = episode.cues.filter((cue) => cue.kind === "hit");
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Fonts />
      <Stack>
        <AbsoluteFill style={{backgroundColor: bg}} />
        <Img
          src={staticFile("isolated-seal.png")}
          style={{position: "absolute", right: 80, top: 80, width: 220, height: 220, objectFit: "contain", opacity: 0.14}}
        />
        <Sequence from={SHOW_FROM} durationInFrames={DO_FROM - SHOW_FROM} layout="none">
          <ShowCover src={episode.showSrc} />
        </Sequence>
        {voxCues.map((cue) => (
          <VoxSnap key={`vox-${cue.fromMs}-${cue.word}`} cue={cue} />
        ))}
        <Sequence from={TEACH_FROM} durationInFrames={TEACH_UNTIL - TEACH_FROM} layout="none">
          <TalkingHead
            src={episode.src}
            startFrom={Math.round((SOURCE_START_MS / 1000) * FPS)}
            dock="dock-right"
            muted
          />
        </Sequence>
        <Sequence from={TEACH_FROM} durationInFrames={TEACH_UNTIL - TEACH_FROM} layout="none">
          <LowerThird kicker={episode.module} title={episode.title} />
        </Sequence>
        <Sequence from={TEACH_FROM} durationInFrames={TEACH_UNTIL - TEACH_FROM} layout="none">
          <ClockKaraoke words={episode.words} />
        </Sequence>
        <ClockLetterbox silences={episode.silences} />
        <Sequence from={20} durationInFrames={34} layout="none">
          <Slate course={episode.course} module={episode.module} title={episode.title} />
        </Sequence>
        <Sequence from={48} durationInFrames={26} layout="none">
          <ObjectiveCard text={episode.objective} />
        </Sequence>
        <Sequence from={68} durationInFrames={22} layout="none">
          <HookCard text={episode.hook} />
        </Sequence>
        <Sequence from={DO_FROM} durationInFrames={RECAP_FROM - DO_FROM} layout="none">
          <DoCard text={episode.doPrompt} />
        </Sequence>
        {episode.recap.map((plate, i) => (
          <Sequence key={`recap-${plate.kicker}`} from={RECAP_FROM + i * 45} durationInFrames={45} layout="none">
            <RecapPlate index={i} kicker={plate.kicker} text={plate.text} />
          </Sequence>
        ))}
        <Sequence from={NEXT_FROM} durationInFrames={TAIL_FROM - NEXT_FROM} layout="none">
          <NextUp module={episode.nextUp.module} title={episode.nextUp.title} />
        </Sequence>
        <Sequence from={0} durationInFrames={24} layout="none">
          <Sting />
        </Sequence>
        <Sequence from={TAIL_FROM} durationInFrames={24} layout="none">
          <Sting />
        </Sequence>
        <Audio src={staticFile("sfx/sting.wav")} />
        <Sequence from={TAIL_FROM} durationInFrames={24} layout="none">
          <Audio src={staticFile("sfx/sting.wav")} />
        </Sequence>
        <Audio src={staticFile("sfx/bed.wav")} volume={0.12} />
        <Sequence from={TEACH_FROM} durationInFrames={TEACH_UNTIL - TEACH_FROM} layout="none">
          <Audio src={staticFile(episode.voSrc)} startFrom={Math.round((SOURCE_START_MS / 1000) * FPS)} />
        </Sequence>
        {hitCues.map((cue) => (
          <Sequence key={`hit-${cue.fromMs}`} from={toTeachFrame(cue.fromMs)} durationInFrames={10} layout="none">
            <Audio src={staticFile("sfx/hit.wav")} />
          </Sequence>
        ))}
        <Sequence from={SHOW_FROM} durationInFrames={16} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} />
        </Sequence>
        {voxCues.map((cue) => (
          <Sequence key={`tick-${cue.fromMs}`} from={toTeachFrame(cue.fromMs)} durationInFrames={12} layout="none">
            <Audio src={staticFile("sfx/tick.wav")} />
          </Sequence>
        ))}
      </Stack>
    </AbsoluteFill>
  );
};

const VoxSnap: React.FC<{cue: KeywordCue}> = ({cue}) => {
  const from = toTeachFrame(cue.fromMs);
  if (from < TEACH_FROM || from >= TEACH_UNTIL) {
    return null;
  }
  return (
    <Sequence from={from} durationInFrames={36} layout="none">
      <CollageBeat word={cue.word} fromFrame={0} />
    </Sequence>
  );
};

const ClockKaraoke: React.FC<{words: Episode["words"]}> = ({words}) => {
  const frame = useCurrentFrame();
  const nowMs = SOURCE_START_MS + (frame / FPS) * 1000;
  return <KaraokePlate words={words} nowMs={nowMs} originMs={SOURCE_START_MS} />;
};

const ClockLetterbox: React.FC<{silences: Silence[]}> = ({silences}) => {
  const frame = useCurrentFrame();
  if (frame < TEACH_FROM || frame >= TEACH_UNTIL) {
    return <Letterbox close={0} />;
  }
  const nowMs = SOURCE_START_MS + ((frame - TEACH_FROM) / FPS) * 1000;
  const gap = silences.find(
    (item) => item.voxEnter && nowMs >= item.afterMs && nowMs < item.afterMs + Math.min(item.gapMs, 1400),
  );
  const local = gap ? nowMs - gap.afterMs : 0;
  const close = gap ? interpolate(local, [0, 180], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
  return <Letterbox close={close} />;
};
