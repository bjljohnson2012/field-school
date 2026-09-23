import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\\.(ts|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const client = await import(pathToFileURL(join(root, "src/lib/ai/client.ts")).href);
const prompts = await import(pathToFileURL(join(root, "src/lib/ai/prompts/index.ts")).href);

const CUTOVER = [
  "synthesizeProfile",
  "synthesizeDirectorProfile",
  "generateCoachingPlan",
  "generateOneOnOnePrep",
  "crossReferencePrepDoc",
  "generateCoachingHints",
  "generatePersonalityComparison",
  "generateQuestions",
  "enhanceMcOption",
  "generateSmartBulkQuestions",
  "articleFromUrl",
  "extractArticleMetadata",
  "cleanupArticleWithInstructions",
  "classifyFile",
  "generateRecommendations",
  "summarizeMonthlyReview",
  "generateTasksForAe",
  "generateTaskDescription",
  "generateCompareNarrative",
  "synthesizeProductBrief",
  "generateWeeklyBrief",
  "selectQuizQuestions",
  "askGrok",
  "generateDrillPrompt",
  "gradeDrillResponse",
];

const DROPPED = ["suggestBrandPalettes", "analyzeWebsite", "RecheckCadence"];

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function sourceTree() {
  const dir = join(root, "src/lib/ai");
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".ts")) files.push(path);
    }
  };
  walk(dir);
  files.push(join(root, "src/lib/pattern/stt.ts"));
  return files.map((path) => readFileSync(path, "utf8")).join("\n");
}

test("cutover prompt functions and the one client are exported", () => {
  for (const name of CUTOVER) {
    assert.equal(typeof prompts[name], "function", name);
  }
  assert.equal(typeof client.transcribe, "function");
  assert.equal(typeof client.forceCoachRoute, "function");
  assert.equal(typeof client.resolveApiKey, "function");
  assert.equal(typeof client.resolveSynthModel, "function");
  assert.equal(typeof client.askGrok, "function");
  assert.equal(client.transcribe.length, 3);
});

test("api key prefers trimmed GROK_API_KEY, then XAI_API_KEY", () => {
  assert.equal(
    client.resolveApiKey({ GROK_API_KEY: "  grok-key  ", XAI_API_KEY: "xai-key" }),
    "grok-key",
  );
  assert.equal(client.resolveApiKey({ GROK_API_KEY: "   ", XAI_API_KEY: " xai-key " }), "xai-key");
  assert.equal(client.resolveApiKey({ GROK_API_KEY: "", XAI_API_KEY: "" }), undefined);
  assert.equal(client.resolveBaseUrl({}), "https://api.x.ai/v1");
  assert.equal(client.resolveBaseUrl({ GROK_BASE_URL: "https://example.test/v1/" }), "https://example.test/v1");
  assert.equal(client.resolveSttModel({}), "grok-stt");
  assert.equal(client.resolveSttModel({ XAI_STT_MODEL: " custom-stt " }), "custom-stt");
});

test("model defaults are the post-rename tiers", () => {
  assert.equal(client.MODEL_FAST, "grok-4.20-non-reasoning");
  assert.equal(client.MODEL_DEFAULT, "grok-4.3");
  assert.notEqual(client.MODEL_FAST, "grok-4-fast-reasoning");
  assert.notEqual(client.MODEL_DEFAULT, "grok-4-fast-reasoning");
  assert.equal(client.resolveModelFast({}), "grok-4.20-non-reasoning");
  assert.equal(client.resolveModelDefault({}), "grok-4.3");
  assert.equal(client.resolveSynthModel(null, {}), "grok-4.3");
  assert.equal(client.resolveSynthModel("   ", { GROK_MODEL: " grok-env " }), "grok-env");
  assert.equal(client.resolveSynthModel("  features-model  ", { GROK_MODEL: "grok-env" }), "features-model");
  assert.equal(client.resolveModelFast({ GROK_MODEL_FAST: " fast-tier " }), "fast-tier");
});

