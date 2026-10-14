import assert from "node:assert/strict";
import test from "node:test";
import { buildGapGraph, graphList } from "../src/lib/gap-loop/graph.ts";
import { scoredEdgeWeight } from "../src/lib/gap-loop/score.ts";

const citation = { table: "outcomes", id: "o1", label: "Goal" };

function fixture() {
  return {
    nodes: [
      { id: "goal", kind: "goal", label: "Fractions goal", evidence: [citation] },
      { id: "req", kind: "requirement", label: "Know fractions", requirementId: "r1", evidence: [citation] },
      { id: "note", kind: "evidence", label: "Notes", requirementId: "r1", evidence: [{ table: "research_tasks", id: "t1", label: "Notes" }] },
    ],
    edges: [
      { id: "e-proposed", from: "note", to: "req", rel: "supports", status: "proposed", weight: 2 },
      { id: "e-accepted", from: "req", to: "goal", rel: "part_of", status: "accepted", weight: 2 },
    ],
    gaps: [
      {
        id: "g1",
        requirementId: "r1",
        summary: "Nothing on hand yet for Know fractions.",
        status: "open",
        evidence: [citation],
      },
    ],
  };
}

test("cluster builder is deterministic and proposed edges have half weight", () => {
  assert.equal(scoredEdgeWeight("proposed", 2), 1);
  assert.equal(scoredEdgeWeight("accepted", 2), 2);
  const first = buildGapGraph(fixture());
  const second = buildGapGraph(fixture());
  assert.deepEqual(second, first);
  const proposed = first.edges.find((edge) => edge.id === "e-proposed");
  assert.equal(proposed.weight, 1);
  assert.equal(proposed.dashed, true);
  assert.equal(first.edges.find((edge) => edge.id === "e-accepted").weight, 2);
  assert.equal(first.clusters.length > 0, true);
  assert.equal(first.clusters.every((cluster) => cluster.citations.length >= 1), true);
});

test("list payload matches the graph payload", () => {
  const graph = buildGapGraph(fixture());
  const list = graphList(graph);
  assert.deepEqual(list.clusters, graph.clusters);
  assert.deepEqual(list.gaps, graph.gaps);
  assert.deepEqual(
    list.nodes.map((node) => node.id),
    graph.nodes.map((node) => node.id),
  );
  assert.deepEqual(
    list.nodes.map((node) => node.clusterId),
    graph.nodes.map((node) => node.clusterId),
  );
});
