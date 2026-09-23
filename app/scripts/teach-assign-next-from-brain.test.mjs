import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard, chooseNextStep } from "../src/lib/living-brain/model.ts";
import { lessonSpineStep, playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function person(overrides) {
  return {
    membershipId: "person-1",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "Who they are now",
    outcomes: "",
    ownsOutcomes: false,
    history: [],
    confidence: "",
    ...overrides,
  };
}

function brain(room, people) {
  return { orgId: "org-1", room, facts: "", outcome: "Aim", people };
}

test("Teach and Assign read the LessonSpine step play wrote", () => {
  const homeBrain = brain("household", [person({})]);
  const wrote = playWriteBody({ room: "household", brain: homeBrain, chapterId: "sting" });
  assert.equal(wrote?.login, "none");
  const after = brain("household", [person({ outcomes: wrote.outcomes })]);
  const chosen = chooseNextStep({ room: "household", brain: after, membershipId: "person-1" });
  assert.equal(chosen?.title, "Continue LessonSpine at Slate");
  assert.equal(chosen?.login, "none");
  assert.equal(chosen?.from, "outcomes");
  assert.equal(lessonSpineStep(chosen?.title || ""), "Continue LessonSpine at Slate");

  const sales = brain("sales", [
    person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Do not show" }),
    person({
      membershipId: "rep-1",
      name: "Lee",
      kind: "adult",
      login: "member",
      outcomes: playOutcome("next-up"),
    }),
  ]);
  const board = brainBoard({ room: "sales", brain: sales });
  assert.equal(board.people.length, 1);
  assert.equal(board.people[0].membershipId, "rep-1");
  assert.equal(board.people[0].outcomes, "Finished LessonSpine");
  const hidden = chooseNextStep({ room: "sales", brain: sales, membershipId: "kid" });
  assert.notEqual(hidden?.membershipId, "kid");
  assert.equal(board.people.some((row) => row.kind === "child"), false);
});

test("Teach and Assign link the living-brain LessonSpine step", () => {
  const teach = read("src/app/teach-live/live.tsx");
  const assign = read("src/app/assign/assign-desk.tsx");
  const desk = read("src/app/assign/desk.ts");
  assert.match(teach, /LessonSpineAct/);
  assert.match(teach, /data-lesson-spine-next=\{spine\}/);
  assert.match(teach, /href="\/play\/lesson-spine"/);
  assert.match(teach, /The child has no login/);
  assert.match(teach, /data-sales-children="0"/);
  assert.match(teach, /chosen\.login === "member"/);
  assert.match(teach, /chosen\.login === "none"/);
  assert.match(assign, /brainBoard/);
  assert.match(assign, /onDesk\.has\(person\.membershipId\)/);
  assert.match(assign, /LessonSpineAct/);
  assert.match(assign, /data-lesson-spine-next=\{spine\}/);
  assert.match(assign, /href="\/play\/lesson-spine"/);
  assert.match(desk, /A child has no login/);
  assert.match(assign, /GUEST_COPY/);
  assert.doesNotMatch(teach + assign + desk, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
