import assert from "node:assert/strict";
import test from "node:test";
import {
  leaksKeyMaterial,
  rejectsPriceOrCharge,
  safeProvider,
  toPublicAiState,
} from "./public-state.ts";

const secret = "sk-live-example-key-abcd";

test("GET shape is last4 only and drops key material", () => {
  const state = toPublicAiState({
    org: "sales",
    membershipId: "mem-1",
    mode: "byok",
    units: 12,
    stored: true,
    provider: "xai",
    status: "active",
    last4: secret,
  });
  assert.equal(state.ok, true);
  assert.equal(state.mode, "byok");
  assert.equal(state.key?.last4, "abcd");
  assert.equal(state.key?.last4.length, 4);
  assert.equal(leaksKeyMaterial(state), false);
  assert.equal(JSON.stringify(state).includes(secret), false);
  assert.equal(JSON.stringify(state).includes("wrapped"), false);
});

test("empty org reads as platform credits with no key", () => {
  const state = toPublicAiState({
    org: "household",
    membershipId: "mem-2",
    mode: "platform",
    units: 0,
    stored: false,
  });
  assert.equal(state.mode, "platform");
  assert.equal(state.units, 0);
  assert.equal(state.stored, false);
  assert.equal(state.key, null);
});

test("a pasted key is not accepted as the provider label", () => {
  assert.equal(safeProvider(secret, secret), "");
  assert.equal(safeProvider("openai", secret), "openai");
});

test("price and charge fields are rejected", () => {
  assert.equal(rejectsPriceOrCharge({ mode: "platform" }), false);
  assert.equal(rejectsPriceOrCharge({ price: 100 }), true);
  assert.equal(rejectsPriceOrCharge({ charge: "tok_card" }), true);
  assert.equal(rejectsPriceOrCharge({ sku: "fourth" }), true);
});

test("ciphertext fields count as a leak", () => {
  assert.equal(
    leaksKeyMaterial({
      ok: true,
      key: { last4: "abcd", wrapped_ciphertext: "AAAA" },
    }),
    true,
  );
});
