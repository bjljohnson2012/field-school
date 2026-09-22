import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { EMPTY_COPY, buildInsights } from "./aggregate.ts";

const here = dirname(fileURLToPath(import.meta.url));
const NOW = "2026-09-22T00:00:00.000Z";

function base(over = {}) {
  return {
    orgSlug: "household",
    orgName: "Household",
    now: NOW,
    people: [],
    events: [],
    portions: [],
    portionItems: [],
    assignments: [],
    ledgerUnits: [],
    skills: [],
    skillStates: [],
    credits: [],
    ledger: [],
    usage: [],
    units: [],
    ...over,
  };
}

const ada = { membershipId: "ada", name: "Ada", kind: "child", stance: "learner" };
const guardian = { membershipId: "parent", name: "Parent", kind: "adult", stance: "guardian" };
const sam = { membershipId: "sam", name: "Sam", kind: "adult", stance: "learner" };
const hiddenChild = { membershipId: "kid", name: "ShouldNotShow", kind: "child", stance: "learner" };

test("empty org uses the exact empty copy and no chart numbers", () => {
  const model = buildInsights(base({ people: [guardian] }));
  assert.equal(model.empty, true);
  assert.equal(EMPTY_COPY, "no events in this org yet");
  assert.deepEqual(model.movement, []);
  assert.deepEqual(model.nextStep, []);
  assert.deepEqual(model.checks, []);
  assert.deepEqual(model.credits, []);
  assert.deepEqual(model.assignments, []);
  assert.equal(model.skills.cells.length, 0);
});

test("sales shows zero children", () => {
  const model = buildInsights(
    base({
      orgSlug: "sales",
      orgName: "Sales team",
      people: [sam, hiddenChild],
      events: [
        {
          membershipId: "sam",
          kind: "watch",
          objectType: "station",
          objectId: "sales:welcome",
          createdAt: "2026-09-21T00:00:00.000Z",
          raw: { course: "sales" },
        },
        {
          membershipId: "kid",
          kind: "watch",
          objectType: "station",
          objectId: "sales:welcome",
          createdAt: "2026-09-21T00:00:00.000Z",
          raw: { course: "sales" },
        },
      ],
    }),
  );
  assert.equal(model.childrenIncluded, 0);
  assert.equal(JSON.stringify(model).includes("ShouldNotShow"), false);
  assert.equal(JSON.stringify(model).includes("\"kid\""), false);
  const moved = model.movement.find((row) => row.id === "moved");
  assert.equal(moved?.value, 1);
  assert.deepEqual(moved?.people.map((person) => person.name), ["Sam"]);
});

test("household shows zero sales diagnostics", () => {
  const model = buildInsights(
    base({
      people: [ada, guardian],
      events: [
        {
          membershipId: "ada",
          kind: "watch",
          objectType: "station",
          objectId: "home:welcome",
          createdAt: "2026-09-21T00:00:00.000Z",
          raw: { course: "home" },
        },
        {
          membershipId: "ada",
          kind: "diagnostic",
          objectType: "skill",
          objectId: "discovery",
          createdAt: "2026-09-21T00:00:00.000Z",
          raw: { course: "sales" },
        },
      ],
      skills: [
        { id: "sk-morning", slug: "morning", name: "Morning start" },
        { id: "sk-discovery", slug: "discovery", name: "Discovery" },
      ],
      skillStates: [
        { skillId: "sk-morning", membershipId: "ada", score: 3 },
        { skillId: "sk-discovery", membershipId: "ada", score: 5 },
      ],
    }),
  );
  assert.equal(model.salesDiagnostics, 0);
  assert.equal(JSON.stringify(model).includes("Discovery"), false);
  assert.equal(JSON.stringify(model).includes("discovery"), false);
  assert.equal(model.skills.columns.map((column) => column.slug).join(","), "morning");
  assert.equal(model.childrenIncluded, 1);
});

