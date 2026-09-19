/** Frame-accurate SceneMotion math. Must match video-pipeline/remotion/src/sceneMotionMath.ts. */

export const SCENE_MOTIONS = ["spring", "interpolate", "glide", "takeover"] as const;
export type SceneMotionName = (typeof SCENE_MOTIONS)[number];

export const GLIDE_FRAMES = 24;
export const TAKEOVER_HOLD_FRAMES = 12;
export const TAKEOVER_EASE_FRAMES = 18;
export const LUMA_SEC = 0.5;

export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/** Smoothstep. No overshoot, no bounce. */
export function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function glideCard(frame: number, frames = GLIDE_FRAMES): {x: number; opacity: number} {
  const t = smoothstep(frame / frames);
  return {x: (1 - t) * -140, opacity: t};
}

export function takeoverHead(
  frame: number,
  hold = TAKEOVER_HOLD_FRAMES,
  ease = TAKEOVER_EASE_FRAMES,
): {opacity: number; x: number; cardOwns: boolean} {
  if (frame < hold) {
    return {opacity: 0, x: 120, cardOwns: true};
  }
  const t = smoothstep((frame - hold) / ease);
  return {opacity: t, x: (1 - t) * 120, cardOwns: false};
}

export function lumaVeil(
  nowSec: number,
  sceneIn: number,
  sceneOut: number,
  duration = LUMA_SEC,
  motion?: string,
): number {
  const into = nowSec - sceneIn;
  const remain = sceneOut - nowSec;
  const inDur = motion === "takeover" || motion === "glide" ? 0 : duration;
  if (inDur > 0 && into >= 0 && into < inDur) {
    return 1 - into / inDur;
  }
  if (remain >= 0 && remain < duration) {
    return 1 - remain / duration;
  }
  return 0;
}

export function isSceneMotion(value: string): value is SceneMotionName {
  return (SCENE_MOTIONS as readonly string[]).includes(value);
}

export function clampPlateSec(sec: number): number {
  return Math.min(12, Math.max(8, sec));
}
