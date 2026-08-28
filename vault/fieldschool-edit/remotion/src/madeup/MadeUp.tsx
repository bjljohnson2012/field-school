import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Stack} from "../components/layers/Stack";
import {CaptionPlate} from "./CaptionPlate";
import {CollageBeat} from "./CollageBeat";
import {HookPlate} from "./HookPlate";
import {MadeHead} from "./MadeHead";
import {MadeLetterbox} from "./MadeLetterbox";
import {CtaCard, StingLockup, TitlePlate} from "./TitlePlate";
import {BED_FRAMES, FPS, LOWER_THIRD_BOTTOM, MASTER_FRAMES, bg, paper, uiFace} from "./tokens";
import type {MadeEpisode, MadeShot, MadeWord} from "./schema";

export const defaultMadeUp: MadeEpisode = {
  slug: "everything-made-up",
  title: "Everything Is Made Up",
  cam: "a_roll.mp4",
  vo: "episodes/everything-made-up/vo.wav",
  captions: "episodes/everything-made-up/captions.json",
  shots: [],
  words: [],
};

export const MadeUp: React.FC<MadeEpisode> = (episode) => {
  const frame = useCurrentFrame();
  const nowMs = (frame / FPS) * 1000;
  const words = episode.words || [];
  const shot = shotAt(episode.shots, frame);
  const local = shot ? frame - shot.fromFrame : 0;
  const vox = Boolean(shot && (shot.type === "vox" || shot.type === "b-roll"));
  const letter = interpolate(vox ? local : 0, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const waitFrame = wordFrame(words, "waiting", 0) ?? 333;
  const justFrame = wordFrame(words, "just", 30000) ?? 1047;
  const bedLoops = Math.ceil((MASTER_FRAMES + 60) / BED_FRAMES);
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Stack>
        <AbsoluteFill style={{backgroundColor: vox ? paper : bg}} />
        {shot && vox ? (
          <CollageBeat
            assets={shot.assets || []}
            text={shot.plate || shot.text || ""}
            annotation={shot.annotation}
            chips={shot.chips}
            list={shot.list}
            local={local}
            stamps={stampCount(shot, words, nowMs, local)}
            spoken={spokenNeedles(words, nowMs)}
          />
        ) : null}
        <MadeHead src={fileName(episode.cam)} layout={shot ? shot.layout : "off"} local={local} />
        {shot && shot.lowerThird ? (
          <div
            style={{
              position: "absolute",
              left: 72,
              bottom: LOWER_THIRD_BOTTOM,
              fontFamily: uiFace,
              fontSize: 18,
              color: paper,
              letterSpacing: "0.12em",
            }}
          >
            {shot.lowerThird.name}
          </div>
        ) : null}
        {shot && shot.type === "hook" && shot.id === "s01" ? (
          <HookPlate text={shot.text || "PEOPLE WAIT TO BE TOLD"} local={frame - enterAt(shot, waitFrame)} />
        ) : null}
        {shot && shot.id === "s02" ? (
          <>
            <HookPlate text="PEOPLE WAIT TO BE TOLD" local={8} pip />
            <HookPlate text={shot.text || "YOU CAN JUST DO THINGS"} local={frame - enterAt(shot, justFrame)} second pip />
          </>
        ) : null}
        {shot && shot.type === "a-roll" && shot.plate ? (
          <TitlePlate text={shot.plate} local={local} docked={shot.layout === "dock-right"} />
        ) : null}
        {shot && (shot.type === "a-roll" || shot.type === "hook") ? (
          <CaptionPlate words={words} nowMs={nowMs} docked={shot.layout === "dock-right"} />
        ) : null}
        {shot && shot.type === "sting" ? <StingLockup local={local} /> : null}
        {shot && shot.type === "cta" ? <CtaCard text={shot.text || ""} local={local} /> : null}
        <MadeLetterbox close={vox ? letter : 0.2} />
        {Array.from({length: bedLoops}, (_, i) => (
          <Sequence key={`bed-${i}`} from={i * BED_FRAMES} durationInFrames={BED_FRAMES} layout="none">
            <Audio src={staticFile("bed.wav")} volume={0.22} />
          </Sequence>
        ))}
        <Audio src={staticFile(fileName(episode.vo))} />
        {episode.shots.map((item) => (
          <ShotSfx key={`${item.id}-sfx`} shot={item} />
        ))}
      </Stack>
    </AbsoluteFill>
  );
};

const ShotSfx: React.FC<{shot: MadeShot}> = ({shot}) => {
  const ticks = Math.max(shot.assets?.length || 0, shot.list?.length || 0, 1);
  const names = (shot.sfx || []).flatMap((name) => (name === "tick" ? Array.from({length: ticks}, () => "tick") : [name]));
  return (
    <>
      {names.map((name, i) => {
        const at = shot.fromFrame + (name === "tick" ? 2 + i * 4 : 2);
        const file =
          name === "whoosh" ? "sfx/whoosh.wav" : name === "hit" ? "sfx/hit.wav" : name === "sting" ? "sfx/sting.wav" : "sfx/tick.wav";
        return (
          <Sequence key={`${shot.id}-${name}-${i}`} from={at} durationInFrames={12} layout="none">
            <Audio src={staticFile(file)} volume={0.16} />
          </Sequence>
        );
      })}
    </>
  );
};

const shotAt = (shots: MadeShot[], frame: number): MadeShot | null => {
  return shots.find((shot) => frame >= shot.fromFrame && frame < shot.fromFrame + shot.durationInFrames) ?? null;
};

const fileName = (path: string): string => {
  if (path.startsWith("episodes/") || path.startsWith("brand/")) {
    return path;
  }
  return path.split("/").pop() || path;
};

const enterAt = (shot: MadeShot, cue: number): number => {
  if (cue >= shot.fromFrame && cue < shot.fromFrame + shot.durationInFrames) {
    return cue;
  }
  return shot.fromFrame;
};

const wordFrame = (words: MadeWord[], needle: string, afterMs: number): number | null => {
  const hit = words.find((word) => word.fromMs >= afterMs && norm(word.text).includes(needle));
  return hit ? Math.round((hit.fromMs / 1000) * FPS) : null;
};

const norm = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

const stampCount = (shot: MadeShot, words: MadeWord[], nowMs: number, local: number): number => {
  if (shot.id !== "s04") {
    return 0;
  }
  const gravity = words.some((word) => nowMs >= word.fromMs && norm(word.text).includes("gravity"));
  const light = words.some((word) => nowMs >= word.fromMs && (norm(word.text).includes("light") || norm(word.text).includes("speed")));
  const freeze = words.some((word) => nowMs >= word.fromMs && (norm(word.text).includes("freez") || norm(word.text).includes("ice")));
  const keyed = Number(gravity) + Number(light) + Number(freeze);
  const cascade = Math.min(3, Math.max(0, Math.floor((local - 2) / 4)));
  return Math.max(keyed, cascade);
};

const spokenNeedles = (words: MadeWord[], nowMs: number): string[] => {
  const live = words.filter((word) => nowMs >= word.fromMs && nowMs < word.toMs + 800).map((word) => norm(word.text));
  const needles = ["why", "started", "left", "best", "keep"];
  return needles.filter((needle) => live.some((text) => text.includes(needle)));
};

export const madeUpDuration = (_episode: MadeEpisode): number => MASTER_FRAMES;
