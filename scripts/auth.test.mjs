import assert from "node:assert/strict";
import test from "node:test";

function isDeanEmail(email) {
  return (email ?? "").trim().toLowerCase() === "bjljohnson2012@gmail.com";
}

function resolveActiveUserId(value, users) {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!id) return null;
  return users.some((u) => u.id === id) ? id : null;
}

test("null and empty session stay signed out", () => {
  const users = [{ id: "user-ben" }];
  assert.equal(resolveActiveUserId(null, users), null);
  assert.equal(resolveActiveUserId(undefined, users), null);
  assert.equal(resolveActiveUserId("", users), null);
});

test("deleted active user becomes signed out", () => {
  assert.equal(resolveActiveUserId("user-maya", [{ id: "user-ben" }]), null);
});

test("known user stays signed in", () => {
  assert.equal(resolveActiveUserId("user-ben", [{ id: "user-ben" }]), "user-ben");
});

test("dean email matches the Google admin", () => {
  assert.equal(isDeanEmail("bjljohnson2012@gmail.com"), true);
  assert.equal(isDeanEmail("  BJLJohnson2012@gmail.com "), true);
  assert.equal(isDeanEmail("maya@field.school"), false);
});
