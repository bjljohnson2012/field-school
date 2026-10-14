import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import { FIXTURE_BACKFILL, applyBackfill, formatDryRun, planBackfill } from "../src/lib/brains/backfill.ts";
import { canSeeBrainNode, listGapLoopEdges, loadBrainGraph, resolveOrgBrain } from "../src/lib/brains/graph.ts";
import { EDGE_ORIGINS, GAP_LOOP_NODE_KINDS, M11_NODE_KINDS, requireSharedEdgeScope, statusForOrigin } from "../src/lib/brains/kinds.ts";
import { nodeKindForBlock, nodesForLesson, reflectionSubmission } from "../src/lib/brains/lesson-nodes.ts";
import {
  LIVING_BRAIN_FALLBACK_THROUGH,
  LIVING_BRAIN_RETIRE_IN,
  chooseNextStepSource,
  nextOpenStation,
} from "../src/lib/brains/next-step.ts";
import { brainModelText } from "../src/lib/brains/prompt.ts";
import { parseBlocks } from "../src/lib/collections/content-model.ts";
import { libraryRedirect } from "../src/lib/library/m10.ts";
import { M9_METRICS, MEMBER_RAIL_DEFAULT, memberDoors } from "../src/lib/shell/m9-shell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const scopeA = {
  orgId: "org-a",
  growthUnitId: "unit-a",
  ownerKind: "child",
  ownerMembershipId: "parent-1",
  childMembershipId: "child-1",
};

function node(id, extra = {}) {
  return {
    id,
    orgId: "org-a",
    growthUnitId: "unit-a",
    ownerKind: "child",
    ownerMembershipId: "parent-1",
    childMembershipId: "child-1",
    kind: "concept",
    label: id,
    body: "",
    refTable: "lessons",
    refId: id,
    evidence: [{ table: "lessons", id, label: id }],
    status: "active",
    ...extra,
  };
}

function edge(id, extra = {}) {
  return {
    id,
    orgId: "org-a",
    fromNode: "n1",
    toNode: "n2",
    rel: "supports",
    because: "because",
    origin: "derived",
    status: "proposed",
    evidence: [{ table: "lessons", id: "n1", label: "n1" }],
    ...extra,
  };
}

test("U1 migration 0028 is additive and does not drop brain tables", () => {
  const sql = read("db/0028_m11_brains.sql");
  assert.match(sql, /knowledge_nodes_kind_check/);
  assert.match(sql, /'lesson', 'brain_page', 'reflection', 'skill', 'project'/);
  assert.match(sql, /'goal', 'requirement', 'concept', 'cluster', 'evidence'/);
  assert.match(sql, /knowledge_edges_origin_check/);
  assert.match(sql, /'system', 'derived', 'user', 'ai'/);
  assert.match(sql, /knowledge_edges_scope_check/);
  assert.doesNotMatch(sql, /DROP TABLE/i);
  assert.doesNotMatch(sql, /living_brains|living_profiles/);
  assert.doesNotMatch(sql, /\bscope\b\s+text/i);
  assert.equal(existsSync(join(root, "db/0026_m11_brains.sql")), false);
  assert.equal(existsSync(join(root, "db/0027_m12_onboarding.sql")), true);
  const names = readdirSync(join(root, "db")).filter((name) => name.startsWith("0028"));
  assert.deepEqual(names, ["0028_m11_brains.sql"]);
});

