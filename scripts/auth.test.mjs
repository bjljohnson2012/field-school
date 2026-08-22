import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

function isDeanEmail(email) {
  return (email ?? "").trim().toLowerCase() === "bjljohnson2012@gmail.com";
}

function resolveActiveUserId(value, users) {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!id) return null;
  return users.some((u) => u.id === id) ? id : null;
}

function isAdminRoute(pathname) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function adminCookieIsValid(value) {
  return value === "1";
}

function signedOutAdminAccess(cookieValue) {
  return adminCookieIsValid(cookieValue) ? "allow" : "redirect";
}

function sanitizeLocalSignInEmail(email) {
  const mail = (email ?? "").trim();
  if (!mail || isDeanEmail(mail)) return "";
  return mail;
}

function canReuseUserForLocalSignIn(user, email) {
  if (!email) return false;
  if (user.role === "admin") return false;
  if (isDeanEmail(email) || isDeanEmail(user.email)) return false;
  return user.email.trim().toLowerCase() === email.toLowerCase();
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

test("signed-out admin access is blocked without a staff cookie", () => {
  assert.equal(signedOutAdminAccess(undefined), "redirect");
  assert.equal(signedOutAdminAccess(null), "redirect");
  assert.equal(signedOutAdminAccess(""), "redirect");
  assert.equal(signedOutAdminAccess("guest"), "redirect");
  assert.equal(signedOutAdminAccess("1"), "allow");
  assert.equal(isAdminRoute("/admin"), true);
  assert.equal(isAdminRoute("/admin/users"), true);
  assert.equal(isAdminRoute("/admin/notifications"), true);
  assert.equal(isAdminRoute("/c/grok-bot"), false);
  assert.equal(isAdminRoute("/share/field-school"), false);
  assert.equal(isAdminRoute("/login"), false);
});

test("proxy and admin layout redirect guests away from staff HTML", () => {
  const proxy = readSrc("src/proxy.ts");
  assert.match(proxy, /signedOutAdminAccess/);
  assert.match(proxy, /loginRedirectForAdmin/);
  assert.match(proxy, /matcher:\s*\[\s*"\/admin"/);
  assert.match(proxy, /export function proxy/);

  const layout = readSrc("src/app/admin/layout.tsx");
  assert.match(layout, /loginRedirectForAdmin/);
  assert.match(layout, /isStaff/);
  assert.match(layout, /Checking staff access/);
  assert.ok(
    layout.indexOf("if (!ready || !isStaff)") < layout.indexOf("<AdminNav"),
    "AdminNav must not render until a staff session is confirmed",
  );

  const overview = readSrc("src/app/admin/page.tsx");
  assert.match(overview, /if \(!ready \|\| !isStaff\) return null/);
  assert.doesNotMatch(overview, /GoogleSignInButton/);
  assert.doesNotMatch(overview, /signInWithGoogleAccount/);
});

test("Google button no longer creates dean via localStorage alone", () => {
  const login = readSrc("src/app/login/page.tsx");
  assert.doesNotMatch(login, /Continue with Google/);
  assert.doesNotMatch(login, /GoogleSignInButton/);
  assert.doesNotMatch(login, /signInWithGoogleAccount/);
  assert.doesNotMatch(login, /DEAN_EMAIL/);
  assert.match(login, /Continue as guest/);
  assert.match(login, /signInLocal/);
  assert.match(login, /never grants\s+admin/);

  const portal = readSrc("src/lib/portal.ts");
  const fn = portal.slice(portal.indexOf("export function signInWithGoogleAccount"));
  assert.match(fn, /return signInLocal\(/);
  assert.doesNotMatch(
    fn.slice(0, fn.indexOf("export function signOutLocal")),
    /role:\s*dean\s*\?\s*"admin"/,
  );

  const ui = [
    "src/app/login/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/demo/page.tsx",
    "src/app/admin/users/page.tsx",
    "src/app/admin/notifications/page.tsx",
    "src/app/admin/users/[id]/page.tsx",
  ];
  for (const file of ui) {
    assert.doesNotMatch(
      readSrc(file),
      /signInWithGoogleAccount/,
      `${file} must not call the old Google dean shortcut`,
    );
  }
});

test("local name/email sign-in cannot attach the dean seat", () => {
  const dean = {
    id: "user-ben",
    role: "admin",
    email: "bjljohnson2012@gmail.com",
  };
  const jordan = {
    id: "user-jordan",
    role: "student",
    email: "jordan@field.school",
  };

  assert.equal(sanitizeLocalSignInEmail("bjljohnson2012@gmail.com"), "");
  assert.equal(sanitizeLocalSignInEmail("  BJLJohnson2012@gmail.com "), "");
  assert.equal(sanitizeLocalSignInEmail("jordan@field.school"), "jordan@field.school");
  assert.equal(canReuseUserForLocalSignIn(dean, "bjljohnson2012@gmail.com"), false);
  assert.equal(canReuseUserForLocalSignIn(dean, "jordan@field.school"), false);
  assert.equal(canReuseUserForLocalSignIn(jordan, "jordan@field.school"), true);
});
