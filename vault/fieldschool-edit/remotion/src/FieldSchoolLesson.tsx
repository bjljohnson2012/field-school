import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {INTRO_SEC, blue, cream, displayFace, ink, sansFace, stone} from "./brand";
import {Fonts} from "./Fonts";
import {Intro} from "./Intro";
import {scenesFromCards, talkSeconds} from "./phrases";
import type {Phrase, Props, Scene, WordStamp} from "./types";
import {defaultProps} from "./types";

export {defaultProps};
export type {Props};

export function durationFrames(props: Props): number {
  const intro = props.introSec ?? INTRO_SEC;
  return Math.max(1, Math.round((intro + talkSeconds(props.cuts, props.durationSec)) * 30));
}

function publicSrc(path: string, fallback: string): string {
  if (!path) {
    return staticFile(fallback);
  }
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const name = path.includes("/") ? path.split("/").pop() || fallback : path;
  return staticFile(name);
}

const WordChip: React.FC<{word: WordStamp; now: number; delay: number}> = ({word, now, delay}) => {
  const {fps} = useVideoConfig();
  const local = useCurrentFrame();
  const pop = spring({frame: Math.max(0, local - delay), fps, config: {damping: 16, mass: 0.45}});
  const spoken = now >= word.start;
  const current = now >= word.start && now <= word.end + 0.08;
  return (
    <span
      style={{
        display: "inline-block",
        marginRight: 14,
        marginBottom: 10,
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: 58,
        letterSpacing: "-0.03em",
        lineHeight: 1.12,
        color: current ? blue : spoken ? ink : stone,
        opacity: spoken ? 1 : 0.28 + 0.2 * pop,
        transform: `translateY(${(1 - pop) * 16}px)`,
      }}
    >
      {word.text}
    </span>
  );
};

const KineticPhrase: React.FC<{phrase: Phrase; now: number}> = ({phrase, now}) => {
  return (
    <div style={{maxWidth: 1000}}>
      {phrase.words.map((word, i) => (
        <WordChip key={`${word.start}-${word.text}-${i}`} word={word} now={now} delay={i * 1} />
      ))}
    </div>
  );
};

const ChapterPlate: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 13, mass: 0.5}});
  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: interpolate(pop, [0, 1], [0, 18]),
          height: 1080,
          backgroundColor: blue,
        }}
      />
      <Img
        src={staticFile("mark-transparent.png")}
        style={{
          position: "absolute",
          right: 80,
          top: 80,
          width: 360,
          height: 360,
          objectFit: "contain",
          opacity: 0.12 * pop,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 240,
          width: 1400,
          fontFamily: sansFace,
          fontSize: 22,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: blue,
          opacity: pop,
        }}
      >
        {scene.label}
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 300,
          width: 1500,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 72,
          letterSpacing: "-0.03em",
          lineHeight: 1.08,
          color: ink,
          opacity: pop,
          transform: `translateY(${(1 - pop) * 28}px)`,
        }}
      >
        {scene.text}
      </div>
    </AbsoluteFill>
  );
};

const TalkingCard: React.FC<{children: React.ReactNode; enter: number}> = ({children, enter}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slide = spring({frame: frame - enter, fps, config: {damping: 16, mass: 0.7}});
  return (
    <div
      style={{
        position: "absolute",
        left: 1160,
        top: 150,
        width: 700,
        height: 820,
        overflow: "hidden",
        borderRadius: 22,
        border: `6px solid ${blue}`,
        boxShadow: "0 22px 60px rgba(26,25,22,0.2)",
        backgroundColor: ink,
        opacity: interpolate(slide, [0, 1], [0, 1]),
        transform: `translateX(${(1 - slide) * 80}px)`,
        zIndex: 3,
      }}
    >
      {children}
    </div>
  );
};

export const FieldSchoolLesson: React.FC<Props> = ({
  src,
  cuts,
  overlay,
  titleCards,
  scenes,
  durationSec,
  phrases,
  introSec,
  lessonTitle,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const intro = introSec ?? INTRO_SEC;
  const introFrames = Math.round(intro * fps);
  const now = frame / fps - intro;
  const ranges = cuts && cuts.length ? cuts : [{in: 0, out: durationSec || 8}];
  const plates = scenes && scenes.length ? scenes : scenesFromCards(titleCards || [], durationSec || 8);
  const livePhrases = (phrases || []).filter((phrase) => now >= phrase.start - 0.25 && now <= phrase.end + 0.55);
  const chapter = plates.find((scene) => now >= scene.in && now < scene.out) || plates[0];
  const chapterAge = chapter ? now - chapter.in : 0;
  const bumper = chapterAge >= 0 && chapterAge < 1.15;

  let cursor = 0;
  const sequences = ranges.map((cut, i) => {
    const start = Number(cut.in) || 0;
    const end = Number(cut.out) > start ? Number(cut.out) : start + (durationSec || 8);
    const dur = Math.max(0.1, end - start);
    const from = Math.round(cursor * fps);
    cursor += dur;
    return (
      <Sequence key={`a${i}`} from={from} durationInFrames={Math.max(1, Math.round(dur * fps))}>
        <OffthreadVideo
          src={publicSrc(src, "a_roll.mp4")}
          startFrom={Math.round(start * fps)}
          style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top"}}
        />
      </Sequence>
    );
  });

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Fonts />
      <Sequence from={0} durationInFrames={introFrames} layout="none">
        <Intro title={lessonTitle || overlay.title || "Field School"} />
      </Sequence>
      <Sequence from={0} durationInFrames={Math.round((intro + 16) * fps)} layout="none">
        <Audio src={staticFile("intro.wav")} volume={(f) => interpolate(f, [0, 40, introFrames, introFrames + 90], [0, 0.38, 0.22, 0.05], {extrapolateRight: "clamp"})} />
      </Sequence>
      <Sequence from={introFrames} layout="none">
        <AbsoluteFill style={{backgroundColor: cream}}>
          <div style={{position: "absolute", left: 0, top: 0, width: 18, height: 1080, backgroundColor: blue, zIndex: 4}} />
          <Img
            src={staticFile("lockup-wide-cream.png")}
            style={{
              position: "absolute",
              left: 48,
              top: 28,
              width: 420,
              height: 88,
              objectFit: "contain",
              zIndex: 5,
            }}
          />
          {bumper && chapter ? (
            <ChapterPlate scene={chapter} />
          ) : (
            <div style={{position: "absolute", left: 72, top: 160, width: 1040, zIndex: 2}}>
              <div
                style={{
                  fontFamily: sansFace,
                  fontSize: 20,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: blue,
                  marginBottom: 18,
                }}
              >
                {chapter ? chapter.label : ""}
              </div>
              {livePhrases.length ? (
                livePhrases.map((phrase) => <KineticPhrase key={`${phrase.start}`} phrase={phrase} now={now} />)
              ) : (
                <div
                  style={{
                    fontFamily: displayFace,
                    fontWeight: 700,
                    fontSize: 56,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.12,
                    color: ink,
                    maxWidth: 1000,
                  }}
                >
                  {chapter ? chapter.text : ""}
                </div>
              )}
            </div>
          )}
          <TalkingCard enter={bumper ? 24 : 0}>{sequences}</TalkingCard>
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              height: 8,
              width: 1920 * interpolate(Math.max(0, now), [0, durationSec || 1], [0, 1], {extrapolateRight: "clamp"}),
              backgroundColor: blue,
              zIndex: 6,
            }}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
