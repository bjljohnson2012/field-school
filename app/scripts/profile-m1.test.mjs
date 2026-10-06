import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ADULT_GATES,
  KID_GATES,
  PROFILE_COPY,
  adultSetup,
  freshnessLabel,
  gateForTool,
  kidEditRefusal,
  kidSetup,
  markGate,
  readGateMarks,
  sanitizeAdultPatch,
  sanitizeKidPatch,
} from "../src/lib/profile/model.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const NOW = new Date("2026-10-06T18:00:00Z");
const DONE = (iso) => ({ firstAt: iso, lastAt: iso });

const PROFILE_FILES = [
  "db/0017_profiles.sql",
  "src/lib/profile/model.ts",
  "src/lib/profile/store.ts",
  "src/lib/profile/sql.ts",
  "src/app/api/profile/route.ts",
  "src/app/api/profile/gates/route.ts",
  "src/app/api/profile/kids/[membershipId]/route.ts",
  "src/app/profile/layout.tsx",
  "src/app/profile/page.tsx",
  "src/app/profile/kids/[membershipId]/page.tsx",
];

test("adult copy is exact and View Profile sits in the existing name menu only", () => {
  assert.equal(PROFILE_COPY.incomplete, "Finish setting up your profile");
  assert.equal(PROFILE_COPY.complete, "Your profile is done");
  const header = read("src/components/site-header.tsx");
  assert.equal(header.match(/View Profile/g)?.length, 1);
  const menu = header.slice(header.indexOf("<details className=\"relative ml-1\">"));
  assert.ok(menu.indexOf("View Profile") > 0 && menu.indexOf("View Profile") < menu.indexOf("<ThemeToggle />"));
  assert.match(menu, /href="\/profile"/);
  assert.doesNotMatch(read("src/components/app-shell.tsx"), /View Profile|\/profile"/);
  const page = read("src/app/profile/page.tsx");
  assert.match(page, /PROFILE_COPY\.complete : PROFILE_COPY\.incomplete/);
  assert.match(page, /setup\.done\} of \{setup\.total\} setup steps done/);
});

test("adult gates are the three locked placeholders and completeness is their AND", () => {
  assert.deepEqual(ADULT_GATES.map((gate) => gate.id), ["G-personality", "G-skills", "G-other"]);
  assert.deepEqual(ADULT_GATES.map((gate) => gate.href), ["/pattern", "/tools/skill", "/tools/intelligence"]);
  assert.ok(ADULT_GATES.every((gate) => gate.required));
  assert.ok(ADULT_GATES.every((gate) => gate.href !== "/skills" && gate.href !== "/intake"));

  const none = adultSetup({}, null, NOW);
  assert.equal(none.complete, false);
  assert.equal(none.headline, PROFILE_COPY.incomplete);
  assert.deepEqual([none.done, none.total], [0, 3]);

  const two = adultSetup({ "G-personality": DONE("2026-10-01T00:00:00Z"), "G-skills": DONE("2026-10-02T00:00:00Z") }, null, NOW);
  assert.equal(two.complete, false);
  assert.equal(two.done, 2);
  assert.equal(two.completedAt, null);

  const all = adultSetup(
    {
      "G-personality": DONE("2026-10-01T00:00:00Z"),
      "G-skills": DONE("2026-10-02T00:00:00Z"),
      "G-other": DONE("2026-10-03T00:00:00Z"),
    },
    null,
    NOW,
  );
  assert.equal(all.complete, true);
  assert.equal(all.headline, PROFILE_COPY.complete);
  assert.equal(all.completedAt, NOW.toISOString());
});

