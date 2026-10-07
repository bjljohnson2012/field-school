import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {formatEngineering, loadEngineeringGraph, pickEngineering} from "./pick-engineering.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const graph = loadEngineeringGraph();
const markdown = readFileSync(join(here, "ENGINEERING_GRAPH.md"), "utf8");

test("the outcome is done and launch stays closed", () => {
  assert.equal(graph.outcome.done, true);
  assert.equal(graph.launch, "CLOSED 0/8");
  assert.match(graph.outcome.statement, /Launch stays CLOSED 0\/8/);
  assert.match(markdown, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.doesNotMatch(markdown, /8\/8 PASS|launch OPEN|launch is open/i);
  assert.deepEqual(graph.outcome.requires, ["E1", "E2", "E3", "E5"]);
  for (const id of graph.outcome.requires) {
    assert.equal(graph.nodes.find((node) => node.id === id).status, "PASS");
  }
});

test("passed nodes cite commits, and the atomic merge stays held", () => {
  for (const node of graph.nodes) {
    assert.match(markdown, new RegExp(`\\| ${node.id} \\|`));
    assert.match(markdown, new RegExp(`\\| ${node.status} \\|`));
    if (node.status === "PASS" && node.sha) {
      assert.match(node.sha, /^[0-9a-f]{40}$/);
      execFileSync("git", ["cat-file", "-e", `${node.sha}^{commit}`], {cwd: repo});
    }
  }
  assert.equal(graph.nodes.find((node) => node.id === "E4").status, "HELD");
  assert.equal(graph.nodes.find((node) => node.id === "E5").status, "PASS");
  assert.equal(graph.nodes.find((node) => node.id === "E6").status, "PASS");
  assert.equal(graph.nodes.find((node) => node.id === "E7").status, "PASS");
  for (const id of ["E1", "E2", "E3", "E5"]) {
    assert.match(graph.nodes.find((node) => node.id === id).sha, /^[0-9a-f]{40}$/);
  }
});

test("the pick is idle, with the atomic merge held", () => {
  const pick = pickEngineering(graph);
  assert.deepEqual(pick.ready.map((node) => node.id), []);
  assert.deepEqual(pick.human.map((node) => node.id), []);
  assert.deepEqual(pick.blocked.map((node) => node.id), []);
  assert.deepEqual(pick.held.map((node) => node.id), ["E4"]);
  assert.equal(pick.done, true);
  const text = formatEngineering(graph, pick);
  assert.match(text, /^OUTCOME done/m);
  assert.match(text, /^CODE none/m);
  assert.match(text, /^HUMAN none/m);
  assert.match(text, /^HELD E4/m);
  assert.match(text, /Launch stays CLOSED 0\/8/);
});

test("a goal with a held node stays open", () => {
  const text = formatEngineering(graph);
  assert.match(text, /^G5 Staff count — on main/m);
  assert.match(text, /^G6 Fresh gates — open/m);
  assert.match(text, /^G7 One gate write — on main/m);
});
