import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

function isHoneypotSpam(website) {
  return typeof website === "string" && Boolean(website.trim());
}

function takeRateLimit(hits, key, limit, now = Date.now()) {
  const start = now - limit.windowMs;
  const prior = (hits.get(key) ?? []).filter((stamp) => stamp > start);
  if (prior.length >= limit.max) {
    hits.set(key, prior);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((prior[0] + limit.windowMs - now) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  prior.push(now);
  hits.set(key, prior);
  return { ok: true };
}

test("honeypot treats a filled company field as spam", () => {
  assert.equal(isHoneypotSpam(""), false);
  assert.equal(isHoneypotSpam("   "), false);
  assert.equal(isHoneypotSpam(undefined), false);
  assert.equal(isHoneypotSpam("http://spam.example"), true);
});

test("rate limit trips after max hits in the window", () => {
  const hits = new Map();
  const limit = { windowMs: 60_000, max: 3 };
  const t0 = 1_000_000;
  assert.equal(takeRateLimit(hits, "signup:ip:1.1.1.1", limit, t0).ok, true);
  assert.equal(takeRateLimit(hits, "signup:ip:1.1.1.1", limit, t0 + 10).ok, true);
  assert.equal(takeRateLimit(hits, "signup:ip:1.1.1.1", limit, t0 + 20).ok, true);
  const blocked = takeRateLimit(hits, "signup:ip:1.1.1.1", limit, t0 + 30);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec >= 1);
  assert.equal(takeRateLimit(hits, "signup:ip:9.9.9.9", limit, t0 + 30).ok, true);
  assert.equal(takeRateLimit(hits, "signup:ip:1.1.1.1", limit, t0 + 60_001).ok, true);
});

test("signup, access-request, newsletter, and tools email share the spam guard", () => {
  const spam = readSrc("src/lib/members/spam.ts");
  const enroll = readSrc("src/lib/members/enroll.ts");
  const notify = readSrc("src/lib/members/notify.ts");
  const store = readSrc("src/lib/members/store.ts");
  const forms = readSrc("src/lib/members/forms.ts");
  const types = readSrc("src/lib/members/types.ts");
  const register = readSrc("src/app/api/members/register/route.ts");
  const access = readSrc("src/app/api/access-requests/route.ts");
  const formsApi = readSrc("src/app/api/forms/route.ts");
  const toolsEmail = readSrc("src/app/api/tools/email/route.ts");
  const signup = readSrc("src/app/signup/signup-form.tsx");
  const request = readSrc("src/app/request-access/request-access-form.tsx");
  const admin = readSrc("src/app/admin/access-requests/page.tsx");
  const newsletter = readSrc("marketing-site/newsletter.html");
  const marketingJs = readSrc("marketing-site/js/forms.js");

  assert.match(spam, /export function isHoneypotSpam/);
  assert.match(spam, /export function takeRateLimit/);
  assert.match(spam, /export function guardPublicSubmit/);
  assert.match(spam, /signup: \{ windowMs: PUBLIC_SUBMIT_WINDOW_MS, max: 5 \}/);
  assert.match(spam, /access: \{ windowMs: PUBLIC_SUBMIT_WINDOW_MS, max: 5 \}/);
  assert.match(spam, /forms: \{ windowMs: PUBLIC_SUBMIT_WINDOW_MS, max: 8 \}/);
  assert.doesNotMatch(spam, /recaptcha|hcaptcha|turnstile|akismet/i);

  assert.match(forms, /isHoneypotSpam/);
  assert.match(register, /guardPublicSubmit/);
  assert.match(register, /recordNewEnrollment/);
  assert.match(register, /result\.created/);
  assert.match(access, /guardPublicSubmit/);
  assert.match(formsApi, /guardPublicSubmit/);
  assert.match(toolsEmail, /guardPublicSubmit/);

  assert.match(signup, /id="signup-website"/);
  assert.match(signup, /website/);
  assert.match(request, /id="access-website"/);
  assert.match(request, /website/);
  assert.match(newsletter, /name="website"/);
  assert.match(marketingJs, /website: data\.get\("website"\)/);

  assert.match(types, /AccessRequestKind/);
  assert.match(types, /"enrollment"/);
  assert.match(store, /kind \?\? "staff"/);
  assert.match(store, /created: true/);
  assert.match(enroll, /kind: "enrollment"/);
  assert.match(enroll, /notifyEnrollment/);
  assert.match(notify, /New enrollment:/);
  assert.match(admin, /enrollment/);
});
