import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { courseOf, quizPassed } from "../src/app/insights/aggregate.ts";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { emptyProgress } from "../src/lib/course/content.ts";
import { getCourse } from "../src/lib/course/catalog.ts";
import { EXAM_PASS_RATIO, PASS_RATIO } from "../src/lib/course/types.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import {
  EXAM_PASS_COUNT,
  EXAM_STATION,
  importableSnapshot,
  learningEventForAttempt,
  mergeLegacyProgress,
  planImport,
  practicePassed,
  progressWriteTarget,
  projectServerProgress,
  scoreCheck,
  scoreExam,
} from "../src/lib/progress/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const course = getCourse("grok-bot");

function answersFor(questions, correctCount) {
  const answers = {};
  questions.forEach((question, index) => {
    answers[question.id] = index < correctCount ? question.answer : question.answer === 0 ? 1 : 0;
  });
  return answers;
}

function attempt(stationSlug, kind, score, passed, createdAt, raw = {}) {
  return { stationSlug, kind, score, total: score, passed, raw, createdAt };
}

function passLesson(mod, at) {
  const assignment = {};
  for (const item of mod.assignment.items) assignment[item.id] = true;
  return [
    attempt(mod.slug, "watch", null, true, at),
    attempt(mod.slug, "practice", null, true, at, { assignment, notes: "done" }),
    attempt(mod.slug, "check", mod.quiz.length, true, at),
  ];
}

test("go-live flags stay false", () => {
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.equal(PASS_RATIO, 0.75);
  assert.equal(EXAM_PASS_RATIO, 0.8);
  assert.equal(EXAM_PASS_COUNT, 8);
});

test("station checks use 75 percent and a retake replaces the earlier result", () => {
  const briefing = course.modules[0];
  assert.equal(briefing.quiz.length, 4);
  const low = scoreCheck(briefing, answersFor(briefing.quiz, 2));
  const high = scoreCheck(briefing, answersFor(briefing.quiz, 3));
  assert.equal(low.need, 3);
  assert.equal(low.passed, false);
  assert.equal(high.passed, true);

  const passedThenFailed = projectServerProgress(course, [
    attempt(briefing.slug, "check", high.score, true, "2026-10-01T00:00:00.000Z"),
    attempt(briefing.slug, "check", low.score, true, "2026-10-02T00:00:00.000Z"),
  ]);
  assert.equal(passedThenFailed.modules[briefing.slug].quizScore, 2);
  assert.equal(passedThenFailed.modules[briefing.slug].quizPassed, false);
  assert.equal(passedThenFailed.modules[briefing.slug].passed, false);

  const failedThenPassed = projectServerProgress(course, [
    attempt(briefing.slug, "check", low.score, false, "2026-10-01T00:00:00.000Z"),
    attempt(briefing.slug, "check", high.score, false, "2026-10-02T00:00:00.000Z"),
  ]);
  assert.equal(failedThenPassed.modules[briefing.slug].quizPassed, true);
  assert.equal(
    practicePassed(briefing, Object.fromEntries(briefing.assignment.items.map((item) => [item.id, true]))),
    true,
  );
});

test("the exam stays 8 of 10 and the certificate needs every lesson on the server", () => {
  assert.equal(course.examQuestions.length, 10);
  const seven = scoreExam(course, answersFor(course.examQuestions, 7));
  const eight = scoreExam(course, answersFor(course.examQuestions, 8));
  assert.equal(seven.need, 8);
  assert.equal(seven.passed, false);
  assert.equal(eight.passed, true);

  const lessons = course.modules.flatMap((mod) => passLesson(mod, "2026-10-03T00:00:00.000Z"));
  const withEight = projectServerProgress(course, [
    ...lessons,
    attempt(EXAM_STATION, "exam", 8, true, "2026-10-04T00:00:00.000Z"),
  ]);
  const again = projectServerProgress(course, [
    ...lessons,
    attempt(EXAM_STATION, "exam", 8, true, "2026-10-04T00:00:00.000Z"),
  ]);
  assert.equal(withEight.certified, true);
  assert.equal(withEight.passed, course.modules.length);
  assert.deepEqual(again, withEight);

  const withSeven = projectServerProgress(course, [
    ...lessons,
    attempt(EXAM_STATION, "exam", 7, true, "2026-10-04T00:00:00.000Z"),
  ]);
  assert.equal(withSeven.exam.passed, false);
  assert.equal(withSeven.certified, false);

  const openLesson = lessons.filter((row) => row.stationSlug !== course.modules[0].slug || row.kind !== "check");
  const missingCheck = projectServerProgress(course, [
    ...openLesson,
    attempt(EXAM_STATION, "exam", 8, true, "2026-10-04T00:00:00.000Z"),
  ]);
  assert.equal(missingCheck.certified, false);
});

test("a later server check wins over an older local pass", () => {
  const briefing = course.modules[0];
  const legacy = {
    [briefing.slug]: {
      ...emptyProgress(),
      watched: true,
      quizScore: 4,
      quizPassed: true,
    },
  };
  const merged = mergeLegacyProgress(course, legacy, [
    attempt(briefing.slug, "check", 1, true, "2026-10-05T00:00:00.000Z"),
  ]);
  assert.equal(merged.modules[briefing.slug].watched, true);
  assert.equal(merged.modules[briefing.slug].quizScore, 1);
  assert.equal(merged.modules[briefing.slug].quizPassed, false);
});

