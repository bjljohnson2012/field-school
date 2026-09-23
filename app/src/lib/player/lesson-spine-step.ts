import { LESSON_SPINE_CHAPTERS } from "./lesson-spine-meta.ts";

/** A living-brain outcome written by LessonSpine play. */
export function lessonSpineStep(title: string) {
  const text = title.trim();
  if (text === "Finished LessonSpine") return text;
  if (/^Continue LessonSpine at \S/.test(text)) return text;
  return null;
}

/**
 * How they are doing, from a LessonSpine outcome.
 * Same words as ledger confidence: Not yet, Getting there, Ready.
 * Null when the outcome is not a LessonSpine step.
 */
export function lessonSpineConfidence(outcomes: string) {
  const step = lessonSpineStep(outcomes);
  if (!step) return null;
  if (step === "Finished LessonSpine") return "Ready";
  const label = step.slice("Continue LessonSpine at ".length);
  const index = LESSON_SPINE_CHAPTERS.findIndex((chapter) => chapter.label === label);
  if (index <= 0) return "Not yet";
  return "Getting there";
}
