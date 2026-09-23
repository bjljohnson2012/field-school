import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

test("signup and station shell name the guest continuity contract", () => {
  const copy = readSrc("src/components/guest-continuity.tsx");
  const signup = readSrc("src/app/signup/signup-form.tsx");
  const station = readSrc("src/app/c/[courseSlug]/s/[slug]/page.tsx");

  assert.match(signup, /GuestContinuity/);
  assert.match(station, /GuestContinuity/);
  assert.match(copy, /campus ladder, stations, desk, and exam open without an account/);
  assert.match(copy, /desk draft does not survive refresh/);
  assert.match(copy, /Use Save desk/);
  assert.doesNotMatch(copy, /autosave|cloud sync/i);
  assert.match(copy, /quiz selection does not survive refresh/);
  assert.match(copy, /Pass stays 75% \(3\/4\)/);
  assert.match(copy, /The exam is 8\/10/);
  assert.match(copy, /whole ladder plus the exam/);
  assert.match(copy, /guests play\. Guests do not write/);
  assert.match(copy, /href="\/login\?next=\/metering"/);
  assert.match(copy, /guest can read the model/);
});

test("guest nav hides extra rooms and keeps one stone Org menu", () => {
  const header = readSrc("src/components/site-header.tsx");
  assert.match(header, /GuestOrgMenu/);
  assert.match(header, /href="\/o\/household"/);
  assert.match(header, /href="\/o\/sales"/);
  assert.match(header, /People, Library, Insights, and New stay hidden/);
  assert.doesNotMatch(header, /bg-primary/);
  assert.doesNotMatch(header, /bg-\[#1f5eff\]/);
  const guestReturn = header.indexOf("if (opts.guest || !opts.loggedIn)");
  const leaderReturn = header.indexOf("if (!opts.leader)");
  const people = header.indexOf('label: "People"');
  assert.ok(guestReturn >= 0 && leaderReturn > guestReturn);
  assert.ok(people > leaderReturn);
});

test("guest footer drops Cart, Tools, and Student demo and keeps About and Pricing", () => {
  const footer = readSrc("src/components/site-footer.tsx");
  const staff = readSrc("src/components/staff-footer-links.tsx");
  assert.match(footer, /Field School site/);
  assert.match(footer, /href="\/about"/);
  assert.match(footer, /href="\/pricing"/);
  assert.doesNotMatch(footer, /href="\/cart"/);
  assert.doesNotMatch(footer, /href="\/tools"/);
  assert.doesNotMatch(footer, /Student demo/);
  assert.doesNotMatch(footer, /bg-primary|bg-\[#1f5eff\]/);
  assert.doesNotMatch(staff, /Student demo/);
  assert.doesNotMatch(staff, /href="\/admin\/demo"/);
});

test("S1 sole fill and S3 exam ratios stay put", () => {
  const home = readSrc("src/app/campus-home.tsx");
  const exam = readSrc("src/app/c/[courseSlug]/exam/page.tsx");
  const types = readSrc("src/lib/course/types.ts");
  const spine = readSrc("src/app/play/lesson-spine/page.tsx");
  assert.match(home, /bg-\[#1f5eff\]/);
  assert.match(home, /Start Grok Bot/);
  assert.match(exam, /Pass at 8\/10/);
  assert.match(types, /export const PASS_RATIO = 0\.75;/);
  assert.match(types, /export const EXAM_PASS_RATIO = 0\.8;/);
  assert.match(
    spine,
    /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/,
  );
});
