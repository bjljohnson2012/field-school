import assert from "node:assert/strict";
import test from "node:test";
import {
  CHILD_COPY,
  DESK_COPY,
  ERROR_COPY,
  GUEST_COPY,
  JOB_SENTENCE,
  LEARNER_COPY,
  PICK_COPY,
  assignedLine,
  assigneeAllowed,
  draftAssignment,
  leaderCanAssign,
  peopleOnDesk,
  roomForOrg,
  visibleAssignments,
} from "./desk.ts";
import { parseLessonSpec } from "./lesson-spec.ts";

const child = {
  membershipId: "child-1",
  name: "Ada",
  kind: "child",
  stance: "learner",
  org: "household",
  login: "none",
};

const salesperson = {
  membershipId: "rep-1",
  name: "Kai",
  kind: "adult",
  stance: "learner",
  org: "sales",
  login: "member",
};

const leader = {
  membershipId: "leader-1",
  name: "Blair",
  kind: "adult",
  stance: "trainer",
  org: "sales",
  login: "member",
};

const mixed = [child, salesperson, leader];

const spec = {
  id: "lesson-1",
  org: "sales",
  title: "Discovery",
  outcome: "Name the next step on a live account.",
  units: [{ id: "unit-1", title: "Name the next step", source_unit_id: "src-discovery" }],
  mode: "assign",
};

test("one desk never lists the other room", () => {
  const sales = peopleOnDesk("sales", mixed, "leader-1");
  const household = peopleOnDesk("household", mixed, "parent-1");
  assert.deepEqual(sales.map((person) => person.membershipId), ["rep-1"]);
  assert.deepEqual(household.map((person) => person.membershipId), ["child-1"]);
  assert.equal(sales.some((person) => person.kind === "child"), false);
  assert.equal(household.some((person) => person.login === "member"), false);
});

test("a child has no login and a teammate does not own the path", () => {
  assert.equal(assigneeAllowed("household", { ...child, login: "member" }, "parent-1"), false);
  assert.equal(assigneeAllowed("sales", { ...salesperson, kind: "child", login: "none" }, "leader-1"), false);
  assert.equal(assigneeAllowed("sales", salesperson, salesperson.membershipId), false);
  const drafted = draftAssignment({
    room: "sales",
    actor: { membershipId: "leader-1", kind: "adult", stance: "trainer", org: "sales" },
    person: salesperson,
    spec,
    orgId: "org-sales",
  });
  assert.equal(drafted.ok, true);
  if (!drafted.ok) return;
  assert.equal(drafted.draft.raw.buyer, false);
  assert.equal(drafted.draft.raw.ownsPath, false);
  assert.equal(drafted.draft.raw.pathOwnerMembershipId, "leader-1");
  assert.equal(drafted.draft.membershipId, "rep-1");
  assert.equal(drafted.draft.raw.login, "member");
  assert.equal(drafted.draft.raw.source_unit_id, "src-discovery");
});

test("household assign keeps the child as a record", () => {
  const drafted = draftAssignment({
    room: "household",
    actor: { membershipId: "parent-1", kind: "adult", stance: "guardian", org: "household" },
    person: child,
    spec: { ...spec, org: "household" },
    orgId: "org-home",
  });
  assert.equal(drafted.ok, true);
  if (!drafted.ok) return;
  assert.equal(drafted.draft.raw.login, "none");
  assert.equal(drafted.draft.raw.buyer, false);
  assert.equal(drafted.draft.raw.ownsPath, false);
});

test("learners and children do not assign", () => {
  assert.equal(leaderCanAssign({ membershipId: "c", kind: "child", stance: "learner", org: "household" }), false);
  assert.equal(leaderCanAssign({ membershipId: "r", kind: "adult", stance: "learner", org: "sales" }), false);
  assert.equal(leaderCanAssign({ membershipId: "p", kind: "adult", stance: "guardian", org: "household" }), true);
  assert.equal(leaderCanAssign({ membershipId: "t", kind: "adult", stance: "trainer", org: "sales" }), true);
  assert.equal(leaderCanAssign({ membershipId: "t", kind: "adult", stance: "trainer", org: "household" }), false);
  assert.equal(roomForOrg("field-school"), null);
});

test("teach mode and a missing source unit stay off this desk", () => {
  const teach = draftAssignment({
    room: "sales",
    actor: { membershipId: "leader-1", kind: "adult", stance: "trainer", org: "sales" },
    person: salesperson,
    spec: { ...spec, mode: "teach" },
    orgId: "org-sales",
  });
  assert.deepEqual(teach, { ok: false, error: "spec_mode" });
  assert.equal(parseLessonSpec({ ...spec, units: [{ id: "u", title: "Unit", source_unit_id: "" }] }), null);
  const crossed = draftAssignment({
    room: "sales",
    actor: { membershipId: "leader-1", kind: "adult", stance: "trainer", org: "sales" },
    person: child,
    spec,
    orgId: "org-sales",
  });
  assert.equal(crossed.ok, false);
});

test("open paths stay on the desk that wrote them", () => {
  const rows = [
    {
      id: "a",
      membershipId: "child-1",
      name: "Ada",
      title: "Home",
      outcome: "Keep going",
      nextUnit: "Read",
      login: "none",
      buyer: false,
      ownsPath: false,
      room: "household",
    },
    {
      id: "b",
      membershipId: "rep-1",
      name: "Kai",
      title: "Discovery",
      outcome: "Name the next step",
      nextUnit: "Name the next step",
      login: "member",
      buyer: false,
      ownsPath: false,
      room: "sales",
    },
  ];
  assert.deepEqual(
    visibleAssignments("sales", rows, "leader-1", true).map((row) => row.id),
    ["b"],
  );
  assert.deepEqual(
    visibleAssignments("household", rows, "parent-1", true).map((row) => row.id),
    ["a"],
  );
  assert.equal(visibleAssignments("sales", rows, "rep-1", false).length, 1);
});

test("copy keeps the job and leaves the other person off the open desk", () => {
  assert.match(JOB_SENTENCE, /I invest in Field School/);
  assert.match(DESK_COPY.sales.law, /does not buy/);
  assert.match(DESK_COPY.sales.law, /does not own the path/);
  assert.equal(DESK_COPY.sales.law.includes("child"), false);
  assert.match(DESK_COPY.household.law, /no login/);
  assert.equal(DESK_COPY.household.law.includes("salesperson"), false);
  const prose = [
    JOB_SENTENCE,
    GUEST_COPY,
    PICK_COPY,
    CHILD_COPY,
    LEARNER_COPY,
    assignedLine("Kai", "Name the next step"),
    ...Object.values(DESK_COPY).flatMap((row) => Object.values(row)),
    ...Object.values(ERROR_COPY),
  ].join("\n");
  assert.equal(prose.includes("—"), false);
  assert.equal(/gym|street|neighborhood|Launch PASS|fourth SKU/i.test(prose), false);
});
