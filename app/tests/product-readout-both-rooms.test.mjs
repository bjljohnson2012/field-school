import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { peopleForDesk } from "../src/app/people/desk.ts";
import { buildInsights } from "../src/app/insights/aggregate.ts";
import { buildLessonSpec, draftUnits } from "../src/app/library/wizard/lesson-spec.ts";
import { learnHomeContext } from "../src/lib/living-brain/model.ts";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");
const repoRoot = join(appRoot, "..");
const readoutPath = join(repoRoot, "docs/prelaunch/PRODUCT_READOUT.md");

const roster = [
  {
    membershipId: "sales-rep",
    name: "Ada",
    kind: "adult",
    stance: "learner",
    org: "sales",
    orgName: "Sales team",
    login: "member",
  },
  {
    membershipId: "sales-child",
    name: "Wrong room",
    kind: "child",
    stance: "learner",
    org: "sales",
    orgName: "Sales team",
    login: "none",
  },
  {
    membershipId: "household-child",
    name: "Bea",
    kind: "child",
    stance: "learner",
    org: "household",
    orgName: "Household",
    login: "none",
  },
  {
    membershipId: "household-login-child",
    name: "Dee",
    kind: "child",
    stance: "learner",
    org: "household",
    orgName: "Household",
    login: "member",
  },
];

function person(overrides) {
  return {
    membershipId: "person-1",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "Reads at the table.",
    outcomes: "Read the morning page",
    ownsOutcomes: false,
    history: [],
    confidence: "Steady at the table",
    ...overrides,
  };
}

test("sales desk lists zero children and household child login is none", () => {
  const sales = peopleForDesk(roster, "sales");
  assert.deepEqual(sales.map((row) => row.membershipId), ["sales-rep"]);
  assert.equal(sales.some((row) => row.kind === "child"), false);

  const household = peopleForDesk(roster, "household");
  assert.deepEqual(household.map((row) => row.membershipId), ["household-child"]);
  assert.equal(household.every((row) => row.kind === "child" && row.login === "none"), true);
});

test("household insights drop sales diagnostics and sales insights drop children", () => {
  const now = "2026-09-22T00:00:00.000Z";
  const household = buildInsights({
    orgSlug: "household",
    orgName: "Household",
    now,
    people: [
      { membershipId: "ada", name: "Ada", kind: "child", stance: "learner" },
      { membershipId: "parent", name: "Parent", kind: "adult", stance: "guardian" },
    ],
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
    portions: [],
    portionItems: [],
    assignments: [],
    ledgerUnits: [],
    skills: [
      { id: "sk-morning", slug: "morning", name: "Morning start" },
      { id: "sk-discovery", slug: "discovery", name: "Discovery" },
    ],
    skillStates: [
      { skillId: "sk-morning", membershipId: "ada", score: 3 },
      { skillId: "sk-discovery", membershipId: "ada", score: 5 },
    ],
    credits: [],
    ledger: [],
    usage: [],
    units: [],
  });
  assert.equal(household.salesDiagnostics, 0);
  assert.equal(JSON.stringify(household).includes("Discovery"), false);
  assert.equal(household.childrenIncluded, 1);

  const sales = buildInsights({
    orgSlug: "sales",
    orgName: "Sales team",
    now,
    people: [
      { membershipId: "sam", name: "Sam", kind: "adult", stance: "learner" },
      { membershipId: "kid", name: "ShouldNotShow", kind: "child", stance: "learner" },
    ],
    events: [
      {
        membershipId: "sam",
        kind: "watch",
        objectType: "station",
        objectId: "sales:welcome",
        createdAt: "2026-09-21T00:00:00.000Z",
        raw: { course: "sales" },
      },
    ],
    portions: [],
    portionItems: [],
    assignments: [],
    ledgerUnits: [],
    skills: [],
    skillStates: [],
    credits: [{ id: "c-platform", mode: "platform" }],
    ledger: [
      {
        creditId: "c-platform",
        direction: "burn",
        units: 5,
        parentMembershipId: "sam",
        childMembershipId: null,
      },
    ],
    usage: [],
    units: [],
  });
  assert.equal(sales.childrenIncluded, 0);
  assert.equal(JSON.stringify(sales).includes("ShouldNotShow"), false);
  assert.equal(sales.credits.find((row) => row.id === "burn")?.value, 5);
});

