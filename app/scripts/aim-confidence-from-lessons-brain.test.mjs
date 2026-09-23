import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard, learnHomeContext, personConfidence } from "../src/lib/living-brain/model.ts";
import { lessonSpineConfidence, playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

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

function brain(room, people, outcome = "") {
  return { orgId: "org-1", room, facts: "", outcome, people };
}

test("Aim and Confidence read LessonSpine progress in both rooms", () => {
  assert.equal(lessonSpineConfidence("Continue LessonSpine at Sting"), "Not yet");
  assert.equal(lessonSpineConfidence(playOutcome("sting")), "Getting there");
  assert.equal(lessonSpineConfidence(playOutcome("recap")), "Getting there");
  assert.equal(lessonSpineConfidence("Finished LessonSpine"), "Ready");
  assert.equal(lessonSpineConfidence("Steady at the table"), null);

  const homeBrain = brain("household", [person({ confidence: "Steady" })]);
  const wrote = playWriteBody({ room: "household", brain: homeBrain, chapterId: "sting" });
  assert.equal(wrote?.login, "none");
  assert.equal(wrote?.outcomes, "Continue LessonSpine at Slate");
  const after = brain("household", [person({ outcomes: wrote.outcomes, confidence: "Steady" })]);
  const card = learnHomeContext({ room: "household", brain: after, membershipId: "person-1" });
  assert.equal(card.login, "none");
  assert.equal(card.from, "outcomes");
  assert.equal(lessonSpineConfidence(card.nextStep), "Getting there");
  assert.equal(personConfidence({ room: "household", brain: after, membershipId: "person-1" }), "Steady");

  const finished = brain("sales", [
    person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Do not show", confidence: "Do not show" }),
    person({
      membershipId: "rep-1",
      name: "Lee",
      kind: "adult",
      login: "member",
      profile: "On the desk",
      outcomes: playOutcome("next-up"),
      confidence: "",
    }),
  ]);
  const board = brainBoard({ room: "sales", brain: finished });
  assert.equal(board.people.length, 1);
  assert.equal(board.people[0].membershipId, "rep-1");
  assert.equal(board.people[0].login, "member");
  assert.equal(lessonSpineConfidence(board.people[0].outcomes), "Ready");
  assert.equal(board.people.some((row) => row.kind === "child" || row.outcomes === "Do not show"), false);
  const hidden = learnHomeContext({ room: "sales", brain: finished, membershipId: "kid" });
  assert.equal(hidden.membershipId, "");
  assert.equal(hidden.confidence, "");
});

test("desks render Aim and Confidence from a LessonSpine outcome", () => {
  const learn = read("src/app/dashboard/page.tsx");
  const people = read("src/app/people/page.tsx");
  const teach = read("src/app/teach-live/live.tsx");
  const assign = read("src/app/assign/assign-desk.tsx");
  const insights = read("src/app/insights/charts.tsx");
  for (const source of [learn, people, teach, assign, insights]) {
    assert.match(source, /lessonSpineConfidence/);
    assert.match(source, /data-confidence-from=/);
    assert.match(source, /data-aim-from=/);
    assert.doesNotMatch(source, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
  }
  assert.match(learn, /signedIn && card\.aim/);
  assert.match(learn, /signedIn && card\.confidence/);
  assert.match(people, /line\?\.confidence/);
  assert.match(people, /brain\.outcome/);
  assert.match(teach, /brain\?\.outcome/);
  assert.match(teach, /props\.aim \?/);
  assert.match(teach, /props\.confidence \?/);
  assert.match(assign, /brain\.outcome/);
  assert.match(assign, /brainAim \?/);
  assert.match(assign, /brainConfidence\[person\.membershipId\] \?/);
  assert.match(insights, /board\.outcome \?/);
  assert.match(insights, /person\.confidence \?/);
  assert.match(teach, /The child has no login/);
  assert.match(teach, /data-sales-children="0"/);
});
