/** Wave 5 lesson spine — sting / slate / objective / recap / next-up. */

export const SPINE_FPS = 30;

export const SPINE_BEATS = [
  {id: "sting", plate: "Opener", durationSec: 10, motion: "takeover"},
  {id: "slate", plate: "TalkingHeadCard", durationSec: 8, motion: "takeover"},
  {id: "objective", plate: "DefinitionBoard", durationSec: 6, motion: "glide"},
  {id: "recap", plate: "RecapCard", durationSec: 10, motion: "glide"},
  {id: "nextUp", plate: "QuizBumper", durationSec: 7, motion: "glide"},
] as const;

export type SpineBeatId = (typeof SPINE_BEATS)[number]["id"];

export function beatFrames(durationSec: number, fps = SPINE_FPS): number {
  return Math.max(1, Math.round(durationSec * fps));
}

export function spineLayout(beats: readonly {id: string; durationSec: number}[] = SPINE_BEATS) {
  let from = 0;
  return beats.map((beat) => {
    const frames = beatFrames(beat.durationSec);
    const row = {...beat, from, frames};
    from += frames;
    return row;
  });
}

export function spineDurationFrames(
  beats: readonly {durationSec: number}[] = SPINE_BEATS,
): number {
  return beats.reduce((sum, beat) => sum + beatFrames(beat.durationSec), 0);
}

export function spineDurationSec(
  beats: readonly {durationSec: number}[] = SPINE_BEATS,
): number {
  return spineDurationFrames(beats) / SPINE_FPS;
}
