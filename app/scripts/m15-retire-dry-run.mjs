/**
 * M15 dry-run. Prints the locked expected counts and the live counts.
 * Exits non-zero and writes nothing when the expected config is absent
 * or the live gate counts differ. Never applies SQL.
 *
 * Gate: living_brains, living_profiles, organizations_kind_homeschool.
 * organizations_by_kind is context and is not a gate.
 *
 * Campus: DATABASE_URL, read-only counts.
 * Tests: M15_DRY_RUN_FIXTURE=1 and M15_LIVE_COUNTS as JSON. That path does not connect.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const GATE_KEYS = ["living_brains", "living_profiles", "organizations_kind_homeschool"];

const DEFAULT_CONFIG = join(dirname(fileURLToPath(import.meta.url)), "m15-retire-counts.json");

function isCount(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function evaluateDryRun({ expected, live }) {
  if (!expected || typeof expected !== "object" || Array.isArray(expected)) {
    return { ok: false, exitCode: 1, write: false, reason: "expected_counts_absent" };
  }
  for (const key of GATE_KEYS) {
    if (!isCount(expected[key])) {
      return { ok: false, exitCode: 1, write: false, reason: "expected_counts_absent" };
    }
  }
  if (!live || typeof live !== "object" || Array.isArray(live)) {
    return {
      ok: false,
      exitCode: 1,
      write: false,
      reason: "live_counts_absent",
      expected: pick(expected),
      context: expected.organizations_by_kind ?? null,
    };
  }
  const diffs = GATE_KEYS.filter((key) => !isCount(live[key]) || live[key] !== expected[key]);
  const body = {
    write: false,
    expected: pick(expected),
    live: pick(live),
    context: expected.organizations_by_kind ?? null,
  };
  if (diffs.length > 0) {
    return { ok: false, exitCode: 1, reason: "live_counts_differ", diffs, ...body };
  }
  return { ok: true, exitCode: 0, reason: "match", ...body };
}

function pick(source) {
  return {
    living_brains: source.living_brains,
    living_profiles: source.living_profiles,
    organizations_kind_homeschool: source.organizations_kind_homeschool,
  };
}

export function formatDryRun(result) {
  const lines = ["mode dry-run", "write 0"];
  if (result.expected) {
    for (const key of GATE_KEYS) lines.push(`expected ${key} ${result.expected[key]}`);
  }
  if (result.live) {
    for (const key of GATE_KEYS) lines.push(`live ${key} ${result.live[key]}`);
  }
  const context = result.context;
  if (context && typeof context === "object") {
    for (const key of ["company", "family", "gym"]) {
      if (isCount(context[key])) lines.push(`context ${key} ${context[key]}`);
    }
  }
  lines.push(result.reason);
  return lines.join("\n");
}

async function readLiveCounts() {
  if (process.env.M15_DRY_RUN_FIXTURE === "1") {
    if (!process.env.M15_LIVE_COUNTS) return null;
    return JSON.parse(process.env.M15_LIVE_COUNTS);
  }
  if (!process.env.DATABASE_URL) return null;
  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
  try {
    const [row] = await sql`
      SELECT
        (SELECT count(*)::int FROM living_brains) AS living_brains,
        (SELECT count(*)::int FROM living_profiles) AS living_profiles,
        (SELECT count(*)::int FROM organizations WHERE lower(trim(kind)) = 'homeschool') AS organizations_kind_homeschool
    `;
    return {
      living_brains: row.living_brains,
      living_profiles: row.living_profiles,
      organizations_kind_homeschool: row.organizations_kind_homeschool,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function runDryRun({ configPath = DEFAULT_CONFIG, live: liveOverride } = {}) {
  if (!existsSync(configPath)) {
    return { ok: false, exitCode: 1, write: false, reason: "expected_counts_absent" };
  }
  let expected;
  try {
    expected = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    return { ok: false, exitCode: 1, write: false, reason: "expected_counts_absent" };
  }
  if (liveOverride !== undefined) return evaluateDryRun({ expected, live: liveOverride });
  let live;
  try {
    live = await readLiveCounts();
  } catch {
    return evaluateDryRun({ expected, live: null });
  }
  return evaluateDryRun({ expected, live });
}

async function main() {
  const configPath = process.env.M15_COUNTS_FILE || DEFAULT_CONFIG;
  const result = await runDryRun({ configPath });
  process.stdout.write(`${formatDryRun(result)}\n`);
  process.exit(result.exitCode);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main();
}
