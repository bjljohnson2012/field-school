import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  privacyAllows,
  readLog,
  referrerOrigin,
  start,
} from "../marketing-site/js/analytics.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "marketing-site");
const tag = '<script type="module" src="/js/analytics.mjs"></script>';
const beside =
  '<script type="module" src="/js/checkout-switch.mjs"></script>\n  <script type="module" src="/js/analytics.mjs"></script>';

const publicPages = [
  "index.html",
  "how-it-works.html",
  "families.html",
  "teams.html",
  "teams/services.html",
  "pricing.html",
  "ben.html",
  "principles.html",
  "newsletter.html",
  "assessment.html",
  "privacy.html",
  "terms.html",
];

function canonicalHref(rel) {
  if (rel === "index.html") return "https://fieldschool.ai/";
  return `https://fieldschool.ai/${rel.replace(/\.html$/, "")}`;
}

test("every public marketing page loads the visit log next to the checkout switch", () => {
  for (const rel of publicPages) {
    const html = readFileSync(join(site, rel), "utf8");
    assert.equal(html.includes(beside), true, rel);
    assert.equal(html.split(tag).length - 1, 1, rel);
  }
});

test("every public marketing page has one self-referencing canonical", () => {
  for (const rel of publicPages) {
    const html = readFileSync(join(site, rel), "utf8");
    const href = canonicalHref(rel);
    const line = `<link rel="canonical" href="${href}">`;
    assert.equal(html.split(line).length - 1, 1, rel);
    assert.equal(html.split('rel="canonical"').length - 1, 1, rel);
  }
});

test("robots.txt disallows /brand", () => {
  const robots = readFileSync(join(site, "robots.txt"), "utf8");
  assert.equal(robots.includes("Disallow: /brand\n"), true);
  assert.equal(robots.includes("Sitemap: https://fieldschool.ai/sitemap.xml"), true);
});

test("the visit log has no vendor, cookie, or gtag", () => {
  const source = readFileSync(join(site, "js/analytics.mjs"), "utf8");
  for (const banned of ["gtag", "google-analytics", "plausible", "posthog", "document.cookie", "buy.stripe.com"]) {
    assert.equal(source.includes(banned), false, banned);
  }
  assert.equal(referrerOrigin("https://news.example/story?email=a@b.c"), "https://news.example");
  assert.equal(privacyAllows({ doNotTrack: "1", globalPrivacyControl: false }), false);
  assert.equal(privacyAllows({ doNotTrack: "0", globalPrivacyControl: true }), false);

  const storage = memoryStorage();
  const doc = fakeDoc("/pricing", "https://news.example/story?email=a@b.c");
  assert.deepEqual(start(doc, { doNotTrack: "0" }, storage, () => "2026-10-13T18:00:00.000Z"), {
    recorded: true,
  });
  const log = readLog(storage);
  assert.equal(log.length, 1);
  assert.equal(log[0].referrerOrigin, "https://news.example");
  assert.equal(JSON.stringify(log).includes("a@b.c"), false);

  const blocked = memoryStorage();
  assert.deepEqual(start(fakeDoc("/", ""), { doNotTrack: "1" }, blocked), { recorded: false });
  assert.deepEqual(readLog(blocked), []);
  assert.deepEqual(start(fakeDoc("/", ""), { globalPrivacyControl: true }, memoryStorage()), {
    recorded: false,
  });
});

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
  };
}

function fakeDoc(path, referrer) {
  return {
    location: { pathname: path },
    referrer,
    addEventListener() {},
  };
}
