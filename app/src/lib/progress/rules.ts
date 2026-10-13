import {
  computePassed,
  emptyProgress,
  passingScore,
  requiredAssignmentComplete,
} from "../course/content.ts";
import {
  EXAM_PASS_RATIO,
  PASS_RATIO,
  type CourseRecord,
  type Module,
  type ModuleProgress,
  type ProgressMap,
} from "../course/types.ts";

export const STATION_PASS_RATIO = PASS_RATIO;
export const EXAM_STATION = "exam";
export const EXAM_PASS_COUNT = 8;

export type ProgressKind = "watch" | "practice" | "check" | "exam";

export type ProgressAttempt = {
  stationSlug: string;
  kind: ProgressKind;
  score: number | null;
  total: number | null;
  passed: boolean;
  raw: Record<string, unknown>;
  createdAt: string;
  learningEventId?: string;
};

export type ExamSnapshot = {
  score: number;
  passed: boolean;
  at: string;
};

export type ProgressProjection = {
  modules: ProgressMap;
  exam: ExamSnapshot | null;
  certified: boolean;
  passed: number;
  total: number;
  examTotal: number;
};

export type ImportPiece = {
  stationSlug: string;
  kind: ProgressKind;
  score: number | null;
  total: number | null;
  passed: boolean;
  raw: Record<string, unknown>;
};

export function progressWriteTarget(signedIn: boolean): "server" | "local" {
  return signedIn ? "server" : "local";
}

export function attemptKey(stationSlug: string, kind: ProgressKind) {
  return `${stationSlug}:${kind}`;
}

export function learningEventForAttempt(input: {
  courseSlug: string;
  stationSlug: string;
  kind: ProgressKind;
  score: number | null;
  passed: boolean;
  imported?: boolean;
}) {
  const kind =
    input.kind === "practice"
      ? "assignment"
      : input.kind === "check"
        ? "quiz"
        : input.kind === "exam"
          ? "exam"
          : "watch";
  const station = input.kind === "exam" ? EXAM_STATION : input.stationSlug;
  return {
    kind,
    objectType: input.kind === "exam" ? "exam" : "station",
    objectId: `${input.courseSlug}:${station}`,
    score: input.score,
    raw: {
      course: input.courseSlug,
      station,
      passed: input.passed,
      ...(input.imported ? { imported: true } : {}),
    },
  };
}

export function scoreAnswers(
  questions: { id: string; answer: number }[],
  answers: Record<string, number>,
  ratio: number,
) {
  let score = 0;
  for (const question of questions) {
    if (answers[question.id] === question.answer) score += 1;
  }
  const need = passingScore(questions.length, ratio);
  return {
    score,
    total: questions.length,
    need,
    passed: score >= need,
  };
}

export function scoreCheck(mod: Module, answers: Record<string, number>) {
  return scoreAnswers(mod.quiz, answers, STATION_PASS_RATIO);
}

export function scoreExam(course: CourseRecord, answers: Record<string, number>) {
  return scoreAnswers(course.examQuestions, answers, EXAM_PASS_RATIO);
}

export function practicePassed(mod: Module, assignment: Record<string, boolean>) {
  return requiredAssignmentComplete(mod, assignment);
}

function asAssignment(raw: Record<string, unknown>) {
  const value = raw.assignment;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const assignment: Record<string, boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    assignment[key] = item === true;
  }
  return assignment;
}

function asNotes(raw: Record<string, unknown>) {
  return typeof raw.notes === "string" ? raw.notes : "";
}

export function latestAttempts(attempts: readonly ProgressAttempt[]) {
  const ordered = [...attempts].sort((a, b) => {
    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;
    return 0;
  });
  const latest = new Map<string, ProgressAttempt>();
  for (const attempt of ordered) {
    latest.set(attemptKey(attempt.stationSlug, attempt.kind), attempt);
  }
  return latest;
}

function moduleFromLatest(mod: Module, latest: Map<string, ProgressAttempt>): ModuleProgress {
  const progress = emptyProgress();
  const watch = latest.get(attemptKey(mod.slug, "watch"));
  const practice = latest.get(attemptKey(mod.slug, "practice"));
  const check = latest.get(attemptKey(mod.slug, "check"));
  if (watch?.passed) progress.watched = true;
  if (practice) {
    progress.assignment = asAssignment(practice.raw);
    progress.notes = asNotes(practice.raw);
  }
  if (check && check.score != null) {
    const scored = check.score >= passingScore(mod.quiz.length, STATION_PASS_RATIO);
    progress.quizScore = check.score;
    progress.quizPassed = scored;
  }
  progress.passed = computePassed(mod, progress);
  return progress;
}

function examFromLatest(course: CourseRecord, latest: Map<string, ProgressAttempt>): ExamSnapshot | null {
  const attempt = latest.get(attemptKey(EXAM_STATION, "exam"));
  if (!attempt || attempt.score == null) return null;
  const need = passingScore(course.examQuestions.length, EXAM_PASS_RATIO);
  return {
    score: attempt.score,
    passed: attempt.score >= need,
    at: attempt.createdAt,
  };
}

export function projectServerProgress(
  course: CourseRecord,
  attempts: readonly ProgressAttempt[],
): ProgressProjection {
  const latest = latestAttempts(attempts);
  const modules: ProgressMap = {};
  for (const mod of course.modules) {
    modules[mod.slug] = moduleFromLatest(mod, latest);
  }
  const exam = examFromLatest(course, latest);
  const passed = course.modules.filter((mod) => modules[mod.slug]?.passed).length;
  const certified = Boolean(exam?.passed) && course.modules.every((mod) => modules[mod.slug]?.passed);
  return {
    modules,
    exam,
    certified,
    passed,
    total: course.modules.length,
    examTotal: course.examQuestions.length,
  };
}

