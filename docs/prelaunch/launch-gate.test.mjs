import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const gate = readFileSync(join(here, "LAUNCH_GATE.md"), "utf8");
const stub = readFileSync(join(here, "STATUS.md"), "utf8");
const campus = readFileSync(join(here, "..", "campus-runtime", "STATUS.md"), "utf8");

test("launch gate is CLOSED at 0/8 and does not invent 8/8", () => {
  assert.match(gate, /\*\*Launch is CLOSED\.\*\*/);
  assert.match(gate, /Launch is never claimed until every node below is explicitly \*\*PASS\*\*/);
  assert.match(gate, /\*\*0\/8\*\*/);
  assert.match(gate, /This readout is \*\*0\/8\*\* and \*\*CLOSED\*\*/);
  assert.doesNotMatch(gate, /8\/8 PASS|launch OPEN|launch is open/i);
  for (const node of ["Product", "ICP", "Brand", "Offer", "Marketing", "Sales", "Legal", "Plan"]) {
    assert.match(gate, new RegExp(`\\| ${node} \\| HELD \\|`));
  }
  assert.match(gate, /Remotion Wave 5 factory \*\*PASS\*\*/);
  assert.match(gate, /Remotion-in-Next/);
  assert.match(gate, /Wave3 campus pack LIVE/);
  assert.match(gate, /TypeCard VOX-S04 PASS/);
  assert.match(stub, /CLOSED/);
  assert.match(campus, /prelaunch\/LAUNCH_GATE\.md/);
  assert.match(campus, /staff\/GRAPH\.md/);
  assert.match(campus, /staff\/ROUTINES\.md/);
  assert.match(campus, /TypeCard VOX-S04 \*\*PASS\*\*/);
  assert.match(campus, /Wave 3 campus pack \*\*LIVE\*\*/);
});

test("living brain and Track B cites stay closed", () => {
  assert.match(gate, /## Living brain and Track B \(not a launch PASS\)/);
  assert.match(gate, /learn-home-context-campus-pack-20260922T205533Z/);
  assert.match(gate, /sha256 `5b2ca542…`/);
  assert.match(gate, /track-b-publish-campus-pack-20260922T205009Z/);
  assert.match(gate, /sha256 `1c1b7333…`/);
  assert.match(gate, /b1071aaca7e3a20abf3b0d288a5f8860417b7dcb/);
  assert.match(gate, /PR 250 merge `c208501`/);
  assert.match(gate, /PR 251 merge `b1071aa`/);
  assert.match(gate, /PR 249 merge `f6dd522`/);
  assert.match(gate, /distribute` stays false/);
  assert.match(gate, /\| Product \| HELD \|/);
  assert.match(gate, /\*\*0\/8\*\*/);
  assert.doesNotMatch(gate, /8\/8 PASS|launch OPEN|launch is open/i);
  assert.doesNotMatch(gate, /JTBD|Jobs-to-be-Done|parent hire path/);
});
