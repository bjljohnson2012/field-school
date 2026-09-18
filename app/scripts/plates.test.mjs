import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

const COMPOSITION_IDS = [
  "Opener",
  "RecapCard",
  "DefinitionBoard",
  "QuizBumper",
  "TalkingHeadCard",
];

test("campus has no plate UI, APIs, or 0006", () => {
  assert.equal(existsSync(join(root, "src/components/plate-rail.tsx")), false);
  assert.equal(existsSync(join(root, "src/app/o/[slug]/teach/plates/page.tsx")), false);
  assert.equal(existsSync(join(root, "src/app/api/plates")), false);
  assert.equal(existsSync(join(root, "db/0006_plates.sql")), false);
  const welcome = read("src/app/o/[slug]/welcome/page.tsx");
  const orgHome = read("src/app/o/[slug]/page.tsx");
  assert.doesNotMatch(welcome, /PlateRail|teach\/plates/);
  assert.doesNotMatch(orgHome, /Approve plates|teach\/plates/);
  const appSrc = walk(join(root, "src")).join("\n");
  assert.doesNotMatch(appSrc, /student-facing AI builder|video builder/i);
});

test("operator plates register only the five compositions", () => {
  const rootTsx = readRepo("plates/src/Root.tsx");
  const tokens = readRepo("plates/src/brand/tokens.ts");
  for (const id of COMPOSITION_IDS) {
    assert.match(rootTsx, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(rootTsx, /id="MyComp"/);
  assert.match(tokens, /WIDTH = 1920/);
  assert.match(tokens, /HEIGHT = 1080/);
  assert.match(tokens, /FPS = 30/);
  assert.match(readRepo("plates/AGENTS.md"), /Operator-only/);
});

test("plates are cream/ink with the Field School mark, not a generic card", () => {
  const layers = readRepo("plates/src/components/layers.tsx");
  const tokens = readRepo("plates/src/brand/tokens.ts");
  assert.match(tokens, /paper: "#EFE7D6"/);
  assert.match(tokens, /ink: "#1A1A16"/);
  assert.match(layers, /lockup-wide-black\.svg/);
  assert.match(layers, /alt="Field School"/);
  assert.doesNotMatch(layers, /borderRadius: 28|boxShadow/);
  assert.equal(existsSync(join(repo, "plates/public/brand/lockup-wide-black.svg")), true);
  assert.equal(existsSync(join(repo, "plates/public/brand/mark-black.svg")), true);
});

test("talking head is docked; Just and melt lock stay on the operator CLI", () => {
  assert.match(readRepo("plates/src/brand/tokens.ts"), /DOCK_PCT = 0.38/);
  assert.match(readRepo("plates/src/compositions/TalkingHeadCard.tsx"), /Docked, not full-bleed/);
  const lock = readRepo("plates/scripts/melt-lock.mjs");
  assert.match(lock, /27pn9xs0zk8a73g/);
  assert.match(lock, /MIN_MEM_MIB = 3072/);
  assert.match(lock, /CPU_CONCURRENCY = 2/);
});

test("fp-50-v1 remains the only Pattern bank; guest events stay gated", () => {
  assert.equal(existsSync(join(root, "src/lib/pattern/load-bank.ts")), true);
  const items = read("src/lib/pattern/items.ts");
  assert.match(items, /fp-50-v1/);
  assert.match(items, /loadPinnedBank/);
  assert.doesNotMatch(items, /export const FP50_ITEMS/);
  assert.doesNotMatch(items, /Myers-Briggs|CliftonStrengths|Enneagram Institute|Everything DiSC/);
  assert.match(read("src/app/api/events/route.ts"), /guest: result.status === 401/);
  assert.match(read("src/lib/campus-runtime/identity.ts"), /sign_in_required/);
});
