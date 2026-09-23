import { LESSON_SPINE_CHAPTERS } from "./lesson-spine-meta.ts";

/** A living-brain outcome written by LessonSpine play. A resume cue may follow on later lines. */
export function lessonSpineStep(title: string) {
  const line = title.trim().split("\n")[0]?.trim() || "";
  if (line === "Finished LessonSpine") return line;
  if (/^Continue LessonSpine at \S/.test(line)) return line;
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

/** One org list of LessonSpine outcomes. People without a spine step are left out. */
export function lessonSpineRollup(
  people: Array<{ name?: string; outcomes?: string; login?: string }>,
) {
  const rows: Array<{ name: string; step: string; login: "none" | "member"; confidence: string }> = [];
  for (const person of people) {
    const step = lessonSpineStep(person.outcomes || "");
    if (!step) continue;
    rows.push({
      name: (person.name || "").trim() || "This person",
      step,
      login: person.login === "member" ? "member" : "none",
      confidence: lessonSpineConfidence(step) || "",
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name) || a.step.localeCompare(b.step));
  return rows;
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

/** Teach and Prove entries for the next LessonSpine portion stored on the living brain. */
export function lessonSpineTeachProve(title: string) {
  const continued = lessonSpineContinue(title);
  if (!continued) return null;
  return { ...continued, teach: continued.step, prove: continued.step };
}

/** Seconds into the continued chapter, plus the caption cue, when a return should resume mid-chapter. */
export function lessonSpineResume(title: string) {
  const step = lessonSpineStep(title);
  const continued = step ? lessonSpineContinue(step) : null;
  if (!step || !continued) return null;
  const lines = title.trim().split("\n").slice(1);
  const resume = lines.find((line) => line.startsWith("resume "));
  const cueLine = lines.find((line) => line.startsWith("cue "));
  if (!resume) return null;
  const offsetSec = Number(resume.slice("resume ".length).replace(/s$/, ""));
  const chapter = LESSON_SPINE_CHAPTERS.find((row) => row.id === continued.chapterId);
  if (!chapter || !Number.isFinite(offsetSec)) return null;
  const span = chapter.endSec - chapter.startSec;
  if (offsetSec <= 0 || offsetSec >= span) return null;
  return {
    chapterId: continued.chapterId,
    offsetSec,
    cue: cueLine ? cueLine.slice("cue ".length) : continued.label,
  };
}

/** Keep the LessonSpine step and attach a mid-chapter scrub. Null when the scrub is not inside that chapter. */
export function lessonSpineWithResume(step: string, offsetSec: number, cue: string) {
  const head = lessonSpineStep(step);
  const continued = head ? lessonSpineContinue(head) : null;
  if (!head || !continued) return null;
  const chapter = LESSON_SPINE_CHAPTERS.find((row) => row.id === continued.chapterId);
  if (!chapter) return null;
  const seconds = Math.round(offsetSec);
  const span = chapter.endSec - chapter.startSec;
  if (seconds <= 0 || seconds >= span) return null;
  const text = cue.trim() || continued.label;
  return `${head}\nresume ${seconds}s\ncue ${text}`;
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