test("after done, a re-run refreshes freshness only and never reopens setup", () => {
  const first = markGate({}, "G-skills", new Date("2026-09-01T00:00:00Z"));
  const rerun = markGate(first, "G-skills", new Date("2026-10-05T00:00:00Z"));
  assert.equal(rerun["G-skills"].firstAt, "2026-09-01T00:00:00.000Z");
  assert.equal(rerun["G-skills"].lastAt, "2026-10-05T00:00:00.000Z");

  const stored = "2026-09-10T00:00:00.000Z";
  const after = adultSetup(rerun, stored, NOW);
  assert.equal(after.complete, true);
  assert.equal(after.completedAt, stored);
  assert.equal(after.headline, PROFILE_COPY.complete);
  assert.equal(after.gates.find((gate) => gate.id === "G-skills").lastAt, "2026-10-05T00:00:00.000Z");

  assert.deepEqual(readGateMarks({ "G-skills": { firstAt: "x", lastAt: "y" }, "G-fake": DONE(stored) }), {});
});

test("freshness affordance reads the last take", () => {
  assert.equal(freshnessLabel(null, NOW), "Not taken yet");
  assert.equal(freshnessLabel("2026-10-06T09:00:00Z", NOW), "Taken today");
  assert.equal(freshnessLabel("2026-10-05T09:00:00Z", NOW), "Taken yesterday");
  assert.equal(freshnessLabel("2026-09-26T09:00:00Z", NOW), "Taken 10 days ago");
  assert.equal(freshnessLabel("2026-08-01T09:00:00Z", NOW), "Taken on Aug 1, 2026");
  const page = read("src/app/profile/page.tsx");
  assert.match(page, /data-freshness/);
  assert.match(page, /freshnessLabel\(gate\.lastAt, now\)/);
});

test("Tools wire: Skill feeds G-skills and Intelligence feeds G-other, nothing else", () => {
  assert.equal(gateForTool("skill"), "G-skills");
  assert.equal(gateForTool("intelligence"), "G-other");
  for (const slug of ["personality", "tool-checklist", "skills", "intake", "constructor", "__proto__"]) {
    assert.equal(gateForTool(slug), null, slug);
  }
  const actions = read("src/components/tool-result-actions.tsx");
  assert.match(actions, /if \(gateForTool\(result\.toolSlug\)\)/);
  assert.match(actions, /\/api\/profile\/gates/);
  const store = read("src/lib/profile/store.ts");
  assert.match(store, /eq\(instrumentRuns\.instrumentSlug, "fp-50-v1"\)/);
  assert.match(store, /eq\(instrumentRuns\.subset, "adult"\)/);
});

test("adult self-edit covers name, optional photo, projects, and manual skills only", () => {
  const ok = sanitizeAdultPatch({
    displayName: "  Ben  ",
    photoUrl: "",
    currentProjects: ["Field School", "field school", " Plates "],
    skillsAdapted: ["Discovery calls"],
  });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.patch, {
    displayName: "Ben",
    photoUrl: "",
    currentProjects: ["Field School", "Plates"],
    skillsAdapted: ["Discovery calls"],
  });
  assert.equal(sanitizeAdultPatch({ photoUrl: "https://example.com/me.jpg" }).ok, true);
  assert.equal(sanitizeAdultPatch({ photoUrl: "http://example.com/me.jpg" }).ok, false);
  assert.equal(sanitizeAdultPatch({ photoUrl: "javascript:alert(1)" }).ok, false);
  assert.equal(sanitizeAdultPatch({ displayName: "  " }).ok, false);
  for (const field of ["publicSlug", "shareUrl", "resumeUrl", "linkedinUrl", "completedAt", "gates"]) {
    assert.equal(sanitizeAdultPatch({ [field]: "x" }).ok, false, field);
  }
  assert.ok(!ADULT_GATES.some((gate) => /photo/i.test(gate.id)));
});

test("adult profile is keyed by the signed-in User and persists without a course", () => {
  const sql = read("db/0017_profiles.sql");
  assert.match(sql, /member_id uuid PRIMARY KEY REFERENCES members\(id\)/);
  assert.match(sql, /completed_at timestamptz/);
  assert.match(sql, /Does not alter 0001-0016/);
  const route = read("src/app/api/profile/route.ts");
  assert.match(route, /memberId: session\.member\.id/);
  assert.doesNotMatch(route, /course|enrol/i);
  assert.match(read("src/app/profile/layout.tsx"), /redirect\("\/login\?next=\/profile"\)/);
});

