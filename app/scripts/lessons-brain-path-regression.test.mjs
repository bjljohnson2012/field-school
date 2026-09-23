import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard, learnHomeContext, peopleContext } from "../src/lib/living-brain/model.ts";
import { lessonSpineRollup, playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

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

function brain(room, people) {
  return { orgId: "org-1", room, facts: "Org facts.", outcome: "", people };
}

function applyWrite(source, body) {
  return {
    ...source,
    people: source.people.map((row) =>
      row.membershipId === body.membershipId ? { ...row, outcomes: body.outcomes } : row,
    ),
  };
}

test("play writes the next LessonSpine step and both desks read it back", () => {
  const home = brain("household", [
    person({ membershipId: "adult", name: "Zoe", kind: "adult", login: "member" }),
    person({ membershipId: "ada", name: "Ada" }),
    person({ membershipId: "bea", name: "Bea", outcomes: "Old page" }),
  ]);
  const homeWrite = playWriteBody({ room: "household", brain: home, chapterId: "sting" });
  assert.ok(homeWrite);
  assert.equal(homeWrite.membershipId, "ada");
  assert.equal(homeWrite.login, "none");
  assert.equal(homeWrite.outcomes, playOutcome("sting"));
  assert.equal(homeWrite.outcomes, "Continue LessonSpine at Slate");

  const homeAfter = applyWrite(home, homeWrite);
  const homeBoard = brainBoard({ room: "household", brain: homeAfter });
  assert.equal(homeBoard.people.every((row) => row.kind === "child" && row.login === "none"), true);
  assert.equal(homeBoard.people.some((row) => row.login === "member"), false);
  const homeLearn = learnHomeContext({ room: "household", brain: homeAfter, membershipId: "ada" });
  assert.equal(homeLearn.login, "none");
  assert.equal(homeLearn.nextStep, "Continue LessonSpine at Slate");
  assert.equal(homeLearn.from, "outcomes");
  const homePeople = peopleContext({ room: "household", brain: homeAfter });
  assert.deepEqual(
    homePeople.map((row) => [row.membershipId, row.login, row.nextStep]),
    [
      ["ada", "none", "Continue LessonSpine at Slate"],
      ["bea", "none", "Old page"],
    ],
  );
  assert.deepEqual(
    lessonSpineRollup(homeBoard.people).map((row) => [row.name, row.step, row.login, row.confidence]),
    [["Ada", "Continue LessonSpine at Slate", "none", "Getting there"]],
  );

  const advanced = playWriteBody({ room: "household", brain: homeAfter, chapterId: "slate" });
  assert.equal(advanced?.outcomes, "Continue LessonSpine at Objective");

  const sales = brain("sales", [
    person({
      membershipId: "kid",
      name: "No",
      kind: "child",
      login: "none",
      outcomes: playOutcome("sting"),
    }),
    person({
      membershipId: "rep-1",
      name: "Lee",
      kind: "adult",
      login: "member",
      profile: "On the desk.",
    }),
  ]);
  const salesWrite = playWriteBody({ room: "sales", brain: sales, chapterId: "slate" });
  assert.ok(salesWrite);
  assert.equal(salesWrite.membershipId, "rep-1");
  assert.equal(salesWrite.login, "member");
  assert.equal(salesWrite.kind, "adult");
  assert.equal(salesWrite.outcomes, "Continue LessonSpine at Objective");
  const salesAfter = applyWrite(sales, salesWrite);
  const salesBoard = brainBoard({ room: "sales", brain: salesAfter });
  assert.equal(salesBoard.people.length, 1);
  assert.equal(salesBoard.people.some((row) => row.kind === "child"), false);
  assert.equal(salesBoard.people[0].login, "member");
  const salesLearn = learnHomeContext({ room: "sales", brain: salesAfter, membershipId: "rep-1" });
  assert.equal(salesLearn.login, "member");
  assert.equal(salesLearn.nextStep, "Continue LessonSpine at Objective");
  assert.deepEqual(lessonSpineRollup(salesBoard.people).map((row) => [row.name, row.step, row.login]), [
    ["Lee", "Continue LessonSpine at Objective", "member"],
  ]);
  assert.equal(learnHomeContext({ room: "sales", brain: salesAfter, membershipId: "kid" }).nextStep, "");
});

test("a guest does not write and an empty desk does not invent a child", () => {
  assert.equal(playWriteBody({ room: "household", brain: null, chapterId: "sting" }), null);
  const salesChildOnly = brain("sales", [
    person({ membershipId: "kid", name: "No", kind: "child", login: "none" }),
  ]);
  assert.equal(playWriteBody({ room: "sales", brain: salesChildOnly, chapterId: "sting" }), null);
  assert.equal(brainBoard({ room: "sales", brain: salesChildOnly }).people.length, 0);
  const wrongRoom = brain("household", [person({ membershipId: "ada", name: "Ada" })]);
  assert.equal(playWriteBody({ room: "sales", brain: wrongRoom, chapterId: "sting" }), null);

  const write = read("src/components/lesson-spine-play-write.tsx");
  assert.match(write, /if \(status !== "authenticated" \|\| !email\) return;/);
  assert.match(write, /Guests stay at the start and do not write/);
  assert.match(read("src/app/dashboard/page.tsx"), /learnHomeContext/);
  assert.match(read("src/app/people/page.tsx"), /peopleContext/);
  assert.match(read("src/app/insights/charts.tsx"), /person\.login === "none" \? "No login"/);
  assert.match(read("src/app/insights/charts.tsx"), /lessonSpineRollup/);
  assert.match(read("src/app/insights/charts.tsx"), /data-org-rollup="living-brain"/);
  assert.match(read("src/app/insights/charts.tsx"), /The child has no login/);
  assert.match(read("src/app/insights/charts.tsx"), /This desk lists no children/);
  assert.match(read("src/app/teach-live/live.tsx"), /lessonSpineStep/);
  assert.match(read("src/app/assign/assign-desk.tsx"), /lessonSpineStep/);
  assert.doesNotMatch(write, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
