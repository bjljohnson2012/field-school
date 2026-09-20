import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const read = (rel) => readFileSync(join(repo, rel), "utf8");

test("2026-09-20 FOUR_MODEL + WAVE3 farm docs exist; no cutover claim", () => {
  const four = read("docs/campus-runtime/FOUR_MODEL.md");
  const wave3 = read("docs/campus-runtime/WAVE3.md");
  assert.match(four, /2026-09-20/);
  assert.match(four, /50b776a1b4152af606c46e9664f54f8e50d98042/);
  assert.match(four, /Four-model ship gate/);
  assert.match(four, /Isolation \| `bc-ee625085/);
  assert.match(four, /Item-bank \| `bc-308e6103/);
  assert.match(four, /Factory \| `bc-9fa1dffc/);
  assert.match(four, /Goal \| `bc-bfa73716/);
  assert.match(four, /\*\*PASS\*\* — all four green/);
  assert.match(four, /\*\*not done\*\*/);
  assert.match(wave3, /2026-09-20 four-model farm/);
  assert.match(wave3, /Four-model ship gate \| \*\*PASS\*\*/);
  assert.match(wave3, /Campus cutover \| \*\*not done\*\*/);
  assert.match(wave3, /FOUR_MODEL\.md/);
  assert.match(wave3, /PR 65 closed SUPERSEDED, unmerged/);
  assert.doesNotMatch(four, /cutover done|campus package extracted/i);
  assert.doesNotMatch(wave3, /cutover done|campus package extracted/i);
  assert.equal(existsSync(join(here, "wave3-four-model-readiness.mjs")), true);
  assert.equal(existsSync(join(here, "wave3-composer.test.mjs")), true);
});
