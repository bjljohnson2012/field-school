import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const { assertCanAccessMember } = await import(pathToFileURL(join(src, "lib/coaching/access.ts")).href);
const { requireCoachingWrite } = await import(pathToFileURL(join(src, "lib/coaching/writes.ts")).href);

function visibleNoteRows(rows, actorMembershipId, subjectMembershipId) {
  if (actorMembershipId === subjectMembershipId) return rows.filter((row) => row.visibleToLearner);
  return rows;
}

function explicitProfileConfirm(value) {
  return value === true;
}

const world = {
  memberships: [
    { id: "coach", orgId: "org", memberId: "m-coach", stance: "coach" },
    { id: "ae", orgId: "org", memberId: "m-ae", stance: "learner" },
    { id: "other", orgId: "org", memberId: "m-other", stance: "learner" },
  ],
  capabilities: [],
  links: [{ orgId: "org", coachMembershipId: "coach", subjectMembershipId: "ae", kind: "director" }],
  wards: [],
};

const actor = (membershipId, memberId, stance) => ({ membershipId, memberId, orgId: "org", stance });

const files = [
  "src/lib/coaching/audit.ts",
  "src/app/api/coaching/notes/route.ts",
  "src/app/api/coaching/notes/[id]/route.ts",
  "src/app/api/coaching/plans/route.ts",
  "src/app/api/coaching/plans/run.ts",
  "src/app/api/coaching/plans/[id]/retry/route.ts",
  "src/app/api/coaching/preps/route.ts",
  "src/app/api/coaching/preps/run.ts",
  "src/app/api/coaching/preps/profile.ts",
  "src/app/api/coaching/preps/[id]/retry/route.ts",
  "src/app/people/[membershipId]/page.tsx",
  "src/app/people/[membershipId]/notes/page.tsx",
  "src/app/people/[membershipId]/notes/notes-panel.tsx",
  "src/app/people/[membershipId]/plan/page.tsx",
  "src/app/people/[membershipId]/plan/plan-panel.tsx",
  "src/app/people/[membershipId]/prep/page.tsx",
  "src/app/people/[membershipId]/prep/prep-panel.tsx",
];

test("notes default hidden and the composer toggle starts off", () => {
  const rows = [
    { id: "hidden", visibleToLearner: false },
    { id: "shown", visibleToLearner: true },
  ];
  assert.deepEqual(
    visibleNoteRows(rows, "ae", "ae").map((row) => row.id),
    ["shown"],
  );
  assert.deepEqual(
    visibleNoteRows(rows, "coach", "ae").map((row) => row.id),
    ["hidden", "shown"],
  );
  const route = read("src/app/api/coaching/notes/route.ts");
  assert.match(route, /visibleToLearner: body\.visibleToLearner === true/);
  assert.match(route, /actorMembershipId === subjectMembershipId/);
  assert.match(route, /row\.visibleToLearner/);
  const panel = read("src/app/people/[membershipId]/notes/notes-panel.tsx");
  assert.match(panel, /useState\(false\)/);
  assert.match(panel, /Visible to learner/);
});

