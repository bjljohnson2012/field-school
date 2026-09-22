import assert from "node:assert/strict";
import test from "node:test";
import { readForTool, shapeBrain, updateOutcome } from "./model.ts";

const parent = { kind: "adult", stance: "guardian", org: "household", membershipId: "parent-1" };
const leader = { kind: "adult", stance: "trainer", org: "sales", membershipId: "leader-1" };

test("parent updates the child outcome and the child has no login", () => {
  const shaped = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "The household is learning at home.",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Who they are now",
        outcomes: "Keep the next step",
      },
    ],
  });
  assert.equal(shaped.ok, true);
  if (!shaped.ok) return;
  assert.equal(shaped.brain.people[0].login, "none");
  assert.equal(shaped.brain.people[0].ownsOutcomes, false);
  const childWrite = updateOutcome(shaped.brain, { ...parent, kind: "child", membershipId: "child-1" }, "child-1", "A login");
  assert.deepEqual(childWrite, { ok: false, error: "child_has_no_login" });
  const updated = updateOutcome(shaped.brain, parent, "child-1", "The next step still shows");
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.brain.people[0].outcomes, "The next step still shows");
  assert.equal(updated.brain.people[0].ownsOutcomes, false);
  const tool = readForTool(updated.brain, "org-home");
  assert.equal(tool?.facts, "The household is learning at home.");
  assert.equal(tool?.people[0].outcomes, "The next step still shows");
  assert.equal(readForTool(updated.brain, "org-sales"), null);
});

test("leader owns sales outcomes and the sales brain has no children", () => {
  const blocked = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "The team keeps moving.",
    actorId: "leader-1",
    people: [
      {
        membershipId: "child-1",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "no",
      },
    ],
  });
  assert.deepEqual(blocked, { ok: false, error: "sales_has_no_children" });
  const shaped = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "The team keeps moving.",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Who they are now",
        outcomes: "Name the next step",
      },
    ],
  });
  assert.equal(shaped.ok, true);
  if (!shaped.ok) return;
  assert.equal(shaped.brain.people[0].login, "member");
  assert.equal(shaped.brain.people[0].ownsOutcomes, false);
  const updated = updateOutcome(shaped.brain, leader, "rep-1", "The next step stays");
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  const tool = readForTool(updated.brain, "org-sales");
  assert.equal(tool?.people.length, 1);
  assert.equal(tool?.people[0].outcomes, "The next step stays");
  assert.equal(tool?.people[0].ownsOutcomes, false);
  assert.equal(tool?.people.some((person) => person.login === "none"), false);
});
