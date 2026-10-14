import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { audienceCut } from "../src/lib/assessments/model.ts";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import {
  commitFinish,
  emptyBrain,
  homeCourseCta,
  visibleBrainEdge,
} from "../src/lib/profile/outcomes.ts";
import {
  FORBIDDEN_PUBLIC_KEYS,
  PERSON_IN_DEVELOPMENT,
  forbiddenPublicKeys,
  peoplePanel,
  sanitizePublicPatch,
  serializePublicProfile,
} from "../src/lib/profile/public.ts";
import { kidProfileRedirect } from "../src/lib/profile/routes.ts";
import {
  initialShareState,
  isShareSlug,
  mintShareSlug,
  nextShareState,
  publicViewStatus,
  shareMintStatus,
} from "../src/lib/profile/share.ts";
import { M9_METRICS, memberDoors } from "../src/lib/shell/m9-shell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const SECRET_EMAIL = "ada.private@example.com";
const SECRET_PHONE = "+1-555-0100";
const SECRET_CHILD = "Ada Private Child";
const SECRET_ASSESSMENT = "Type Five Whisper";
const SECRET_COACHING = "coach note alpha";
const SECRET_PROGRESS = "3 of 10 lessons secret";
const MEMBERSHIP_ID = "11111111-2222-4333-8444-555555555555";

function bundle() {
  return {
    displayName: "Ada Adult",
    photoSrc: "/api/media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    headline: "Builds field schools",
    bio: "A short bio.",
    linkedinUrl: "https://www.linkedin.com/in/ada-example",
    ownedSkills: ["Writing briefs", "Hidden skill"],
    publicSkills: ["Writing briefs", "Not owned"],
    ownedProjects: [
      { name: "Plates", link: "https://fieldschool.ai/plates" },
      { name: "Private deck", link: "https://fieldschool.ai/deck" },
    ],
    publicProjects: [
      { name: "Plates", link: "https://evil.example/steal" },
      { name: "Not owned", link: "https://fieldschool.ai/nope" },
    ],
    email: SECRET_EMAIL,
    phone: SECRET_PHONE,
    orgId: "org-secret",
    membershipId: MEMBERSHIP_ID,
    memberId: "member-secret",
    children: [{ name: SECRET_CHILD }],
    assessments: [{ label: SECRET_ASSESSMENT }],
    personality: { label: SECRET_ASSESSMENT },
    coaching: { note: SECRET_COACHING },
    progress: SECRET_PROGRESS,
    gates: { "G-personality": true },
  };
}

test("audienceCut stays personality-only and the public profile drops personality", () => {
  const rows = [
    { track: "personality", taxonomy: "mbti", category: "intj", confidencePct: 80, locked: true, unsettled: false },
    { track: "skills", taxonomy: "skill_band", category: "strong", confidencePct: 70, locked: true, unsettled: false },
    { track: "profile", taxonomy: "notice_band", category: "high", confidencePct: 60, locked: false, unsettled: true },
  ];
  assert.deepEqual(
    audienceCut("public", rows).map((row) => row.track),
    ["personality"],
  );
  const pub = serializePublicProfile(bundle());
  assert.equal(JSON.stringify(pub).includes(SECRET_ASSESSMENT), false);
  assert.equal(JSON.stringify(pub).includes("mbti"), false);
});

