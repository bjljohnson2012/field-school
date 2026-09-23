/** Cues the LessonSpine rail applies. Soft notes only; Cleaning stays held. */
const WORDS = ["Sting.", "Household:", "the", "child", "has", "no", "login."];

export const APPLIED_CUE = "Sting. Household: the child has no login.";

export function appliedLessonSpineCraft() {
  const spoken = WORDS.map((text, index) => ({
    text,
    startMs: index === 0 ? 0 : index * 1000,
    endMs: index === WORDS.length - 1 ? 10000 : (index + 1) * 1000,
  }));
  return {
    cues: [{ text: APPLIED_CUE, startMs: 0, endMs: 10000 }],
    spoken,
    chapters: [
      { id: "sting", from: 0, frames: 300 },
      { id: "slate", from: 300, frames: 240 },
      { id: "objective", from: 540, frames: 180 },
      { id: "recap", from: 720, frames: 300 },
      { id: "nextUp", from: 1020, frames: 210 },
    ],
    audio: [
      {
        id: "sting",
        from: 0,
        frames: 300,
        fps: 30,
        startMs: 0,
        endMs: 10000,
        cueStartMs: 0,
        cueEndMs: 10000,
      },
    ],
    compositions: [
      {
        id: "LessonSpine",
        source: "const frame = useCurrentFrame();\ninterpolate(frame, [0, 12], [0, 1]);",
      },
    ],
    durations: [{ id: "LessonSpine", seconds: 41 }],
    flicker: [{ id: "cut", luma: [0, 0, 0, 1, 1, 1] }],
    contrast: [
      { id: "body", role: "text", foreground: "#1A1A16", background: "#EFE7D6" },
      { id: "tick", role: "mark", foreground: "#1A1A16", background: "#EFE7D6" },
    ],
    beats: [
      { id: "sting", objective: "Sting." },
      { id: "slate", objective: "Slate." },
      { id: "objective", objective: "Objective." },
      { id: "recap", objective: "Recap." },
      { id: "nextUp", objective: "Next up." },
    ],
    cleaningFlip: true,
  };
}
