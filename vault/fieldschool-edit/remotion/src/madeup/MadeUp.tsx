import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Stack} from "../components/layers/Stack";
import {CollageBeat} from "./CollageBeat";
import {useWaitingSolo} from "./dropOff";
import {HookPlate} from "./HookPlate";
import {MadeHead} from "./MadeHead";
import {MadeLetterbox} from "./MadeLetterbox";
import {PaperSheet} from "./PaperSheet";
import {BrandBug, BrandLockup} from "./BrandLockup";
import {CtaCard} from "./TitlePlate";
import {PLAYBOOK, TypeField, letterAtMs, waitingOpen} from "./TypeField";
import {PhrasePlate} from "./PhrasePlate";
import {PaperCut, type CutKind} from "./PaperCut";
import {WaitingWash} from "./WaitingWash";
import {HoldFonts} from "./HoldFonts";
import {heardSince} from "./spoken";
import {BED_FRAMES, FPS, MASTER_FRAMES, bg, gold, paperGrain, uiFace} from "./tokens";
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
  const prev = shotBefore(episode.shots, frame);
  const local = shot ? frame - shot.fromFrame : 0;
  const solo = useWaitingSolo(words);
  const vox = Boolean(shot && (shot.type === "vox" || shot.type === "b-roll"));
  const waited = waitingOpen(nowMs, words);
  const slamType = waited || playbookOpen(nowMs, words);
  const teach = Boolean(shot && shot.type === "a-roll");
  const paperOpen = shot && shot.type === "a-roll" ? 1 : 0;
  const hookGhost = shot?.id === "s01" && solo > 0 ? 1 : 0;
  const letterMode = shot && shot.layout === "letterbox" ? "hair" : "none";
  const kind = cutKind(shot);
  const stingLen = episode.shots.find((item) => item.type === "sting")?.durationInFrames ?? 154;
  const shotFromMs = shot ? (shot.fromFrame / FPS) * 1000 : 0;
  const shotToMs = shot ? ((shot.fromFrame + shot.durationInFrames) / FPS) * 1000 : 0;
  const heard = heardSince(words, nowMs, shotFromMs);
  const headFresh = Boolean(shot && shot.layout !== "off" && (!prev || prev.layout !== shot.layout));
  const bedVol = bedVolume(shot, frame);
  const bedLoops = Math.ceil((MASTER_FRAMES + 60) / BED_FRAMES);
  const phraseOn =
    teach &&
    !slamType &&
    shot &&
    (shot.layout === "dock-right" || shot.layout === "dock-left" || shot.layout === "letterbox");
  return (
    <HoldFonts>
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Stack>
        <AbsoluteFill style={{backgroundColor: bg, backgroundImage: paperGrain}} />
        <PaperSheet open={paperOpen} solo={solo} layout={shot?.layout} />
        <WaitingWash open={shot?.id === "s01" && waited ? 1 : solo} />
        {shot && vox ? (
          <CollageBeat
            assets={shot.assets || []}
            text={shot.plate || shot.text || ""}
            annotation={shot.annotation}
            chips={shot.chips}
            list={shot.list}
            local={local}
            stamps={stampCount(shot, words, nowMs, local)}
            spoken={heard}
          />
        ) : null}
        {slamType ? <TypeField words={words} nowMs={nowMs} /> : null}
        {shot && shot.type === "hook" && shot.id === "s01" && !waited ? (
          <HookPlate
            text={shot.text || "PEOPLE CANNOT GET THINGS DONE"}
            local={frame - shot.fromFrame}
            ghost={hookGhost}
            words={words}
            nowMs={nowMs}
            fromMs={shotFromMs}
          />
        ) : null}
        {shot && shot.id === "s02" ? (
          <HookPlate
            text={shot.text || "YOU CAN JUST DO THINGS"}
            local={local}
            words={words}
            nowMs={nowMs}
            fromMs={shotFromMs}
          />
        ) : null}
        {phraseOn && shot ? (
          <PhrasePlate
            words={words}
            nowMs={nowMs}
            fromMs={shotFromMs}
            toMs={shotToMs}
            layout={shot.layout}
            phrases={shot.phrases}
          />
        ) : null}
        <MadeHead
          src={fileName(episode.cam)}
          layout={shot ? shot.layout : "off"}
          local={local}
          solo={solo}
          fresh={headFresh}
        />
        {shot && shot.lowerThird && shot.layout === "dock-right" && solo < 0.4 ? (
          <div
            style={{
              position: "absolute",
              right: 88,
              bottom: 88,
              width: 640,
              textAlign: "right",
              opacity: 1,
            }}
          >
            <div style={{width: 48, height: 3, backgroundColor: gold, marginLeft: "auto", marginBottom: 10}} />
            <div
              style={{
                fontFamily: uiFace,
                fontSize: 18,
                letterSpacing: "0.08em",
                color: gold,
              }}
            >
              {shot.lowerThird.name}
            </div>
          </div>
        ) : null}
        {shot && (shot.type !== "sting" || local >= stingLen - 6) ? (
          <PaperCut local={shot.type === "sting" ? local - (stingLen - 6) : local} kind={kind} />
        ) : null}
        {shot && shot.type === "sting" ? <BrandLockup local={local} duration={stingLen} /> : null}
        {shot && shot.type === "cta" ? <CtaCard text={shot.text || ""} local={local} /> : null}
        <BrandBug open={shot && shot.type !== "sting" && shot.type !== "cta" ? 1 : 0} />
        <MadeLetterbox mode={letterMode} local={20} />
        {Array.from({length: bedLoops}, (_, i) => (
          <Sequence key={`bed-${i}`} from={i * BED_FRAMES} durationInFrames={BED_FRAMES} layout="none">
            <Audio src={staticFile("bed.wav")} volume={bedVol} />
          </Sequence>
        ))}
        <Audio src={staticFile(fileName(episode.vo))} />
        {episode.shots.map((item) => (
          <ShotSfx key={`${item.id}-sfx`} shot={item} />
        ))}
        <PlaybookKeys words={words} />
        <WaitHit words={words} />
        <EditorialHits words={words} />
        <WordHits words={words} />
      </Stack>
    </AbsoluteFill>
    </HoldFonts>
  );
};