test("visibility flip calls writeCoachingAudit", () => {
  const flip = read("src/app/api/coaching/notes/[id]/route.ts");
  const audit = read("src/lib/coaching/audit.ts");
  assert.match(audit, /export async function writeCoachingAudit/);
  assert.match(audit, /auditLogs/);
  assert.match(flip, /writeCoachingAudit\(/);
  assert.match(flip, /coaching_note\.visibility/);
  const call = flip.indexOf("writeCoachingAudit(");
  const update = flip.indexOf("update(coachingNotes)");
  assert.ok(update >= 0 && call > update);
});

test("plans and preps persist generating, ready, and failed, and expose retry", () => {
  const plans = [read("src/app/api/coaching/plans/run.ts"), read("src/app/api/coaching/plans/route.ts")].join("\n");
  const preps = [read("src/app/api/coaching/preps/run.ts"), read("src/app/api/coaching/preps/route.ts")].join("\n");
  for (const source of [plans, preps]) {
    assert.match(source, /"generating"/);
    assert.match(source, /"ready"/);
    assert.match(source, /"failed"/);
  }
  assert.match(plans, /generateCoachingPlan\(/);
  assert.match(plans, /from "@\/lib\/ai\/prompts\/plans"/);
  assert.match(read("src/app/api/coaching/plans/[id]/retry/route.ts"), /export async function POST/);
  assert.match(read("src/app/api/coaching/plans/[id]/retry/route.ts"), /retryPlan\(/);
  assert.match(preps, /generateOneOnOnePrep\(/);
  assert.match(preps, /crossReferencePrepDoc\(/);
  assert.match(preps, /prepDocText/);
  assert.match(preps, /oneOnOnePreps/);
  assert.match(read("src/app/api/coaching/preps/[id]/retry/route.ts"), /retryPrep\(/);
  assert.doesNotMatch(preps, /prep_docs|prepDocs|cross_refs|crossRefs/);
});

test("requireCoachingWrite is 403 when writes are off and mutates call it first", async () => {
  const previous = process.env.COACHING_WRITES;
  delete process.env.COACHING_WRITES;
  try {
    const unset = requireCoachingWrite();
    assert.equal(unset.status, 403);
    assert.deepEqual(await unset.json(), { error: "writes_disabled" });
    process.env.COACHING_WRITES = "0";
    const zero = requireCoachingWrite();
    assert.equal(zero.status, 403);
    assert.deepEqual(await zero.json(), { error: "writes_disabled" });
  } finally {
    if (previous === undefined) delete process.env.COACHING_WRITES;
    else process.env.COACHING_WRITES = previous;
  }

  const routes = [
    ["src/app/api/coaching/notes/route.ts", ["POST"]],
    ["src/app/api/coaching/notes/[id]/route.ts", ["PATCH"]],
    ["src/app/api/coaching/plans/route.ts", ["POST"]],
    ["src/app/api/coaching/plans/[id]/retry/route.ts", ["POST"]],
    ["src/app/api/coaching/preps/route.ts", ["POST"]],
    ["src/app/api/coaching/preps/[id]/retry/route.ts", ["POST"]],
  ];
  for (const [rel, names] of routes) {
    const source = read(rel);
    for (const name of names) {
      const handler = source.indexOf(`export async function ${name}`);
      const gate = source.indexOf("const blocked = requireCoachingWrite()", handler);
      assert.ok(handler >= 0 && gate > handler, `${rel} ${name}`);
      const between = source.slice(handler, gate);
      assert.equal(between.includes("await "), false, rel);
      assert.equal(between.includes("getDb("), false, rel);
    }
    assert.match(source, /if \(blocked\) return blocked/);
  }
});

test("access uses assertCanAccessMember and a learner keeps the card view", () => {
  const coach = actor("coach", "m-coach", "coach");
  const ae = actor("ae", "m-ae", "learner");
  const other = actor("other", "m-other", "learner");
  assert.equal(assertCanAccessMember(world, coach, "ae")?.id, "ae");
  assert.equal(assertCanAccessMember(world, ae, "ae")?.id, "ae");
  assert.equal(assertCanAccessMember(world, other, "ae"), null);

  const notes = read("src/app/api/coaching/notes/route.ts");
  const flip = read("src/app/api/coaching/notes/[id]/route.ts");
  const plans = read("src/app/api/coaching/plans/run.ts");
  const preps = read("src/app/api/coaching/preps/run.ts");
  for (const source of [notes, flip, plans, preps]) {
    assert.match(source, /assertCanAccessMember/);
  }

  const page = read("src/app/people/[membershipId]/page.tsx");
  assert.match(page, /surface === "coach"/);
  assert.match(page, /href=\{`\/people\/\$\{subject\.membershipId\}\/notes`\}/);
  assert.match(page, /href=\{`\/people\/\$\{subject\.membershipId\}\/plan`\}/);
  assert.match(page, /href=\{`\/people\/\$\{subject\.membershipId\}\/prep`\}/);
  assert.match(page, />Tasks</);
  assert.match(page, />Reviews</);
  assert.match(page, />Files</);
  assert.equal(page.includes('href="/tasks"'), false);
  assert.equal(page.includes("/reviews"), false);
  assert.equal(page.includes("/files"), false);
  assert.match(read("src/app/people/[membershipId]/notes/page.tsx"), /coach=\{surface === "coach"\}/);
});

test("routes do not open a second AI client and profile writes require confirm", () => {
  const joined = files.map(read).join("\n");
  assert.doesNotMatch(joined, /lib\/ai\/client/);
  assert.doesNotMatch(joined, /AUTH_URL/);
  assert.doesNotMatch(joined, /COACHING_WRITES\s*=/);

  assert.equal(explicitProfileConfirm(undefined), false);
  assert.equal(explicitProfileConfirm(false), false);
  assert.equal(explicitProfileConfirm("true"), false);
  assert.equal(explicitProfileConfirm(true), true);

  const profile = read("src/app/api/coaching/preps/profile.ts");
  const run = read("src/app/api/coaching/preps/run.ts");
  assert.match(profile, /return value === true/);
  const guard = profile.indexOf("if (!confirmed) return null");
  const update = profile.indexOf("update(coachingProfiles)");
  assert.ok(guard >= 0 && update > guard);
  assert.match(run, /explicitProfileConfirm\(options\.confirmProfile\)/);
  assert.match(run, /applyConfirmedProfile\(/);
  assert.doesNotMatch(run, /update\(coachingProfiles\)/);
  assert.ok(run.indexOf("generateOneOnOnePrep") < run.indexOf("applyConfirmedProfile"));
  const failed = run.indexOf('status: "failed"');
  const confirm = run.indexOf("explicitProfileConfirm(options.confirmProfile)");
  assert.ok(failed >= 0 && confirm > failed);
});

test("pages use AE tokens", () => {
  const ui = [
    "src/app/people/[membershipId]/notes/page.tsx",
    "src/app/people/[membershipId]/notes/notes-panel.tsx",
    "src/app/people/[membershipId]/plan/page.tsx",
    "src/app/people/[membershipId]/plan/plan-panel.tsx",
    "src/app/people/[membershipId]/prep/page.tsx",
    "src/app/people/[membershipId]/prep/prep-panel.tsx",
  ]
    .map(read)
    .join("\n");
  assert.match(ui, /h-page/);
  assert.match(ui, /className="card/);
  assert.match(ui, /btn-primary/);
  assert.match(ui, /className="input/);
  assert.match(read("src/app/people/[membershipId]/prep/prep-panel.tsx"), /useState\(false\)/);
  assert.match(read("src/app/people/[membershipId]/prep/prep-panel.tsx"), /Confirm coaching profile update/);
});