test("kid profile: parent-only edit, G-intake stub, no photo, adult gates do not apply", () => {
  assert.deepEqual(KID_GATES.map((gate) => gate.id), ["G-intake"]);
  assert.equal(KID_GATES[0].href, null);
  const kid = kidSetup(null);
  assert.equal(kid.complete, false);
  assert.deepEqual(kid.gates.map((gate) => gate.id), ["G-intake"]);
  assert.equal(kidSetup("2026-10-01T00:00:00Z").complete, true);

  assert.equal(sanitizeKidPatch({ displayName: "Ada", photoUrl: "https://x.test/a.png" }).error, "kid_no_photo");
  assert.equal(sanitizeKidPatch({ displayName: "Ada", skillsAdapted: [] }).ok, false);
  assert.deepEqual(sanitizeKidPatch({ displayName: " Ada " }), { ok: true, patch: { displayName: "Ada" } });

  const parent = { kind: "adult", stance: "guardian", orgSlug: "household", membershipId: "p" };
  assert.equal(kidEditRefusal(parent, true), null);
  assert.equal(kidEditRefusal(parent, false), "not_your_child");
  assert.equal(kidEditRefusal({ ...parent, kind: "child" }, true), "child_cannot_edit");
  assert.equal(kidEditRefusal({ ...parent, orgSlug: "sales" }, true), "household_only");

  const sql = read("db/0017_profiles.sql");
  const kidTable = sql.slice(sql.indexOf("CREATE TABLE IF NOT EXISTS kid_profiles"));
  assert.doesNotMatch(kidTable, /photo|public|slug|share/i);
  assert.match(kidTable, /UNIQUE \(org_id, child_membership_id\)/);

  const route = read("src/app/api/profile/kids/[membershipId]/route.ts");
  assert.ok(route.indexOf("kidEditRefusal") < route.indexOf("updateKidProfile(parent.scope"));
  assert.match(route, /isGuardianOf\(scope, childMembershipId\)/);
  const page = read("src/app/profile/kids/[membershipId]/page.tsx");
  assert.match(page, /Child view · read-only/);
  assert.match(page, /\{kidView \? null : \(\s*<section className="rounded-xl border border-border bg-card px-5 py-5">\s*<h2 className="text-sm font-semibold">Edit<\/h2>/);
  assert.doesNotMatch(page, /type="file"|photoUrl/);
});

test("kids list only on the household room; sales profile shows no children", () => {
  const route = read("src/app/api/profile/route.ts");
  assert.match(route, /auth\.active\?\.orgSlug === "household" \? auth\.active : null/);
  assert.match(route, /: \[\];/);
  assert.match(read("src/lib/profile/store.ts"), /eq\(members\.kind, "child"\)/);
});

test("M1 holds: no public URL, no resume, LinkedIn, or nudge, no locks moved", () => {
  assert.equal(existsSync(join(root, "src/app/u")), false);
  assert.equal(existsSync(join(root, "src/app/profile/public")), false);
  assert.equal(existsSync(join(root, "src/app/api/profile/public")), false);
  for (const rel of PROFILE_FILES) {
    const src = read(rel)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*(--|\/\/).*$/gm, "");
    assert.doesNotMatch(src, /resume|linkedin|nudge|share_url|public_url|publicSlug/i, rel);
    assert.doesNotMatch(src, /AUTH_URL|COACHING_|CRON_SECRET|AE_WRITES_FROZEN|COMPOSE_PROFILES|Launch|Cap\b/, rel);
    assert.doesNotMatch(src, /2\.24\.64\.248|27pn9xs0zk8a73g|af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/, rel);
  }
});
