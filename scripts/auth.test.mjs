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
  assert.equal(isAdminRoute("/privacy"), false);
  assert.equal(isAdminRoute("/terms"), false);
});

test("privacy and terms pages are public, real policies linked from chrome", () => {
  const privacy = readSrc("src/app/privacy/page.tsx");
  const terms = readSrc("src/app/terms/page.tsx");
  const footer = readSrc("src/components/site-footer.tsx");
  const proxy = readSrc("src/proxy.ts");

  assert.match(privacy, /title:\s*"Privacy Policy"/);
  assert.match(privacy, /LAST_UPDATED = "2026-08-22"/);
  assert.match(privacy, /Last updated \{LAST_UPDATED\}/);
  assert.match(privacy, /do not sell personal data/i);
  assert.match(privacy, /localStorage/);
  assert.match(privacy, /under 13/);
  assert.match(privacy, /DEAN_EMAIL/);
  assert.match(privacy, /COMPANY_NAME/);
  assert.match(privacy, /UNI_NAME/);
  assert.match(privacy, /staff[\s\S]+allowlist/);
  assert.doesNotMatch(privacy, /lorem ipsum/i);

  assert.match(terms, /title:\s*"Terms of Service"/);
  assert.match(terms, /LAST_UPDATED = "2026-08-22"/);
  assert.match(terms, /Last updated \{LAST_UPDATED\}/);
  assert.match(terms, /Educational and demo nature/);
  assert.match(terms, /staff allowlist/);
  assert.match(terms, /Disclaimer of warranties/);
  assert.match(terms, /Limitation of liability/);
  assert.match(terms, /Ohio/);
  assert.match(terms, /DEAN_EMAIL/);
  assert.doesNotMatch(terms, /lorem ipsum/i);

  assert.match(footer, /href="\/privacy"/);
  assert.match(footer, /href="\/terms"/);
  assert.match(footer, /href="\/about"/);

  assert.match(proxy, /matcher:\s*\[\s*"\/admin"/);
  assert.doesNotMatch(proxy, /\/privacy/);
  assert.doesNotMatch(proxy, /\/terms/);
});

test("proxy and admin layout redirect guests away from staff HTML", () => {
  const proxy = readSrc("src/proxy.ts");
  assert.match(proxy, /signedOutAdminAccess/);
  assert.match(proxy, /loginRedirectForAdmin/);
  assert.match(proxy, /authIsConfigured/);
  assert.match(proxy, /matcher:\s*\[\s*"\/admin"/);
  assert.match(proxy, /export async function proxy/);

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

test("OAuth scaffolding exists but fake localStorage dean shortcut does not", () => {
  const login = readSrc("src/app/login/login-form.tsx");
  assert.match(login, /OAuthSignInButtons/);
  assert.match(login, /Continue as guest/);
  assert.match(login, /signInLocal/);
  assert.match(login, /never grants admin/);
  assert.doesNotMatch(login, /GoogleSignInButton/);
  assert.doesNotMatch(login, /signInWithGoogleAccount/);
  assert.doesNotMatch(login, /DEAN_EMAIL/);

  const portal = readSrc("src/lib/portal.ts");
  assert.doesNotMatch(portal, /export function signInWithGoogleAccount/);

  const bridge = readSrc("src/lib/auth/portal-bridge.ts");
  assert.match(bridge, /activateStaffFromOAuth/);
  assert.match(bridge, /isStaffEmail/);
  assert.doesNotMatch(bridge, /signInWithGoogleAccount/);

  const ui = [
    "src/app/login/login-form.tsx",
    "src/app/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/demo/page.tsx",
    "src/app/admin/users/page.tsx",
    "src/app/admin/notifications/page.tsx",
    "src/app/admin/users/[id]/page.tsx",
  ];
  for (const file of ui) {
    const src = readSrc(file);
    assert.doesNotMatch(
      src,
      /signInWithGoogleAccount/,
      `${file} must not call the old Google dean shortcut`,
    );
    assert.doesNotMatch(src, /GoogleSignInButton/);
  }

  const home = readSrc("src/app/page.tsx");
  assert.match(home, /Continue as guest/);
  const gateIdx = home.indexOf("ready && isStaff");
  const adminIdx = home.indexOf('href="/admin"');
  assert.ok(gateIdx >= 0 && adminIdx > gateIdx, "home Admin CTA is staff-only");
});

test("Auth.js wiring is present and env-gated", () => {
  assert.ok(readSrc("AUTH.md").includes("GOOGLE_CLIENT_ID"));
  assert.ok(readSrc("AUTH.md").includes("AUTH_SECRET"));
  assert.match(readSrc("src/auth.ts"), /NextAuth/);
  assert.match(readSrc("src/lib/auth/env.ts"), /authIsConfigured/);
  assert.match(readSrc("src/lib/auth/config.ts"), /buildAuthConfig/);
  assert.match(readSrc("src/components/oauth-sign-in-buttons.tsx"), /oauth\.configured/);

  const oauthButtons = readSrc("src/components/oauth-sign-in-buttons.tsx");
  assert.match(oauthButtons, /signIn\("google"/);
  assert.match(oauthButtons, /signIn\("twitter"/);
  assert.match(oauthButtons, /not configured on this campus yet/);
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
