import React from "react";
import {AbsoluteFill} from "remotion";

/** Later sibling paints on top. z-index is not used. */
export const Stack: React.FC<{
  bed: React.ReactNode;
  broll: React.ReactNode;
  vox: React.ReactNode;
  head: React.ReactNode;
  lowerThird: React.ReactNode;
  karaoke: React.ReactNode;
  letterbox: React.ReactNode;
  audio: React.ReactNode;
}> = ({bed, broll, vox, head, lowerThird, karaoke, letterbox, audio}) => {
  return (
    <AbsoluteFill>
      {bed}
      {broll}
      {vox}
      {head}
      {lowerThird}
      {karaoke}
      {letterbox}
      {audio}
    </AbsoluteFill>
  );
};
