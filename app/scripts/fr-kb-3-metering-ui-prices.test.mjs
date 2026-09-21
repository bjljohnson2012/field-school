import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");
const MASTER_SHA = "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
const SOURCE = "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
const ANALOGY = "/opt/cursor/artifacts/lesson-spine-analogy-encode/2026-09-21/LessonSpine.mp4";
const ANALOGY_SHA = "a556a0b5a2beaec4b0cc44eadcbf6c092cd152a568282ce3eee06564be01af37";
const EVIDENCE = "/opt/cursor/artifacts/lesson-spine-evidence-encode/2026-09-21/LessonSpine.mp4";
const EVIDENCE_SHA = "5d0499f6cbff19149ce0b5da3c615a1ca0ab26fbbece2d9e26da0e78dd367c4b";
const RUBRIC = "/opt/cursor/artifacts/lesson-spine-rubric-encode/2026-09-21/LessonSpine.mp4";
const RUBRIC_SHA = "4aef4c713218247ebb4cad42b637f4b1331a02d6db4fcc13ac13e2bde156a337";
const THRESHOLD = "/opt/cursor/artifacts/lesson-spine-threshold-encode/2026-09-21/LessonSpine.mp4";
const THRESHOLD_SHA = "955f0256424fdc4ddb5ae5506a04a9ea877cb6a79ccb126ba1bb4884b9943a6f";
const SPECTRUM = "/opt/cursor/artifacts/lesson-spine-spectrum-encode/2026-09-21/LessonSpine.mp4";
const SPECTRUM_SHA = "496f506babd11a6e5247e87c3bbf926117b0de31feae5b6573fa891bdf6c68d0";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("FR-KB-3 metering UI shows locked Learn with Ben prices only", () => {
  const page = read("src/app/metering/page.tsx");
  const ui = read("src/components/fr-kb-3-metering.tsx");
  const display = read("src/lib/credits/metering-display.ts");
  const hire = read("src/components/lesson-spine-hire-path.tsx");
  const plans = read("src/lib/billing/plans.ts");
  const store = read("src/lib/credits/store.ts");
  const rules = read("src/lib/credits/rules.ts");
  const home = read("src/components/family-v1-home.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(page, /FrKb3Metering/);
  assert.match(ui, /data-metering="fr-kb-3"/);
  assert.match(ui, /data-price-source="learn-with-ben-market-research"/);
  assert.match(ui, /data-metering-model=\{model\.id\}/);
  assert.match(ui, /\/login\?next=\/metering/);
  assert.match(ui, /\/api\/credits/);
  assert.match(display, /METERING_PRICE_SOURCE/);
  assert.match(display, /\$100 \/ \$200 \/ \$1,000/);
  assert.match(display, /LEARN_WITH_BEN_PLAN_IDS/);
  assert.match(display, /market-research/);
  assert.match(hire, /\/metering/);
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.match(plans, /priceLabel: "\$100"/);
  assert.match(plans, /priceLabel: "\$200"/);
  assert.match(plans, /priceLabel: "\$1,000"/);
  assert.doesNotMatch(plans, /credits|BYOK|customer_api_keys/);
  assert.match(store, /amounts_wait_revenue/);
  assert.match(store, /byok_monthly_only/);
  assert.doesNotMatch(rules, /\$\d|priceLabel|buy\.stripe/);
  assert.doesNotMatch(home, /\/api\/credits|\/api\/keys|\/metering/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
  assert.doesNotMatch(page + ui + display, /Gym|Foundry|Retainer|\$150|\$250|\$500/);
});

test("master and priors untouched after FR-KB-3 metering UI", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite FR-KB-3 metering after PR 189; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  assert.match(wave5, /## FR-KB-3 metering UI \(PASS\)/);
  assert.match(wave5, /PR 189 merge `90df7d4`/);
  assert.match(wave5, /\/metering/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /FR-KB-3 metering UI \*\*PASS\*\*/);
  assert.match(campus, /PR 189 merge `90df7d4`/);
  assert.match(campus, /Stripe live Learn with Ben \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(rail, /\/metering/);
  assert.match(rail, /market-research/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
});
