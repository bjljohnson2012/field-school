import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const call = /loadSubjectIdentity\(\s*[A-Za-z0-9_.]+\s*\)/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

test("every loadSubjectIdentity caller passes the active org", () => {
  const misses = [];
  for (const path of walk(join(root, "src"))) {
    const text = readFileSync(path, "utf8");
    const found = text.match(call);
    if (found) misses.push(`${path.slice(root.length + 1)} ${found.join(" ")}`);
  }
  assert.deepEqual(misses, []);
  const scores = readFileSync(join(root, "src/lib/coaching/scores.ts"), "utf8");
  assert.match(scores, /export async function loadSubjectIdentity\(\s*membershipId: string,\s*orgId: string,/);
  assert.doesNotMatch(scores, /orgId\?:/);
});
