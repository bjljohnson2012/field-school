import { brainBoard, type LivingBrain, type Room } from "../living-brain/model.ts";
import { LESSON_SPINE_CHAPTERS } from "./lesson-spine-meta.ts";

export {
  lessonSpineConfidence,
  lessonSpineContinue,
  lessonSpineRollup,
  lessonSpineStep,
  lessonSpineTrail,
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
