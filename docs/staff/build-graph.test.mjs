import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const graph = readFileSync(join(here, "BUILD_GRAPH.md"), "utf8");
const law = readFileSync(join(here, "..", "LAW.md"), "utf8");
const start = readFileSync(join(here, "..", "campus-runtime", "START.md"), "utf8");

test("BUILD_GRAPH is a loop with named nodes and no launch claim", () => {
  for (const id of ["N0", "N1", "N2", "N3", "N15", "CHROME", "INSIGHTS", "PROVE"]) {
    assert.match(graph, new RegExp(id));
  }
  assert.match(graph, /load graph/);
  assert.match(graph, /site-header\.tsx/);
  assert.match(graph, /orgs\.includes/);
  assert.match(graph, /CLOSED/);
  assert.doesNotMatch(graph, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(graph, /Default: Wave 2/);
});

test("LAW kills Wave 2 as the job", () => {
  assert.match(law, /docs\/staff\/BUILD_GRAPH\.md/);
  assert.match(law, /Wave 2 tenants/);
  assert.match(law, /not the job|Resume is forbidden|that instruction is dead/i);
  assert.doesNotMatch(law, /Default: Wave 2/);
});

test("START no longer defaults to Wave 2", () => {
  assert.match(start, /docs\/LAW\.md/);
  assert.match(start, /BUILD_GRAPH/);
  assert.doesNotMatch(start, /Default: Wave 2/);
});
