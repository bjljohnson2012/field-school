import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertEvidence, removeNode } from "../src/lib/gap-loop/citations.ts";

test("a node or edge without evidence is refused", () => {
  assert.throws(() => assertEvidence([]), /evidence_required/);
  assert.throws(() => assertEvidence([{ table: "brain_notes", id: "", label: "Note" }]), /evidence_required/);
  const cited = assertEvidence([{ table: "brain_notes", id: "n1", label: "Fractions note" }]);
  assert.equal(cited.length, 1);
});

test("delete removes the node and the edges derived from it", () => {
  const nodes = [
    { id: "goal", evidence: [{ table: "outcomes", id: "o1", label: "Goal" }] },
    { id: "upload", evidence: [{ table: "research_tasks", id: "t1", label: "Notes" }] },
  ];
  const edges = [
    { id: "e1", from: "upload", to: "goal", evidence: [{ table: "research_tasks", id: "t1", label: "Notes" }] },
    { id: "e2", from: "goal", to: "upload", evidence: [{ table: "outcomes", id: "o1", label: "Goal" }] },
    { id: "e3", from: "goal", to: "goal", evidence: [{ table: "outcomes", id: "o1", label: "Goal" }] },
  ];
  const next = removeNode(nodes, edges, "upload");
  assert.deepEqual(next.nodes.map((node) => node.id), ["goal"]);
  assert.deepEqual(next.edges.map((edge) => edge.id), ["e3"]);
});

test("the migration requires a citation and does not add a vector column", () => {
  const sql = readFileSync(new URL("../db/0021_knowledge_gap_loop.sql", import.meta.url), "utf8");
  assert.match(sql, /knowledge_nodes_evidence_len CHECK \(jsonb_typeof\(evidence\) = 'array' AND jsonb_array_length\(evidence\) >= 1\)/);
  assert.match(sql, /knowledge_edges_evidence_len CHECK \(jsonb_typeof\(evidence\) = 'array' AND jsonb_array_length\(evidence\) >= 1\)/);
  assert.match(sql, /ON DELETE CASCADE/);
  assert.match(sql, /Does not alter 0001-0020/);
  assert.doesNotMatch(sql, /vector\s*\(/i);
});