const playbookOpen = (nowMs: number, words: MadeWord[]): boolean => {
  const book = words.find((word) => PLAYBOOK.test(word.text.trim()));
  if (!book) {
    return false;
  }
  return nowMs + 34 >= book.fromMs && nowMs < book.fromMs + 2360;
};

const WaitHit: React.FC<{words: MadeWord[]}> = ({words}) => {
  const hit = words.find((word) => /^waiting\.$/i.test(word.text.trim()));
  if (!hit) {
    return null;
  }
  const at = Math.round((hit.fromMs / 1000) * FPS);
  return (
    <Sequence from={at} durationInFrames={16} layout="none">
      <Audio src={staticFile("sfx/hit.wav")} volume={0.34} />
    </Sequence>
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
          <Audio src={staticFile(i % 2 === 0 ? "sfx/key-a.wav" : "sfx/key-b.wav")} volume={0.16} />
        </Sequence>
      ))}
    </>
  );
};

const WordHits: React.FC<{words: MadeWord[]}> = ({words}) => {
  const names = ["just", "authored", "gravity", "stuck", "five", "sixty", "60", "wreck", "vandal", "act"];
  const hits = words.filter((word) => names.includes(norm(word.text)));
  return (
    <>
      {hits.map((word, i) => (
        <Sequence key={`hit-${word.fromMs}-${i}`} from={Math.round((word.fromMs / 1000) * FPS)} durationInFrames={10} layout="none">
          <Audio src={staticFile("sfx/tick.wav")} volume={0.14} />
        </Sequence>
      ))}
    </>
  );
};

const cutKind = (shot: MadeShot | null): CutKind => {
  if (!shot) {
    return "none";
  }
  if (shot.type === "sting" || shot.id === "s01") {
    return "wipe";
  }
  if (shot.type === "vox" || shot.type === "b-roll") {
    return "flash";
  }
  return "none";
};

const bedVolume = (shot: MadeShot | null, frame: number): number => {
  const fade = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const base = shot?.type === "sting" ? 0.2 : shot?.type === "cta" ? 0.16 : 0.12;
  return fade * base;
};

const EditorialHits: React.FC<{words: MadeWord[]}> = ({words}) => {
  const waiting = words.find((word) => /^waiting\.$/i.test(word.text.trim()));
  const book = words.find((word) => PLAYBOOK.test(word.text.trim()));
  const waitAt = waiting ? Math.round((waiting.fromMs / 1000) * FPS) : 334;
  const bookAt = book ? Math.round((book.fromMs / 1000) * FPS) : 451;
  return (
    <>
      <Sequence from={3} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/stamp.wav")} volume={0.32} />
      </Sequence>
      <Sequence from={10} durationInFrames={28} layout="none">
        <Audio src={staticFile("sfx/swell.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={waitAt} durationInFrames={18} layout="none">
        <Audio src={staticFile("sfx/paper.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={bookAt} durationInFrames={16} layout="none">
        <Audio src={staticFile("sfx/page.wav")} volume={0.26} />
      </Sequence>
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
        const vol = name === "hit" ? 0.32 : name === "sting" ? 0.16 : name === "whoosh" ? 0.2 : 0.12;
        return (
          <Sequence key={`${shot.id}-${name}-${i}`} from={at} durationInFrames={14} layout="none">
            <Audio src={staticFile(file)} volume={vol} />
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
  return Number(gravity) + Number(light) + Number(freeze);
};

const shotBefore = (shots: MadeShot[], frame: number): MadeShot | null => {
  const index = shots.findIndex((item) => frame >= item.fromFrame && frame < item.fromFrame + item.durationInFrames);
  return index > 0 ? shots[index - 1] : null;
};

const norm = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

export const madeUpDuration = (_episode: MadeEpisode): number => MASTER_FRAMES;
