import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("deploy applies every pending db sql file through the tracking table", () => {
  const deploy = read("deploy/deploy.sh");
  const runner = read("deploy/apply-migrations.sh");
  const files = readdirSync(join(root, "db"))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  assert.match(deploy, /apply-migrations\.sh/);
  assert.doesNotMatch(deploy, /for f in 0001_wave1\.sql/);
  assert.doesNotMatch(deploy, /2\.24\.64\.248/);
  assert.doesNotMatch(deploy, /bash .*flip-auth-url/);
  assert.doesNotMatch(deploy, /tenancy-backfill|test-rows/);

  assert.match(runner, /schema_migrations/);
  assert.match(runner, /already_applied/);
  assert.match(runner, /ON_ERROR_STOP=1/);
  assert.match(runner, /filename text PRIMARY KEY/);
  assert.doesNotMatch(runner, /0001_wave1\.sql 0002_field_pattern/);

  assert.ok(files.includes("0001_wave1.sql"));
  assert.ok(files.includes("0011_credits_byok.sql"));
  assert.ok(files.includes("0012_plate_renders.sql"));
  assert.ok(files.includes("0022_tenancy.sql"));
  assert.ok(files.includes("0024_m8_offer_tiers.sql"));
  assert.equal(files.at(-1), "0025_m7_progress.sql");
  assert.ok(files.indexOf("0005_coaching.sql") < files.indexOf("0005_composer.sql"));
  assert.ok(files.indexOf("0011_credits_byok.sql") < files.indexOf("0012_plate_renders.sql"));
  assert.ok(files.indexOf("0023_content_model.sql") < files.indexOf("0023_m8_identity_billing.sql"));
  assert.ok(files.indexOf("0024_m8_offer_tiers.sql") < files.indexOf("0025_m7_progress.sql"));
});