test("local progress imports once and does not trust a short exam", () => {
  const briefing = course.modules[0];
  const local = {
    modules: {
      [briefing.slug]: {
        ...emptyProgress(),
        watched: true,
        quizScore: 2,
        quizPassed: true,
      },
    },
    exam: { score: 7, passed: true, at: "2026-10-01T00:00:00.000Z" },
  };
  const plan = planImport({ course, importedAt: null, serverKeys: [], local });
  assert.equal(plan.markImported, true);
  assert.equal(plan.pieces.find((piece) => piece.kind === "check").passed, false);
  assert.equal(plan.pieces.find((piece) => piece.kind === "exam").passed, false);
  assert.equal(plan.pieces.find((piece) => piece.kind === "exam").score, 7);

  const repeat = planImport({
    course,
    importedAt: "2026-10-02T00:00:00.000Z",
    serverKeys: [],
    local,
  });
  assert.deepEqual(repeat.pieces, []);
  assert.equal(repeat.markImported, false);

  const already = planImport({
    course,
    importedAt: null,
    serverKeys: [`${briefing.slug}:watch`],
    local,
  });
  assert.equal(already.pieces.some((piece) => piece.kind === "watch"), false);

  const seeded = importableSnapshot(
    [
      {
        userId: "user-jordan",
        course: {
          modules: { [briefing.slug]: { ...emptyProgress(), watched: true } },
          exam: null,
        },
      },
    ],
    ["user-jordan", "user-ben", "user-sam"],
  );
  assert.equal(seeded, null);
});

test("progress rows reference a learning event the insights log can read", () => {
  const event = learningEventForAttempt({
    courseSlug: "grok-bot",
    stationSlug: "briefing",
    kind: "check",
    score: 3,
    passed: true,
  });
  assert.equal(event.kind, "quiz");
  assert.equal(event.objectId, "grok-bot:briefing");
  assert.equal(quizPassed(event.raw), true);
  assert.equal(courseOf({ objectId: event.objectId, raw: event.raw }), "grok-bot");
  const sql = read("db/0025_m7_progress.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS enrollments/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS progress_attempts/);
  assert.match(sql, /CREATE OR REPLACE VIEW progress_latest/);
  assert.match(sql, /learning_event_id uuid NOT NULL REFERENCES learning_events\(id\)/);
  assert.doesNotMatch(sql, /ALTER TABLE learning_events/);
  assert.doesNotMatch(sql, /ALTER TABLE progress_ledgers|CREATE TABLE progress_ledgers/);
  assert.doesNotMatch(sql, /DROP TABLE/);
  const store = read("src/lib/progress/store.ts");
  assert.match(store, /learning_event_id/);
  assert.match(store, /org_id = \$\{actor\.orgId\}/);
  assert.match(store, /membership_id = \$\{actor\.membershipId\}/);
  assert.match(store, /FROM progress_latest/);
});

test("signed-in grok bot progress is server state and guests keep the local path", () => {
  assert.equal(progressWriteTarget(true), "server");
  assert.equal(progressWriteTarget(false), "local");
  const station = read("src/app/c/[courseSlug]/s/[slug]/page.tsx");
  const exam = read("src/app/c/[courseSlug]/exam/page.tsx");
  const certificate = read("src/app/c/[courseSlug]/certificate/page.tsx");
  const sync = read("src/components/auth-portal-sync.tsx");
  assert.match(station, /kind: "watch"/);
  assert.match(station, /kind: "practice"/);
  assert.match(station, /kind: "check"/);
  assert.doesNotMatch(station, /localStorage/);
  assert.doesNotMatch(station, /postLearningEvent/);
  assert.match(station, /upsertModule/);
  assert.match(station, /saveQuizAnswers/);
  const serverWatch = station.slice(station.indexOf('kind: "watch"'), station.indexOf("upsertModule"));
  assert.doesNotMatch(serverWatch, /upsertModule|localStorage/);
  assert.match(exam, /kind: "exam"/);
  assert.match(exam, /Pass at 8\/10/);
  const serverExam = exam.slice(exam.indexOf('kind: "exam"'), exam.indexOf("saveExamAnswers"));
  assert.doesNotMatch(serverExam, /saveExamAnswers|localStorage/);
  assert.match(certificate, /view\.certified/);
  assert.match(certificate, /every lesson done on the server/);
  assert.doesNotMatch(certificate, /tally\.certified/);
  assert.match(sync, /importableCourseSnapshot\("grok-bot"\)/);
  assert.match(sync, /importServerProgress\("grok-bot", snapshot\)/);
  assert.doesNotMatch(sync, /applyServerCourse|localStorage/);
  assert.match(read("src/app/learn/page.tsx"), /Lessons done on the server/);
  assert.match(read("src/app/people/[membershipId]/page.tsx"), /readCourseProgress/);
  assert.match(read("src/app/api/progress/route.ts"), /scoreCheck/);
  assert.match(read("src/app/api/progress/route.ts"), /scoreExam/);
  assert.doesNotMatch(read("src/lib/progress/store.ts"), /sk_live|AUTH_URL/);
  const guest = read("src/components/guest-continuity.tsx");
  assert.match(guest, /Pass stays 75% \(3\/4\)/);
  assert.match(guest, /The exam is 8\/10/);
  assert.match(guest, /The desk stays on this browser/);
  assert.doesNotMatch(guest, /—/);
});
