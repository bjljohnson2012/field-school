import React from "react";
import {Img, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {displayFace, gold, ink, paper, serifFace} from "../../brand";

export const LowerThird: React.FC<{
  name: string;
  org: string;
  visible: boolean;
}> = ({name, org, visible}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: {damping: 200},
    durationInFrames: 14,
  });
  const opacity = visible ? enter : 0;

  return (
    <>
      <Img
        src={staticFile("brand/mark-color-512.png")}
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
          left: 96,
          top: 900,
          opacity,
          backgroundColor: paper,
          borderRadius: 14,
          padding: "10px 18px 10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{width: 8, alignSelf: "stretch", borderRadius: 4, backgroundColor: gold}} />
        <div>
          <div
            style={{
              fontFamily: displayFace,
              fontWeight: 600,
              fontSize: 32,
              color: ink,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: serifFace,
              fontWeight: 400,
              fontSize: 22,
              color: ink,
              marginTop: 2,
            }}
          >
            {org}
          </div>
        </div>
      </div>
    </>
  );
};
