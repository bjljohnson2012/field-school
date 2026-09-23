import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let target = src + "/" + specifier.slice(2);
    if (!/\\.(ts|tsx|js|mjs|cjs|json)$/.test(target)) target += ".ts";
    return nextResolve(pathToFileURL(target).href, context);
  }
  if (specifier.startsWith(".") && !/\\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const { intercalate, clientQuestion, recommendationsForInsert, synthesisIsStale, SYNTHESIS_ORPHAN_MS } =
  await import(pathToFileURL(join(src, "lib/coaching/intercalate.ts")).href);

const read = (rel) => readFileSync(join(root, rel), "utf8");

function question(id, category, productId = null) {
  return { id, category, productId, text: id, questionType: "LONG_FORM", tags: ["hidden"], options: null };
}

function adjacentSameCategory(items) {
  for (let i = 1; i < items.length; i++) {
    if (items[i].category === items[i - 1].category) return true;
  }
  return false;
}

test("intercalate keeps every question and does not place the same category adjacent", () => {
  const bank = [
    question("d1", "DISCOVERY"),
    question("d2", "DISCOVERY", "kit"),
    question("c1", "CLOSING"),
    question("c2", "CLOSING", "kit"),
    question("m1", "COMMUNICATION"),
    question("m2", "COMMUNICATION", "west"),
    question("r1", "RESILIENCE"),
    question("r2", "RESILIENCE", "west"),
  ];
  assert.deepEqual(intercalate([]), []);
  for (const seed of [0, 0.2, 0.5, 0.999]) {
    const ordered = intercalate(bank, () => seed);
    assert.equal(ordered.length, bank.length);
    assert.deepEqual(ordered.map((row) => row.id).sort(), bank.map((row) => row.id).sort());
    assert.equal(adjacentSameCategory(ordered), false, `seed ${seed}`);
  }
});

test("client payload is id, type, text, and options only", () => {
  const client = clientQuestion({
    id: "q1",
    category: "PERSONALITY",
    tags: ["disc"],
    questionType: "LIKERT",
    text: "How do you decide?",
    options: [{ value: "1", label: "One" }],
  });
  assert.deepEqual(Object.keys(client).sort(), ["id", "options", "text", "type"]);
  assert.equal(client.type, "LIKERT");
  assert.equal("category" in client, false);
  assert.equal("tags" in client, false);
  const start = read("src/app/api/coaching/intake/start/route.ts");
  const response = start.slice(start.lastIndexOf("return NextResponse.json"));
  assert.match(response, /clientQuestion\(/);
  assert.doesNotMatch(response, /category/);
  assert.doesNotMatch(response, /tags/);
});

test("forceCoachRoute overwrites PERSONALITY and LEADERSHIP before insert", () => {
  const rows = recommendationsForInsert([
    { category: "PERSONALITY", routeTo: "learner", route_to: "learner", title: "Type", description: "Coach only" },
    { category: "LEADERSHIP", route_to: "learner", title: "Lead", body: "Coach only" },
    { category: "SALES_SKILL", routeTo: "learner", title: "Drill", body: "For the learner" },
  ]);
  assert.equal(rows[0].routeTo, "coach");
  assert.equal(rows[1].routeTo, "coach");
  assert.equal(rows[2].routeTo, "learner");
  const job = read("src/app/api/coaching/intake/job.ts");
  const prepare = job.indexOf("recommendationsForInsert(");
  const insert = job.indexOf("insert(recommendations)");
  assert.ok(prepare >= 0 && insert > prepare);
  assert.match(read("src/lib/coaching/intercalate.ts"), /forceCoachRoute\(/);
  assert.match(job, /synthesizeProfile\(/);
  assert.match(job, /synthesizeDirectorProfile\(/);
  assert.doesNotMatch(job, /generateRecommendations\(/);
  assert.doesNotMatch(job, /\/api\/events/);
  assert.doesNotMatch(job, /AiJob/);
});

test("start, save, and submit return 403 writes_disabled when coaching writes are off", async () => {
  const { requireCoachingWrite } = await import(pathToFileURL(join(src, "lib/coaching/writes.ts")).href);
  const previous = process.env.COACHING_WRITES;
  delete process.env.COACHING_WRITES;
  try {
    const unset = requireCoachingWrite();
    assert.equal(unset.status, 403);
    assert.deepEqual(await unset.json(), { error: "writes_disabled" });
    process.env.COACHING_WRITES = "0";
    const zero = requireCoachingWrite();
    assert.equal(zero.status, 403);
    assert.deepEqual(await zero.json(), { error: "writes_disabled" });
  } finally {
    if (previous === undefined) delete process.env.COACHING_WRITES;
    else process.env.COACHING_WRITES = previous;
  }

  for (const rel of [
    "src/app/api/coaching/intake/start/route.ts",
    "src/app/api/coaching/intake/save/route.ts",
    "src/app/api/coaching/intake/submit/route.ts",
  ]) {
    const source = read(rel);
    const gate = source.indexOf("const blocked = requireCoachingWrite()");
    const handler = source.indexOf("export async function POST");
    assert.ok(handler >= 0 && gate > handler, rel);
    assert.equal(source.slice(handler, gate).includes("getDb("), false, rel);
    assert.equal(source.slice(handler, gate).includes("await "), false, rel);
    assert.match(source, /if \(blocked\) return blocked/);
  }
});

test("synthesis status is polled from the shell and stale generating work restarts once", () => {
  const shell = read("src/components/app-shell.tsx");
  const bannerAt = shell.indexOf("<SynthesisStatusBanner />");
  const childrenAt = shell.indexOf("{children}");
  assert.ok(bannerAt >= 0 && childrenAt > bannerAt);
  const banner = read("src/components/synthesis-status-banner.tsx");
  assert.match(banner, /\/api\/coaching\/synthesis/);
  assert.match(banner, /2000/);
  assert.match(banner, /generating/);
  assert.match(banner, /failed/);
  const route = read("src/app/api/coaching/synthesis/route.ts");
  assert.match(route, /interval '3 minutes'/);
  assert.match(route, /enqueueIntakeSynthesis\(/);
  assert.doesNotMatch(route, /cron/);
  const now = Date.parse("2026-09-23T12:00:00Z");
  assert.equal(synthesisIsStale("generating", new Date(now - SYNTHESIS_ORPHAN_MS), now), false);
  assert.equal(synthesisIsStale("generating", new Date(now - SYNTHESIS_ORPHAN_MS - 1), now), true);
  assert.equal(synthesisIsStale("failed", new Date(now - SYNTHESIS_ORPHAN_MS - 1), now), false);
  const submit = read("src/app/api/coaching/intake/submit/route.ts");
  assert.match(submit, /enqueueIntakeSynthesis\(/);
  assert.match(read("src/app/api/coaching/intake/job.ts"), /after\(/);
  assert.match(read("src/app/intake/intake-wizard.tsx"), /resumeIndex/);
  assert.match(read("src/components/wizard-step.tsx"), /className="input/);
});
