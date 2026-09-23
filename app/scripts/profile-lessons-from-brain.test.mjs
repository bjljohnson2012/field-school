import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard } from "../src/lib/living-brain/model.ts";
import { lessonSpineStep, lessonSpineTrail, playOutcome } from "../src/lib/player/play-rail-write.ts";

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

test("an individual profile reads that person's LessonSpine step and trail", () => {
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [
      person({
        outcomes: playOutcome("slate"),
        history: [{ outcomes: playOutcome("sting") }, { outcomes: playOutcome("slate") }],
      }),
    ],
  };
  const board = brainBoard({ room: "household", brain: home });
  assert.equal(board.people.length, 1);
  assert.equal(board.people[0].login, "none");
  assert.equal(lessonSpineStep(board.people[0].outcomes), "Continue LessonSpine at Objective");
  assert.deepEqual(lessonSpineTrail(board.people[0].history, board.people[0].outcomes), [
    "Continue LessonSpine at Slate",
    "Continue LessonSpine at Objective",
  ]);

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
        profile: "On the desk.",
        outcomes: playOutcome("next-up"),
        history: [{ outcomes: playOutcome("recap") }],
      }),
    ],
  };
  const salesBoard = brainBoard({ room: "sales", brain: sales });
  assert.equal(salesBoard.people.length, 1);
  assert.equal(salesBoard.people[0].membershipId, "rep-1");
  assert.equal(salesBoard.people[0].login, "member");
  assert.equal(lessonSpineStep(salesBoard.people[0].outcomes), "Finished LessonSpine");
  assert.deepEqual(lessonSpineTrail(salesBoard.people[0].history), ["Continue LessonSpine at Next up"]);
  assert.equal(salesBoard.people.some((row) => row.kind === "child" || row.outcomes === "Do not show"), false);
});

test("the opened profile shows the living-brain LessonSpine step and trail", () => {
  const charts = read("src/app/insights/charts.tsx");
  assert.match(charts, /data-profile=\{brain \? "living-brain" : undefined\}/);
  assert.match(charts, /data-open-profile=/);
  assert.match(charts, /LessonSpineHistory/);
  assert.match(charts, /data-lesson-spine-next=\{spine \|\| undefined\}/);
  assert.match(charts, /The child has no login/);
  assert.match(charts, /This desk lists no children/);
  assert.match(charts, /person\.login === "none" \? "No login"/);
  assert.match(charts, /data-sales-children=\{board\.room === "sales" \? "0" : undefined\}/);
  assert.doesNotMatch(charts, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
