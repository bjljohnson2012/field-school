import { brainBoard, type LivingBrain, type Room } from "../living-brain/model.ts";
import { lessonSpineStep, lessonSpineWithResume } from "./lesson-spine-step.ts";
import { LESSON_SPINE_CHAPTERS } from "./lesson-spine-meta.ts";

export {
  lessonSpineConfidence,
  lessonSpineContinue,
  lessonSpineResume,
  lessonSpineRollup,
  lessonSpineStep,
  lessonSpineTeachProve,
  lessonSpineTrail,
  lessonSpineWithResume,
} from "./lesson-spine-step.ts";

function chapterId(raw: string) {
  const id = raw.trim();
  return id === "nextUp" ? "next-up" : id;
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

/** Next LessonSpine portion after this chapter finishes. Same write as play, named for the finished chapter. */
export function portionWriteBody(input: {
  room: Room;
  brain: LivingBrain | null;
  chapterId: string;
}) {
  return playWriteBody(input);
}

export const NEXT_LESSON_STEP = "Continue LessonSpine at Next lesson";

/** Finishing Prove for the consumed portion writes the next chapter continue-from. The final chapter writes the next lesson. */
export function proveCompleteBody(input: {
  room: Room;
  brain: LivingBrain | null;
  chapterId: string;
}) {
  const id = chapterId(input.chapterId);
  const last = LESSON_SPINE_CHAPTERS[LESSON_SPINE_CHAPTERS.length - 1];
  if (id !== last.id) return portionWriteBody(input);
  if (!input.brain || input.brain.room !== input.room) return null;
  const person = brainBoard({ room: input.room, brain: input.brain }).people[0];
  if (!person) return null;
  const onFinalLesson = lessonSpineStep(person.outcomes || "") === NEXT_LESSON_STEP;
  return {
    membershipId: person.membershipId,
    name: person.name,
    kind: person.kind,
    login: person.login,
    profile: person.profile,
    outcomes: onFinalLesson ? "" : NEXT_LESSON_STEP,
  };
}

/** Body for POST /api/living-brain. Keeps the step and stores a mid-chapter scrub plus caption cue. */
export function resumeWriteBody(input: {
  room: Room;
  brain: LivingBrain | null;
  offsetSec: number;
  cue: string;
}) {
  if (!input.brain || input.brain.room !== input.room) return null;
  const person = brainBoard({ room: input.room, brain: input.brain }).people[0];
  if (!person) return null;
  const step = lessonSpineStep(person.outcomes || "");
  if (!step) return null;
  const outcomes = lessonSpineWithResume(step, input.offsetSec, input.cue);
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