export function mergeLegacyProgress(
  course: CourseRecord,
  legacy: ProgressMap,
  attempts: readonly ProgressAttempt[],
): ProgressProjection {
  const projected = projectServerProgress(course, attempts);
  const keys = new Set(attempts.map((attempt) => attemptKey(attempt.stationSlug, attempt.kind)));
  for (const mod of course.modules) {
    const prior = legacy[mod.slug];
    if (!prior) continue;
    const next: ModuleProgress = { ...projected.modules[mod.slug] };
    if (!keys.has(attemptKey(mod.slug, "watch"))) next.watched = prior.watched;
    if (!keys.has(attemptKey(mod.slug, "practice"))) {
      next.assignment = prior.assignment;
      next.notes = prior.notes;
    }
    if (!keys.has(attemptKey(mod.slug, "check"))) {
      next.quizScore = prior.quizScore;
      next.quizPassed = prior.quizPassed;
    }
    next.passed = computePassed(mod, next);
    projected.modules[mod.slug] = next;
  }
  projected.passed = course.modules.filter((mod) => projected.modules[mod.slug]?.passed).length;
  projected.certified =
    Boolean(projected.exam?.passed) && course.modules.every((mod) => projected.modules[mod.slug]?.passed);
  return projected;
}

function localHasPractice(progress: ModuleProgress) {
  if (progress.notes.trim()) return true;
  return Object.keys(progress.assignment).length > 0;
}

export function planImport(input: {
  course: CourseRecord;
  importedAt: string | null;
  serverKeys: readonly string[];
  local: { modules: ProgressMap; exam: ExamSnapshot | null };
}): { pieces: ImportPiece[]; markImported: boolean } {
  if (input.importedAt) return { pieces: [], markImported: false };
  const have = new Set(input.serverKeys);
  const pieces: ImportPiece[] = [];
  let wanted = 0;

  for (const mod of input.course.modules) {
    const progress = input.local.modules[mod.slug];
    if (!progress) continue;
    if (progress.watched) {
      wanted += 1;
      if (!have.has(attemptKey(mod.slug, "watch"))) {
        pieces.push({
          stationSlug: mod.slug,
          kind: "watch",
          score: null,
          total: null,
          passed: true,
          raw: {},
        });
      }
    }
    if (localHasPractice(progress)) {
      wanted += 1;
      if (!have.has(attemptKey(mod.slug, "practice"))) {
        const assignment = progress.assignment ?? {};
        pieces.push({
          stationSlug: mod.slug,
          kind: "practice",
          score: null,
          total: null,
          passed: practicePassed(mod, assignment),
          raw: { assignment, notes: progress.notes ?? "" },
        });
      }
    }
    if (progress.quizScore != null) {
      wanted += 1;
      if (!have.has(attemptKey(mod.slug, "check"))) {
        const need = passingScore(mod.quiz.length, STATION_PASS_RATIO);
        pieces.push({
          stationSlug: mod.slug,
          kind: "check",
          score: progress.quizScore,
          total: mod.quiz.length,
          passed: progress.quizScore >= need,
          raw: {},
        });
      }
    }
  }

  if (input.local.exam && Number.isFinite(input.local.exam.score)) {
    wanted += 1;
    if (!have.has(attemptKey(EXAM_STATION, "exam"))) {
      const need = passingScore(input.course.examQuestions.length, EXAM_PASS_RATIO);
      pieces.push({
        stationSlug: EXAM_STATION,
        kind: "exam",
        score: input.local.exam.score,
        total: input.course.examQuestions.length,
        passed: input.local.exam.score >= need,
        raw: {},
      });
    }
  }

  return { pieces, markImported: wanted > 0 };
}

export function mergeProgressSnapshots(
  parts: readonly { modules: ProgressMap; exam: ExamSnapshot | null }[],
): { modules: ProgressMap; exam: ExamSnapshot | null } | null {
  const modules: ProgressMap = {};
  let exam: ExamSnapshot | null = null;
  let any = false;
  for (const part of parts) {
    for (const [slug, progress] of Object.entries(part.modules)) {
      const current = modules[slug];
      if (!current || rankProgress(progress) >= rankProgress(current)) {
        modules[slug] = progress;
        any = true;
      }
    }
    if (part.exam && (!exam || part.exam.score >= exam.score)) {
      exam = part.exam;
      any = true;
    }
  }
  if (!any) return null;
  return { modules, exam };
}

function rankProgress(progress: ModuleProgress) {
  if (progress.passed) return 3;
  if (progress.quizPassed || progress.quizScore != null) return 2;
  if (progress.watched || progress.notes.trim() || Object.keys(progress.assignment).length > 0) return 1;
  return 0;
}

export function importableSnapshot(
  workspaces: readonly {
    userId: string;
    course: { modules: ProgressMap; exam: ExamSnapshot | null } | null;
  }[],
  seedIds: readonly string[],
) {
  const seeds = new Set(seedIds);
  const parts = workspaces
    .filter((workspace) => !seeds.has(workspace.userId) && workspace.course)
    .map((workspace) => workspace.course!)
    .filter((course) => rankSnapshot(course) > 0);
  return mergeProgressSnapshots(parts);
}

function rankSnapshot(course: { modules: ProgressMap; exam: ExamSnapshot | null }) {
  if (course.exam) return 1;
  return Object.values(course.modules).some((progress) => rankProgress(progress) > 0) ? 1 : 0;
}
