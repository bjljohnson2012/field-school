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
    confidence: "",
    ...overrides,
  };
}

function brain(room, people) {
  return { orgId: "org-1", room, facts: "", outcome: "Aim", people };
}

test("return chrome reads the LessonSpine step play wrote", () => {
  const homeBrain = brain("household", [person({})]);
  const wrote = playWriteBody({ room: "household", brain: homeBrain, chapterId: "sting" });
  assert.equal(wrote?.login, "none");
  const home = brainBoard({
    room: "household",
    brain: brain("household", [person({ outcomes: wrote.outcomes })]),
  });
  assert.equal(home.people[0].login, "none");
  assert.equal(lessonSpineStep(home.people[0].outcomes), "Continue LessonSpine at Slate");

  const sales = brainBoard({
    room: "sales",
    brain: brain("sales", [
      person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Do not show" }),
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        outcomes: playOutcome("slate"),
      }),
    ]),
  });
  assert.equal(sales.people.length, 1);
  assert.equal(sales.people[0].membershipId, "rep-1");
  assert.equal(lessonSpineStep(sales.people[0].outcomes), "Continue LessonSpine at Objective");
  assert.equal(sales.people.some((row) => row.kind === "child"), false);
});

test("signed-in chrome shows the return step and guests stay quiet", () => {
  const header = read("src/components/site-header.tsx");
  const chip = read("src/components/leave-return-next.tsx");
  assert.match(header, /loggedIn \? <LeaveReturnNext \/> : null/);
  assert.match(header, /status === "unauthenticated"/);
  assert.match(header, /guestChrome \? "\/" : "\/dashboard"/);
  assert.doesNotMatch(header, /label: "Play"|href: "\/play\/lesson-spine"/);
  assert.match(chip, /data-leave-return="living-brain"/);
  assert.match(chip, /data-lesson-spine-next=/);
  assert.match(chip, /data-next-from="outcomes"/);
  assert.match(chip, /href="\/play\/lesson-spine"/);
  assert.match(chip, /The child has no login/);
  assert.match(chip, /This desk lists no children/);
  assert.match(chip, /data-sales-children=\{step\.room === "sales" \? "0" : undefined\}/);
  assert.match(chip, /status !== "authenticated" \|\| !email/);
  assert.doesNotMatch(header + chip, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
