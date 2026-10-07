import assert from "node:assert/strict";
import test from "node:test";
import { canReadOutcome, canWriteOutcome, modelUserPayload, outcomeWrite, redactChildForPrompt } from "../src/lib/gap-loop/rules.ts";
import { outcomeSignals } from "../src/lib/gap-loop/signals.ts";

const adult = {
  kind: "adult",
  stance: "guardian",
  orgSlug: "household",
  orgId: "org-1",
  membershipId: "mem-parent",
  memberId: "member-1",
  mode: "family",
  features: { mode: "family" },
};

test("a child membership cannot write", () => {
  const child = { ...adult, kind: "child", stance: "learner" };
  assert.deepEqual(outcomeWrite(child, "person", false), { ok: false, error: "child_cannot_write" });
  assert.deepEqual(outcomeWrite(child, "child", false), { ok: false, error: "child_cannot_write" });
  assert.equal(canWriteOutcome(child, "person", true), false);
});

test("the sales room cannot create a child goal", () => {
  const sales = { ...adult, orgSlug: "sales", stance: "admin", mode: "none", features: {} };
  assert.equal(canWriteOutcome(sales, "person", false), true);
  assert.deepEqual(outcomeWrite(sales, "child", false), { ok: false, error: "sales_room_cannot_create_child_goal" });
  assert.equal(canWriteOutcome(sales, "child", true), false);
});

test("a household parent can write a child goal and an adult can write a self goal", () => {
  assert.equal(canWriteOutcome(adult, "person", false), true);
  assert.equal(canWriteOutcome(adult, "child", false), true);
  const learner = { ...adult, stance: "learner" };
  assert.equal(canWriteOutcome(learner, "child", false), false);
  assert.equal(
    canReadOutcome(adult, { orgId: "org-1", ownerKind: "child", ownerMembershipId: "mem-parent", childMembershipId: "kid" }, false),
    true,
  );
  assert.equal(
    canReadOutcome(adult, { orgId: "org-2", ownerKind: "person", ownerMembershipId: "mem-parent", childMembershipId: null }, false),
    false,
  );
});

test("redactChildForPrompt strips the name and profile identifiers", () => {
  const text = redactChildForPrompt("Robin can add fractions. Contact robin@home.test.", "Robin", ["robin@home.test"]);
  assert.equal(text.includes("Robin"), false);
  assert.equal(text.includes("robin@home.test"), false);
  assert.match(text, /the learner can add fractions/);
  const payload = modelUserPayload({
    ownerKind: "child",
    statement: "Help Robin with fractions",
    horizon: "By spring for Robin",
    childName: "Robin",
    identifiers: ["kid-profile-77"],
  });
  assert.equal(JSON.stringify(payload).includes("Robin"), false);
  assert.equal(JSON.stringify(payload).includes("kid-profile-77"), false);
  assert.equal(payload.learner, "the learner");
});

test("outcome signals never write parent confidence", () => {
  const signals = outcomeSignals({
    title: "Fractions",
    requirements: [
      { label: "Know fractions", status: "met", coverage: 80, systemConfidence: "High" },
      { label: "Show fractions", status: "open", coverage: 20, systemConfidence: "Low" },
    ],
    topGap: "Show fractions",
    intentLinked: false,
  });
  assert.equal(signals.confidence, null);
  assert.equal(signals.writesParentConfidence, false);
  assert.equal(signals.next.locked, false);
  assert.equal(signals.now.coverage.done, 1);
  assert.equal(signals.now.coverage.total, 2);
});
