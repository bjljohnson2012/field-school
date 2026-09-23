import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard, nextStepTrail, rememberOutcome } from "../src/lib/living-brain/model.ts";
import { lessonSpineTrail, playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function person(overrides) {
  return {
    membershipId: "person-1",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "Reads at the table.",
    outcomes: "",
    ownsOutcomes: false,
    history: [],
    confidence: "",
    ...overrides,
  };
}

test("History reads the LessonSpine trail in both rooms", () => {
  const wrote = playWriteBody({
    room: "household",
    brain: { orgId: "org-1", room: "household", facts: "", outcome: "", people: [person({})] },
    chapterId: "sting",
  });
  assert.equal(wrote?.login, "none");
  assert.equal(wrote?.outcomes, "Continue LessonSpine at Slate");
  const history = rememberOutcome(
    [{ outcomes: "Continue LessonSpine at Sting" }, { outcomes: "Old page" }],
    wrote.outcomes,
  );
  const trail = lessonSpineTrail(history, "Finished LessonSpine");
  assert.deepEqual(trail, [
    "Continue LessonSpine at Sting",
    "Continue LessonSpine at Slate",
    "Finished LessonSpine",
  ]);
  assert.equal(trail.includes("Old page"), false);

  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({ outcomes: wrote.outcomes, history })],
  };
  const homeTrail = nextStepTrail({ room: "household", brain: home, membershipId: "person-1" });
  assert.equal(lessonSpineTrail(homeTrail)[0], "Continue LessonSpine at Sting");
  assert.equal(home.people[0].login, "none");

  const sales = {
    orgId: "org-1",
    room: "sales",
    facts: "",
    outcome: "",
    people: [
      person({
        membershipId: "kid",
        name: "No",
        kind: "child",
        login: "none",
        outcomes: "Do not show",
        history: [{ outcomes: "Do not show" }],
      }),
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        profile: "On the desk",
        outcomes: playOutcome("next-up"),
        history: [{ outcomes: playOutcome("slate") }, { outcomes: playOutcome("next-up") }],
      }),
    ],
  };
  const board = brainBoard({ room: "sales", brain: sales });
  assert.equal(board.people.length, 1);
  assert.equal(board.people[0].membershipId, "rep-1");
  assert.equal(board.people.some((row) => row.kind === "child" || row.outcomes === "Do not show"), false);
  assert.deepEqual(lessonSpineTrail(board.people[0].history), [
    "Continue LessonSpine at Objective",
    "Finished LessonSpine",
  ]);
  assert.equal(nextStepTrail({ room: "sales", brain: sales, membershipId: "kid" }).length, 0);
});

test("History surfaces list the living-brain LessonSpine trail", () => {
  const history = read("src/components/lesson-spine-history.tsx");
  const teach = read("src/app/teach-live/live.tsx");
  const assign = read("src/app/assign/assign-desk.tsx");
  const insights = read("src/app/insights/charts.tsx");
  assert.match(history, /History/);
  assert.match(history, /data-lesson-spine-trail="living-brain"/);
  assert.match(history, /lessonSpineTrail/);
  assert.match(history, /href="\/play\/lesson-spine"/);
  for (const source of [teach, assign, insights]) {
    assert.match(source, /LessonSpineHistory/);
    assert.doesNotMatch(source, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
  }
  assert.match(teach, /The child has no login/);
  assert.match(teach, /data-sales-children="0"/);
  assert.match(assign, /brainBoard/);
});
