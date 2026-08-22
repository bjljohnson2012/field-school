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
  assert.match(footer, /href="\/pricing"/);
  assert.match(footer, /href="\/signup"/);

  assert.match(proxy, /matcher:\s*\[\s*"\/admin"/);
  assert.doesNotMatch(proxy, /\/privacy/);
  assert.doesNotMatch(proxy, /\/terms/);
  assert.doesNotMatch(proxy, /\/pricing/);
  assert.doesNotMatch(proxy, /\/signup/);
});

test("proxy and admin layout redirect guests away from staff HTML", () => {
  const proxy = readSrc("src/proxy.ts");
  assert.match(proxy, /signedOutAdminAccess/);
  assert.match(proxy, /loginRedirectForAdmin/);
  assert.match(proxy, /authIsConfigured/);
  assert.match(proxy, /isStaffSession/);
  assert.match(proxy, /request-access/);
  assert.match(proxy, /edgeAuth/);
  assert.match(proxy, /matcher:\s*\[\s*"\/admin"/);
  assert.match(proxy, /export async function proxy/);
  assert.doesNotMatch(proxy, /from \"@\/auth\"/);
  assert.doesNotMatch(proxy, /from \"@\/lib\/members\/store\"/);

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
  const loginPage = readSrc("src/app/login/page.tsx");
  assert.match(loginPage, /export const dynamic = "force-dynamic"/);
  assert.match(loginPage, /getOAuthProviderStatus/);

  const login = readSrc("src/app/login/login-form.tsx");
  assert.match(login, /OAuthSignInButtons/);
  assert.match(login, /Continue as guest/);
  assert.match(login, /signInLocal/);
  assert.match(login, /never grants admin/);
  assert.match(login, /href="\/signup"/);
  assert.match(login, /Join the free beta/);
  assert.match(login, /signIn\("credentials"/);
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
  assert.match(home, /Join free beta/);
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
  assert.match(oauthButtons, /nextPath = "\/dashboard"/);

  const config = readSrc("src/lib/auth/config.ts");
  assert.match(config, /error:\s*"\/signup"/);
  assert.match(config, /roleForAuth/);
  assert.doesNotMatch(config, /return isStaffEmail\(email\)/);
  assert.match(readSrc("src/auth.ts"), /Credentials/);
  assert.match(readSrc("src/auth.ts"), /verifyMemberLogin/);
  assert.match(readSrc("src/lib/auth/env.ts"), /authCanMintSessions/);
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

function normalizeEmail(email) {
  return (email ?? "").trim().toLowerCase();
}

function isValidEmail(email) {
  const mail = normalizeEmail(email);
  return Boolean(mail) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
}

function passwordError(password) {
  const value = password ?? "";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 200) return "Password must be at most 200 characters.";
  return null;
}

function roleForAuth(provider, email) {
  if (provider === "credentials") return "member";
  return isDeanEmail(email) ? "admin" : "member";
}

function isStaffOAuthProvider(provider) {
  return provider === "google" || provider === "twitter";
}

function isStaffSession(session) {
  const email = session?.user?.email;
  if (!isDeanEmail(email)) return false;
  const provider = session?.user?.provider;
  if (provider === "credentials") return false;
  if (isStaffOAuthProvider(provider)) return true;
  if (!provider && session?.user?.role !== "member") return true;
  return false;
}

test("credentials never grant staff even for the dean email", () => {
  assert.equal(roleForAuth("credentials", "bjljohnson2012@gmail.com"), "member");
  assert.equal(roleForAuth("google", "bjljohnson2012@gmail.com"), "admin");
  assert.equal(roleForAuth("twitter", "maya@field.school"), "member");
  assert.equal(roleForAuth("google", "maya@field.school"), "member");
});

test("staff session requires allowlisted Google or X", () => {
  assert.equal(
    isStaffSession({
      user: { email: "bjljohnson2012@gmail.com", provider: "google" },
    }),
    true,
  );
  assert.equal(
    isStaffSession({
      user: { email: "bjljohnson2012@gmail.com", provider: "twitter" },
    }),
    true,
  );
  assert.equal(
    isStaffSession({
      user: { email: "bjljohnson2012@gmail.com", provider: "credentials" },
    }),
    false,
  );
  assert.equal(
    isStaffSession({
      user: { email: "maya@field.school", provider: "google" },
    }),
    false,
  );
  assert.equal(
    isStaffSession({
      user: { email: "bjljohnson2012@gmail.com" },
    }),
    true,
  );
});

test("password and email rules for member signup", () => {
  assert.equal(isValidEmail("jordan@field.school"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(normalizeEmail("  BJL@Field.School "), "bjl@field.school");
  assert.equal(passwordError("short"), "Password must be at least 8 characters.");
  assert.equal(passwordError("longenough"), null);
});

test("free beta signup, pricing, and request-access pages exist", () => {
  const signupPage = readSrc("src/app/signup/page.tsx");
  const signup = readSrc("src/app/signup/signup-form.tsx");
  const pricing = readSrc("src/app/pricing/page.tsx");
  const request = readSrc("src/app/request-access/request-access-form.tsx");
  const complete = readSrc("src/app/login/complete/oauth-complete-client.tsx");
  const store = readSrc("src/lib/members/store.ts");
  const notify = readSrc("src/lib/members/notify.ts");
  const compose = readSrc("deploy/docker-compose.yml");
  const authMd = readSrc("AUTH.md");

  assert.match(signupPage, /export const dynamic = "force-dynamic"/);
  assert.match(signup, /Join the free beta/);
  assert.match(signup, /Continue as guest/);
  assert.match(signup, /\/api\/members\/register/);
  assert.match(signup, /signIn\("credentials"/);
  assert.match(signup, /authErrorMessage/);
  assert.doesNotMatch(signup, /lorem ipsum/i);

  assert.match(pricing, /\$100/);
  assert.match(pricing, /\$200/);
  assert.match(pricing, /\$1,000/);
  assert.match(pricing, /Cohort meetings online/);
  assert.match(pricing, /Cohort meetings in person/);
  assert.match(pricing, /One-on-one AI \+ business coaching/);
  assert.match(pricing, /Join free now/);
  assert.match(pricing, /invoiced later/i);
  assert.match(pricing, /no checkout/i);
  assert.doesNotMatch(pricing, /stripe/i);
  assert.doesNotMatch(pricing, /<form/);
  assert.doesNotMatch(pricing, /lorem ipsum/i);

  assert.match(request, /\/api\/access-requests/);
  assert.match(request, /Request access/);
  assert.match(complete, /request-access/);
  assert.match(complete, /activateMemberFromAuth/);
  assert.match(complete, /\/signup\?error=/);

  assert.match(store, /bcryptjs/);
  assert.match(store, /passwordHash/);
  assert.match(store, /campus-store\.json/);
  assert.doesNotMatch(store, /localStorage/);
  assert.match(notify, /ACCESS_REQUEST_NOTIFY_EMAIL|accessRequestNotifyEmail/);
  assert.match(notify, /SMTP_HOST/);

  assert.match(compose, /field-school-data/);
  assert.match(compose, /MEMBER_STORE_PATH/);
  assert.doesNotMatch(compose, /field-school-db/);

  assert.match(authMd, /MEMBER_STORE_PATH/);
  assert.match(authMd, /ACCESS_REQUEST_NOTIFY_EMAIL/);
  assert.match(authMd, /forever-free beta|Free beta/i);
  assert.match(readSrc("src/app/admin/access-requests/page.tsx"), /Access requests/);
});
