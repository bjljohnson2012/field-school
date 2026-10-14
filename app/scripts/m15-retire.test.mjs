import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import { evaluateDryRun, formatDryRun, runDryRun } from "./m15-retire-dry-run.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "../db/0033_m15_retire.sql"), "utf8");
const counts = JSON.parse(readFileSync(join(here, "m15-retire-counts.json"), "utf8"));

const LOCKED = {
  living_brains: 1,
  living_profiles: 0,
  organizations_kind_homeschool: 0,
};

function applyKind(rows) {
  return rows.map((row) => {
    const folded = row.kind.trim().toLowerCase();
    if (folded !== "homeschool") return row;
    if (row.kind === "family" && row.homeschoolMode === true) return row;
    return { ...row, kind: "family", homeschoolMode: true };
  });
}

test("0033 retires homeschool kind and drops only the living-brain tables", () => {
  assert.match(sql, /UPDATE organizations/);
  assert.match(sql, /SET kind = 'family'/);
  assert.match(sql, /homeschool_mode = true/);
  assert.match(sql, /lower\(trim\(kind\)\) = 'homeschool'/);
  assert.match(sql, /DROP TABLE IF EXISTS living_profiles;/);
  assert.match(sql, /DROP TABLE IF EXISTS living_brains;/);
  assert.equal(sql.match(/DROP TABLE/g).length, 2);
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+organizations/i);
  assert.doesNotMatch(sql, /DROP TABLE[^;\n]*(growth_units|knowledge_brains|brain_sources|brain_notes|brain_artifacts)/);
  assert.doesNotMatch(sql, /DROP TABLE(?! IF EXISTS)/);

  const rows = [
    { slug: "field-school", kind: "gym", homeschoolMode: false },
    { slug: "household", kind: "homeschool", homeschoolMode: false },
    { slug: "sales", kind: "company", homeschoolMode: false },
    { slug: "already", kind: "family", homeschoolMode: true },
    { slug: "plain-family", kind: "family", homeschoolMode: false },
    { slug: "mixed", kind: "HomeSchool", homeschoolMode: false },
  ];
  const once = applyKind(rows);
  const twice = applyKind(once);
  assert.deepEqual(twice, once);
  assert.equal(once.length, rows.length);
  assert.equal(once.some((row) => row.kind.trim().toLowerCase() === "homeschool"), false);
  assert.deepEqual(
    once.find((row) => row.slug === "household"),
    { slug: "household", kind: "family", homeschoolMode: true },
  );
  assert.deepEqual(
    once.find((row) => row.slug === "mixed"),
    { slug: "mixed", kind: "family", homeschoolMode: true },
  );
  assert.equal(once.find((row) => row.slug === "field-school").kind, "gym");
  assert.equal(once.find((row) => row.slug === "sales").kind, "company");
  assert.equal(once.find((row) => row.slug === "plain-family").homeschoolMode, false);
});

test("campus readers do not query the retired tables", () => {
  const schema = readFileSync(join(here, "../src/lib/db/schema.ts"), "utf8");
  const living = readFileSync(join(here, "../src/lib/living-brain/store.ts"), "utf8");
  const evolution = readFileSync(join(here, "../src/lib/evolution/store.ts"), "utf8");
  for (const source of [schema, living, evolution]) {
    assert.doesNotMatch(source, /living_brains|living_profiles|livingBrains|livingProfiles/);
  }
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
});

test("the locked dry-run config is 1 / 0 / 0 and context is not a gate", () => {
  assert.deepEqual(
    {
      living_brains: counts.living_brains,
      living_profiles: counts.living_profiles,
      organizations_kind_homeschool: counts.organizations_kind_homeschool,
    },
    LOCKED,
  );
  assert.deepEqual(counts.organizations_by_kind, { company: 1, family: 2, gym: 1 });

  const match = evaluateDryRun({ expected: counts, live: LOCKED });
  assert.equal(match.exitCode, 0);
  assert.equal(match.write, false);
  assert.match(formatDryRun(match), /expected living_brains 1/);
  assert.match(formatDryRun(match), /live living_profiles 0/);
  assert.match(formatDryRun(match), /context gym 1/);

  const differ = evaluateDryRun({
    expected: counts,
    live: { ...LOCKED, living_brains: 2 },
  });
  assert.equal(differ.exitCode, 1);
  assert.equal(differ.write, false);
  assert.equal(differ.reason, "live_counts_differ");

  const contextOnly = evaluateDryRun({
    expected: { ...counts, organizations_by_kind: { company: 9, family: 9, gym: 9 } },
    live: LOCKED,
  });
  assert.equal(contextOnly.exitCode, 0);
  assert.equal(contextOnly.write, false);

  const absent = evaluateDryRun({ expected: null, live: LOCKED });
  assert.equal(absent.exitCode, 1);
  assert.equal(absent.write, false);
  assert.equal(absent.reason, "expected_counts_absent");
  const empty = evaluateDryRun({ expected: {}, live: LOCKED });
  assert.equal(empty.reason, "expected_counts_absent");
});

test("the dry-run command writes nothing and exits non-zero when live counts differ", () => {
  const script = join(here, "m15-retire-dry-run.mjs");
  const source = readFileSync(script, "utf8");
  assert.doesNotMatch(source, /\b(INSERT|UPDATE|DELETE|DROP)\b/);

  const differ = spawnSync(process.execPath, [script], {
    cwd: join(here, ".."),
    env: {
      ...process.env,
      M15_DRY_RUN_FIXTURE: "1",
      M15_LIVE_COUNTS: JSON.stringify({ ...LOCKED, living_profiles: 4 }),
      DATABASE_URL: "",
    },
    encoding: "utf8",
  });
  assert.equal(differ.status, 1);
  assert.match(differ.stdout, /write 0/);
  assert.match(differ.stdout, /expected living_brains 1/);
  assert.match(differ.stdout, /live living_profiles 4/);
  assert.match(differ.stdout, /live_counts_differ/);
  assert.equal(differ.stdout.includes("DATABASE_URL"), false);

  const match = spawnSync(process.execPath, [script], {
    cwd: join(here, ".."),
    env: {
      ...process.env,
      M15_DRY_RUN_FIXTURE: "1",
      M15_LIVE_COUNTS: JSON.stringify(LOCKED),
      DATABASE_URL: "",
    },
    encoding: "utf8",
  });
  assert.equal(match.status, 0);
  assert.match(match.stdout, /write 0/);
  assert.match(match.stdout, /expected organizations_kind_homeschool 0/);
  assert.match(match.stdout, /context company 1/);
  assert.match(match.stdout, /context family 2/);

  const missing = spawnSync(process.execPath, [script], {
    cwd: join(here, ".."),
    env: {
      ...process.env,
      M15_COUNTS_FILE: join(here, "missing-m15-counts.json"),
      M15_DRY_RUN_FIXTURE: "1",
      DATABASE_URL: "",
    },
    encoding: "utf8",
  });
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /write 0/);
  assert.match(missing.stdout, /expected_counts_absent/);
});

test("runDryRun reads the committed config and still writes nothing", async () => {
  const result = await runDryRun({ live: LOCKED });
  assert.equal(result.exitCode, 0);
  assert.equal(result.write, false);
  assert.deepEqual(result.expected, LOCKED);
});
