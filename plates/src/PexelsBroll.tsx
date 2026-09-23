import React from "react";
import {AbsoluteFill, OffthreadVideo, interpolate, useCurrentFrame} from "remotion";
import {cream, ink} from "./brand";

export type PexelsBrollProps = {
  file: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
};

/** Cached Pexels b-roll plus the photographer attribution stored with the file. */
export const PexelsBroll: React.FC<PexelsBrollProps> = ({
  file,
  photographer,
  photographerUrl,
  pexelsUrl,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      {file ? <OffthreadVideo src={file} /> : null}
      <div
        data-pexels-attribution="cached"
        data-photographer={photographer}
        data-photographer-url={photographerUrl}
        data-pexels-url={pexelsUrl}
        style={{
          position: "absolute",
          left: 48,
          bottom: 36,
          color: ink,
          backgroundColor: cream,
          fontSize: 22,
          padding: "8px 12px",
          opacity,
        }}
      >
        {photographer} on Pexels
      </div>
    </AbsoluteFill>
  );
};
