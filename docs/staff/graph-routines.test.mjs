import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const graph = readFileSync(join(here, "GRAPH.md"), "utf8");
const routines = readFileSync(join(here, "ROUTINES.md"), "utf8");
const gate = readFileSync(join(here, "..", "prelaunch", "LAUNCH_GATE.md"), "utf8");
const stub = readFileSync(join(here, "..", "prelaunch", "STATUS.md"), "utf8");

test("staff GRAPH is the locked hub; launch stays CLOSED 0/8", () => {
  assert.match(graph, /CDM → CTO → Cursor Gate → Field School PM/);
  assert.match(graph, /No peer C-suite messaging/);
  assert.match(graph, /Do not invent seats/);
  assert.match(graph, /Do not spawn new Product \/ Marketer \/ Revenue agents/);
  assert.match(graph, /Remotion Wave 5 factory is \*\*PASS\*\* in `plates\/` only/);
  assert.match(graph, /No Remotion-in-Next/);
  assert.match(graph, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.doesNotMatch(graph, /8\/8 PASS|launch OPEN|launch is open/i);
});

test("staff ROUTINES lists Field School clocks as handoffs", () => {
  for (const clock of ["06:00", "09:00", "15:00", "22:00", "02:00"]) {
    assert.match(routines, new RegExp(clock));
  }
  assert.match(routines, /Every clock is a handoff/);
  assert.match(routines, /CDM → CTO → Cursor Gate → Field School PM/);
  assert.match(routines, /Sealed brief shape/);
  assert.match(routines, /Project: Field School PM/);
  assert.match(routines, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.doesNotMatch(routines, /8\/8 PASS|launch OPEN|launch is open/i);
});

test("Plan node and STATUS cross-link GRAPH and ROUTINES", () => {
  assert.match(gate, /\| Plan \| HELD \|/);
  assert.match(gate, /staff\/GRAPH\.md/);
  assert.match(gate, /staff\/ROUTINES\.md/);
  assert.match(gate, /\*\*0\/8\*\*/);
  assert.match(stub, /staff\/GRAPH\.md/);
  assert.match(stub, /staff\/ROUTINES\.md/);
  assert.match(stub, /CLOSED/);
});
