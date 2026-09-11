import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const FORM_KINDS = ["saturday_note", "topic_request", "shop_waitlist"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return (email ?? "").trim().toLowerCase();
}

function isValidEmail(email) {
  const mail = normalizeEmail(email);
  return Boolean(mail) && EMAIL_RE.test(mail);
}

function isFormKind(value) {
  return FORM_KINDS.includes(value);
}

function validateFormInput(input) {
  if (typeof input.website === "string" && input.website.trim()) {
    return { ok: true, spam: true };
  }
  if (!isFormKind(input.kind)) return { ok: false, error: "Unknown form." };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = normalizeEmail(typeof input.email === "string" ? input.email : "");
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email." };
  if (input.kind === "topic_request" && !name) {
    return { ok: false, error: "Name is required." };
  }
  if (input.kind === "topic_request" && !message) {
    return { ok: false, error: "Tell us the topic you want covered." };
  }
  return { ok: true, spam: false, kind: input.kind, name, email, message };
}

test("form kinds and validation match the Saturday list and topic request", () => {
  assert.deepEqual(validateFormInput({ kind: "saturday_note", email: "  Maya@Field.School " }), {
    ok: true,
    spam: false,
    kind: "saturday_note",
    name: "",
    email: "maya@field.school",
    message: "",
  });
  assert.equal(validateFormInput({ kind: "saturday_note", email: "nope" }).ok, false);
  assert.equal(
    validateFormInput({ kind: "topic_request", email: "maya@field.school", name: "Maya" }).error,
    "Tell us the topic you want covered.",
  );
  assert.equal(
    validateFormInput({
      kind: "topic_request",
      email: "maya@field.school",
      name: "Maya",
      message: "Close plans for AEs",
    }).ok,
    true,
  );
  assert.equal(validateFormInput({ kind: "mystery", email: "maya@field.school" }).ok, false);
  assert.equal(validateFormInput({ kind: "saturday_note", email: "x@y.z", website: "http://spam" }).spam, true);
});

test("public form API, admin tabs, and marketing forms are wired", () => {
  const api = readSrc("src/app/api/forms/route.ts");
  const adminApi = readSrc("src/app/api/admin/forms/route.ts");
  const store = readSrc("src/lib/members/store.ts");
  const types = readSrc("src/lib/members/types.ts");
  const forms = readSrc("src/lib/members/forms.ts");
  const adminPage = readSrc("src/app/admin/forms/page.tsx");
  const nav = readSrc("src/components/admin-nav.tsx");
  const home = readSrc("marketing-site/index.html");
  const newsletter = readSrc("marketing-site/newsletter.html");
  const tools = readSrc("marketing-site/tools.html");
  const shop = readSrc("marketing-site/shop.html");
  const pricing = readSrc("marketing-site/pricing.html");
  const js = readSrc("marketing-site/js/forms.js");

  assert.match(types, /saturday_note/);
  assert.match(types, /topic_request/);
  assert.match(types, /shop_waitlist/);
  assert.match(store, /formSubmissions/);
  assert.match(store, /createFormSubmission/);
  assert.match(forms, /fieldschool\.ai/);
  assert.match(forms, /portal\.fieldschool\.ai/);
  assert.match(api, /validateFormInput/);
  assert.match(api, /createFormSubmission/);
  assert.match(api, /corsHeadersForOrigin/);
  assert.match(adminApi, /isStaffSession/);
  assert.match(adminApi, /listFormSubmissions/);
  assert.match(adminPage, /role="tablist"/);
  assert.match(adminPage, /Saturday list/);
  assert.match(adminPage, /Topic requests/);
  assert.match(adminPage, /shop waitlist/);
  assert.match(nav, /href:\s*"\/admin\/forms"/);

  const portal = readSrc("marketing-site/portal.html");
  const community = readSrc("marketing-site/community.html");
  const coaching = readSrc("marketing-site/coaching.html");
  const about = readSrc("marketing-site/about.html");

  assert.doesNotMatch(home, /data-form="saturday_note"/);
  assert.doesNotMatch(home, /University/);
  assert.match(home, /Field School is the organization/);
  assert.match(home, /training portal/);
  assert.match(home, /href="\/portal"/);
  assert.match(home, /href="\/community"/);
  assert.match(home, /href="\/coaching"/);
  assert.match(home, /Join our Newsletter/);
  assert.match(home, /Enroll/);
  assert.doesNotMatch(home, /mailto:ben@fieldschool.ai/);
  assert.match(about, /Field School is the organization/);
  assert.match(portal, /The Field School training portal/);
  assert.match(community, /The Field School community/);
  assert.match(coaching, /Field School coaching/);
  assert.match(newsletter, /data-form="saturday_note"/);
  assert.match(newsletter, /One email each Saturday/);
  assert.match(newsletter, /Under Field School/);
  assert.match(tools, /data-form="topic_request"/);
  assert.match(tools, /portal\.fieldschool\.ai\/tools\/skill/);
  assert.doesNotMatch(tools, /login\?next=\/tools\/skill/);
  assert.match(tools, /Take an assessment free/);
  assert.match(pricing, /\$10/);
  assert.match(pricing, /\$1,059/);
  assert.doesNotMatch(pricing, /University/);
  assert.match(pricing, /Training portal/);
  assert.match(pricing, /checkout\?plan=10/);
  assert.doesNotMatch(pricing, /Invoice later/);
  assert.match(shop, /data-form="shop_waitlist"/);
  assert.match(js, /portal\.fieldschool\.ai\/api\/forms/);
});