test("transcribe shape tries /stt then /audio/transcriptions and stt.ts only delegates", () => {
  const shape = client.transcribe.toString();
  const primary = shape.indexOf('"/stt"');
  const fallback = shape.indexOf('"/audio/transcriptions"');
  assert.ok(primary >= 0, "primary /stt path");
  assert.ok(fallback > primary, "fallback transcriptions path");
  assert.match(shape, /stt_unavailable/);
  assert.match(shape, /stt_failed/);
  assert.match(shape, /stt_empty/);

  const stt = read("src/lib/pattern/stt.ts");
  assert.match(stt, /transcribe\(/);
  assert.doesNotMatch(stt, /fetch\s*\(/);
  assert.doesNotMatch(stt, /api\.x\.ai/);
  assert.doesNotMatch(stt, /XAI_API_KEY|GROK_API_KEY|new OpenAI/);
});

test("PERSONALITY and LEADERSHIP overwrite route_to to coach", () => {
  const personality = client.forceCoachRoute({
    category: "PERSONALITY",
    routeTo: "learner",
    route_to: "learner",
    title: "keep",
  });
  assert.equal(personality.route_to, "coach");
  assert.equal(personality.routeTo, "coach");
  assert.equal(personality.title, "keep");

  const leadership = client.forceCoachRoute({ category: " leadership ", routeTo: "AE" });
  assert.equal(leadership.route_to, "coach");
  assert.equal(leadership.routeTo, "coach");

  const sales = client.forceCoachRoute({ category: "SALES_SKILL", routeTo: "learner" });
  assert.equal(sales.routeTo, "learner");
  assert.equal(sales.route_to, undefined);
  assert.equal(sales, client.forceCoachRoute(sales));
});

test("synthesis prompts keep JSON examples and improve-drill prompts stay", () => {
  assert.match(prompts.SYNTHESIS_SYSTEM_PROMPT, /"personalitySummary"/);
  assert.match(prompts.SYNTHESIS_SYSTEM_PROMPT, /"salesStyleSummary"/);
  assert.match(prompts.SYNTHESIS_SYSTEM_PROMPT, /"skillScores"/);
  assert.match(prompts.SYNTHESIS_SYSTEM_PROMPT, /"DISCOVERY"/);
  assert.match(prompts.DIRECTOR_SYSTEM_PROMPT, /"leadershipSummary"/);
  assert.match(prompts.DIRECTOR_SYSTEM_PROMPT, /"forecastingSummary"/);
  assert.match(prompts.DIRECTOR_SYSTEM_PROMPT, /"skillScores"/);
  assert.match(prompts.DIRECTOR_SYSTEM_PROMPT, /"LEADERSHIP"/);
  assert.match(prompts.DRILL_PROMPT_AE, /"expectedBehaviors"/);
  assert.match(prompts.DRILL_PROMPT_LEADER, /"trapBehaviors"/);
  assert.match(prompts.GRADER_PROMPT, /"score"/);
});

test("info logs omit psychographic answer bodies", () => {
  const lines = [];
  const original = console.info;
  console.info = (line) => {
    lines.push(String(line));
  };
  try {
    client.logAiJob({
      jobId: "job-1",
      orgId: "org-1",
      model: "grok-4.3",
      latencyMs: 12,
      status: "ok",
      usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 },
      answers: "PSYCH_ANSWER_SENTINEL",
      body: "narrative body",
    });
  } finally {
    console.info = original;
  }
  assert.equal(lines.length, 1);
  const logged = JSON.parse(lines[0]);
  assert.equal(logged.event, "coaching.ai.job");
  assert.equal(logged.jobId, "job-1");
  assert.equal(logged.orgId, "org-1");
  assert.equal(logged.model, "grok-4.3");
  assert.equal(logged.latencyMs, 12);
  assert.equal(logged.status, "ok");
  assert.equal(logged.usage.totalTokens, 7);
  assert.equal(JSON.stringify(logged).includes("PSYCH_ANSWER_SENTINEL"), false);
  assert.equal(JSON.stringify(logged).includes("narrative body"), false);
});

test("brand, website analyze, and recheck cadence are absent", () => {
  const blob = sourceTree();
  for (const name of DROPPED) {
    assert.equal(blob.includes(name), false, name);
    assert.equal(name in client, false, name);
    assert.equal(name in prompts, false, name);
  }
  assert.doesNotMatch(blob, /sk-[A-Za-z0-9]{8,}/);
  assert.doesNotMatch(blob, /xai-[A-Za-z0-9]{8,}/);
  assert.doesNotMatch(blob, /drizzle-orm|\.insert\(/);
});
