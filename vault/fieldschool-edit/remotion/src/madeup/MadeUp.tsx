import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Stack} from "../components/layers/Stack";
import {CollageBeat} from "./CollageBeat";
import {useWaitingSolo} from "./dropOff";
import {HookPlate} from "./HookPlate";
import {MadeHead} from "./MadeHead";
import {MadeLetterbox} from "./MadeLetterbox";
import {PaperSheet} from "./PaperSheet";
import {CtaCard, StingLockup, TitlePlate} from "./TitlePlate";
import {PLAYBOOK, TypeField, letterAtMs} from "./TypeField";
import {WaitingWash} from "./WaitingWash";
import {BED_FRAMES, FPS, MASTER_FRAMES, bg, darkGrain, gold, paper, uiFace} from "./tokens";
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
  const solo = useWaitingSolo(words);
  const vox = Boolean(shot && (shot.type === "vox" || shot.type === "b-roll"));
  const teach = Boolean(
    shot &&
      (shot.type === "a-roll" || shot.id === "s02" || (shot.id === "s01" && solo > 0.02)),
  );
  const docked = Boolean(shot && (shot.layout === "dock-right" || shot.layout === "pip-tr") && solo < 0.5);
  const paperOpen =
    shot && shot.type === "a-roll"
      ? interpolate(local, [0, 10], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
      : 0;
  const hookGhost = shot?.id === "s01" && solo > 0.08 ? 1 : 0;
  const bedLoops = Math.ceil((MASTER_FRAMES + 60) / BED_FRAMES);
  const letterMode = !shot || shot.type === "sting" || shot.type === "cta" || shot.type === "hook" ? "none" : vox ? "vox" : "hair";
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Stack>
        <AbsoluteFill style={{backgroundColor: vox ? paper : bg}} />
        {!vox ? <AbsoluteFill style={{backgroundImage: darkGrain, opacity: 0.85}} /> : null}
        <PaperSheet open={paperOpen} solo={solo} />
        <WaitingWash open={solo} />
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
        {teach ? (
          <TypeField
            words={words}
            nowMs={nowMs}
            solo={solo}
            docked={docked}
            mode={shot?.type === "a-roll" ? "paper" : "dark"}
          />
        ) : null}
        {shot && shot.type === "hook" && shot.id === "s01" ? (
          <HookPlate text={shot.text || "PEOPLE WAIT TO BE TOLD"} local={frame - shot.fromFrame} ghost={hookGhost} />
        ) : null}
        {shot && shot.id === "s02" ? (
          <HookPlate text={shot.text || "YOU CAN JUST DO THINGS"} local={local} pip />
        ) : null}
        {shot && shot.type === "a-roll" && shot.plate ? (
          <TitlePlate text={shot.plate} local={local} docked={shot.layout === "dock-right"} />
        ) : null}
        <MadeHead src={fileName(episode.cam)} layout={shot ? shot.layout : "off"} local={local} solo={solo} />
        {shot && shot.lowerThird && shot.layout === "dock-right" && solo < 0.4 ? (
          <div
            style={{
              position: "absolute",
              right: 72,
              bottom: 88,
              width: 680,
              textAlign: "right",
              opacity: interpolate(local, [8, 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
            }}
          >
            <div style={{width: 48, height: 3, backgroundColor: gold, marginLeft: "auto", marginBottom: 10}} />
            <div
              style={{
                fontFamily: uiFace,
                fontSize: 18,
                letterSpacing: "0.16em",
                color: gold,
              }}
            >
              {shot.lowerThird.name}
            </div>
          </div>
        ) : null}
        {shot && shot.type === "sting" ? <StingLockup local={local} /> : null}
        {shot && shot.type === "cta" ? <CtaCard text={shot.text || ""} local={local} /> : null}
        <MadeLetterbox mode={letterMode} />
        {Array.from({length: bedLoops}, (_, i) => (
          <Sequence key={`bed-${i}`} from={i * BED_FRAMES} durationInFrames={BED_FRAMES} layout="none">
            <Audio src={staticFile("bed.wav")} volume={0.22} />
          </Sequence>
        ))}
        <Audio src={staticFile(fileName(episode.vo))} />
        {episode.shots.map((item) => (
          <ShotSfx key={`${item.id}-sfx`} shot={item} />
        ))}
        <PlaybookKeys words={words} />
      </Stack>
    </AbsoluteFill>
  );
};

const PlaybookKeys: React.FC<{words: MadeWord[]}> = ({words}) => {
  const book = words.find((word) => PLAYBOOK.test(word.text.trim()));
  if (!book) {
    return null;
  }
  const keys = book.text.split("").map((_, i) => Math.round((letterAtMs(book.fromMs, i, book.text.length) / 1000) * FPS));
  return (
    <>
      {keys.map((at, i) => (
        <Sequence key={`key-${at}-${i}`} from={at} durationInFrames={5} layout="none">
          <Audio src={staticFile(i % 2 === 0 ? "sfx/key-a.wav" : "sfx/key-b.wav")} volume={0.1} />
        </Sequence>
      ))}
    </>
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
  return shots.find((item) => frame >= item.fromFrame && frame < item.fromFrame + item.durationInFrames) ?? null;
};

const fileName = (path: string): string => {
  if (path.startsWith("episodes/") || path.startsWith("brand/")) {
    return path;
  }
  return path.split("/").pop() || path;
};

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

const norm = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

export const madeUpDuration = (_episode: MadeEpisode): number => MASTER_FRAMES;