test("U2 U3 U4 U5 backfill dry-run is cited, derived, and idempotent", () => {
  const first = planBackfill(FIXTURE_BACKFILL);
  const printed = formatDryRun(first.counts, first.plannedInserts);
  assert.match(printed, /brain_sources 1/);
  assert.match(printed, /brain_notes 1/);
  assert.match(printed, /brain_artifacts 1/);
  assert.match(printed, /knowledge_units 1/);
  assert.match(printed, /coaching_knowledge_units 1/);
  assert.match(printed, /knowledge_nodes 2/);
  assert.ok(first.nodes.every((row) => row.refTable && row.refId && row.evidence.length >= 1));
  assert.equal(first.edges.length, 1);
  assert.equal(first.edges[0].origin, "derived");
  const kinds = new Set(first.nodes.map((row) => row.kind));
  assert.equal(kinds.has("brain_page"), true);
  assert.equal(kinds.has("skill"), true);
  assert.equal(kinds.has("project"), true);

  const applied = applyBackfill(FIXTURE_BACKFILL);
  const second = planBackfill({ ...FIXTURE_BACKFILL, existingNodes: applied.existingNodes });
  assert.equal(second.plannedInserts, 0);
  assert.equal(second.nodes.length, 0);
  assert.equal(second.counts.brain_sources, first.counts.brain_sources);
  assert.equal(second.counts.brain_notes, first.counts.brain_notes);
  assert.equal(second.counts.brain_artifacts, first.counts.brain_artifacts);
  assert.equal(second.counts.knowledge_units, first.counts.knowledge_units);
  assert.equal(second.counts.coaching_knowledge_units, first.counts.coaching_knowledge_units);

  const stdout = execFileSync(process.execPath, ["--experimental-strip-types", "scripts/brains-backfill.mjs", "--dry-run"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(stdout, /brain_sources 1/);
  assert.match(stdout, /knowledge_nodes 2/);
});

test("U6 rejected edges stay out of the brain graph and the gap-loop list", () => {
  const graph = loadBrainGraph({
    nodes: [node("n1"), node("n2"), node("n3", { orgId: "org-b" })],
    edges: [edge("keep"), edge("hide", { status: "rejected" }), edge("other", { orgId: "org-b", fromNode: "n3", toNode: "n1" })],
    filter: { orgId: "org-a", room: "household" },
  });
  assert.deepEqual(graph.edges.map((row) => row.id), ["keep"]);
  assert.deepEqual(graph.nodes.map((row) => row.id), ["n1", "n2"]);
  const listed = listGapLoopEdges([edge("keep"), edge("hide", { status: "rejected" })]);
  assert.deepEqual(listed.map((row) => row.id), ["keep"]);
  assert.match(read("src/lib/gap-loop/store.ts"), /status <> 'rejected'/);
});

test("U7 child-scope brain prompts redact the learner", () => {
  assert.match(read("src/lib/brains/prompt.ts"), /redactChildForPrompt/);
  assert.equal(brainModelText({ ownerKind: "child", text: "Ada can add", childName: "Ada" }), "the learner can add");
  assert.equal(brainModelText({ ownerKind: "person", text: "Ada can add", childName: "Ada" }), "Ada can add");
});

test("U8 legacy brain paths redirect to the library brain", () => {
  assert.equal(libraryRedirect("/brain"), "/library/brain");
  assert.equal(libraryRedirect("/knowledge"), "/library/brain");
  assert.equal(libraryRedirect("/networks"), "/library/brain");
  assert.equal(libraryRedirect("/knowledge/goals"), null);
  assert.match(read("src/proxy.ts"), /\/networks/);
  assert.match(read("src/app/networks/page.tsx"), /redirect\("\/knowledge"\)/);
});

test("U9 member rail stays Learn, Library, You at 240px", () => {
  assert.equal(MEMBER_RAIL_DEFAULT, "issue-368");
  assert.equal(M9_METRICS.railPx, 240);
  assert.deepEqual(memberDoors(MEMBER_RAIL_DEFAULT).map((door) => door.label), ["Learn", "Library", "You"]);
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
});

test("B1 B2 B3 kinds, shared scope, and origin", () => {
  assert.deepEqual(GAP_LOOP_NODE_KINDS, ["goal", "requirement", "concept", "cluster", "evidence"]);
  assert.deepEqual(M11_NODE_KINDS, ["lesson", "brain_page", "reflection", "skill", "project"]);
  assert.deepEqual(EDGE_ORIGINS, ["system", "derived", "user", "ai"]);
  assert.equal(statusForOrigin("ai"), "proposed");
  assert.equal(statusForOrigin("user"), "accepted");
  assert.equal(statusForOrigin("system"), "proposed");
  assert.deepEqual(requireSharedEdgeScope(scopeA, { ...scopeA }), scopeA);
  assert.throws(() => requireSharedEdgeScope(scopeA, { ...scopeA, orgId: "org-b" }), /edge_scope_mismatch/);
  assert.throws(() => requireSharedEdgeScope(scopeA, null), /edge_endpoint_missing/);
  assert.match(read("src/lib/gap-loop/store.ts"), /requireSharedEdgeScope/);
});

test("B4 one org brain and filtered views", () => {
  const brains = [
    { id: "later", orgId: "org-a", growthUnitId: "unit-b", status: "current", createdAt: "2026-10-02" },
    { id: "earlier", orgId: "org-a", growthUnitId: "unit-a", status: "current", createdAt: "2026-10-01" },
    { id: "other", orgId: "org-b", growthUnitId: "unit-c", status: "current", createdAt: "2026-09-01" },
  ];
  assert.equal(resolveOrgBrain(brains, "org-a")?.id, "earlier");
  const graph = loadBrainGraph({
    brains,
    nodes: [node("child", { childMembershipId: "child-1", ownerKind: "child" }), node("rep", { ownerKind: "person", childMembershipId: null, growthUnitId: "unit-b" })],
    edges: [],
    filter: { orgId: "org-a", room: "sales" },
  });
  assert.equal(graph.brainId, "earlier");
  assert.deepEqual(graph.nodes.map((row) => row.id), ["rep"]);
  const filtered = loadBrainGraph({
    brains,
    nodes: [node("child"), node("rep", { growthUnitId: "unit-b", ownerKind: "person", childMembershipId: null })],
    edges: [],
    filter: { orgId: "org-a", room: "household", growthUnitId: "unit-a" },
  });
  assert.deepEqual(filtered.nodes.map((row) => row.id), ["child"]);
});

test("B5 reflection block maps onto lesson nodes", () => {
  const parsed = parseBlocks([
    { kind: "reflection", prompt: "What changed?", response: "The map", tags: ["desk"] },
    { kind: "quiz", questions: [] },
    { kind: "assignment", title: "Field", brief: "Do it", notesPlaceholder: "", items: [] },
    { kind: "text", text: "Core" },
    { kind: "station", station: "01", kicker: "", durationLabel: "", summary: "" },
    { kind: "course", tagline: "Course", kicker: "", videoId: "", videoUrl: "", videoTitle: "", passRatio: 0.75, examPassRatio: 0.8, updatedAt: "2026-10-14" },
  ]);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(nodeKindForBlock("reflection"), "reflection");
  assert.equal(nodeKindForBlock("quiz"), "evidence");
  assert.equal(nodeKindForBlock("assignment"), "evidence");
  assert.equal(nodeKindForBlock("text"), "concept");
  assert.equal(nodeKindForBlock("bullets"), "concept");
  assert.equal(nodeKindForBlock("quote"), "concept");
  assert.equal(nodeKindForBlock("clip"), "concept");
  assert.equal(nodeKindForBlock("station"), "requirement");
  assert.equal(nodeKindForBlock("course"), "cluster");
  const built = nodesForLesson({ id: "lesson-1", title: "Maps", blocks: parsed.blocks });
  assert.equal(built.nodes[0].kind, "lesson");
  assert.deepEqual(
    built.nodes.slice(1).map((row) => row.kind),
    ["reflection", "evidence", "evidence", "concept", "requirement", "cluster"],
  );
  assert.ok(built.edges.every((row) => row.origin === "derived" && row.toKey === "lesson:lesson-1"));
  const submitted = reflectionSubmission("lesson-1", 0, { kind: "reflection", prompt: "What changed?", response: "The map" });
  assert.equal(submitted.kind, "reflection");
  assert.equal(submitted.body, "The map");
  assert.equal(submitted.evidence.length >= 1, true);
});

test("B6 enrollments win and living brain is only the fallback through M14", () => {
  const modules = [
    { slug: "briefing", title: "What this actually is" },
    { slug: "two-computers", title: "The two computers" },
  ];
  const open = nextOpenStation({
    membershipId: "member-1",
    enrollments: [{ membershipId: "member-1", courseSlug: "grok-bot", status: "active" }],
    latest: [{ membershipId: "member-1", courseSlug: "grok-bot", stationSlug: "briefing", kind: "watch", passed: true }],
    modules,
  });
  assert.equal(open?.from, "enrollments");
  assert.equal(open?.stationSlug, "briefing");
  const chosen = chooseNextStepSource({ enrollment: open, livingTitle: "Old living step" });
  assert.equal(chosen.from, "enrollments");
  assert.equal(chosen.title, "What this actually is");
  const fallback = chooseNextStepSource({ enrollment: null, livingTitle: "Old living step", phase: "M14" });
  assert.equal(fallback.from, "living_brain");
  const retired = chooseNextStepSource({ enrollment: null, livingTitle: "Old living step", phase: "M15" });
  assert.equal(retired.from, "");
  assert.equal(LIVING_BRAIN_FALLBACK_THROUGH, "M14");
  assert.equal(LIVING_BRAIN_RETIRE_IN, "M15");
  assert.match(read("src/app/learn/page.tsx"), /\/api\/brains\/next-step/);
  assert.match(read("src/app/learn/page.tsx"), /learnHomeContext/);
  assert.match(read("src/components/profile/enrollment-next.tsx"), /\/api\/brains\/next-step/);
  assert.match(read("src/app/api/living-brain/route.ts"), /enrollmentNextFor/);
  assert.doesNotMatch(read("src/components/library/brain-board.tsx"), /living_profiles|living_brains/);
  assert.match(read("src/app/api/library/brain/route.ts"), /readLibraryBrain/);
});

test("I1 I2 I3 a brain stays inside the org and the sales desk has no child rows", () => {
  const childNode = node("child-node");
  const other = loadBrainGraph({
    nodes: [childNode],
    edges: [edge("e1")],
    filter: { orgId: "org-b", room: "household" },
  });
  assert.equal(other.nodes.length, 0);
  assert.equal(other.edges.length, 0);
  const actor = { orgId: "org-a", membershipId: "parent-1", kind: "guardian" };
  assert.equal(canSeeBrainNode(actor, childNode, false), true);
  assert.equal(canSeeBrainNode({ ...actor, kind: "child" }, childNode, false), false);
  assert.equal(canSeeBrainNode({ ...actor, orgId: "org-b" }, childNode, false), false);
  const sales = loadBrainGraph({
    nodes: [childNode, node("rep", { ownerKind: "person", childMembershipId: null })],
    edges: [],
    filter: { orgId: "org-a", room: "sales" },
  });
  assert.deepEqual(sales.nodes.map((row) => row.id), ["rep"]);
});

test("I4 I5 a brain note keeps its source and goal routes stay put", () => {
  const note = planBackfill({
    ...FIXTURE_BACKFILL,
    brainSources: [],
    brainArtifacts: [],
    knowledgeUnits: [],
    coachingUnits: [],
  }).nodes.find((row) => row.refTable === "brain_notes");
  assert.equal(note?.refId, "n1");
  assert.equal(note?.evidence[0].table, "brain_notes");
  assert.match(read("src/app/api/brain/route.ts"), /canWriteBrain/);
  assert.equal(existsSync(join(root, "src/app/knowledge/goals/page.tsx")), true);
});

test("new copy has no em dash and no retired product names", () => {
  const files = [
    "db/0028_m11_brains.sql",
    "src/lib/brains/kinds.ts",
    "src/lib/brains/graph.ts",
    "src/lib/brains/backfill.ts",
    "src/lib/brains/lesson-nodes.ts",
    "src/lib/brains/next-step.ts",
    "src/lib/brains/prompt.ts",
    "src/components/library/brain-board.tsx",
    "src/components/profile/enrollment-next.tsx",
    "src/app/library/brain/page.tsx",
  ];
  const banned = [/\u2014/, /Learn with Ben/, /\bGym\b/, /\bFoundry\b/, /\bRetainer\b/];
  for (const file of files) {
    const source = read(file);
    for (const pattern of banned) assert.doesNotMatch(source, pattern, file);
  }
});
