import assert from "node:assert/strict";
import { test } from "node:test";
import {
  brainLessonGraph,
  brainsForRoom,
  edgeViews,
  entityKey,
  mergeGraphs,
  neighbors,
  parseEdgeViews,
  parseFocus,
  personMilestoneGraph,
} from "../src/lib/knowledge/graph.ts";
import { COLLECTIONS, deriveMilestones } from "../src/lib/records/model.ts";

const B1 = "b1000000-0000-4000-8000-000000000001";
const B2 = "b2000000-0000-4000-8000-000000000002";
const L1 = "11000000-0000-4000-8000-000000000001";
const L2 = "12000000-0000-4000-8000-000000000002";
const KID = "c1000000-0000-4000-8000-000000000001";
const ME = "a1000000-0000-4000-8000-000000000001";
const href = (id) => `/o/household/l/${id}`;

const rows = {
  brains: [
    { id: B1, title: "Ada's brain", childMembershipId: KID },
    { id: B2, title: "Family", childMembershipId: null },
  ],
  items: [
    { table: "brain_notes", id: "n1", brainId: B1, title: "Fractions note", unitId: "u1" },
    { table: "brain_notes", id: "n2", brainId: B1, title: "Halves note", unitId: "u2" },
    { table: "brain_sources", id: "s1", brainId: B1, title: "Worksheet", unitId: "u1" },
    { table: "brain_artifacts", id: "a1", brainId: B2, title: "Map", unitId: "u3" },
    { table: "brain_notes", id: "n3", brainId: B2, title: "Orphan", unitId: "u-no-lesson" },
    { table: "brain_notes", id: "n4", brainId: B2, title: "Other org", unitId: "u-missing" },
  ],
  units: [
    { id: "u1", lessonId: L1, title: "Fractions 1" },
    { id: "u2", lessonId: L1, title: "Halves" },
    { id: "u3", lessonId: L2, title: "Maps" },
    { id: "u-no-lesson", lessonId: null, title: "Loose" },
  ],
  lessons: [
    { id: L1, title: "Fractions" },
    { id: L2, title: "Geography" },
  ],
};

test("one draws-on edge per brain and lesson, explained by every citing item", () => {
  const graph = brainLessonGraph(rows, href);
  assert.equal(graph.edges.length, 2);
  const fractions = graph.edges.find((edge) => edge.to === entityKey({ kind: "lesson", id: L1 }));
  assert.equal(fractions.from, `brain:${B1}`);
  assert.equal(fractions.because, "1 source and 2 notes in this brain cite 2 units from this lesson (Fractions 1, Halves).");
  assert.deepEqual(fractions.evidence.map((row) => row.rowId).sort(), ["n1", "n2", "s1"]);
  const lesson = graph.entities.find((entity) => entity.key === fractions.to);
  assert.equal(lesson.href, `/o/household/l/${L1}`);
});

test("items on a unit with no lesson, or a unit outside the org rows, make no edge", () => {
  const graph = brainLessonGraph(rows, href);
  const evidence = graph.edges.flatMap((edge) => edge.evidence.map((row) => row.rowId));
  assert.equal(evidence.includes("n3"), false);
  assert.equal(evidence.includes("n4"), false);
});

test("sales never receives a tracked child's brain; household keeps both", () => {
  assert.deepEqual(brainsForRoom("sales", rows.brains).map((brain) => brain.id), [B2]);
  assert.deepEqual(brainsForRoom("household", rows.brains).map((brain) => brain.id), [B1, B2]);
  const sales = brainLessonGraph({ ...rows, brains: brainsForRoom("sales", rows.brains) }, href);
  assert.deepEqual(sales.edges.map((edge) => edge.from), [`brain:${B2}`]);
});

test("milestones derive from the rows that own each fact, newest first", () => {
  const milestones = deriveMilestones({
    self: {
      memberId: ME,
      gates: { "G-skills": { firstAt: "2026-10-01T00:00:00.000Z", lastAt: "2026-10-04T00:00:00.000Z" } },
      completedAt: null,
      tools: [{ attemptId: "t-1", toolSlug: "skill", summary: "Operator · 14/24.", completedAt: "2026-10-04T00:00:00.000Z" }],
    },
    kids: [
      { membershipId: KID, intakeDoneAt: "2026-10-02T00:00:00.000Z" },
      { membershipId: "c2", intakeDoneAt: null },
    ],
    ledgerUnits: [
      { id: "lu1", childMembershipId: KID, title: "Fractions", status: "completed", completedAt: "2026-10-05T00:00:00.000Z" },
      { id: "lu2", childMembershipId: KID, title: "Maps", status: "in_progress", completedAt: null },
    ],
  });
  assert.deepEqual(
    milestones.map((m) => [m.kind, m.title, m.at.slice(0, 10)]),
    [
      ["unit-complete", "Finished Fractions", "2026-10-05"],
      ["tool-result", "Skill assessment: Operator · 14/24.", "2026-10-04"],
      ["kid-intake", "Intake done", "2026-10-02"],
      ["profile-gate", "Complete skills assessment", "2026-10-01"],
    ],
  );
  assert.deepEqual(milestones[0].source, { table: "progress_ledger_units", rowId: "lu1" });
});

test("a person reaches only their own milestones; a login learner and a tracked child never share a key", () => {
  const milestones = deriveMilestones({
    self: { memberId: ME, gates: {}, completedAt: "2026-10-03T00:00:00.000Z", tools: [] },
    kids: [{ membershipId: KID, intakeDoneAt: "2026-10-02T00:00:00.000Z" }],
    ledgerUnits: [],
  });
  const self = personMilestoneGraph({ ref: { as: "self", memberId: ME }, label: "You", href: "/profile" }, milestones);
  const kid = personMilestoneGraph(
    { ref: { as: "tracked-child", membershipId: KID }, label: "Ada", href: `/profile/kids/${KID}` },
    milestones,
  );
  assert.deepEqual(self.edges.map((edge) => edge.because), ["You reached this on 2026-10-03."]);
  assert.deepEqual(kid.edges.map((edge) => edge.because), ["Ada reached this on 2026-10-02."]);
  assert.notEqual(self.edges[0].from, kid.edges[0].from);
  const merged = mergeGraphs(self, kid, kid);
  assert.equal(merged.edges.length, 2);
  assert.equal(neighbors(merged, `person:child:${KID}`).length, 1);
});

test("edge views round-trip through the browser parser and malformed rows are refused", () => {
  const views = edgeViews(brainLessonGraph(rows, href));
  assert.deepEqual(parseEdgeViews(JSON.parse(JSON.stringify({ ok: true, edges: views }))), views);
  assert.match(views[0].evidence[0], /^(note|source) “/);
  assert.equal(parseEdgeViews({ edges: [{ ...views[0], rel: "owns" }] }), null);
  assert.equal(parseEdgeViews({ edges: "nope" }), null);
});

test("focus is parsed at the boundary", () => {
  assert.deepEqual(parseFocus("brains"), { kind: "brains" });
  assert.deepEqual(parseFocus(`child:${KID}`), { kind: "child", membershipId: KID });
  assert.deepEqual(parseFocus("library", `${L1},${L2}`), { kind: "library", lessonIds: [L1, L2] });
  assert.equal(parseFocus("library", "1;drop table"), null);
  assert.equal(parseFocus("child:../etc"), null);
  assert.equal(parseFocus("org"), null);
});

test("the four Payload-shaped collections are named once", () => {
  assert.deepEqual(
    COLLECTIONS.map((c) => c.label),
    ["Families", "Student Profiles", "Milestones", "Media"],
  );
});
