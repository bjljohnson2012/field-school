import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { audienceCut } from "../src/lib/assessments/model.ts";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { ENRICHMENT_COPY, findExact, matchKey } from "../src/lib/enrichment/names.ts";
import {
  emptyLedger,
  experienceProject,
  foldImport,
  importTarget,
  linkedInReviewList,
  proposeCertificationSkills,
} from "../src/lib/enrichment/import-plan.ts";
import { decideResumeParse, proposeResumeEntries, resumeProposalsFromModel } from "../src/lib/enrichment/resume.ts";
import { RESEARCH_CAPS } from "../src/lib/gap-loop/research.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import { mergeGateMark } from "../src/lib/profile/gate-mark.ts";
import { buildPeerProfile, peerForbiddenKeys, photoVisibleTo, profileUrls, shownPlacements } from "../src/lib/profile/peer.ts";
import { M9_METRICS, memberDoors } from "../src/lib/shell/m9-shell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const SKILL = { id: "skill-1", kind: "skill", title: "Writing Briefs", organization: "", startedOn: null, endedOn: null };
const EXPERIENCE = {
  id: "experience-5",
  kind: "experience",
  title: "Operations Lead",
  organization: "Northwind",
  startedOn: "2022-03",
  endedOn: null,
};
const EDUCATION = {
  id: "education-8",
  kind: "education",
  title: "Bachelor of Arts - BA, Economics",
  organization: "University of Rochester",
  startedOn: "2013",
  endedOn: "2017",
};
const CERT = {
  id: "certification-4",
  kind: "certification",
  title: "Certified Scrum Product Owner",
  organization: "",
  startedOn: null,
  endedOn: null,
};

const SECRET_EMAIL = "ada.private@example.com";
const SECRET_PHONE = "+1-555-0100";
const SECRET_CHILD = "Ada Private Child";
const SECRET_ANSWER = "raw answer seven";
const SECRET_COACHING = "coach note alpha";
const SECRET_PROGRESS = "3 of 10 lessons secret";
const MEMBERSHIP_ID = "11111111-2222-4333-8444-555555555555";

test("accepting a skill twice does not add a second link", () => {
  const once = foldImport(emptyLedger(), [{ candidate: SKILL, useId: null }]);
  const twice = foldImport(once.state, [{ candidate: SKILL, useId: null }]);
  assert.equal(twice.state.links.length, 1);
  assert.deepEqual(twice.result.alreadyOnProfile, ["Writing Briefs"]);
  assert.equal(twice.result.added.length, 0);
});

test("experience becomes one project link and a second accept is already on the profile", () => {
  const project = experienceProject(EXPERIENCE);
  assert.equal(project.matchKey, matchKey("Northwind"));
  assert.equal(project.role, "Operations Lead");
  assert.equal(project.name, "Northwind");
  const once = foldImport(emptyLedger(), [{ candidate: EXPERIENCE, useId: null }]);
  assert.equal(once.state.projects.length, 1);
  assert.equal(once.state.projects[0].matchKey, matchKey("Northwind"));
  assert.equal(once.state.entries.length, 0);
  const twice = foldImport(once.state, [{ candidate: EXPERIENCE, useId: null }]);
  assert.equal(twice.state.projects.length, 1);
  assert.deepEqual(twice.result.alreadyOnProfile, ["Operations Lead"]);
});

test("education and certification stay entries, and a certification proposes a skill", () => {
  assert.equal(importTarget(EDUCATION), "entry");
  assert.equal(importTarget(CERT), "entry");
  assert.equal(importTarget(EXPERIENCE), "project");
  const folded = foldImport(emptyLedger(), [
    { candidate: EDUCATION, useId: null },
    { candidate: CERT, useId: null },
  ]);
  assert.equal(folded.state.projects.length, 0);
  assert.deepEqual(folded.state.entries.map((row) => row.kind).sort(), ["certification", "education"]);
  const proposed = proposeCertificationSkills([CERT]);
  const skill = proposed.find((item) => item.kind === "skill");
  assert.equal(skill.title, CERT.title);
  const catalog = [{ id: "s1", name: "Writing briefs", matchKey: "writingbriefs", aliases: [] }];
  const titled = proposeCertificationSkills([
    { ...CERT, title: "Writing briefs" },
  ]);
  const match = findExact(matchKey(titled.find((item) => item.kind === "skill").title), catalog);
  assert.equal(match.name, "Writing briefs");
  assert.match(ENRICHMENT_COPY.existing, /already in the system/i);
  assert.equal(linkedInReviewList("Ada Example\nEngineer\nNorthwind\n"), null);
});

