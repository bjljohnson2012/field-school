import { brainBoard, type LivingBrain, type Room } from "../living-brain/model.ts";
import { LESSON_SPINE_CHAPTERS } from "./lesson-spine-meta.ts";

function chapterId(raw: string) {
  const id = raw.trim();
  return id === "nextUp" ? "next-up" : id;
}

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

/** Next LessonSpine step for the person already on the desk. */
export function playOutcome(rawChapterId: string) {
  const id = chapterId(rawChapterId);
  const index = LESSON_SPINE_CHAPTERS.findIndex((chapter) => chapter.id === id);
  if (index < 0) return null;
  const next = LESSON_SPINE_CHAPTERS[index + 1];
  if (!next) return "Finished LessonSpine";
  return `Continue LessonSpine at ${next.label}`;
}

/** Body for POST /api/living-brain. Null when this desk has nobody to update. */
export function playWriteBody(input: {
  room: Room;
  brain: LivingBrain | null;
  chapterId: string;
}) {
  if (!input.brain || input.brain.room !== input.room) return null;
  const person = brainBoard({ room: input.room, brain: input.brain }).people[0];
  if (!person) return null;
  const outcomes = playOutcome(input.chapterId);
  if (!outcomes) return null;
  return {
    membershipId: person.membershipId,
    name: person.name,
    kind: person.kind,
    login: person.login,
    profile: person.profile,
    outcomes,
  };
}
