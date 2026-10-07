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

test("the outcome stays open and launch stays closed", () => {
  assert.equal(graph.outcome.done, false);
  assert.equal(graph.launch, "CLOSED 0/8");
  assert.match(graph.outcome.statement, /Launch stays CLOSED 0\/8/);
  assert.match(markdown, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.doesNotMatch(markdown, /8\/8 PASS|launch OPEN|launch is open/i);
  assert.deepEqual(graph.outcome.requires, ["E1", "E2", "E3", "E5"]);
});

test("built nodes cite commits, and no node is PASS", () => {
  for (const node of graph.nodes) {
    assert.notEqual(node.status, "PASS");
    assert.match(markdown, new RegExp(`\\| ${node.id} \\|`));
    assert.match(markdown, new RegExp(`\\| ${node.status} \\|`));
    if (node.status === "BUILT") {
      assert.match(node.sha, /^[0-9a-f]{40}$/);
      execFileSync("git", ["cat-file", "-e", `${node.sha}^{commit}`], {cwd: repo});
    }
  }
  assert.equal(graph.nodes.find((node) => node.id === "E4").status, "HELD");
  assert.equal(graph.nodes.find((node) => node.id === "E7").status, "HELD");
  assert.equal(graph.nodes.find((node) => node.id === "E5").status, "BLOCKED");
});

test("the pick is Product MATCH, with rebind blocked and merge held", () => {
  const pick = pickEngineering(graph);
  assert.deepEqual(pick.ready.map((node) => node.id), []);
  assert.deepEqual(pick.human.map((node) => node.id), ["E6"]);
  assert.deepEqual(pick.blocked.map((node) => node.id), ["E5"]);
  assert.deepEqual(pick.held.map((node) => node.id), ["E4", "E7"]);
  assert.equal(pick.done, false);
  const text = formatEngineering(graph, pick);
  assert.match(text, /^OUTCOME open/m);
  assert.match(text, /^CODE none/m);
  assert.match(text, /^HUMAN E6 Product MATCH/m);
  assert.match(text, /Drafts stay drafts until Ben gives MERGE GO/);
});

test("a goal with a held node stays open", () => {
  const text = formatEngineering(graph);
  assert.match(text, /^G5 Staff count — built, merge held/m);
  assert.match(text, /^G6 Fresh gates — open/m);
  assert.match(text, /^G7 One gate write — open/m);
});
