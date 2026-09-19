import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const read = (rel) => readFileSync(join(repo, rel), "utf8");

test("2026-09-19 FOUR_MODEL + WAVE3 readiness docs exist; no cutover claim", () => {
  const four = read("docs/campus-runtime/FOUR_MODEL.md");
  const wave3 = read("docs/campus-runtime/WAVE3.md");
  assert.match(four, /2026-09-19/);
  assert.match(four, /ship_gate|Four-model ship gate/);
  assert.match(four, /\*\*FAIL\*\*/);
  assert.match(four, /not done/);
  assert.match(four, /wave3-composer\.test\.mjs/);
  assert.match(four, /wave3-four-model-readiness\.mjs/);
  assert.match(wave3, /2026-09-19 four-model readiness/);
  assert.match(wave3, /FOUR_MODEL\.md/);
  assert.match(four, /e24b0127804cf387594ac38eb9cb6255efe98348/);
  assert.match(four, /coordinator-owned/);
  assert.match(wave3, /2026-09-19 four-model farm target/);
  assert.doesNotMatch(four, /cutover done|campus package extracted/i);
  assert.equal(existsSync(join(here, "wave3-four-model-readiness.mjs")), true);
  assert.equal(existsSync(join(here, "wave3-composer.test.mjs")), true);
});
