import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { acceptsAnswer, evaluate, neutralPrior } from "../src/lib/assessments/engine.ts";
import {
  WIZARD_COPY,
  answerFit,
  audienceCut,
  isExpired,
  priorFromBearing,
  readAnswers,
  runView,
  wizardRefusal,
} from "../src/lib/assessments/model.ts";
import { CEILINGS, trackDef } from "../src/lib/assessments/tracks.ts";
import { candidatesFromText, linkedinDate, parseProfileUrl, readCandidate } from "../src/lib/enrichment/linkedin.ts";
import { readPhoto } from "../src/lib/enrichment/media.ts";
import { parseAcceptance, parseProjectInput, parseSkillInput } from "../src/lib/enrichment/model.ts";
import { ENRICHMENT_COPY, cleanName, findExact, matchKey, suggest } from "../src/lib/enrichment/names.ts";
import { pdfText } from "../src/lib/enrichment/pdf-text.ts";
import { isPublicAddress, parsePhotoUrl } from "../src/lib/enrichment/photo-url.ts";
import { LINKEDIN_LINES, linkedinPdf } from "./fixtures/make-linkedin-pdf.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const code = (rel) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*(--|\/\/).*$/gm, "");

/** Answers every question with the highest or the middle choice and returns each state on the way. */
function respond(trackId, pick) {
  const def = trackDef(trackId);
  const prior = neutralPrior(def);
  const answers = [];
  const states = [evaluate(def, prior, answers)];
  while (states.at(-1).kind === "asking") {
    const state = states.at(-1);
    const values = state.next.choices.map((choice) => choice.value).sort((a, b) => a - b);
    const value = pick === "max" ? values.at(-1) : values[Math.floor((values.length - 1) / 2)];
    answers.push({ key: state.next.key, value });
    states.push(evaluate(def, prior, answers));
  }
  return { def, prior, answers, states, final: states.at(-1) };
}

const strongSkills = respond("skills", "max");
const neutralPersonality = respond("personality", "mid");

test("three tracks with the locked ceilings, run from one engine", () => {
  assert.deepEqual(CEILINGS, { personality: 50, skills: 24, profile: 24 });
  assert.deepEqual(
    ["personality", "skills", "profile"].map((id) => trackDef(id).gate),
    ["G-personality", "G-skills", "G-other"],
  );
  assert.deepEqual(
    trackDef("personality").taxonomies.map((t) => t.id),
    ["enneagram", "disc", "mbti", "field_pattern"],
  );
  assert.deepEqual(trackDef("skills").taxonomies.map((t) => t.id), ["skill_band", "skill_cluster"]);
  assert.deepEqual(
    trackDef("profile").taxonomies.map((t) => t.id),
    ["intelligence_lead", "notice_band", "decide_band", "learn_band"],
  );
});

test("no taxonomy locks before six informing answers, and locks at 75% or more", () => {
  for (const run of [strongSkills, respond("profile", "max"), respond("personality", "max")]) {
    for (const placement of run.final.placements.filter((p) => p.kind === "locked")) {
      assert.ok(placement.answered >= 6, `${placement.taxonomy} locked after ${placement.answered}`);
      assert.ok(placement.confidence >= 0.75, `${placement.taxonomy} at ${placement.confidence}`);
    }
  }
  for (const state of strongSkills.states.slice(0, 6)) {
    assert.ok(state.placements.every((p) => p.kind === "open"));
  }
  const band = strongSkills.final.placements.find((p) => p.taxonomy === "skill_band");
  assert.equal(band.kind, "locked");
  assert.equal(band.category, "principal");
});

