import assert from "node:assert/strict";
import { test } from "node:test";
import {
  latestByTool,
  owedGates,
  parseToolSubmission,
  scoreSubmission,
  submissionBody,
} from "../src/lib/tools/results.ts";

const attemptId = "3f6c1a52-8d4e-4b7a-9c21-0e5f7d8a9b10";
const allFours = (ids) => Object.fromEntries(ids.map((id) => [id, 4]));
const SKILL = ["brief", "logins", "ai", "tools", "ship", "track"];
const INTEL = ["notice-signal", "notice-gap", "decide-first", "decide-risk", "learn-pace", "learn-transfer"];

test("a full Skill submission parses and the server scores it Principal 24/24", () => {
  const parsed = parseToolSubmission({ tool: "skill", attemptId, answers: allFours(SKILL) });
  assert.equal(parsed.ok, true);
  const at = new Date("2026-10-06T12:00:00.000Z");
  const result = scoreSubmission(parsed.submission, at);
  assert.equal(result.completedAt, "2026-10-06T12:00:00.000Z");
  assert.deepEqual(result.scores, { total: 24, max: 24 });
  assert.equal(result.labels.band, "Principal");
  assert.match(result.summary, /^Principal · 24\/24\./);
});

test("Intelligence scores three axes from raw answers", () => {
  const answers = { ...allFours(INTEL), "learn-pace": 1, "learn-transfer": 1 };
  const parsed = parseToolSubmission({ tool: "intelligence", attemptId, answers });
  assert.equal(parsed.ok, true);
  const result = scoreSubmission(parsed.submission, new Date("2026-10-06T12:00:00.000Z"));
  assert.deepEqual(result.scores, { notice: 8, decide: 8, learn: 2, total: 18, max: 24 });
  assert.equal(result.labels.learn, "Learn · warming");
});

test("a browser-sent summary, score, or clock is ignored", () => {
  const parsed = parseToolSubmission({
    tool: "skill",
    attemptId,
    answers: allFours(SKILL),
    summary: "Principal · 99/24",
    completedAt: "2001-01-01T00:00:00.000Z",
  });
  assert.equal(parsed.ok, true);
  assert.deepEqual(Object.keys(parsed.submission).sort(), ["answers", "attemptId", "toolSlug"]);
});

test("submissions the server cannot score are refused with a reason", () => {
  const cases = [
    [{ tool: "personality", attemptId, answers: {} }, "not_a_saved_tool"],
    [null, "not_a_saved_tool"],
    [{ tool: "skill", attemptId: "not-a-uuid", answers: allFours(SKILL) }, "bad_attempt_id"],
    [{ tool: "skill", attemptId, answers: { ...allFours(SKILL), track: undefined } }, "answers_incomplete"],
    [{ tool: "skill", attemptId, answers: { ...allFours(SKILL), ai: 5 } }, "answers_incomplete"],
    [{ tool: "skill", attemptId, answers: { ...allFours(SKILL), extra: 1 } }, "answers_incomplete"],
    [{ tool: "intelligence", attemptId, answers: allFours(SKILL) }, "answers_incomplete"],
  ];
  for (const [body, error] of cases) {
    assert.deepEqual(parseToolSubmission(body), { ok: false, error }, JSON.stringify(body));
  }
});

test("the wire body round-trips through the parser", () => {
  const submission = { toolSlug: "skill", attemptId, answers: allFours(SKILL) };
  assert.deepEqual(parseToolSubmission(JSON.parse(JSON.stringify(submissionBody(submission)))), {
    ok: true,
    submission,
  });
});

test("latestByTool keeps the newest result per tool", () => {
  const row = (toolSlug, completedAt, summary) => ({
    toolSlug,
    attemptId,
    answers: {},
    completedAt,
    summary,
    scores: {},
    labels: {},
  });
  const latest = latestByTool([
    row("skill", "2026-10-01T00:00:00.000Z", "old"),
    row("skill", "2026-10-05T00:00:00.000Z", "new"),
    row("intelligence", "2026-10-02T00:00:00.000Z", "only"),
    row("skill", "2026-10-03T00:00:00.000Z", "middle"),
  ]);
  assert.equal(latest.skill.summary, "new");
  assert.equal(latest.intelligence.summary, "only");
});

test("owedGates marks each unmarked gate once, at its first stored result", () => {
  const row = (toolSlug, completedAt) => ({ toolSlug, attemptId, answers: {}, completedAt, summary: "", scores: {}, labels: {} });
  const results = [
    row("skill", "2026-10-03T00:00:00.000Z"),
    row("skill", "2026-10-01T00:00:00.000Z"),
    row("intelligence", "2026-10-02T00:00:00.000Z"),
  ];
  assert.deepEqual(owedGates(results, new Set()), [
    { gate: "G-skills", at: "2026-10-01T00:00:00.000Z" },
    { gate: "G-other", at: "2026-10-02T00:00:00.000Z" },
  ]);
  assert.deepEqual(owedGates(results, new Set(["G-skills"])), [{ gate: "G-other", at: "2026-10-02T00:00:00.000Z" }]);
  assert.deepEqual(owedGates(results, new Set(["G-skills", "G-other"])), []);
  assert.deepEqual(owedGates([], new Set()), []);
});

test("gates route refreshes lastAt on a new tool_results row even when the gate is already done", async () => {
  const { readFileSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const route = readFileSync(join(root, "src/app/api/profile/gates/route.ts"), "utf8");
  assert.match(route, /if \(saved\.created\)/);
  assert.match(route, /recordAdultGate\(owner, gate, new Date\(saved\.result\.completedAt\)\)/);
  // Retakes of done gates are invisible to owedGates; the created branch is what moves lastAt.
  const row = (toolSlug, completedAt) => ({ toolSlug, attemptId, answers: {}, completedAt, summary: "", scores: {}, labels: {} });
  assert.deepEqual(owedGates([row("skill", "2026-10-06T12:00:00.000Z")], new Set(["G-skills"])), []);
});