test("movement, next step, checks, credits, and assignments use real rows", () => {
  const model = buildInsights(
    base({
      people: [ada, guardian],
      events: [
        {
          membershipId: "ada",
          kind: "quiz",
          objectType: "unit",
          objectId: "unit-1",
          createdAt: "2026-09-20T00:00:00.000Z",
          raw: { passed: true },
        },
        {
          membershipId: "ada",
          kind: "quiz",
          objectType: "unit",
          objectId: "unit-1",
          createdAt: "2026-09-18T00:00:00.000Z",
          raw: { passed: false },
        },
        {
          membershipId: "parent",
          kind: "watch",
          objectType: "station",
          objectId: "home:welcome",
          createdAt: "2026-09-01T00:00:00.000Z",
          raw: { course: "home" },
        },
      ],
      portions: [{ id: "portion-1", membershipId: "ada", version: 2, status: "suggested" }],
      portionItems: [{ portionId: "portion-1", membershipId: "ada", unitId: "unit-1" }],
      assignments: [
        { membershipId: "ada", status: "open", objectType: "unit" },
        { membershipId: "parent", status: "completed", objectType: "station" },
      ],
      units: [{ id: "unit-1", title: "Welcome unit" }],
      credits: [
        { id: "c-platform", mode: "platform" },
        { id: "c-byok", mode: "byok" },
      ],
      ledger: [
        {
          creditId: "c-platform",
          direction: "burn",
          units: 5,
          parentMembershipId: "parent",
          childMembershipId: "ada",
        },
        {
          creditId: "c-platform",
          direction: "grant",
          units: 100,
          parentMembershipId: "parent",
          childMembershipId: null,
        },
        {
          creditId: "c-byok",
          direction: "burn",
          units: 9,
          parentMembershipId: "parent",
          childMembershipId: null,
        },
      ],
      usage: [
        {
          creditId: "c-byok",
          units: 2,
          parentMembershipId: "parent",
          childMembershipId: null,
        },
      ],
    }),
  );

  assert.equal(model.empty, false);
  assert.equal(model.movement.find((row) => row.id === "moved")?.people[0]?.membershipId, "ada");
  assert.equal(model.movement.find((row) => row.id === "stalled")?.people[0]?.name, "Parent");
  assert.equal(model.nextStep.find((row) => row.id === "no-portion")?.people.some((person) => person.membershipId === "parent"), true);
  assert.equal(model.nextStep.find((row) => row.id === "no-portion")?.people.some((person) => person.membershipId === "ada"), false);
  assert.equal(model.nextStep.find((row) => row.id === "no-unit")?.people.some((person) => person.membershipId === "ada"), false);
  const check = model.checks[0];
  assert.equal(check?.label, "Welcome unit");
  assert.equal(check?.value, 50);
  assert.equal(check?.valueLabel, "1 of 2 passed");
  assert.equal(check?.people[0]?.membershipId, "ada");
  assert.equal(check?.unitId, "unit-1");
  assert.equal(model.credits.find((row) => row.id === "burn")?.value, 5);
  assert.equal(model.credits.find((row) => row.id === "byok")?.value, 2);
  assert.equal(model.credits.find((row) => row.id === "burn")?.valueLabel, "5 units");
  assert.equal(model.assignments.find((row) => row.id === "open")?.value, 1);
  assert.equal(model.assignments.find((row) => row.id === "completed")?.value, 1);
  assert.equal(JSON.stringify(model).includes("$"), false);
});

test("a point carries a person and the page keeps six charts", () => {
  const page = readFileSync(join(here, "page.tsx"), "utf8");
  const charts = readFileSync(join(here, "charts.tsx"), "utf8");
  const load = readFileSync(join(here, "load.ts"), "utf8");
  for (const id of ["movement", "next-step", "checks", "skills", "credits", "assignments"]) {
    assert.match(charts, new RegExp(`id="${id}"`));
  }
  assert.match(charts, /data-chart=\{id\}/);
  assert.match(charts, /EMPTY_COPY/);
  assert.match(charts, /onClick=\{\(\) => onOpen\(point\)\}/);
  assert.match(charts, /data-person=\{person\.membershipId\}/);
  assert.match(load, /eq\(learningEvents\.orgId, orgId\)/);
  assert.match(load, /eq\(creditLedger\.orgId, orgId\)/);
  assert.match(load, /eq\(skillStates\.orgId, orgId\)/);
  assert.match(load, /eq\(assignments\.orgId, orgId\)/);
  assert.doesNotMatch(page, /site-header|dashboard\/page|COMPANY_GRAPH/);
  assert.equal(EMPTY_COPY, "no events in this org yet");
});
