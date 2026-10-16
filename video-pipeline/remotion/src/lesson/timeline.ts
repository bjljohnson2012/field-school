/** Scene starts are locked to the voice clock. Fade length changes the overlap, not the clock. */

export const SCENE_START = {
  cam: 75,
  teach: 760,
  show: 955,
  do: 1180,
  outro: 1315,
} as const;

export const OUTRO_FRAMES = 150;

export function sceneDurations(fade: number) {
  const start = SCENE_START;
  return {
    intro: start.cam + fade,
    cam: start.teach - start.cam + fade,
    teach: start.show - start.teach + fade,
    show: start.do - start.show + fade,
    do: start.outro - start.do + fade,
    outro: OUTRO_FRAMES,
  };
}

export function lessonFrames(): number {
  return SCENE_START.outro + OUTRO_FRAMES;
}
