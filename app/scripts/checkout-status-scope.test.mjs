import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const status = readFileSync(join(root, "src/app/api/checkout/status/route.ts"), "utf8");

test("checkout status checks the caller before it answers", () => {
  assert.match(status, /identityFromRequest/);
  assert.match(status, /decideCheckoutStatus/);
  assert.match(status, /stripe_test_mode_only/);
  assert.match(status, /findPurchaseBySession/);
  assert.match(status, /hireActivated/);
  assert.doesNotMatch(status, /sk_live_/);
});
