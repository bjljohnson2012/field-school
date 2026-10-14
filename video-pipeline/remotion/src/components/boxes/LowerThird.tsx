import React from "react";
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper, sansFace} from "../../brand";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const LowerThird: React.FC<{
  name: string;
  org: string;
  title: string;
  visible: boolean;
}> = ({name, org, title, visible}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame: Math.max(0, frame - 36),
    fps,
    config: {damping: 200, mass: 0.7},
    durationInFrames: 16,
  });
  const opacity = visible ? enter : 0;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 1148,
          top: 24,
          width: 400,
          height: 64,
          opacity,
          fontFamily: displayFace,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.02em",
          lineHeight: "64px",
          color: paper,
          textAlign: "right",
        }}
      >
        {title}
      </div>
      <Img
        src={staticFile("isolated-seal.svg")}
        style={{
          position: "absolute",
          left: 1576,
          top: 24,
          width: 80,
          height: 64,
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1142,
          bottom: 78,
          width: 700,
          opacity,
          translate: `${interpolate(enter, [0, 1], [24, 0], clamp)}px 0px`,
          backgroundColor: paper,
          borderRadius: 16,
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{width: 8, alignSelf: "stretch", borderRadius: 4, backgroundColor: gold}} />
        <div>
          <div
            style={{
              fontFamily: displayFace,
              fontWeight: 700,
              fontSize: 34,
              color: ink,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: sansFace,
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: ink,
              opacity: 0.75,
              marginTop: 4,
            }}
          >
            {org}
          </div>
        </div>
      </div>
    </>
  );
};
