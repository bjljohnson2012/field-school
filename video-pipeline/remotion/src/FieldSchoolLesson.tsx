import React, {useMemo} from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {INTRO_SEC, charcoal, cream, displayFace, gold, ink, olive, sansFace} from "./brand";
import {Fonts} from "./Fonts";
import {Intro} from "./Intro";
import {scenesFromCards, talkSeconds} from "./phrases";
import {
  LUMA_SEC,
  glideCard,
  lumaVeil,
  takeoverHead,
} from "./sceneMotionMath";
import type {Props, Scene, SceneMotion} from "./types";
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

const TypeCard: React.FC<{
  scene: Scene;
  motion: SceneMotion;
  sceneFrame: number;
  children: React.ReactNode;
}> = ({scene, motion, sceneFrame, children}) => {
  const {fps} = useVideoConfig();
  const frame = sceneFrame;
  const springPop = spring({frame, fps, config: {damping: 200, mass: 0.5}});
  const interp = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const glide = glideCard(frame);

  let opacity = 1;
  let x = 0;
  if (motion === "spring") {
    opacity = springPop;
    x = (1 - springPop) * -28;
  } else if (motion === "interpolate") {
    opacity = interp;
    x = (1 - interp) * -36;
  } else if (motion === "glide") {
    opacity = glide.opacity;
    x = glide.x;
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

const HeadFixture: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: charcoal}}>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 200,
          width: 420,
          height: 420,
          borderRadius: 210,
          backgroundColor: olive,
        }}
      />
    </AbsoluteFill>
  );
};

const TalkingCard: React.FC<{
  children: React.ReactNode;
  motion: SceneMotion;
  sceneFrame: number;
}> = ({children, motion, sceneFrame}) => {
  const {fps} = useVideoConfig();
  const frame = sceneFrame;
  const slide = spring({frame, fps, config: {damping: 200, mass: 0.7}});
  const interp = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const head = takeoverHead(frame);

  let opacity = 1;
  let x = 0;
  if (motion === "spring") {
    opacity = interpolate(slide, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    x = (1 - slide) * 80;
  } else if (motion === "interpolate") {
    opacity = interp;
    x = (1 - interp) * 64;
  } else if (motion === "glide") {
    opacity = 1;
    x = 0;
  } else if (motion === "takeover") {
    opacity = head.opacity;
    x = head.x;
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
        backgroundColor: charcoal,
        opacity,
        translate: `${x}px 0px`,
      }}
    >
      {children}
    </div>
  );
};

const OverlayLock: React.FC<{overlay: Props["overlay"]}> = ({overlay}) => {
  const logo = overlay.logo ? publicSrc(overlay.logo, "isolated-seal.svg") : staticFile("isolated-seal.svg");
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
          color: ink,
          textAlign: "right",
        }}
      >
        {overlay.title || "SceneMotion fixture"}
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
  const introFrames = Math.max(0, Math.round(intro * fps));
  const now = frame / fps - intro;
  const plates = useMemo(
    () => (scenes && scenes.length ? scenes : scenesFromCards(titleCards || [], durationSec || 8)),
    [scenes, titleCards, durationSec],
  );
  const chapter = plates.find((scene) => now >= scene.in && now < scene.out) || plates[0];
  const motion: SceneMotion = chapter?.motion || "spring";
  const veil = chapter ? lumaVeil(now, chapter.in, chapter.out, LUMA_SEC, motion) : 0;
  const lock = {
    logo: overlay?.logo || "isolated-seal.svg",
    title: overlay?.title || "SceneMotion fixture",
    x: overlay?.x ?? 1576,
    y: overlay?.y ?? 24,
    w: overlay?.w ?? 80,
    h: overlay?.h ?? 64,
  };

  return (
    <AbsoluteFill style={{backgroundColor: cream}}>
      <Fonts />
      {introFrames > 0 ? (
        <Sequence from={0} durationInFrames={introFrames} layout="none">
          <Intro title={lessonTitle || lock.title || "Field School"} />
        </Sequence>
      ) : null}
      <Sequence from={introFrames} layout="none">
        <AbsoluteFill style={{backgroundColor: cream}}>
          {chapter ? (
            <>
              <TypeCard scene={chapter} motion={motion} sceneFrame={Math.max(0, Math.round((now - chapter.in) * fps))}>
                <div
                  style={{
                    fontFamily: sansFace,
                    fontSize: 20,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: gold,
                    marginBottom: 18,
                  }}
                >
                  {chapter.label}
                </div>
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
                  {chapter.text}
                </div>
              </TypeCard>
              <TalkingCard motion={motion} sceneFrame={Math.max(0, Math.round((now - chapter.in) * fps))}>
                <HeadFixture />
              </TalkingCard>
            </>
          ) : null}
          {veil > 0 ? <AbsoluteFill style={{backgroundColor: cream, opacity: veil}} /> : null}
          <OverlayLock overlay={lock} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
