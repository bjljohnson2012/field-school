import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { learnHomeContext } from "../src/lib/living-brain/model.ts";
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

function brain(room, people, outcome = "Aim") {
  return { orgId: "org-1", room, facts: "", outcome, people };
}

test("Learn reads the LessonSpine step play wrote", () => {
  const homeBrain = brain("household", [person({})]);
  const wrote = playWriteBody({ room: "household", brain: homeBrain, chapterId: "sting" });
  assert.equal(wrote?.outcomes, "Continue LessonSpine at Slate");
  assert.equal(wrote?.login, "none");
  const after = brain("household", [person({ outcomes: wrote.outcomes })]);
  const card = learnHomeContext({
    room: "household",
    brain: after,
    membershipId: "person-1",
    storedTitle: "Old unit",
  });
  assert.equal(card.nextStep, "Continue LessonSpine at Slate");
  assert.equal(card.from, "outcomes");
  assert.equal(card.login, "none");
  assert.equal(lessonSpineStep(card.nextStep), "Continue LessonSpine at Slate");

  const salesBrain = brain("sales", [
    person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Do not show" }),
    person({
      membershipId: "rep-1",
      name: "Lee",
      kind: "adult",
      login: "member",
      profile: "On the desk",
      outcomes: playOutcome("next-up"),
    }),
  ]);
  const salesCard = learnHomeContext({ room: "sales", brain: salesBrain, membershipId: "rep-1" });
  assert.equal(salesCard.nextStep, "Finished LessonSpine");
  assert.equal(salesCard.login, "member");
  assert.equal(salesCard.from, "outcomes");
  const hidden = learnHomeContext({ room: "sales", brain: salesBrain, membershipId: "kid" });
  assert.equal(hidden.nextStep, "");
  assert.equal(lessonSpineStep("Old unit"), null);
});

test("Learn desk shows the living-brain LessonSpine step and leaves guests alone", () => {
  const page = read("src/app/dashboard/page.tsx");
  assert.match(page, /lessonSpineStep/);
  assert.match(page, /data-lesson-spine-next=/);
  assert.match(page, /data-next-from="outcomes"/);
  assert.match(page, /href: fromBrain \? "\/play\/lesson-spine" : "\/teach-live"/);
  assert.match(page, /The child has no login/);
  assert.match(page, /The team member may sign in/);
  assert.match(page, /!signedIn && !waiting/);
  assert.match(page, /data-sales-children=\{card\.org === "sales" \? "0" : undefined\}/);
  assert.doesNotMatch(page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
