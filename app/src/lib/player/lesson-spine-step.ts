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

/** Chapter a signed-in play should continue, from a living-brain LessonSpine step. */
export function lessonSpineContinue(title: string) {
  const step = lessonSpineStep(title);
  if (!step) return null;
  if (step === "Finished LessonSpine") {
    const last = LESSON_SPINE_CHAPTERS[LESSON_SPINE_CHAPTERS.length - 1];
    return { step, chapterId: last.id, label: last.label, startSec: last.startSec };
  }
  const name = step.slice("Continue LessonSpine at ".length);
  const chapter = LESSON_SPINE_CHAPTERS.find((row) => row.label === name);
  if (!chapter) return null;
  return { step, chapterId: chapter.id, label: chapter.label, startSec: chapter.startSec };
}

/** LessonSpine Continue/Finished marks, oldest first. The current step is included once. */
export function lessonSpineTrail(marks: Array<{ outcomes?: string } | null | undefined>, current?: string) {
  const steps: string[] = [];
  for (const mark of marks) {
    const step = lessonSpineStep(mark?.outcomes || "");
    if (step && steps[steps.length - 1] !== step) steps.push(step);
  }
  const now = lessonSpineStep(current || "");
  if (now && steps[steps.length - 1] !== now) steps.push(now);
  return steps;
}