test("peer profile shows adult depth and hides contact, children, answers, coaching, and progress", () => {
  const placements = [
    {
      track: "personality",
      taxonomy: "mbti",
      category: "intj",
      label: "Myers-Briggs",
      categoryLabel: "INTJ",
      confidencePct: 80,
      locked: true,
      unsettled: false,
    },
    {
      track: "skills",
      taxonomy: "skill_band",
      category: "strong",
      label: "Skill band",
      categoryLabel: "Strong",
      confidencePct: 78,
      locked: true,
      unsettled: false,
    },
    {
      track: "profile",
      taxonomy: "notice_band",
      category: "high",
      label: "Notice",
      categoryLabel: "High",
      confidencePct: 60,
      locked: false,
      unsettled: true,
    },
    {
      track: "skills",
      taxonomy: "skill_cluster",
      category: "open",
      label: "Cluster",
      categoryLabel: "Open",
      confidencePct: 40,
      locked: false,
      unsettled: false,
    },
  ];
  const peer = buildPeerProfile({
    kind: "adult",
    sameOrg: true,
    viewerAdult: true,
    displayName: "Ada Adult",
    photo: "/api/media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    headline: "Builds field schools",
    bio: "A short bio.",
    skills: [{ name: "Writing briefs", level: "strong" }],
    projects: [{ name: "Northwind", role: "Operations Lead", link: "https://fieldschool.ai/plates" }],
    entries: [
      { kind: "education", title: "BA Economics", organization: "Rochester", startedOn: "2013", endedOn: "2017" },
      { kind: "experience", title: "Operations Lead", organization: "Northwind", startedOn: "2022-03", endedOn: null },
      { kind: "certification", title: "Certified Scrum Product Owner", organization: "", startedOn: null, endedOn: null },
    ],
    placements,
    email: SECRET_EMAIL,
    phone: SECRET_PHONE,
    children: [{ name: SECRET_CHILD }],
    answers: [{ text: SECRET_ANSWER }],
    coaching: { note: SECRET_COACHING },
    progress: SECRET_PROGRESS,
  });
  assert.deepEqual(Object.keys(peer), [
    "displayName",
    "photo",
    "headline",
    "bio",
    "skills",
    "projects",
    "entries",
    "placements",
  ]);
  assert.equal(peer.displayName, "Ada Adult");
  assert.equal(peer.photo, "/api/media/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  assert.equal(peer.headline, "Builds field schools");
  assert.equal(peer.bio, "A short bio.");
  assert.deepEqual(peer.skills, [{ name: "Writing briefs", level: "strong" }]);
  assert.deepEqual(peer.projects, [{ name: "Northwind", role: "Operations Lead", link: "https://fieldschool.ai/plates" }]);
  assert.deepEqual(
    peer.entries.map((row) => row.kind),
    ["education", "certification"],
  );
  assert.deepEqual(
    peer.placements.map((row) => row.track),
    ["personality", "skills", "profile"],
  );
  assert.equal(peer.placements.find((row) => row.track === "profile").state, "unsettled");
  const dumped = JSON.stringify(peer);
  for (const secret of [SECRET_EMAIL, SECRET_PHONE, SECRET_CHILD, SECRET_ANSWER, SECRET_COACHING, SECRET_PROGRESS]) {
    assert.equal(dumped.includes(secret), false, secret);
  }
  assert.deepEqual(peerForbiddenKeys(peer), []);
  assert.deepEqual(
    shownPlacements("public", placements).map((row) => row.track),
    ["personality"],
  );
  assert.deepEqual(
    audienceCut("public", placements).map((row) => row.track),
    ["personality"],
  );
  assert.equal(buildPeerProfile({ ...peerInput(), kind: "child" }), null);
  assert.equal(buildPeerProfile({ ...peerInput(), sameOrg: false }), null);
  assert.equal(buildPeerProfile({ ...peerInput(), viewerAdult: false }), null);
});

function peerInput() {
  return {
    kind: "adult",
    sameOrg: true,
    viewerAdult: true,
    displayName: "Ada",
    photo: "",
    headline: "",
    bio: "",
    skills: [],
    projects: [],
    entries: [],
    placements: [],
  };
}

test("a person in development has no public or peer profile URL", () => {
  assert.deepEqual(
    profileUrls({
      kind: "child",
      sameOrg: true,
      viewerAdult: true,
      shareEnabled: true,
      slug: "bbbbbbbbbb",
      membershipId: MEMBERSHIP_ID,
    }),
    { publicUrl: null, peerUrl: null },
  );
  assert.deepEqual(
    profileUrls({
      kind: "adult",
      sameOrg: true,
      viewerAdult: true,
      shareEnabled: true,
      slug: "bbbbbbbbbb",
      membershipId: MEMBERSHIP_ID,
    }),
    { publicUrl: "/share/bbbbbbbbbb", peerUrl: `/people/${MEMBERSHIP_ID}` },
  );
  assert.equal(photoVisibleTo({ viewerKind: "adult", ownerKind: "child", sameOrg: true, isOwner: false }), false);
  assert.equal(photoVisibleTo({ viewerKind: "child", ownerKind: "adult", sameOrg: true, isOwner: true }), false);
  assert.equal(photoVisibleTo({ viewerKind: "adult", ownerKind: "adult", sameOrg: true, isOwner: false }), true);
  assert.equal(photoVisibleTo({ viewerKind: "adult", ownerKind: "adult", sameOrg: false, isOwner: false }), false);
});

test("concurrent gate merges keep both ids and the later lastAt", async () => {
  const early = new Date("2026-10-01T00:00:00.000Z");
  const later = new Date("2026-10-02T00:00:00.000Z");
  const forward = mergeGateMark(mergeGateMark({}, "G-skills", early), "G-other", later);
  const reverse = mergeGateMark(mergeGateMark({}, "G-other", later), "G-skills", early);
  assert.deepEqual(forward, reverse);
  assert.equal(forward["G-skills"].firstAt, early.toISOString());
  assert.equal(forward["G-other"].lastAt, later.toISOString());

  const laterFirst = mergeGateMark(mergeGateMark({}, "G-skills", later), "G-skills", early);
  const earlyFirst = mergeGateMark(mergeGateMark({}, "G-skills", early), "G-skills", later);
  assert.deepEqual(laterFirst, earlyFirst);
  assert.equal(laterFirst["G-skills"].firstAt, early.toISOString());
  assert.equal(laterFirst["G-skills"].lastAt, later.toISOString());

  let marks = {};
  let chain = Promise.resolve();
  const merge = (id, at) => {
    const run = chain.then(() => {
      marks = mergeGateMark(marks, id, at);
    });
    chain = run;
    return run;
  };
  await Promise.all([merge("G-skills", early), merge("G-other", later), merge("G-skills", later)]);
  assert.equal(marks["G-skills"].firstAt, early.toISOString());
  assert.equal(marks["G-skills"].lastAt, later.toISOString());
  assert.equal(marks["G-other"].firstAt, later.toISOString());

  const store = read("src/lib/profile/store.ts");
  const mergeSql = read("src/lib/profile/gate-merge.ts");
  assert.match(store, /writeGateMerge\(owner\.memberId, gate/);
  assert.match(store, /writeGateMerge\(owner\.memberId, "G-personality"/);
  assert.match(store, /mergeGateSpan\(marks, "G-personality"/);
  assert.doesNotMatch(store, /gates:\s*marks/);
  assert.match(mergeSql, /LEAST/);
  assert.match(mergeSql, /GREATEST/);
  assert.match(mergeSql, /jsonb_set/);
});

test("a resume PDF proposes entries and stops at the GL2 caps", async () => {
  assert.equal(decideResumeParse({ adult: false, taskMicros: 0, monthMicros: 0, nextMicros: 1 }).error, "adults_only");
  assert.equal(
    decideResumeParse({ adult: true, taskMicros: 0, monthMicros: RESEARCH_CAPS.perMonthUsdMicros, nextMicros: 1 }).error,
    "month_cap",
  );
  assert.equal(
    decideResumeParse({ adult: true, taskMicros: RESEARCH_CAPS.perTaskUsdMicros, monthMicros: 0, nextMicros: 1 }).error,
    "task_cap",
  );
  let calls = 0;
  const blocked = await proposeResumeEntries({
    text: "Ada Example, engineer.",
    adult: false,
    taskMicros: 0,
    monthMicros: 0,
    complete: async () => {
      calls += 1;
      return {};
    },
  });
  assert.equal(blocked.called, false);
  assert.equal(calls, 0);
  const capped = await proposeResumeEntries({
    text: "Ada Example, engineer.",
    adult: true,
    taskMicros: 0,
    monthMicros: RESEARCH_CAPS.perMonthUsdMicros,
    complete: async () => {
      calls += 1;
      return {};
    },
  });
  assert.equal(capped.error, "month_cap");
  assert.equal(calls, 0);
  const parsed = await proposeResumeEntries({
    text: "Ada Example\nEngineer at Northwind\n",
    adult: true,
    taskMicros: 0,
    monthMicros: 0,
    complete: async () => {
      calls += 1;
      return {
        entries: [
          { kind: "experience", title: "Engineer", organization: "Northwind", startedOn: "2020-01", endedOn: null },
          { kind: "education", title: "BA Economics", organization: "Rochester", startedOn: "2013", endedOn: "2017" },
          { kind: "certification", title: "Writing briefs", organization: "", startedOn: null, endedOn: null },
          { kind: "project", title: "Should drop", organization: "", startedOn: null, endedOn: null },
        ],
      };
    },
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.called, true);
  assert.equal(calls, 1);
  assert.equal(parsed.items.some((item) => item.kind === "experience"), true);
  assert.equal(parsed.items.some((item) => item.kind === "education"), true);
  assert.equal(parsed.items.some((item) => item.kind === "project"), false);
  assert.equal(parsed.items.some((item) => item.kind === "skill" && item.title === "Writing briefs"), true);
  assert.equal(resumeProposalsFromModel({ entries: [] }).length, 0);
  const resume = read("src/lib/enrichment/resume.ts");
  const run = read("src/lib/enrichment/resume-run.ts");
  assert.doesNotMatch(resume, /GROK_API_KEY|XAI_API_KEY/);
  assert.doesNotMatch(run, /GROK_API_KEY|XAI_API_KEY|console\.(log|info|debug)/);
  assert.match(run, /recordResearchSpend/);
  assert.match(run, /adults_only/);
  assert.match(read("src/app/api/profile/import/review/route.ts"), /proposeResumeForMember/);
  assert.doesNotMatch(read("src/app/api/profile/import/review/route.ts"), /fetch\(|linkedin\.com/);
});

test("migration 0031 is the only new file and the locks stay shut", () => {
  const sql = read("db/0031_pm4_profile.sql");
  assert.match(sql, /source IN \('self', 'linkedin', 'resume'\)/);
  assert.doesNotMatch(sql, /DROP TABLE|homeschool|living_brain|knowledge_nodes/i);
  assert.doesNotMatch(read("db/0029_gl2_gap_loop.sql"), /resume/);
  assert.doesNotMatch(read("db/0030_pm3_profile.sql"), /resume/);
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.equal(M9_METRICS.railPx, 240);
  assert.deepEqual(
    memberDoors("issue-368").map((door) => door.label),
    ["Learn", "Library", "You"],
  );
  assert.match(read("src/lib/billing/checkout-destination.ts"), /https:\/\/portal\.fieldschool\.ai/);
  assert.match(read("src/components/profile/people-profile-panel.tsx"), /data-entries/);
  assert.match(read("src/components/profile/people-profile-panel.tsx"), /data-placements/);
  assert.doesNotMatch(read("src/components/profile/people-profile-panel.tsx"), /email|coaching|progress|answers/);
});
