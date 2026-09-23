import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { lessonSpineContinue, playWriteBody } from "../src/lib/player/play-rail-write.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hook = readFileSync(join(root, "src/components/lesson-spine-play-write.tsx"), "utf8");

function person(overrides) {
  return {
    membershipId: "person-1",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "On the desk",
    outcomes: "",
    ownsOutcomes: false,
    history: [],
    confidence: "",
    ...overrides,
  };
}

function brain(room, people) {
  return {
    orgId: "org-1",
    room,
    facts: "",
    outcome: "",
    people,
  };
}

function recordPlaySource() {
  const start = hook.indexOf("const recordPlay = useCallback(");
  const end = hook.indexOf("const recordResume = useCallback(");
  assert.ok(start >= 0 && end > start, "recordPlay is present");
  return hook.slice(start, end);
}

test("signed-in open continues at the stored next LessonSpine step", () => {
  const opened = lessonSpineContinue("Continue LessonSpine at Slate");
  assert.ok(opened);
  assert.equal(opened.step, "Continue LessonSpine at Slate");
  assert.equal(opened.chapterId, "slate");
  assert.equal(opened.label, "Slate");
  assert.equal(opened.startSec, 10);

  const later = lessonSpineContinue("Continue LessonSpine at Recap");
  assert.equal(later?.step, "Continue LessonSpine at Recap");
  assert.equal(later?.chapterId, "recap");
  assert.equal(later?.label, "Recap");
});

test("signed-in play writes the next LessonSpine step for the member on the desk", () => {
  const wrote = playWriteBody({
    room: "sales",
    brain: brain("sales", [
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        profile: "On the desk",
      }),
    ]),
    chapterId: "sting",
  });
  assert.ok(wrote);
  assert.equal(wrote.membershipId, "rep-1");
  assert.equal(wrote.login, "member");
  assert.equal(wrote.outcomes, "Continue LessonSpine at Slate");
  assert.equal(lessonSpineContinue(wrote.outcomes)?.chapterId, "slate");
});

test("guest play does not write", () => {
  assert.equal(
    playWriteBody({
      room: "sales",
      brain: brain("sales", [person({ kind: "child", login: "none" })]),
      chapterId: "sting",
    }),
    null,
  );

  const play = recordPlaySource();
  const guard = play.indexOf('status !== "authenticated" || !email');
  const post = play.indexOf('method: "POST"');
  assert.ok(guard >= 0, "recordPlay checks the session");
  assert.match(play, /if \(status !== "authenticated" \|\| !email\) return;/);
  assert.ok(post > guard, "recordPlay returns before any living-brain POST");
});
