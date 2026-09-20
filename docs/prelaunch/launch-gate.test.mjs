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
  assert.match(gate, /Wave3 farm \/ cutover/);
  assert.match(stub, /CLOSED/);
  assert.match(campus, /prelaunch\/LAUNCH_GATE\.md/);
});
