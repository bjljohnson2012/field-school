import assert from "node:assert/strict";
import test from "node:test";
import {
  coverageOf,
  detectGap,
  freshness,
  gapPriority,
  rankGaps,
  requestForGap,
  suppressRejected,
  systemConfidence,
  clampRequirements,
} from "../src/lib/gap-loop/score.ts";

function evidence(extra = {}) {
  return {
    id: "e1",
    kind: "upload",
    match: 1,
    ageDays: 1,
    sourceId: "s1",
    materialOnHand: true,
    provesUse: false,
    ...extra,
  };
}

function requirement(extra = {}) {
  return {
    id: "r1",
    label: "Fractions",
    weight: 2,
    depth: 0,
    evidence: [],
    ...extra,
  };
}

test("coverage math uses strength, match, and freshness", () => {
  assert.equal(coverageOf([evidence({ kind: "parent_ready", provesUse: true, materialOnHand: false })]), 100);
  assert.equal(coverageOf([evidence({ kind: "parent_getting_there", provesUse: true })]), 50);
  assert.equal(coverageOf([evidence({ kind: "parent_not_yet", provesUse: true })]), 15);
  assert.equal(coverageOf([evidence({ kind: "quiz_pass", provesUse: true })]), 80);
  assert.equal(coverageOf([evidence({ kind: "artifact", provesUse: true })]), 60);
  assert.equal(coverageOf([evidence({ kind: "upload" })]), 30);
  assert.equal(coverageOf([evidence({ kind: "brain_source" })]), 30);
  assert.equal(coverageOf([evidence({ kind: "profile_skill" })]), 40);
  assert.equal(coverageOf([evidence({ kind: "assessment_band" })]), 30);
  assert.equal(coverageOf([evidence({ kind: "upload" }), evidence({ id: "e2", kind: "upload", sourceId: "s2" })]), 60);
  assert.equal(coverageOf([evidence({ kind: "parent_ready", provesUse: true }), evidence({ kind: "upload" })]), 100);
  assert.equal(coverageOf([evidence({ match: 0.5 })]), 15);
});

test("freshness stays full for 180 days and then decays", () => {
  assert.equal(freshness(0), 1);
  assert.equal(freshness(180), 1);
  assert.ok(freshness(181) < 1);
  assert.equal(freshness(180 + 365), 0.2);
  assert.equal(freshness(180 + 800), 0.2);
  const faded = coverageOf([evidence({ kind: "parent_ready", provesUse: true, ageDays: 180 + 365 })]);
  assert.equal(faded, 20);
});

test("each gap kind", () => {
  assert.equal(detectGap(requirement(), 0), "missing_knowledge");
  assert.equal(detectGap(requirement({ evidence: [evidence()] }), 30), "missing_demonstration");
  assert.equal(
    detectGap(requirement({ expectedLinkMissing: true, coveredClusters: 2, evidence: [evidence({ provesUse: true })] }), 40),
    "missing_link",
  );
  assert.equal(detectGap(requirement({ evidence: [evidence({ ageDays: 400 })] }), 20), "stale");
  assert.equal(detectGap(requirement({ evidence: [evidence({ disagreesWith: "e2" })] }), 30), "conflict");
  assert.equal(
    detectGap(requirement({ evidence: [evidence({ kind: "parent_ready", provesUse: true, materialOnHand: true })] }), 100),
    null,
  );
});

test("ranking and system confidence", () => {
  const low = { id: "a", priority: gapPriority(1, 90, 0) };
  const high = { id: "b", priority: gapPriority(3, 10, 2) };
  assert.ok(high.priority > low.priority);
  assert.deepEqual(rankGaps([low, high]).map((row) => row.id), ["b", "a"]);
  assert.equal(systemConfidence([evidence()], false), "Low");
  assert.equal(
    systemConfidence([evidence(), evidence({ id: "e2", sourceId: "s2" })], false),
    "Medium",
  );
  assert.equal(
    systemConfidence(
      [
        evidence(),
        evidence({ id: "e2", sourceId: "s2" }),
        evidence({ id: "e3", sourceId: "s3" }),
      ],
      true,
    ),
    "High",
  );
});

test("a rejected finding stays out until the evidence changes", () => {
  const previous = [{ requirementId: "r1", status: "rejected", evidenceKey: "a,b" }];
  const kept = suppressRejected(previous, [
    { requirementId: "r1", evidenceKey: "a,b", kind: "missing_knowledge" },
    { requirementId: "r1", evidenceKey: "a,b,c", kind: "missing_knowledge" },
  ]);
  assert.deepEqual(kept.map((row) => row.evidenceKey), ["a,b,c"]);
});

test("requirements clamp to 3 through 12 and requests stay off the web", () => {
  const rows = clampRequirements([{ label: "Only one", kind: "knowledge", weight: 9, doneCondition: { evidenceType: "upload", text: "A source" } }]);
  assert.ok(rows.length >= 3 && rows.length <= 12);
  assert.equal(rows[0].weight, 5);
  assert.equal(requestForGap("missing_knowledge", "Fractions", "child").channel, "upload");
  assert.equal(requestForGap("missing_demonstration", "Fractions", "child").channel, "rating");
  assert.equal(requestForGap("missing_demonstration", "Fractions", "person").channel, "lesson");
  assert.equal(requestForGap("web" in {} ? "conflict" : "conflict", "Fractions", "person").channel, "answer");
});
