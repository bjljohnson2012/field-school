import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DESK_COPY,
  JOB_SENTENCE,
  deskForOrg,
  initialDesk,
  peopleForDesk,
  roomsFor,
} from "./desk.ts";

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
    membershipId: "sales-trainer",
    name: "Cara",
    kind: "adult",
    stance: "trainer",
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
    membershipId: "household-parent",
    name: "Cara",
    kind: "adult",
    stance: "guardian",
    org: "household",
    orgName: "Household",
    login: "member",
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

test("sales desk lists login learners only", () => {
  const rows = peopleForDesk(roster, "sales");
  assert.deepEqual(
    rows.map((row) => row.membershipId),
    ["sales-rep"],
  );
  assert.equal(
    rows.every((row) => row.kind !== "child" && row.login !== "none"),
    true,
  );
});

test("household desk lists tracked children with login none", () => {
  const rows = peopleForDesk(roster, "household");
  assert.deepEqual(
    rows.map((row) => row.membershipId),
    ["household-child"],
  );
  assert.equal(
    rows.every((row) => row.kind === "child" && row.login === "none"),
    true,
  );
});

test("the two desks never share a person", () => {
  const sales = new Set(peopleForDesk(roster, "sales").map((row) => row.membershipId));
  const household = peopleForDesk(roster, "household");
  assert.equal(
    household.some((row) => sales.has(row.membershipId)),
    false,
  );
});

test("an unknown org is not a desk", () => {
  assert.equal(deskForOrg("field-school"), null);
  assert.equal(deskForOrg(""), null);
});

test("two rooms stay unselected until the active org names one", () => {
  assert.equal(
    initialDesk({
      activeSlug: "",
      membershipSlugs: ["household", "sales"],
      staff: false,
    }),
    null,
  );
  assert.equal(
    initialDesk({
      activeSlug: "sales",
      membershipSlugs: ["household", "sales"],
      staff: false,
    }),
    "sales",
  );
  assert.equal(
    initialDesk({
      activeSlug: "household",
      membershipSlugs: ["sales", "household"],
      staff: false,
    }),
    "household",
  );
});

test("one membership is that room", () => {
  assert.deepEqual(roomsFor(["household"], false), ["household"]);
  assert.equal(
    initialDesk({ activeSlug: "field-school", membershipSlugs: ["sales"], staff: false }),
    "sales",
  );
});

test("staff with no student org must pick a room", () => {
  assert.deepEqual(roomsFor([], true), ["sales", "household"]);
  assert.equal(
    initialDesk({ activeSlug: "field-school", membershipSlugs: [], staff: true }),
    null,
  );
});

test("desk copy names the job, the buyer, and login none", () => {
  const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const desk = readFileSync(new URL("./desk.ts", import.meta.url), "utf8");
  const prose = `${page}\n${desk}`;
  assert.match(prose, new RegExp(JOB_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(DESK_COPY.sales.lede, /login learners/);
  assert.match(DESK_COPY.sales.lede, /A child is not a buyer/);
  assert.match(DESK_COPY.household.lede, /tracked children/);
  assert.match(DESK_COPY.household.lede, /Login is none/);
  assert.match(DESK_COPY.household.lede, /A child is not a buyer/);
  assert.equal(DESK_COPY.household.login, "None");
  assert.equal(DESK_COPY.sales.kind, "Login learner");
  assert.doesNotMatch(prose, /\u2014/);
  assert.doesNotMatch(prose, /\bgym\b/i);
  assert.doesNotMatch(prose, /\bstreet\b/i);
  assert.doesNotMatch(prose, /\bneighborhood\b/i);
  assert.doesNotMatch(prose, /Launch PASS/);
  assert.doesNotMatch(prose, /formation/i);
  assert.doesNotMatch(page, /View all/);
  assert.match(page, /peopleForDesk/);
});
