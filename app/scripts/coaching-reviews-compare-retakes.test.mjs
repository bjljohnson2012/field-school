import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const repo = join(root, "..");
const src = join(root, "src");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const { onlyReviewCoach, adjustedScore, followUpRecommendationRow, resolveReviewSkillSlug } = await import(
  pathToFileURL(join(src, "app/coaching/reviews/policy.ts")).href
);
const {
  canSeeDirectorTypeLabels,
  hasVpLink,
  hideDirectorOnlyRecommendations,
  presentDirectorTypes,
  viewerIsLearner,
} = await import(pathToFileURL(join(src, "app/coaching/compare/policy.ts")).href);
const { tasksBadgeCount, coachSeesRetake } = await import(
  pathToFileURL(join(src, "app/tasks/retake-policy.ts")).href
);
const { requireCoachingWrite } = await import(pathToFileURL(join(src, "lib/coaching/writes.ts")).href);
const { coachingNav } = await import(pathToFileURL(join(src, "lib/coaching/nav.ts")).href);
const { assertCanAccessMember } = await import(pathToFileURL(join(src, "lib/coaching/access.ts")).href);

function gateIsFirst(source, name) {
  const handler = source.indexOf(`export async function ${name}`);
  const gate = source.indexOf("const blocked = requireCoachingWrite()", handler);
  assert.ok(handler >= 0 && gate > handler, name);
  const between = source.slice(handler, gate);
  assert.equal(between.includes("await "), false, name);
  assert.equal(between.includes("getDb("), false, name);
}

