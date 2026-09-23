import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard } from "../src/lib/living-brain/model.ts";
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

test("Insights reads each LessonSpine step play wrote", () => {
  const homeBrain = brain("household", [person({})]);
  const wrote = playWriteBody({ room: "household", brain: homeBrain, chapterId: "recap" });
  assert.equal(wrote?.login, "none");
  const home = brainBoard({
    room: "household",
    brain: brain("household", [
      person({
        outcomes: wrote.outcomes,
        history: [{ outcomes: "Continue LessonSpine at Slate" }],
      }),
    ]),
  });
  assert.equal(home.people.length, 1);
  assert.equal(home.people[0].login, "none");
  assert.equal(home.people[0].outcomes, "Continue LessonSpine at Next up");
  assert.equal(lessonSpineStep(home.people[0].outcomes), "Continue LessonSpine at Next up");
  assert.equal(lessonSpineStep(home.people[0].history[0].outcomes), "Continue LessonSpine at Slate");

  const sales = brainBoard({
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
  assert.equal(sales.people.length, 1);
  assert.equal(sales.people[0].membershipId, "rep-1");
  assert.equal(sales.people[0].outcomes, "Finished LessonSpine");
  assert.equal(sales.people.some((row) => row.kind === "child"), false);
});

test("Insights shows the living-brain LessonSpine step in both rooms", () => {
  const charts = read("src/app/insights/charts.tsx");
  const page = read("src/app/insights/page.tsx");
  assert.match(charts, /lessonSpineStep/);
  assert.match(charts, /data-lesson-spine-next=\{spine\}/);
  assert.match(charts, /data-next-from="outcomes"/);
  assert.match(charts, /href="\/play\/lesson-spine"/);
  assert.match(charts, /data-sales-children=\{board\.room === "sales" \? "0" : undefined\}/);
  assert.match(charts, /person\.login === "none" \? "No login"/);
  assert.match(charts, /data-next-from="brain"/);
  assert.match(page, /child_has_no_login/);
  assert.match(page, /sign_in_required/);
  assert.doesNotMatch(charts + page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