test("Enneagram, DISC, and Myers-Briggs lock at 75% or higher and then hold", () => {
  const run = respond("personality", "max");
  for (const taxonomy of ["enneagram", "disc", "mbti"]) {
    const lockedAt = run.states.findIndex((state) =>
      state.placements.some((placement) => placement.taxonomy === taxonomy && placement.kind === "locked"),
    );
    assert.ok(lockedAt >= 6, `${taxonomy} locked at step ${lockedAt}`);
    const first = run.states[lockedAt].placements.find((placement) => placement.taxonomy === taxonomy);
    assert.equal(first.kind, "locked");
    assert.ok(first.confidence >= 0.75, `${taxonomy} at ${first.confidence}`);
    for (const state of run.states.slice(lockedAt)) {
      assert.deepEqual(
        state.placements.find((placement) => placement.taxonomy === taxonomy),
        first,
        taxonomy,
      );
    }
  }
});

test("a locked placement never moves on later answers", () => {
  const lockedAt = strongSkills.states.findIndex((s) => s.placements.some((p) => p.taxonomy === "skill_band" && p.kind === "locked"));
  assert.ok(lockedAt > 0);
  const first = strongSkills.states[lockedAt].placements.find((p) => p.taxonomy === "skill_band");
  for (const state of strongSkills.states.slice(lockedAt)) {
    assert.deepEqual(
      state.placements.find((p) => p.taxonomy === "skill_band"),
      first,
    );
  }
});

test("the ceiling ends a run with a best read flagged unsettled, and the run still finishes", () => {
  const { final, answers } = neutralPersonality;
  assert.equal(final.kind, "finished");
  assert.equal(final.outcome, "ceiling_unsettled");
  assert.equal(answers.length, 50);
  assert.ok(final.placements.every((p) => p.kind === "unsettled"));
  const view = runView(trackDef("personality"), "r", final);
  assert.equal(view.status, "ceiling_unsettled");
  assert.equal(view.next, null);
  assert.ok(view.placements.every((p) => p.state === "unsettled" && p.categoryLabel));
  assert.equal(WIZARD_COPY.unsettled, "We're not sure yet — here's our best read");
});

test("same prior and answers give the same state, so a run resumes from any prefix", () => {
  const { def, prior, answers, states } = strongSkills;
  for (let k = 0; k < answers.length; k += 1) {
    const resumed = evaluate(def, prior, answers.slice(0, k));
    assert.deepEqual(resumed, states[k]);
    assert.equal(resumed.next.key, answers[k].key);
  }
});

test("the track meter shows confidence progress, not a question count", () => {
  const view = runView(strongSkills.def, "r", strongSkills.states[3]);
  assert.ok(view.meter.progress > 0 && view.meter.progress < 1);
  assert.deepEqual(Object.keys(view.meter), ["progress", "taxonomies"]);
  assert.equal(runView(strongSkills.def, "r", strongSkills.final).meter.progress, 1);
});

test("only the asked item and one of its choices is accepted; a retry of the last answer is a repeat", () => {
  const { states, answers } = strongSkills;
  const asking = states[2];
  assert.equal(acceptsAnswer(asking, answers[2]), true);
  assert.equal(acceptsAnswer(asking, { key: answers[2].key, value: 99 }), false);
  assert.equal(acceptsAnswer(asking, answers[1]), false);
  assert.equal(answerFit(asking, answers.slice(0, 2), answers[1]), "repeat");
  assert.equal(answerFit(asking, answers.slice(0, 2), answers[0]), "reject");
  assert.throws(() => evaluate(strongSkills.def, strongSkills.prior, [{ key: "nope", value: 1 }]), /assessment_item_unknown/);
  const def = trackDef("skills");
  const one = answers[0];
  assert.equal(readAnswers(def, [one, one]), null);
  assert.equal(readAnswers(def, [{ key: one.key, value: 9 }]), null);
  assert.deepEqual(readAnswers(def, [one]), [one]);
});

test("adults only; a sales room keeps the Personality carve", () => {
  assert.equal(wizardRefusal({ kind: "child", orgSlug: "household" }, "skills"), "child_cannot_run_assessments");
  assert.equal(wizardRefusal({ kind: "child", orgSlug: "household" }, null), "child_cannot_run_assessments");
  assert.equal(wizardRefusal({ kind: "adult", orgSlug: "sales" }, "personality"), "not_on_sales_board");
  assert.equal(wizardRefusal({ kind: "adult", orgSlug: "sales" }, "skills"), null);
  assert.equal(wizardRefusal({ kind: "adult", orgSlug: "household" }, "personality"), null);
});