test("wizard writes one LessonSpec and both rooms keep a next step", () => {
  const units = draftUnits({
    kind: "text",
    title: "Opening",
    detail: "Name the next step",
    nextId: () => "unit-1",
  });
  const spec = buildLessonSpec({
    id: "spec-1",
    org: "sales",
    title: "Next step",
    outcome: "Name the next step after the session",
    delivery: "teach",
    videoCut: false,
    units,
    approvedUnitIds: units.map((unit) => unit.id),
  });
  assert.ok(spec);
  assert.equal(spec.units.length, 1);
  assert.ok(spec.units[0].source_unit_id);

  const home = learnHomeContext({
    room: "household",
    brain: {
      orgId: "org-home",
      room: "household",
      facts: "",
      outcome: "Finish the year reading aloud",
      people: [person({})],
    },
    membershipId: "person-1",
  });
  assert.equal(home.login, "none");
  assert.equal(home.nextStep, "Read the morning page");

  const sales = learnHomeContext({
    room: "sales",
    brain: {
      orgId: "org-sales",
      room: "sales",
      facts: "",
      outcome: "Close the quarter on the next call",
      people: [
        person({
          membershipId: "rep-1",
          name: "Kai",
          kind: "adult",
          login: "member",
          outcomes: "Name the next call",
          confidence: "Moving on the calls",
        }),
        person({
          membershipId: "child-9",
          name: "Wrong room",
          kind: "child",
          login: "none",
          outcomes: "Do not show",
          confidence: "Do not show",
        }),
      ],
    },
    membershipId: "rep-1",
  });
  assert.equal(sales.login, "member");
  assert.equal(sales.nextStep, "Name the next call");
  const hidden = learnHomeContext({
    room: "sales",
    brain: {
      orgId: "org-sales",
      room: "sales",
      facts: "",
      outcome: "Close the quarter on the next call",
      people: [
        person({
          membershipId: "rep-1",
          name: "Kai",
          kind: "adult",
          login: "member",
          outcomes: "Name the next call",
        }),
        person({
          membershipId: "child-9",
          name: "Wrong room",
          kind: "child",
          login: "none",
          outcomes: "Do not show",
        }),
      ],
    },
    membershipId: "child-9",
  });
  assert.equal(hidden.nextStep, "");
});

test("teach live route and prior proof files stay on disk", () => {
  const teach = readFileSync(join(appRoot, "src/app/o/[slug]/teach/page.tsx"), "utf8");
  const org = readFileSync(join(appRoot, "src/app/o/[slug]/page.tsx"), "utf8");
  assert.match(teach, /Teachers only/);
  assert.match(org, /\/o\/\$\{slug\}\/teach/);
  for (const rel of [
    "src/app/people/desk.test.mjs",
    "src/app/insights/aggregate.test.mjs",
    "src/app/library/wizard/lesson-spec.test.mjs",
    "src/lib/living-brain/model.test.mjs",
    "scripts/wave3-composer.test.mjs",
  ]) {
    assert.equal(existsSync(join(appRoot, rel)), true, rel);
  }
});

test("readout cites prior proofs and stays held", () => {
  const readout = readFileSync(readoutPath, "utf8");
  const lines = readout.trim().split("\n").filter((line) => line.startsWith("- "));
  assert.equal(lines.length, 8);
  const proven = [
    ["/people", "PR 220", "app/src/app/people/desk.test.mjs"],
    ["/insights", "PR 225", "app/src/app/insights/aggregate.test.mjs"],
    ["/library/wizard", "PR 224", "app/src/app/library/wizard/lesson-spec.test.mjs"],
    ["/dashboard", "PR 250", "app/src/lib/living-brain/model.test.mjs"],
    ["/insights", "PR 225", "app/src/app/insights/aggregate.test.mjs"],
    ["/o/:slug/teach", "PR 30", "app/scripts/wave3-composer.test.mjs"],
  ];
  for (const [route, pr, file] of proven) {
    const line = lines.find((row) => row.includes(route) && row.includes(pr) && row.includes(file));
    assert.ok(line, `${route} ${pr}`);
    assert.match(line, /PROVEN/);
    assert.doesNotMatch(line, /app\/tests\/product-readout-both-rooms\.test\.mjs/);
  }
  assert.match(lines[0], /PROVEN/);
  assert.doesNotMatch(lines[0], /NOT PROVEN/);
  assert.match(lines[0], /PR 206/);
  assert.match(lines[0], /app\/src\/components\/site-header\.test\.mjs/);
  assert.match(lines[0], /\(test added in this PR\)/);
  assert.match(lines[3], /PROVEN/);
  assert.doesNotMatch(lines[3], /NOT PROVEN/);
  assert.match(lines[3], /PR 214/);
  assert.match(lines[3], /app\/src\/components\/site-header\.test\.mjs/);
  assert.match(lines[3], /\(test added in this PR\)/);
  assert.equal(readout.trim().endsWith("Product stays HELD. Launch CLOSED 0/8."), true);
  assert.doesNotMatch(readout, /8\/8|Product \| PASS|Launch is OPEN/);
});
