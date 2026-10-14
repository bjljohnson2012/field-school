import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { EMBEDDING_CONFIG } from "../src/lib/gap-loop/embedding.ts";
import { coverageMatch, wordMatch } from "../src/lib/gap-loop/score.ts";

test("coverage uses similarity when an embedding is present", () => {
  const requirement = "Know fractions well";
  const text = "zzzz unrelated";
  const lexical = wordMatch(requirement, text);
  const similar = coverageMatch(requirement, text, [1, 0, 0], [1, 0, 0]);
  assert.equal(similar, 1);
  assert.ok(similar > lexical);
});

test("a null embedding falls back to M1 word match", () => {
  const requirement = "Know fractions well";
  const text = "fractions practice sheet";
  assert.equal(coverageMatch(requirement, text, null, null), wordMatch(requirement, text));
  assert.equal(coverageMatch(requirement, text, [1, 0], null), wordMatch(requirement, text));
});

test("N is stored once and the migration uses that width", () => {
  assert.equal(EMBEDDING_CONFIG.provider, "xai");
  assert.equal(EMBEDDING_CONFIG.model, "v1");
  assert.equal(EMBEDDING_CONFIG.dimensions, 1024);
  const sql = readFileSync(new URL("../db/0029_gl2_gap_loop.sql", import.meta.url), "utf8");
  assert.match(sql, /embedding vector\(1024\)/);
  assert.match(sql, /USING hnsw/);
  assert.doesNotMatch(sql, /qdrant/i);
});
