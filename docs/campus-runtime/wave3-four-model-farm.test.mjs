import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const four = readFileSync(join(here, "FOUR_MODEL.md"), "utf8");
const wave3 = readFileSync(join(here, "WAVE3.md"), "utf8");
const campus = readFileSync(join(here, "STATUS.md"), "utf8");
const gate = readFileSync(join(here, "..", "prelaunch", "LAUNCH_GATE.md"), "utf8");

test("2026-09-20 farm is PASS on 50b776a; cutover not done; launch stays CLOSED 0/8", () => {
  assert.match(four, /50b776a1b4152af606c46e9664f54f8e50d98042/);
  assert.match(four, /wave3-four-model-isolation-50b776a\.json/);
  assert.match(four, /wave3-four-model-itembank-50b776a\.json/);
  assert.match(four, /wave3-four-model-factory-50b776a\.json/);
  assert.match(four, /wave3-four-model-goal-50b776a\.json/);
  assert.match(four, /Four-model ship gate \| \*\*PASS\*\*/);
  assert.match(four, /Wave3 campus cutover \| \*\*not done\*\*/);
  assert.match(wave3, /Campus cutover \| \*\*not done\*\*/);
  assert.match(campus, /farm \*\*PASS\*\* on `50b776a`/);
  assert.match(campus, /PR 65 closed SUPERSEDED, unmerged/);
  assert.match(gate, /\*\*Launch is CLOSED\.\*\*/);
  assert.match(gate, /\*\*0\/8\*\*/);
  assert.doesNotMatch(four, /8\/8 PASS|launch OPEN|cutover done/i);
  assert.doesNotMatch(wave3, /8\/8 PASS|launch OPEN|cutover done/i);
});
