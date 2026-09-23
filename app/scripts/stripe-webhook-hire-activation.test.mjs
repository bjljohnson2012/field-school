import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { activateLearnWithBenHire } from "../src/lib/billing/hire-activation.ts";

function verifyStripeSignature(input) {
  const { payload, header, secret, nowSec } = input;
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const eq = piece.indexOf("=");
      return [piece.slice(0, eq), piece.slice(eq + 1)];
    }),
  );
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs((nowSec ?? t) - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${payload}`).digest("hex");
  return parts.v1 === expected;
}

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

test("webhook hire activation accepts only locked Learn with Ben amounts", () => {
  const dir = mkdtempSync(join(tmpdir(), "hire-activation-"));
  const dest = join(dir, "hire-activation.json");
  process.env.HIRE_ACTIVATION_PATH = dest;
  try {
    const refused = activateLearnWithBenHire({
      planId: "10",
      stripeSessionId: "cs_test_portal",
      amountTotal: 1000,
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.error, "not_learn_with_ben");
    const mismatch = activateLearnWithBenHire({
      planId: "100",
      stripeSessionId: "cs_test_mismatch",
      amountTotal: 15000,
    });
    assert.equal(mismatch.ok, false);
    assert.equal(mismatch.error, "amount_mismatch");
    for (const [planId, cents] of [
      ["100", 10000],
      ["200", 20000],
      ["1000", 100000],
    ]) {
      const ok = activateLearnWithBenHire({
        planId,
        stripeSessionId: `cs_test_${planId}`,
        amountTotal: cents,
      });
      assert.equal(ok.ok, true);
      if (ok.ok) {
        assert.equal(ok.row.activated, true);
        assert.equal(ok.row.amount_cents, cents);
        assert.equal(ok.row.distribute, false);
        assert.equal(ok.row.launch, "CLOSED 0/8");
      }
    }
  } finally {
    delete process.env.HIRE_ACTIVATION_PATH;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("signed fixture verifies Stripe v1 webhook signature", () => {
  const payload = JSON.stringify({
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_hire100",
        amount_total: 10000,
        metadata: { plan: "100" },
        customer_details: { email: "hire.dryrun@fieldschool.ai" },
      },
    },
  });
  const secret = "whsec_test_hire_activation";
  const t = 1_790_000_000;
  const v1 = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  assert.equal(
    verifyStripeSignature({
      payload,
      header: `t=${t},v1=${v1}`,
      secret,
      nowSec: t,
    }),
    true,
  );
});

test("webhook route and success return stay on locked three plans", () => {
  const webhook = read("src/app/api/stripe/webhook/route.ts");
  const hire = read("src/lib/billing/hire-activation.ts");
  const success = read("src/app/checkout/success/success-client.tsx");
  const status = read("src/app/api/checkout/status/route.ts");
  const page = read("src/app/operator/hire/page.tsx");
  const fulfill = read("src/lib/billing/fulfill.ts");
  const parse = read("src/lib/billing/stripe-webhook.ts");
  const plans = read("src/lib/billing/plans.ts");
  const pkg = JSON.parse(read("package.json"));
  assert.match(webhook, /activateLearnWithBenHire/);
  assert.match(webhook, /fulfillPaidCheckout/);
  assert.match(hire, /HIRE_AMOUNT_CENTS/);
  assert.match(hire, /10000/);
  assert.match(hire, /20000/);
  assert.match(hire, /100000/);
  assert.match(success, /data-hire-activated/);
  assert.match(success, /\/metering/);
  assert.match(status, /hireActivated/);
  assert.match(page, /data-hire-activation="operator"/);
  assert.doesNotMatch(fulfill, /credits|BYOK|customer_api_keys|writeCredits/);
  assert.doesNotMatch(parse, /credits|BYOK|customer_api_keys|writeCredits/);
  assert.doesNotMatch(plans, /credits|BYOK|customer_api_keys/);
  assert.doesNotMatch(hire + page + success, /Gym|Foundry|Retainer|\$150|\$250|\$500/);
  assert.deepEqual(
    Object.keys(pkg.dependencies).filter((name) => name === "remotion" || name.startsWith("@remotion/")).sort(),
    ["@remotion/player", "remotion"],
  );
});

test("master and priors untouched after hire activation", () => {
  assert.equal(existsSync(SOURCE), true);
  assert.equal(sha256(SOURCE), MASTER_SHA);
  assert.equal(sha256(join(root, "public/lessons/LessonSpine.mp4")), MASTER_SHA);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 STATUS cite Stripe webhook hire after PR 192; launch CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  const gate = readRepo("docs/prelaunch/LAUNCH_GATE.md");
  assert.match(wave5, /## Stripe webhook hire activation \(PASS\)/);
  assert.match(wave5, /PR 192 merge `49deeb1`/);
  assert.match(wave5, /\/operator\/hire/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(wave5, /No live Cleaning \/ Publish flip/);
  assert.match(campus, /Stripe webhook hire activation \*\*PASS\*\*/);
  assert.match(campus, /PR 192 merge `49deeb1`/);
  assert.match(campus, /Launch-gate evidence rows \*\*PASS\*\*/);
  assert.match(campus, /AUTH_URL is `https:\/\/portal\.fieldschool\.ai`/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /Distribute HELD/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.equal(
    campus.split("Stripe webhook hire activation **PASS**. PR 192 merge `49deeb1`.").length - 1,
    3,
  );
  assert.match(rail, /\/operator\/hire/);
  assert.match(rail, /hire-activation/);
  assert.match(gate, /Product \| HELD/);
  assert.match(gate, /Hire-path evidence rows/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(gate, /8\/8 PASS|Launch is OPEN|Product \| PASS/i);
});
