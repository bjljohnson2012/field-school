import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { peopleContext } from "../src/lib/living-brain/model.ts";
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
    confidence: "Steady",
    ...overrides,
  };
}

function brain(room, people) {
  return { orgId: "org-1", room, facts: "", outcome: "Aim", people };
}

test("People reads each LessonSpine step play wrote", () => {
  const homeBrain = brain("household", [person({})]);
  const wrote = playWriteBody({ room: "household", brain: homeBrain, chapterId: "sting" });
  assert.equal(wrote?.login, "none");
  const homeRows = peopleContext({
    room: "household",
    brain: brain("household", [person({ outcomes: wrote.outcomes })]),
  });
  assert.equal(homeRows.length, 1);
  assert.equal(homeRows[0].login, "none");
  assert.equal(homeRows[0].nextStep, "Continue LessonSpine at Slate");
  assert.equal(lessonSpineStep(homeRows[0].nextStep), "Continue LessonSpine at Slate");

  const salesRows = peopleContext({
    room: "sales",
    brain: brain("sales", [
      person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Do not show" }),
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        outcomes: playOutcome("next-up"),
      }),
    ]),
  });
  assert.equal(salesRows.length, 1);
  assert.equal(salesRows[0].membershipId, "rep-1");
  assert.equal(salesRows[0].login, "member");
  assert.equal(salesRows[0].nextStep, "Finished LessonSpine");
  assert.equal(salesRows.some((row) => row.nextStep === "Do not show"), false);
});

test("People desk shows the living-brain LessonSpine step in both rooms", () => {
  const page = read("src/app/people/page.tsx");
  assert.match(page, /peopleContext/);
  assert.match(page, /lessonSpineStep/);
  assert.match(page, /data-lesson-spine-next=/);
  assert.match(page, /data-next-from=\{spine \? "outcomes" : undefined\}/);
  assert.match(page, /href="\/play\/lesson-spine"/);
  assert.match(page, /data-sales-children=\{desk === "sales" \? "0" : undefined\}/);
  assert.match(page, /Login is none for a tracked child/);
  assert.match(page, /data-next-step=/);
  assert.doesNotMatch(page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
