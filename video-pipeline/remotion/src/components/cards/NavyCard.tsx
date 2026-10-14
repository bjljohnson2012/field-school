import React from "react";
import {CameraMotionBlur} from "@remotion/motion-blur";
import {Rect} from "@remotion/shapes";
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, navy, orange, paper, sansFace} from "../../brand";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const Headline: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 16], [42, 0], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const opacity = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <div
      style={{
        translate: `0px ${shift}px`,
        opacity,
        fontFamily: displayFace,
        fontWeight: 700,
        fontSize: text.length > 42 ? 72 : 92,
        letterSpacing: "-0.035em",
        lineHeight: 1.02,
        color: paper,
        maxWidth: 1480,
      }}
    >
      {text}
    </div>
  );
};

/** Full-screen navy card. The live lockup sits on a paper bar, the way the site header does. */
export const NavyCard: React.FC<{
  kicker: string;
  text: string;
  showLogo?: boolean;
}> = ({kicker, text, showLogo = false}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const rule = interpolate(frame, [4, 18], [0, 1], clamp);

  return (
    <div style={{width, height, backgroundColor: navy, position: "absolute", inset: 0}}>
      {showLogo ? (
        <div style={{backgroundColor: paper, height: 168, display: "flex", alignItems: "center", paddingLeft: 72}}>
          <Img src={staticFile("lesson60/logo.png")} style={{height: 112, width: "auto"}} />
        </div>
      ) : null}
      <div style={{position: "absolute", left: 96, right: 96, top: showLogo ? 280 : 300}}>
        <div
          style={{
            fontFamily: sansFace,
            fontWeight: 600,
            fontSize: 28,
            letterSpacing: "0.16em",
            color: orange,
            marginBottom: 28,
          }}
        >
          {kicker}
        </div>
        <div style={{width: 220 * rule, height: 8, marginBottom: 36}}>
          <Rect width={Math.max(1, 220 * rule)} height={8} cornerRadius={4} fill={orange} />
        </div>
        <CameraMotionBlur shutterAngle={140} samples={5}>
          <Headline text={text} />
        </CameraMotionBlur>
      </div>
    </div>
  );
};