test("placements are labeled Field School estimates; public cut is Personality only", () => {
  assert.equal(WIZARD_COPY.estimate, "Field School estimate. Not an official MBTI®, Enneagram, or DISC result.");
  const rows = [
    { track: "personality", taxonomy: "mbti", category: "INTJ", confidencePct: 80, locked: true, unsettled: false },
    { track: "skills", taxonomy: "skill_band", category: "operator", confidencePct: 78, locked: true, unsettled: false },
  ];
  assert.deepEqual(audienceCut("public", rows).map((r) => r.taxonomy), ["mbti"]);
  assert.equal(audienceCut("self", rows).length, 2);
});

test("a Field Pattern Bearing pre-seeds the Personality prior; retention is 30 days", () => {
  const def = trackDef("personality");
  const dims = Object.fromEntries(def.dims.map((dim, i) => [dim, i === 0 ? 100 : 50]));
  assert.deepEqual(priorFromBearing(def, dims), { mean: [2, 0, 0, 0, 0, 0, 0, 0], scale: 0.5 });
  assert.equal(priorFromBearing(def, { drive: 50 }), null);
  const start = new Date("2026-09-01T00:00:00Z");
  assert.equal(isExpired(start, new Date("2026-10-01T00:00:00Z")), false);
  assert.equal(isExpired(start, new Date("2026-10-01T00:00:01Z")), true);
});

test("0019: one open run per track, raw answers only while open, placements additive", () => {
  const sql = code("db/0019_assessments.sql");
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS assessment_runs_one_open\s+ON assessment_runs \(member_id, track\) WHERE status = 'in_progress'/);
  assert.match(sql, /status IN \('in_progress', 'complete', 'ceiling_unsettled', 'expired'\)/);
  assert.match(sql, /CHECK \(locked <> unsettled\)/);
  assert.match(sql, /UNIQUE \(run_id, taxonomy\)/);
  assert.doesNotMatch(sql, /tool_results|(REFERENCES|ALTER TABLE|CREATE TABLE IF NOT EXISTS) (member_profiles|instrument_runs|skills)\b/);
});

