import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { applyHomeschoolUpdate } from "../src/lib/tenancy/kind.ts";

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../db/0022_tenancy.sql"),
  "utf8",
);

test("migration 0022 adds the two columns and turns homeschool rows into family mode", () => {
  assert.match(sql, /ADD COLUMN IF NOT EXISTS homeschool_mode boolean NOT NULL DEFAULT false/i);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES members\(id\)/i);
  assert.match(sql, /SET kind = 'family'/);
  assert.match(sql, /homeschool_mode = true/);
  assert.match(sql, /WHERE kind = 'homeschool'/);
  assert.doesNotMatch(sql, /CHECK\s*\(/i);
  assert.doesNotMatch(sql, /\bDROP\b/i);
  assert.doesNotMatch(sql, /\bDELETE\b/i);
  assert.doesNotMatch(sql, /drizzle/i);
});

test("running the homeschool update twice changes nothing and leaves no homeschool kind", () => {
  const seeded = [
    { slug: "field-school", kind: "gym", homeschoolMode: false },
    { slug: "household", kind: "homeschool", homeschoolMode: false },
    { slug: "sales", kind: "company", homeschoolMode: false },
    { slug: "already", kind: "family", homeschoolMode: true },
  ];
  const once = applyHomeschoolUpdate(seeded);
  const twice = applyHomeschoolUpdate(once);
  assert.deepEqual(twice, once);
  assert.equal(twice.some((row) => row.kind === "homeschool"), false);
  assert.deepEqual(
    twice.find((row) => row.slug === "household"),
    { slug: "household", kind: "family", homeschoolMode: true },
  );
  assert.deepEqual(
    twice.find((row) => row.slug === "field-school"),
    { slug: "field-school", kind: "gym", homeschoolMode: false },
  );
  assert.equal(twice.find((row) => row.slug === "sales")?.kind, "company");
  const wave = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../db/0004_tenants.sql"), "utf8");
  assert.match(wave, /kind IS DISTINCT FROM 'family'/);
});