test("public serializer keeps the allowlist and never emits forbidden fields", () => {
  const pub = serializePublicProfile(bundle());
  assert.deepEqual(Object.keys(pub), [
    "displayName",
    "photo",
    "headline",
    "bio",
    "skills",
    "projects",
    "linkedinUrl",
  ]);
  assert.deepEqual(pub.skills, [{ name: "Writing briefs" }]);
  assert.deepEqual(Object.keys(pub.skills[0]), ["name"]);
  assert.deepEqual(pub.projects, [{ name: "Plates", link: "https://fieldschool.ai/plates" }]);
  assert.deepEqual(Object.keys(pub.projects[0]).sort(), ["link", "name"]);
  assert.equal(pub.photo, "/api/media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  assert.equal(pub.linkedinUrl, "https://www.linkedin.com/in/ada-example");
  assert.deepEqual(forbiddenPublicKeys(pub), []);
  const dumped = JSON.stringify(pub);
  for (const secret of [SECRET_EMAIL, SECRET_PHONE, SECRET_CHILD, SECRET_ASSESSMENT, SECRET_COACHING, SECRET_PROGRESS, MEMBERSHIP_ID, "org-secret", "member-secret"]) {
    assert.equal(dumped.includes(secret), false, secret);
  }
  for (const key of FORBIDDEN_PUBLIC_KEYS) {
    assert.equal(Object.hasOwn(pub, key), false, key);
  }
  const leaked = serializePublicProfile({
    ...bundle(),
    photoSrc: "https://cdn.example/secret.jpg",
    linkedinUrl: "https://evil.example/in/ada",
    email: SECRET_EMAIL,
  });
  assert.equal(leaked.photo, "");
  assert.equal(leaked.linkedinUrl, "");
  assert.equal(JSON.stringify(leaked).includes(SECRET_EMAIL), false);
});

test("share slugs are opaque, off by default, and a revoke kills the slug", () => {
  assert.deepEqual(initialShareState(), { enabled: false, slug: null });
  const bytes = Uint8Array.from({ length: 16 }, (_, index) => index + 3);
  const minted = mintShareSlug(bytes, [MEMBERSHIP_ID]);
  assert.equal(minted.length >= 10, true);
  assert.equal(isShareSlug(minted), true);
  assert.notEqual(minted, MEMBERSHIP_ID);
  assert.match(minted, /^[A-Za-z0-9_-]+$/);

  const blocked = "aaaaaaaaaa";
  let calls = 0;
  const mint = () => {
    calls += 1;
    return calls === 1 ? blocked : "bbbbbbbbbb";
  };
  const enabled = nextShareState(initialShareState(), "enable", mint, [blocked, MEMBERSHIP_ID]);
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.slug, "bbbbbbbbbb");
  assert.notEqual(enabled.slug, MEMBERSHIP_ID);
  const again = nextShareState(enabled, "enable", () => "cccccccccc", [MEMBERSHIP_ID]);
  assert.equal(again.slug, "bbbbbbbbbb");
  const revoked = nextShareState(again, "revoke", () => "bbbbbbbbbb", []);
  assert.deepEqual(revoked, { enabled: false, slug: null });
  const renewed = nextShareState(revoked, "enable", () => "dddddddddd", [MEMBERSHIP_ID]);
  assert.equal(renewed.slug, "dddddddddd");
  assert.notEqual(renewed.slug, "bbbbbbbbbb");

  assert.equal(shareMintStatus("child"), 403);
  assert.equal(shareMintStatus("adult"), 200);
  assert.equal(
    publicViewStatus({ kind: "child", shareEnabled: true, slug: "dddddddddd", requestedSlug: "dddddddddd" }),
    404,
  );
  assert.equal(
    publicViewStatus({ kind: "adult", shareEnabled: false, slug: null, requestedSlug: "bbbbbbbbbb" }),
    404,
  );
  assert.equal(
    publicViewStatus({ kind: "adult", shareEnabled: true, slug: "dddddddddd", requestedSlug: "bbbbbbbbbb" }),
    404,
  );
  assert.equal(
    publicViewStatus({ kind: "adult", shareEnabled: true, slug: "dddddddddd", requestedSlug: "dddddddddd" }),
    200,
  );
  assert.equal(publicViewStatus({ kind: "adult", shareEnabled: true, slug: MEMBERSHIP_ID, requestedSlug: MEMBERSHIP_ID }), 404);
});

test("wizard finish writes personality outcomes and skills or profile evidence once", () => {
  const placements = [
    { id: "p1", runId: "r1", track: "personality", label: "Discovery call", locked: true, unsettled: false, catalogSlug: "grok-bot" },
    { id: "p2", runId: "r1", track: "skills", label: "Writing briefs", locked: true, unsettled: false },
    { id: "p3", runId: "r1", track: "profile", label: "Notice", locked: false, unsettled: true },
    { id: "p4", runId: "r1", track: "skills", label: "Still open", locked: false, unsettled: false },
  ];
  const once = commitFinish(emptyBrain(), placements);
  const twice = commitFinish(once, placements);
  assert.equal(twice.outcomes.length, 1);
  assert.equal(twice.evidence.length, 2);
  assert.equal(twice.outcomes[0].role, "outcome");
  assert.equal(twice.outcomes[0].refTable, "assessment_placements");
  assert.equal(twice.outcomes[0].refId, "p1");
  assert.equal(twice.outcomes[0].title, "Discovery call");
  assert.deepEqual(
    twice.evidence.map((row) => row.refId).sort(),
    ["p2", "p3"],
  );
  assert.ok(twice.evidence.every((row) => row.refTable === "assessment_placements" && row.role === "evidence"));
  assert.equal(twice.outcomes.some((row) => row.refId === "p2"), false);

  const home = homeCourseCta({ outcomes: twice.outcomes, enrollmentSlug: null });
  assert.equal(home.from, "outcomes");
  assert.equal(home.title, "Discovery call");
  assert.equal(home.href, "/c/grok-bot");
  assert.equal(home.courseSlug, "grok-bot");
  const enrolled = homeCourseCta({ outcomes: twice.outcomes, enrollmentSlug: "grok-bot" });
  assert.equal(enrolled.href, "/c/grok-bot");
  assert.equal(enrolled.title, "Discovery call");
  assert.equal(visibleBrainEdge({ status: "rejected" }), false);
  assert.equal(visibleBrainEdge({ status: "proposed" }), true);
});

