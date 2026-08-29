import {interpolate} from "remotion";
import {BED_FRAMES, MASTER_FRAMES} from "./tokens";

export const BED_STING = 0.32;
export const BED_TEACH = 0.24;
export const BED_CTA = 0.22;
export const BED_FADE_IN = 28;
export const BED_SETTLE_FROM = 140;
export const BED_SETTLE_TO = 236;
export const BED_CROSS = 36;

export const bedGain = (frame: number): number => {
  const fadeIn = interpolate(frame, [0, BED_FADE_IN], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const body = interpolate(frame, [BED_SETTLE_FROM, BED_SETTLE_TO], [BED_STING, BED_TEACH], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tail = interpolate(frame, [MASTER_FRAMES - 200, MASTER_FRAMES - 130], [BED_TEACH, BED_CTA], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return fadeIn * Math.min(body, tail);
};

export const loopBedGain = (absFrame: number, local: number, loopFrom: number): number => {
  const edgeIn =
    loopFrom === 0
      ? 1
      : interpolate(local, [0, BED_CROSS], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const edgeOut = interpolate(local, [BED_FRAMES, BED_FRAMES + BED_CROSS], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return bedGain(absFrame) * edgeIn * edgeOut;
};
