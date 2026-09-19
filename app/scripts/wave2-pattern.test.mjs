import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const DIMS = ["drive", "harmony", "structure", "pace", "abstraction", "challenge", "duty", "expression"];

function parseTable() {
  const md = readFileSync(join(repo, "docs/campus-runtime/fp-50-v1.md"), "utf8");
  const rows = [];
  for (const line of md.split("\n")) {
    const m = line.match(
      /^\| (\d+) \| (.+?) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| (-?\d+) \| ([y ]*) \|$/,
    );
    if (!m) continue;
    const weights = {};
    DIMS.forEach((dim, i) => {
      const n = Number(m[i + 3]);
      if (n) weights[dim] = n;
    });
    rows.push({
      n: Number(m[1]),
      prompt: m[2].trim(),
      weights,
      child: m[11].trim() === "y",
    });
  }
  return rows;
}

function parseItemsTs() {
  return parseTable();
}

function scoreAnswers(items, answers) {
  const raw = Object.fromEntries(DIMS.map((d) => [d, 0]));
  for (const item of items) {
    const a = answers[item.n];
    if (typeof a !== "number") continue;
    const centered = a - 3;
    for (const dim of DIMS) raw[dim] += centered * (item.weights[dim] ?? 0);
  }
  const bearing = {};
  for (const dim of DIMS) {
    const ext = items.reduce((n, item) => n + 2 * Math.abs(item.weights[dim] ?? 0), 0) || 1;
    bearing[dim] = Math.round(Math.min(100, Math.max(0, ((raw[dim] + ext) / (2 * ext)) * 100)) * 10) / 10;
  }
  return bearing;
}

test("fp-50-v1 item bank matches the markdown table", () => {
  const table = parseTable();
  assert.equal(table.length, 50);
  const childCount = table.filter((r) => r.child).length;
  assert.ok(childCount >= 20, `child subset ${childCount}`);
  const loader = readFileSync(join(root, "src/lib/pattern/load-bank.ts"), "utf8");
  const items = readFileSync(join(root, "src/lib/pattern/items.ts"), "utf8");
  assert.match(loader, /docs\/campus-runtime\/fp-50-v1\.md/);
  assert.match(loader, /0003_pattern_weights\.sql/);
  assert.match(loader, /readFileSync/);
  assert.doesNotMatch(items, /I would rather start the work/);
  assert.match(items, /loadPinnedBank/);
  const sql3 = readFileSync(join(repo, "app/db/0003_pattern_weights.sql"), "utf8");
  assert.match(sql3, /weights jsonb/);
});

test("eight Bearing dimensions and template narrative keys", () => {
  const score = readFileSync(join(root, "src/lib/pattern/score.ts"), "utf8");
  for (const dim of DIMS) assert.match(score, new RegExp(dim));
  for (const key of [
    "how_you_learn",
    "how_you_approach",
    "how_you_handle_conflict",
    "how_you_take_feedback",
    "how_you_show_up_in_a_group",
    "working_title",
  ]) {
    assert.match(score, new RegExp(key));
  }
  assert.match(score, /nine_patterns/);
  assert.match(score, /type_codes/);
  assert.match(score, /influence/);
  assert.match(score, /clusters/);
  assert.doesNotMatch(score, /Myers-Briggs|Enneagram Institute|CliftonStrengths|StrengthsFinder|DiSC/);
});

test("a Pattern run maps Likert answers onto Bearing 0-100", () => {
  const items = parseItemsTs();
  const allFive = Object.fromEntries(items.map((item) => [item.n, 5]));
  const allOne = Object.fromEntries(items.map((item) => [item.n, 1]));
  const high = scoreAnswers(items, allFive);
  const low = scoreAnswers(items, allOne);
  for (const dim of DIMS) {
    assert.ok(high[dim] >= 0 && high[dim] <= 100);
    assert.ok(low[dim] >= 0 && low[dim] <= 100);
  }
  assert.ok(high.drive > low.drive);
  assert.ok(high.duty > low.duty);
});

test("pattern API resets Bearing and import only overrides correspondence", () => {
  const run = readFileSync(join(root, "src/app/api/pattern/run/route.ts"), "utf8");
  assert.match(run, /reset: true/);
  const imp = readFileSync(join(root, "src/app/api/pattern/import/route.ts"), "utf8");
  assert.match(imp, /imported: true/);
  assert.match(imp, /Bearing is unchanged/);
  assert.match(imp, /profile_required/);
  const profile = readFileSync(join(root, "src/lib/pattern/profile.ts"), "utf8");
  assert.match(profile, /memberProfileRevisions/);
  assert.match(profile, /pattern_run/);
  assert.match(profile, /ProfileMissingError/);
  assert.match(profile, /requireProfile/);
  const ingest = readFileSync(join(root, "src/app/api/pattern/ingest/route.ts"), "utf8");
  assert.match(ingest, /profile_required/);
});

test("apply script reads pinned 0002-0004 and does not deploy", async () => {
  const { wave2SqlPaths } = await import("./apply-0002-0004.mjs");
  const paths = wave2SqlPaths();
  assert.equal(paths.length, 3);
  assert.match(readFileSync(paths[0], "utf8"), /member_profiles/);
  assert.match(readFileSync(paths[1], "utf8"), /weights jsonb/);
  assert.match(readFileSync(paths[2], "utf8"), /household/);

  const apply = readFileSync(join(root, "scripts/apply-0002-0004.mjs"), "utf8");
  assert.match(apply, /0002_field_pattern\.sql/);
  assert.match(apply, /0003_pattern_weights\.sql/);
  assert.match(apply, /0004_tenants\.sql/);
  assert.doesNotMatch(apply, /deploy\.sh/);
  const helper = readFileSync(join(root, "src/lib/db/apply-wave2-sql.ts"), "utf8");
  assert.match(helper, /pinnedSqlPaths/);
});
