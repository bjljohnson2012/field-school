import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {INTRO_SEC, blue, displayFace, sansFace, stone} from "./brand";
import {Fonts} from "./Fonts";
import {Intro} from "./Intro";
import {scenesFromCards, talkSeconds} from "./phrases";
import {
  GLIDE_FRAMES,
  LUMA_SEC,
  TAKEOVER_EASE_FRAMES,
  TAKEOVER_HOLD_FRAMES,
  lumaVeil,
} from "./sceneMotionMath";
import type {Phrase, Props, Scene, SceneMotion, WordStamp} from "./types";
import {defaultProps} from "./types";

export {defaultProps};
export type {Props};

const CARD_CREAM = "#EFE7D6";
const CARD_INK = "#1A1A16";

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
        color: current ? blue : spoken ? CARD_INK : stone,
        opacity: spoken ? 1 : 0.28 + 0.2 * pop,
        translate: `0px ${(1 - pop) * 16}px`,
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

const TypeCard: React.FC<{
  scene: Scene;
  motion: SceneMotion;
  sceneFrame: number;
  children: React.ReactNode;
}> = ({scene, motion, sceneFrame, children}) => {
  const {fps} = useVideoConfig();
  const frame = sceneFrame;
  const springPop = spring({frame, fps, config: {damping: 13, mass: 0.5}});
  const interp = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const glide = interpolate(frame, [0, GLIDE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  let opacity = 1;
  let x = 0;
  if (motion === "spring") {
    opacity = springPop;
    x = (1 - springPop) * -28;
  } else if (motion === "interpolate") {
    opacity = interp;
    x = (1 - interp) * -36;
  } else if (motion === "glide") {
    opacity = glide;
    x = (1 - glide) * -140;
  } else if (motion === "takeover") {
    opacity = 1;
    x = 0;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: scene.x || 72,
        top: scene.y || 160,
        width: 1040,
        opacity,
        translate: `${x}px 0px`,
      }}
    >
      {children}
    </div>
  );
};

const TalkingCard: React.FC<{
  children: React.ReactNode;
  motion: SceneMotion;
  sceneFrame: number;
}> = ({children, motion, sceneFrame}) => {
  const {fps} = useVideoConfig();
  const frame = sceneFrame;
  const slide = spring({frame, fps, config: {damping: 16, mass: 0.7}});
  const interp = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const headIn = interpolate(frame, [TAKEOVER_HOLD_FRAMES, TAKEOVER_HOLD_FRAMES + TAKEOVER_EASE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  let opacity = 1;
  let x = 0;
  if (motion === "spring") {
    opacity = interpolate(slide, [0, 1], [0, 1]);
    x = (1 - slide) * 80;
  } else if (motion === "interpolate") {
    opacity = interp;
    x = (1 - interp) * 64;
  } else if (motion === "glide") {
    opacity = 1;
    x = 0;
  } else if (motion === "takeover") {
    opacity = headIn;
    x = (1 - headIn) * 120;
  }

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
        backgroundColor: CARD_INK,
        opacity,
        translate: `${x}px 0px`,
      }}
    >
      {children}
    </div>
  );
};

const OverlayLock: React.FC<{overlay: Props["overlay"]}> = ({overlay}) => {
  const logo = overlay.logo ? publicSrc(overlay.logo, "isolated-seal.png") : staticFile("isolated-seal.png");
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: overlay.x - 420,
          top: overlay.y,
          width: 410,
          height: overlay.h,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
          lineHeight: `${overlay.h}px`,
          color: CARD_INK,
          textAlign: "right",
        }}
      >
        {overlay.title || "You Can Just Do Things"}
      </div>
      <Img
        src={logo}
        style={{
          position: "absolute",
          left: overlay.x,
          top: overlay.y,
          width: overlay.w,
          height: overlay.h,
          objectFit: "contain",
        }}
      />
    </>
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
  const motion: SceneMotion = chapter?.motion || "spring";
  const veil = chapter ? lumaVeil(now, chapter.in, chapter.out, LUMA_SEC, motion) : 0;
  const lock = {
    logo: overlay?.logo || "isolated-seal.png",
    title: overlay?.title || "You Can Just Do Things",
    x: overlay?.x ?? 1576,
    y: overlay?.y ?? 24,
    w: overlay?.w ?? 80,
    h: overlay?.h ?? 64,
  };

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
    <AbsoluteFill style={{backgroundColor: CARD_CREAM}}>
      <Fonts />
      <Sequence from={0} durationInFrames={introFrames} layout="none">
        <Intro title={lessonTitle || lock.title || "Field School"} />
      </Sequence>
      <Sequence from={introFrames} layout="none">
        <AbsoluteFill style={{backgroundColor: CARD_CREAM}}>
          <div style={{position: "absolute", left: 0, top: 0, width: 18, height: 1080, backgroundColor: blue}} />
          {chapter ? (
            <>
              <TypeCard scene={chapter} motion={motion} sceneFrame={Math.max(0, Math.round((now - chapter.in) * fps))}>
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
                  {chapter.label}
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
                      color: CARD_INK,
                      maxWidth: 1000,
                    }}
                  >
                    {chapter.text}
                  </div>
                )}
              </TypeCard>
              <TalkingCard motion={motion} sceneFrame={Math.max(0, Math.round((now - chapter.in) * fps))}>
                {sequences}
              </TalkingCard>
            </>
          ) : null}
          {veil > 0 ? (
            <AbsoluteFill style={{backgroundColor: CARD_CREAM, opacity: veil}} />
          ) : null}
          <OverlayLock overlay={lock} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