test("submit is only the review coach and scores use monthly_review", () => {
  assert.equal(onlyReviewCoach({ coachMembershipId: "coach" }, "coach"), true);
  assert.equal(onlyReviewCoach({ coachMembershipId: "coach" }, "peer"), false);
  assert.equal(adjustedScore(70, 10), 80);
  assert.equal(adjustedScore(98, 15), 100);
  assert.equal(adjustedScore(4, -10), 0);
  assert.equal(resolveReviewSkillSlug("DISCOVERY"), "coaching-discovery");
  const row = followUpRecommendationRow({
    title: "Next call",
    description: "Review the last demo.",
    category: "LEADERSHIP",
    routeTo: "coach",
  });
  assert.equal(row.source, "monthly_review");
  assert.equal(row.routeTo, "coach");
  assert.equal(followUpRecommendationRow({ title: "", description: "x" }), null);

  const submit = read("src/app/api/coaching/reviews/submit.ts");
  assert.match(submit, /summarizeMonthlyReview\(/);
  assert.match(submit, /from "@\/lib\/ai\/prompts\/loop"/);
  assert.match(submit, /applySkillScore\(/);
  assert.match(submit, /actor: coach/);
  assert.match(submit, /source: "monthly_review"/);
  assert.match(submit, /loadSubjectIdentity\(input\.actor\.membershipId\)/);
  assert.match(submit, /insert\(recommendations\)/);
  assert.match(submit, /onlyReviewCoach\(review, input\.actor\.membershipId\)/);
  assert.match(submit, /assertCanAccessMember\(input\.world, input\.actor, review\.subjectMembershipId\)/);
  const coachCheck = submit.indexOf("onlyReviewCoach(review");
  const summaryCall = submit.indexOf("await summarizeMonthlyReview");
  const scoreCall = submit.indexOf("await applySkillScore");
  assert.ok(coachCheck >= 0 && coachCheck < summaryCall && summaryCall < scoreCall);

  const route = read("src/app/api/coaching/reviews/[id]/submit/route.ts");
  gateIsFirst(route, "POST");
  assert.match(route, /if \(blocked\) return blocked/);
  assert.match(route, /submitMonthlyReview\(/);
  assert.doesNotMatch(submit + route, /lib\/ai\/client/);
});

test("requireCoachingWrite is 403 writes_disabled when unset or 0", async () => {
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
  for (const rel of [
    "src/app/api/coaching/reviews/route.ts",
    "src/app/api/coaching/reviews/[id]/route.ts",
    "src/app/api/coaching/reviews/[id]/submit/route.ts",
    "src/app/api/coaching/compare/aes/route.ts",
    "src/app/api/coaching/compare/directors/route.ts",
  ]) {
    gateIsFirst(read(rel), "POST");
  }
  const action = read("src/app/tasks/retake-actions.ts");
  const fn = action.indexOf("export async function decideRetake");
  const gate = action.indexOf("const blocked = requireCoachingWrite()", fn);
  assert.ok(fn >= 0 && gate > fn);
  assert.equal(action.slice(fn, gate).includes("await "), false);
});

test("compare hides director-only recommendations and other director type labels", () => {
  const rows = [
    { title: "Learner task", routeTo: "learner", category: "SALES_SKILL" },
    { title: "Coach note", routeTo: "coach", category: "GENERAL" },
    { title: "Personality", routeTo: "learner", category: "PERSONALITY" },
  ];
  assert.equal(hideDirectorOnlyRecommendations(rows, true).length, 1);
  assert.equal(hideDirectorOnlyRecommendations(rows, false).length, 3);
  assert.equal(viewerIsLearner({ stance: "learner", capabilities: [], platformAdmin: false }), true);
  assert.equal(viewerIsLearner({ stance: "coach", capabilities: [], platformAdmin: false }), false);

  const hidden = { enneagramType: "9", discProfile: "S", mbtiType: "INFP" };
  assert.deepEqual(presentDirectorTypes(hidden, false), {
    enneagramType: null,
    discProfile: null,
    mbtiType: null,
  });
  assert.equal(presentDirectorTypes(hidden, true).mbtiType, "INFP");

  const peer = {
    actorMembershipId: "coach-a",
    subjectMembershipId: "coach-b",
    stance: "coach",
    capabilities: [],
    platformAdmin: false,
    vpLink: false,
  };
  assert.equal(canSeeDirectorTypeLabels(peer), false);
  assert.equal(canSeeDirectorTypeLabels({ ...peer, stance: "leader" }), true);
  assert.equal(canSeeDirectorTypeLabels({ ...peer, stance: "admin" }), true);
  assert.equal(canSeeDirectorTypeLabels({ ...peer, actorMembershipId: "coach-b" }), true);
  assert.equal(canSeeDirectorTypeLabels({ ...peer, vpLink: true }), true);
  assert.equal(
    hasVpLink(
      [{ orgId: "org", coachMembershipId: "vp", subjectMembershipId: "coach-b", kind: "vp" }],
      "org",
      "vp",
      "coach-b",
    ),
    true,
  );
  assert.equal(
    hasVpLink(
      [{ orgId: "org", coachMembershipId: "coach-a", subjectMembershipId: "ae", kind: "director" }],
      "org",
      "coach-a",
      "coach-b",
    ),
    false,
  );

  const aes = read("src/app/api/coaching/compare/load.ts");
  assert.match(aes, /generateCompareNarrative\(/);
  assert.match(aes, /generatePersonalityComparison\(/);
  assert.match(aes, /hideDirectorOnlyRecommendations\(/);
  assert.match(aes, /canSeeDirectorTypeLabels\(/);
  assert.match(aes, /presentDirectorTypes\(/);
  assert.match(aes, /assertCanAccessMember/);
  assert.match(read("src/app/api/coaching/compare/aes/route.ts"), /compareAes\(/);
  assert.match(read("src/app/api/coaching/compare/directors/route.ts"), /compareDirectors\(/);
  assert.doesNotMatch(aes, /lib\/ai\/client/);
});

test("retakes stay on tasks and the badge adds open retake requests for coaches with work items", () => {
  assert.equal(
    tasksBadgeCount({ openWorkItems: 2, hasWorkItems: true, isCoach: true, openRetakes: 3 }),
    5,
  );
  assert.equal(
    tasksBadgeCount({ openWorkItems: 2, hasWorkItems: false, isCoach: true, openRetakes: 3 }),
    2,
  );
  assert.equal(
    tasksBadgeCount({ openWorkItems: 2, hasWorkItems: true, isCoach: false, openRetakes: 3 }),
    2,
  );
  assert.equal(
    coachSeesRetake({
      isCoach: true,
      actorMembershipId: "coach",
      requesterMembershipId: "ae",
      canAccessRequester: true,
    }),
    true,
  );
  assert.equal(
    coachSeesRetake({
      isCoach: false,
      actorMembershipId: "ae",
      requesterMembershipId: "ae",
      canAccessRequester: true,
    }),
    false,
  );

  const page = read("src/app/tasks/page.tsx");
  const section = read("src/app/tasks/retake-section.tsx");
  const loader = read("src/app/tasks/retakes.ts");
  assert.match(page, /RetakeSection/);
  assert.match(page, /loadCoachRetakes/);
  assert.match(loader, /retakeRequests/);
  assert.match(loader, /coachSeesRetake/);
  assert.match(section, /Retake requests/);
  assert.doesNotMatch(page + section + loader, /\/quizzes|tokenHash|adHocQuizzes/);
  const count = read("src/app/api/coaching/tasks/count/route.ts");
  assert.match(count, /tasksBadgeCount\(/);
  assert.match(count, /retakeRequests/);
  assert.match(count, /countOpenTasks\(/);
  const badge = read("src/components/tasks-nav-badge.tsx");
  assert.match(badge, /\/api\/coaching\/tasks\/count/);
});

test("Reviews is a real link and Compare is not in center nav", () => {
  const nav = read("src/lib/coaching/nav.ts");
  const ready = nav.slice(nav.indexOf("const READY"), nav.indexOf("function item"));
  assert.match(ready, /"\/coaching\/reviews"/);
  assert.doesNotMatch(ready, /"\/coaching\/compare"/);
  assert.doesNotMatch(nav, /Compare/);
  const coachNav = coachingNav({ orgKind: "sales", capabilities: ["coach"], platformAdmin: false });
  const reviews = coachNav.find((item) => item.href === "/coaching/reviews");
  assert.equal(reviews?.label, "Reviews");
  assert.equal(reviews?.disabled, false);
  assert.equal(coachNav.some((item) => item.href === "/coaching/compare" || item.label === "Compare"), false);
  assert.equal(coachNav.some((item) => item.href === "/tasks" || item.label === "Tasks"), false);

  const person = read("src/app/people/[membershipId]/page.tsx");
  assert.match(person, /href=\{`\/coaching\/reviews\?subject=\$\{subject\.membershipId\}`\}/);
  assert.match(person, /Reviews/);
  assert.match(person, />Files</);
  assert.match(person, />Tasks</);
  assert.equal(person.includes("/files"), false);
  assert.equal(person.includes('href="/tasks"'), false);
  const filesAt = person.indexOf(">Files<");
  const tasksAt = person.lastIndexOf(">Tasks<");
  assert.match(person.slice(filesAt - 220, filesAt), /<span/);
  assert.doesNotMatch(person.slice(filesAt - 220, filesAt), /href=/);
  assert.match(person.slice(tasksAt - 220, tasksAt), /<span/);
  assert.doesNotMatch(person.slice(tasksAt - 220, tasksAt), /href=/);

  const ui = [read("src/app/coaching/reviews/page.tsx"), read("src/app/coaching/reviews/reviews-panel.tsx")].join("\n");
  assert.match(ui, /h-page/);
  assert.match(ui, /btn-primary/);
  assert.match(ui, /className="input/);
  assert.match(ui, /className="card/);
  assert.match(ui, /No pending reviews/);
  assert.match(ui, /Open/);
  assert.match(ui, /Submit/);
});

test("access stays on the reporting chain and client.ts is untouched", () => {
  const world = {
    memberships: [
      { id: "coach", orgId: "org", memberId: "m-coach", stance: "coach" },
      { id: "ae", orgId: "org", memberId: "m-ae", stance: "learner" },
      { id: "peer", orgId: "org", memberId: "m-peer", stance: "coach" },
    ],
    capabilities: [],
    links: [{ orgId: "org", coachMembershipId: "coach", subjectMembershipId: "ae", kind: "director" }],
    wards: [],
  };
  const coach = { membershipId: "coach", memberId: "m-coach", orgId: "org", stance: "coach" };
  const peer = { membershipId: "peer", memberId: "m-peer", orgId: "org", stance: "coach" };
  assert.equal(assertCanAccessMember(world, coach, "ae")?.id, "ae");
  assert.equal(assertCanAccessMember(world, peer, "ae"), null);

  const status = execSync("git status --porcelain -- app/src/lib/ai/client.ts", { cwd: repo }).toString();
  assert.equal(status.trim(), "");
  const watched = [
    "src/app/api/coaching/reviews/submit.ts",
    "src/app/api/coaching/reviews/route.ts",
    "src/app/api/coaching/reviews/[id]/route.ts",
    "src/app/api/coaching/reviews/[id]/submit/route.ts",
    "src/app/api/coaching/compare/load.ts",
    "src/app/api/coaching/compare/aes/route.ts",
    "src/app/api/coaching/compare/directors/route.ts",
    "src/app/coaching/reviews/page.tsx",
    "src/app/coaching/reviews/reviews-panel.tsx",
    "src/app/coaching/compare/page.tsx",
    "src/app/coaching/compare/compare-panel.tsx",
    "src/app/tasks/page.tsx",
    "src/app/tasks/retakes.ts",
    "src/app/tasks/retake-actions.ts",
    "src/lib/coaching/nav.ts",
  ]
    .map(read)
    .join("\n");
  assert.doesNotMatch(watched, /lib\/ai\/client/);
  assert.doesNotMatch(watched, /AUTH_URL/);
  assert.doesNotMatch(watched, /COACHING_WRITES\s*=/);
  assert.doesNotMatch(watched, /COACHING_SHELL/);
});
