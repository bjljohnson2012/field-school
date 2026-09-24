import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("1-4 skill card uses Field School primary and skips coach chips", () => {
  const card = read("src/components/skill-card.tsx");
  assert.match(card, /data-meter="1-4"/);
  assert.match(card, /bg-primary/);
  assert.doesNotMatch(card, /bg-brand-orange|#FF6A1A|#0B1F3A/);
  const hundred = card.indexOf("hundred ?");
  const meter = card.indexOf('data-meter="1-4"');
  assert.ok(hundred >= 0 && meter > hundred);
  assert.match(card.slice(hundred, meter), /bg-primary/);
  assert.match(card, /skill\.scale === "0-100" && skill\.source/);
  assert.doesNotMatch(card.slice(meter), /bg-brand-orange|Coach override|Monthly review|director/);
});

test("household person card hides coach hints and keeps the sales tab", () => {
  const page = read("src/app/people/[membershipId]/page.tsx");
  assert.match(page, /cardSkillsForOrg\(subject\.orgSlug\)/);
  assert.match(page, /<SkillCard skills=\{scoreTiles\} \/>/);
  assert.match(page, /skill\.scale === "0-100" \? source : null/);
  assert.match(page, /hints\.length && subject\.orgSlug !== "household"/);
  assert.match(page, /bg-primary/);
  assert.doesNotMatch(page, /bg-brand-navy/);
  assert.match(page, /aria-label="Person"/);
});

test("household routes use page density and leave sales class strings", () => {
  const org = read("src/app/o/[slug]/page.tsx");
  const pattern = read("src/app/pattern/page.tsx");
  const assign = read("src/app/assign/assign-desk.tsx");
  assert.match(org, /mx-auto max-w-6xl px-6 py-8/);
  assert.match(org, /inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm text-primary-foreground/);
  assert.match(org, /mt-10 rounded-xl border border-border bg-card px-5 py-5/);
  assert.match(pattern, /mx-auto max-w-7xl px-6 py-8/);
  assert.match(pattern, /Pattern lives on the person/);
  assert.match(assign, /inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground/);
  assert.match(assign, /mt-8 rounded-xl border border-border bg-card px-4 py-4/);
  assert.match(assign, /Open the sales desk/);
  for (const rel of [
    "src/components/children-database.tsx",
    "src/components/fr-6-supervised-progress.tsx",
    "src/components/fr-kb-1-parent-brain.tsx",
    "src/components/fr-3-parent-intent.tsx",
    "src/components/fr-4-parent-path.tsx",
    "src/components/fr-5-parent-portion.tsx",
  ]) {
    const source = read(rel);
    assert.match(source, /h-page|h-section/);
    assert.match(source, /card /);
    assert.doesNotMatch(source, /bg-brand-orange|#FF6A1A|#0B1F3A/);
  }
  for (const rel of ["src/app/children/page.tsx", "src/app/progress/page.tsx", "src/app/brain/page.tsx", "src/app/intent/page.tsx", "src/app/path/page.tsx", "src/app/portion/page.tsx"]) {
    assert.match(read(rel), /max-w-6xl px-6 py-8/);
  }
});
