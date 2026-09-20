import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const wave3 = readFileSync(join(here, "WAVE3.md"), "utf8");
const campus = readFileSync(join(here, "STATUS.md"), "utf8");
const gate = readFileSync(join(here, "..", "prelaunch", "LAUNCH_GATE.md"), "utf8");

test("WAVE3 teach live smoke is dated 2026-09-20; launch stays CLOSED 0/8", () => {
  assert.match(wave3, /## 2026-09-20 teach live smoke/);
  assert.match(wave3, /Guest\/unsigned composer stays 401/);
  assert.match(wave3, /do not steal family LIVE `bc-4765f2f0`/);
  assert.match(wave3, /signed teacher 200 catalog \/ publish/);
  assert.match(wave3, /\*\*skipped\*\*/);
  assert.match(wave3, /HARD fail \| none/);
  assert.match(wave3, /Remotion-in-Next held/);
  assert.match(wave3, /e352f5ad/);
  assert.match(wave3, /71b3245b/);
  assert.match(wave3, /baec863d/);
  assert.match(wave3, /Campus cutover \| \*\*not done\*\*/);
  assert.match(wave3, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(campus, /2026-09-20 teach live smoke/);
  assert.match(campus, /Wave 3 campus pack \*\*LIVE\*\*/);
  assert.match(campus, /PR 65 closed SUPERSEDED, unmerged/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(gate, /\*\*Launch is CLOSED\.\*\*/);
  assert.match(gate, /\*\*0\/8\*\*/);
  assert.doesNotMatch(wave3, /8\/8 PASS|launch OPEN|cutover done/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN|cutover done/i);
});
