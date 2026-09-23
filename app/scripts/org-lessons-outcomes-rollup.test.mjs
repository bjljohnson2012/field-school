import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard } from "../src/lib/living-brain/model.ts";
import { lessonSpineRollup, playOutcome } from "../src/lib/player/play-rail-write.ts";

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

test("org rollup lists LessonSpine outcomes across the desk", () => {
  const home = brainBoard({
    room: "household",
    brain: {
      orgId: "org-1",
      room: "household",
      facts: "",
      outcome: "",
      people: [
        person({ membershipId: "bea", name: "Bea", outcomes: "Old page" }),
        person({ membershipId: "ada", name: "Ada", outcomes: playOutcome("sting") }),
        person({ membershipId: "cy", name: "Cy", outcomes: playOutcome("next-up") }),
      ],
    },
  });
  assert.equal(home.people.every((row) => row.login === "none"), true);
  const rollup = lessonSpineRollup(home.people);
  assert.deepEqual(
    rollup.map((row) => [row.name, row.step, row.login, row.confidence]),
    [
      ["Ada", "Continue LessonSpine at Slate", "none", "Getting there"],
      ["Cy", "Finished LessonSpine", "none", "Ready"],
    ],
  );
  assert.equal(rollup.some((row) => row.step === "Old page"), false);

  const sales = brainBoard({
    room: "sales",
    brain: {
      orgId: "org-1",
      room: "sales",
      facts: "",
      outcome: "",
      people: [
        person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: playOutcome("sting") }),
        person({
          membershipId: "rep-1",
          name: "Lee",
          kind: "adult",
          login: "member",
          profile: "On the desk.",
          outcomes: playOutcome("slate"),
        }),
      ],
    },
  });
  assert.equal(sales.people.length, 1);
  assert.equal(sales.people[0].membershipId, "rep-1");
  assert.equal(sales.people.some((row) => row.kind === "child"), false);
  const salesRollup = lessonSpineRollup(sales.people);
  assert.deepEqual(salesRollup.map((row) => [row.name, row.step, row.login]), [
    ["Lee", "Continue LessonSpine at Objective", "member"],
  ]);
});

test("org brain renders the LessonSpine outcomes rollup", () => {
  const charts = read("src/app/insights/charts.tsx");
  assert.match(charts, /data-org-rollup="living-brain"/);
  assert.match(charts, /lessonSpineRollup/);
  assert.match(charts, /LessonSpine outcomes/);
  assert.match(charts, /The child has no login/);
  assert.match(charts, /This desk lists no children/);
  assert.match(charts, /person\.login === "none" \? "No login"/);
  assert.match(charts, /data-sales-children=\{board\.room === "sales" \? "0" : undefined\}/);
  assert.match(charts, /data-chart="org-brain"/);
  assert.doesNotMatch(charts, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