test("people panel shows an adult photo and skills, and a child has neither a photo nor a public link", () => {
  const adult = peoplePanel({
    kind: "adult",
    displayName: "Ada Adult",
    photoSrc: "/api/media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    skills: ["Writing briefs"],
    shareEnabled: true,
    slug: "bbbbbbbbbb",
    membershipId: MEMBERSHIP_ID,
  });
  assert.equal(adult.kind, "adult");
  assert.equal(adult.photo, "/api/media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  assert.deepEqual(adult.skills, ["Writing briefs"]);
  assert.equal(adult.shareHref, "/share/bbbbbbbbbb");

  const child = peoplePanel({
    kind: "child",
    displayName: SECRET_CHILD,
    photoSrc: "/api/media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    skills: ["Writing briefs"],
    shareEnabled: true,
    slug: "bbbbbbbbbb",
    membershipId: MEMBERSHIP_ID,
  });
  assert.equal(child.kind, "development");
  assert.equal(child.label, PERSON_IN_DEVELOPMENT);
  assert.equal(child.photo, null);
  assert.equal(child.shareHref, null);
  assert.deepEqual(child.skills, []);

  const panel = read("src/components/profile/people-profile-panel.tsx");
  assert.equal(PERSON_IN_DEVELOPMENT, "Person in development");
  assert.match(panel, /data-profile-photo/);
  assert.match(panel, /data-skills/);
  assert.match(panel, /\{PERSON_IN_DEVELOPMENT\}/);
  assert.doesNotMatch(panel, /type="file"/);
  const dev = panel.slice(panel.indexOf('panel.kind === "development"'), panel.indexOf('data-profile-panel="adult"'));
  assert.doesNotMatch(dev, /data-profile-photo|shareHref|type="file"/);
});

test("kid profile URLs redirect to people and the wizard finish heading is plain", () => {
  assert.deepEqual(kidProfileRedirect("/profile/kids/abc"), { href: "/people/abc", status: 301 });
  assert.deepEqual(kidProfileRedirect("/profile/kids/abc/"), { href: "/people/abc", status: 301 });
  assert.equal(kidProfileRedirect("/profile/kids/../admin"), null);
  assert.equal(kidProfileRedirect("/api/profile/kids/abc"), null);
  assert.match(read("src/proxy.ts"), /kidProfileRedirect/);
  const wizard = read("src/components/profile-m2/assessment-wizard.tsx");
  assert.match(wizard, /data-wizard-finish="plain"/);
  assert.doesNotMatch(wizard, /FlipText/);
  assert.match(read("src/app/dashboard/page.tsx"), /HomeCourseCta/);
  assert.match(read("src/components/profile/home-course-cta.tsx"), /data-next-from="outcomes"/);
  assert.match(read("src/app/api/profile/home-course/route.ts"), /loadHomeCourse/);
});

test("migration 0030 is the only new profile migration and go-live flags stay off", () => {
  const names = readdirSync(join(root, "db"));
  assert.deepEqual(
    names.filter((name) => name.startsWith("0030")),
    ["0030_pm3_profile.sql"],
  );
  assert.equal(names.some((name) => name.startsWith("0029")), false);
  const sql = read("db/0030_pm3_profile.sql");
  assert.match(sql, /share_slug/);
  assert.match(sql, /share_enabled/);
  assert.doesNotMatch(sql, /kid_profiles/);
  assert.doesNotMatch(read("db/0028_m11_brains.sql"), /share_slug/);
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.equal(M9_METRICS.railPx, 240);
  assert.deepEqual(
    memberDoors("issue-368").map((door) => door.label),
    ["Learn", "Library", "You"],
  );
  const patch = sanitizePublicPatch(
    { headline: "Hello", bio: "Bio", linkedinUrl: "https://www.linkedin.com/in/ada-example", publicSkills: ["Writing briefs", "Nope"], publicProjects: [{ name: "Plates", link: "https://fieldschool.ai/plates" }], email: SECRET_EMAIL },
    { skills: ["Writing briefs"], projects: [{ name: "Plates", link: "https://fieldschool.ai/plates" }] },
  );
  assert.equal(patch.ok, false);
});