test("0020: media owned by the User, photo FK pinned to the owner, catalog apart from coaching skills", () => {
  const sql = code("db/0020_profile_enrichment.sql");
  assert.match(sql, /FOREIGN KEY \(photo_media_id, member_id\) REFERENCES media \(id, owner_member_id\)/);
  assert.match(sql, /mime_type IN \('image\/jpeg', 'image\/png', 'image\/webp'\)/);
  assert.match(sql, /source_kind = 'url' AND source_url ~ '\^https:\/\/'/);
  for (const table of ["profile_skills", "profile_skill_links", "profile_projects", "profile_project_links", "profile_entries"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(`));
  }
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS (skills|skill_items|skill_states|tool_results|families|student_profiles|milestones)\b/);
  assert.doesNotMatch(sql, /kid_profiles/);
  assert.match(sql, /CONSTRAINT profile_skill_links_source CHECK \(\(source = 'linkedin'\) = \(imported_at IS NOT NULL\)\)/);
});

test("names: case, spacing, and punctuation never make a new item; aliases count", () => {
  assert.equal(cleanName("  Product   Strategy ", 80), "Product Strategy");
  assert.equal(cleanName("   ", 80), null);
  assert.equal(matchKey("Product-Strategy"), "productstrategy");
  assert.equal(matchKey("Ｐｒｏｄｕｃｔ strategy"), "productstrategy");
  assert.notEqual(matchKey("C++"), matchKey("C#"));
  assert.notEqual(matchKey("C++"), matchKey("C"));
  const known = [
    { id: "1", name: "Running an AI crew", matchKey: "runninganaicrew", aliases: ["ai crew", "ai agents"] },
    { id: "2", name: "Product Strategy", matchKey: "productstrategy", aliases: [] },
  ];
  assert.equal(findExact(matchKey("AI Crew"), known)?.id, "1");
  assert.equal(findExact(matchKey("product strategy!"), known)?.id, "2");
  assert.equal(findExact(matchKey("Strategy"), known), null);
  assert.deepEqual(suggest("Product Stratgy", known).map((k) => k.id), ["2"]);
  assert.equal(ENRICHMENT_COPY.addProject, "Add information about a new project");
  assert.equal(ENRICHMENT_COPY.addSkill, "Add information about a new skill");
  assert.equal(ENRICHMENT_COPY.existing, "This is already in the system");
});

test("skill and project input is checked at the boundary", () => {
  assert.deepEqual(parseSkillInput({ name: " SQL ", level: "strong" }), { name: "SQL", useId: null, level: "strong", notes: "" });
  assert.equal(parseSkillInput({ name: "SQL", level: "wizard" }), null);
  assert.equal(parseSkillInput({ name: "", useId: null }), null);
  assert.equal(parseSkillInput({ useId: "not-a-uuid" }), null);
  assert.equal(parseProjectInput({ name: "Barn", link: "http://x.test" }), null);
  assert.equal(parseProjectInput({ name: "Barn", link: "https://x.test/barn" })?.link, "https://x.test/barn");
});

function jpeg() {
  const seg = (marker, body) => [0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 0xff, ...body];
  const exif = [...Buffer.from("Exif\0\0GPS 43.15N 77.61W")];
  const sof = [8, 0, 30, 0, 40, 1, 1, 0x11, 0];
  return new Uint8Array([
    0xff, 0xd8,
    ...seg(0xe0, [...Buffer.from("JFIF\0"), 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    ...seg(0xe1, exif),
    ...seg(0xfe, [...Buffer.from("shot on a phone")]),
    ...seg(0xc0, sof),
    ...seg(0xda, [1, 1, 0, 0, 0x3f, 0]),
    0x12, 0x34, 0xff, 0xd9,
  ]);
}

function png() {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    return [...len, ...Buffer.from(type), ...data, 0, 0, 0, 0];
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(64, 0);
  ihdr.writeUInt32BE(48, 4);
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk("IHDR", [...ihdr]),
    ...chunk("tEXt", [...Buffer.from("Author\0Ada at home")]),
    ...chunk("IDAT", [1, 2, 3]),
    ...chunk("IEND", []),
  ]);
}

function webp() {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32LE(data.length);
    return [...Buffer.from(type), ...len, ...data, ...(data.length % 2 ? [0] : [])];
  };
  const vp8x = [0x08 | 0x04, 0, 0, 0, 99, 0, 0, 49, 0, 0];
  const body = [...Buffer.from("WEBP"), ...chunk("VP8X", vp8x), ...chunk("VP8L", [0x2f, 0, 0, 0, 0]), ...chunk("EXIF", [...Buffer.from("GPS here")])];
  const size = Buffer.alloc(4);
  size.writeUInt32LE(body.length);
  return new Uint8Array([...Buffer.from("RIFF"), ...size, ...body]);
}

test("photos: type from the bytes, size read, location and text metadata removed", () => {
  const j = readPhoto(jpeg());
  assert.equal(j.ok, true);
  assert.deepEqual([j.photo.mime, j.photo.width, j.photo.height], ["image/jpeg", 40, 30]);
  assert.doesNotMatch(Buffer.from(j.photo.bytes).toString("latin1"), /Exif|GPS|phone/);
  assert.match(Buffer.from(j.photo.bytes).toString("latin1"), /JFIF/);

  const p = readPhoto(png());
  assert.deepEqual([p.photo.mime, p.photo.width, p.photo.height], ["image/png", 64, 48]);
  assert.doesNotMatch(Buffer.from(p.photo.bytes).toString("latin1"), /tEXt|Ada at home/);

  const w = readPhoto(webp());
  assert.deepEqual([w.photo.mime, w.photo.width, w.photo.height], ["image/webp", 100, 50]);
  const out = Buffer.from(w.photo.bytes);
  assert.doesNotMatch(out.toString("latin1"), /EXIF|GPS/);
  assert.equal(out.readUInt32LE(4), out.length - 8);
  assert.equal(out[20] & 0x0c, 0);

  assert.deepEqual(readPhoto(new Uint8Array(Buffer.from("GIF89a....."))), { ok: false, error: "photo_type_unsupported" });
  assert.deepEqual(readPhoto(new Uint8Array(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))), {
    ok: false,
    error: "photo_type_unsupported",
  });
  assert.deepEqual(readPhoto(jpeg().subarray(0, 20)), { ok: false, error: "photo_unreadable" });
  assert.deepEqual(readPhoto(new Uint8Array(5 * 1024 * 1024 + 1)), { ok: false, error: "photo_too_large" });
});

test("photo links: https only, and only to public addresses", () => {
  assert.ok(parsePhotoUrl("https://images.example.com/me.jpg"));
  for (const bad of [
    "http://images.example.com/me.jpg",
    "https://user:pw@images.example.com/me.jpg",
    "https://images.example.com:8443/me.jpg",
    "https://127.0.0.1/me.jpg",
    "https://[::1]/me.jpg",
    "https://localhost/me.jpg",
    "javascript:alert(1)",
  ]) {
    assert.equal(parsePhotoUrl(bad), null, bad);
  }
  for (const address of ["10.1.2.3", "127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1", "::", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "::ffff:169.254.169.254"]) {
    assert.equal(isPublicAddress(address), false, address);
  }
  for (const address of ["8.8.8.8", "93.184.216.34", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) {
    assert.equal(isPublicAddress(address), true, address);
  }
});

const EXPECTED_IMPORT = [
  { id: "headline-0", kind: "headline", title: "Operations lead at Northwind", organization: "", startedOn: null, endedOn: null },
  { id: "skill-1", kind: "skill", title: "Writing Briefs", organization: "", startedOn: null, endedOn: null },
  { id: "skill-2", kind: "skill", title: "Product Strategy", organization: "", startedOn: null, endedOn: null },
  { id: "skill-3", kind: "skill", title: "TypeScript", organization: "", startedOn: null, endedOn: null },
  { id: "certification-4", kind: "certification", title: "Certified Scrum Product Owner", organization: "", startedOn: null, endedOn: null },
  { id: "experience-5", kind: "experience", title: "Operations Lead", organization: "Northwind", startedOn: "2022-03", endedOn: null },
  { id: "experience-6", kind: "experience", title: "Operations Analyst", organization: "Northwind", startedOn: "2020-09", endedOn: "2022-02" },
  { id: "experience-7", kind: "experience", title: "Project Coordinator", organization: "Contoso", startedOn: "2017-06", endedOn: "2020-08" },
  { id: "education-8", kind: "education", title: "Bachelor of Arts - BA, Economics", organization: "University of Rochester", startedOn: "2013", endedOn: "2017" },
];

test("LinkedIn: a profile link is a label only; the PDF export becomes a review list", async () => {
  assert.equal(parseProfileUrl("https://www.linkedin.com/in/ada-example/"), "https://www.linkedin.com/in/ada-example");
  assert.equal(parseProfileUrl("https://linkedin.com/in/ada-example"), "https://www.linkedin.com/in/ada-example");
  assert.equal(parseProfileUrl("https://www.linkedin.com/company/northwind"), null);
  assert.equal(parseProfileUrl("https://evil.example/in/ada"), null);
  assert.equal(parseProfileUrl("http://www.linkedin.com/in/ada-example"), null);
  assert.equal(linkedinDate("March 2022"), "2022-03");
  assert.equal(linkedinDate("Present"), null);

  assert.deepEqual(candidatesFromText(LINKEDIN_LINES.join("\n")), EXPECTED_IMPORT);
  const text = await pdfText(linkedinPdf());
  assert.deepEqual(candidatesFromText(text), EXPECTED_IMPORT);
  assert.equal(await pdfText(new Uint8Array(Buffer.from("not a pdf"))), null);
});

test("LinkedIn: accepted items are re-read, and an item cannot change kind or carry bad dates", () => {
  assert.deepEqual(readCandidate(EXPECTED_IMPORT[5]), EXPECTED_IMPORT[5]);
  assert.equal(readCandidate({ ...EXPECTED_IMPORT[5], kind: "admin" }), null);
  assert.equal(readCandidate({ ...EXPECTED_IMPORT[5], startedOn: "March 2022" }), null);
  const accepted = parseAcceptance({
    profileUrl: "https://www.linkedin.com/in/ada-example",
    items: [{ candidate: EXPECTED_IMPORT[1], useId: null }, { candidate: EXPECTED_IMPORT[5], useId: "8e7b1b52-63a4-4a0e-9a57-0a1f3c4f2d10" }],
  });
  assert.equal(accepted.profileUrl, "https://www.linkedin.com/in/ada-example");
  assert.deepEqual(accepted.items.map((item) => item.useId), [null, null]);
  assert.equal(parseAcceptance({ profileUrl: "https://evil.example/in/x", items: [{ candidate: EXPECTED_IMPORT[1] }] }), null);
  assert.equal(parseAcceptance({ items: [] }), null);
});

test("wiring: routes refuse before they act; photo is shown from campus only; no localStorage record", () => {
  const runs = code("src/app/api/assessments/runs/route.ts");
  assert.ok(runs.indexOf("wizardRefusal(") < runs.indexOf("openRun("));
  const answers = code("src/app/api/assessments/runs/[runId]/answers/route.ts");
  assert.ok(answers.indexOf("wizardRefusal(") < answers.indexOf("answerRun("));
  for (const rel of [
    "src/app/api/profile/photo/route.ts",
    "src/app/api/media/[id]/route.ts",
    "src/app/api/profile/enrichment/route.ts",
    "src/app/api/profile/enrichment/check/route.ts",
    "src/app/api/profile/skills/route.ts",
    "src/app/api/profile/projects/route.ts",
    "src/app/api/profile/import/review/route.ts",
    "src/app/api/profile/import/accept/route.ts",
  ]) {
    assert.match(code(rel), /await adultOnly\(request\)/, rel);
  }
  assert.match(code("src/app/api/media/[id]/route.ts"), /"X-Content-Type-Options": "nosniff"/);
  const review = code("src/app/api/profile/import/review/route.ts");
  assert.doesNotMatch(review, /fetch\(|fetchPhoto|linkedin\.com/);
  const page = code("src/app/profile/page.tsx");
  assert.match(page, /src=\{profile\.photoSrc\}/);
  assert.doesNotMatch(page, /src=\{profile\.photoUrl\}/);
  for (const rel of [
    "src/components/profile-m2/assessment-wizard.tsx",
    "src/components/profile-m2/enrichment-panel.tsx",
    "src/components/profile-m2/photo-panel.tsx",
  ]) {
    assert.doesNotMatch(code(rel), /localStorage|sessionStorage/, rel);
  }
  assert.doesNotMatch(code("src/app/profile/kids/[membershipId]/page.tsx"), /PhotoPanel|profile-m2/);
});

test("start, answer, resume, and result stay on the assessment routes", () => {
  const start = code("src/app/api/assessments/runs/route.ts");
  assert.match(start, /export async function POST/);
  assert.ok(start.indexOf("wizardRefusal(") < start.indexOf("openRun("));
  const answer = code("src/app/api/assessments/runs/[runId]/answers/route.ts");
  assert.match(answer, /export async function POST/);
  assert.ok(answer.indexOf("wizardRefusal(") < answer.indexOf("answerRun("));
  const resume = code("src/app/api/assessments/runs/[runId]/route.ts");
  assert.match(resume, /export async function GET/);
  assert.match(resume, /readRun\(/);
  assert.ok(resume.indexOf("wizardRefusal(") < resume.indexOf("return NextResponse.json"));
  const result = code("src/app/api/assessments/route.ts");
  assert.match(result, /export async function GET/);
  assert.ok(result.indexOf("wizardRefusal(") < result.indexOf("wizardOverview("));
  const store = code("src/lib/assessments/store.ts");
  assert.match(store, /export async function openRun/);
  assert.match(store, /export async function answerRun/);
  assert.match(store, /export async function readRun/);
  assert.match(store, /latest: done \? await storedPlacementView\(done\) : null/);
});

test("the adult profile shows finished reads, and a firm category is 75% or higher", () => {
  const page = code("src/app/profile/page.tsx");
  const results = code("src/components/profile-m2/assessment-results.tsx");
  assert.match(page, /<AssessmentResults \/>/);
  assert.match(results, /data-assessment-results/);
  assert.match(results, /placement\.state === "locked" && placement\.confidencePct >= 75/);
  assert.match(results, /Best read/);
  assert.doesNotMatch(results, /localStorage|sessionStorage/);
  assert.doesNotMatch(code("src/app/profile/kids/[membershipId]/page.tsx"), /AssessmentResults|NeuralWeb/);
});

test("a finished wizard run draws the neural web, and motion can be reduced", () => {
  const wizard = code("src/components/profile-m2/assessment-wizard.tsx");
  const web = code("src/components/profile-m2/neural-web.tsx");
  assert.ok(wizard.indexOf("run.next ?") < wizard.indexOf("<NeuralWeb"));
  assert.match(wizard, /<NeuralWeb title=\{label\(run\.track\)\} placements=\{run\.placements\} \/>/);
  assert.match(wizard, /const locked = placement\?\.state === "locked"/);
  assert.match(wizard, /locked \? " ✓" : ""/);
  assert.match(wizard, /placement\?\.state === "unsettled" \? placement\.confidencePct \/ 100 : meter\.progress/);
  assert.match(web, /data-neural-web/);
  assert.match(web, /animateMotion/);
  assert.match(web, /prefers-reduced-motion:\s*reduce/);
  assert.match(web, /neural-pulse \{ display: none; \}/);
  assert.doesNotMatch(web, /localStorage|sessionStorage/);
});

test("gate seam: Skills and Profile write gate freshness through one function only", () => {
  const sink = code("src/lib/assessments/gate-sink.ts");
  const store = code("src/lib/assessments/store.ts");
  assert.match(sink, /export async function recordTrackGate/);
  assert.match(sink, /saveToolResult\(/);
  assert.ok(sink.indexOf("saveToolResult(") < sink.indexOf("recordAdultGate("));
  assert.match(sink, /recordAdultGate\(/);
  assert.doesNotMatch(store, /recordAdultGate|tool_results|toolResults/);
  assert.match(store, /recordTrackGate\(/);
  assert.match(store, /finishGate\(owner, written, answers\)/);
});

test("a finished run writes a tool result only when every official item was answered", async () => {
  const { toolForGate, toolSubmissionFromRun } = await import("../src/lib/assessments/tool-bridge.ts");
  assert.equal(toolForGate("G-personality"), null);
  assert.equal(toolForGate("G-skills"), "skill");
  assert.equal(toolForGate("G-other"), "intelligence");
  const skill = ["brief", "logins", "ai", "tools", "ship", "track"].map((key) => ({ key, value: 4 }));
  const submission = toolSubmissionFromRun("skill", "3f6c1a52-8d4e-4b7a-9c21-0e5f7d8a9b10", [
    ...skill,
    { key: "brief-handoff", value: 2 },
  ]);
  assert.equal(submission?.toolSlug, "skill");
  assert.deepEqual(Object.keys(submission?.answers ?? {}).sort(), ["ai", "brief", "logins", "ship", "tools", "track"]);
  assert.equal(toolSubmissionFromRun("skill", "3f6c1a52-8d4e-4b7a-9c21-0e5f7d8a9b10", skill.slice(1)), null);
  assert.equal(
    toolSubmissionFromRun("intelligence", "3f6c1a52-8d4e-4b7a-9c21-0e5f7d8a9b10", [
      { key: "notice-signal", value: 4 },
    ]),
    null,
  );
});
