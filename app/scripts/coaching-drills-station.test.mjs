import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let target = src + "/" + specifier.slice(2);
    if (!/\\.(ts|tsx|js|mjs|cjs|json)$/.test(target)) target += ".ts";
    return nextResolve(pathToFileURL(target).href, context);
  }
  if (specifier.startsWith(".") && !/\\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const { coachingNav } = await import(pathToFileURL(join(src, "lib/coaching/nav.ts")).href);
const { recordDrillAttempt, DrillWriteError } = await import(
  pathToFileURL(join(src, "app/api/coaching/drills/write.ts")).href
);
const {
  drillShape,
  drillsForOrg,
  foreignSubject,
  improveLabel,
  pointsToLevel,
  pointsToNextLevel,
  scoreToPoints,
  skillsForShape,
  summarizeAttempts,
} = await import(pathToFileURL(join(src, "app/api/coaching/drills/math.ts")).href);
const { openDrillTicket, sealDrillTicket } = await import(
  pathToFileURL(join(src, "app/api/coaching/drills/ticket.ts")).href
);

const read = (rel) => readFileSync(join(root, rel), "utf8");

const subject = { orgId: "org-1", membershipId: "mem-1", stance: "learner" };

test("one drill action writes the attempt and a subject drill event", async () => {
  const calls = [];
  const saved = await recordDrillAttempt(
    {
      subject,
      skillCategory: "coaching-discovery",
      scenario: "The buyer says the price is the problem.",
      expectedBehaviors: ["Name the pain"],
      trapBehaviors: ["Discount immediately"],
      rubric: "Specific next step.",
      userResponse: "What would make this worth it this quarter?",
    },
    {
      grade: async (input) => {
        calls.push("grade");
        assert.equal(input.scenario, "The buyer says the price is the problem.");
        assert.equal(input.userResponse, "What would make this worth it this quarter?");
        return {
          score: 92,
          summary: "Named the value question.",
          didWell: ["Asked a value question"],
          toImprove: ["Name a date"],
          improvedExample: "Can we book Thursday?",
        };
      },
      insertAttempt: async (row) => {
        calls.push("insert");
        assert.equal(row.orgId, subject.orgId);
        assert.equal(row.membershipId, subject.membershipId);
        assert.equal(row.skillCategory, "coaching-discovery");
        assert.equal(row.status, "completed");
        assert.equal(row.pointsAwarded, scoreToPoints(92));
        assert.equal(row.aiScore, 92);
        return { id: "attempt-1" };
      },
      recordEvent: async (who, event, actor) => {
        calls.push("event");
        assert.equal(who.membershipId, subject.membershipId);
        assert.equal(event.kind, "drill");
        assert.equal(event.objectType, "drill");
        assert.equal(event.objectId, "attempt-1");
        assert.equal(actor.membershipId, subject.membershipId);
        assert.equal(actor.stance, subject.stance);
        return { id: "event-1" };
      },
    },
  );
  assert.deepEqual(calls, ["grade", "insert", "event"]);
  assert.equal(saved.id, "attempt-1");
  assert.equal(saved.pointsAwarded, 105);

  const skipped = [];
  await assert.rejects(
    () =>
      recordDrillAttempt(
        {
          subject,
          skillCategory: "coaching-discovery",
          scenario: "A scenario.",
          expectedBehaviors: [],
          trapBehaviors: [],
          rubric: "Rubric",
          userResponse: "Answer",
          requestedMembershipId: "someone-else",
        },
        {
          grade: async () => {
            skipped.push("grade");
            return { score: 10, summary: "", didWell: [], toImprove: [], improvedExample: "" };
          },
          insertAttempt: async () => {
            skipped.push("insert");
            return { id: "nope" };
          },
          recordEvent: async () => {
            skipped.push("event");
          },
        },
      ),
    (error) => error instanceof DrillWriteError && error.code === "subject_only",
  );
  assert.deepEqual(skipped, []);
});

test("points and streak come from completed attempts only", () => {
  assert.equal(pointsToLevel(0), 1);
  assert.equal(pointsToLevel(100), 2);
  assert.equal(pointsToLevel(10000), 12);
  assert.deepEqual(pointsToNextLevel(150), { current: 50, needed: 200, pct: 25 });
  assert.equal(scoreToPoints(95), 107);
  assert.equal(scoreToPoints(70), 58);
  assert.equal(scoreToPoints(50), 25);
  assert.equal(scoreToPoints(49), 5);

  const now = new Date(Date.UTC(2026, 8, 24, 15, 0, 0));
  const day = (offset) => new Date(Date.UTC(2026, 8, 24 - offset, 12, 0, 0));
  const stats = summarizeAttempts(
    [
      { pointsAwarded: 10, createdAt: day(2), status: "completed" },
      { pointsAwarded: 20, createdAt: day(1), status: "completed" },
      { pointsAwarded: 30, createdAt: day(0), status: "completed" },
      { pointsAwarded: 99, createdAt: day(0), status: "open" },
    ],
    now,
  );
  assert.equal(stats.totalPoints, 60);
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.longestStreak, 3);

  const gapped = summarizeAttempts(
    [
      { pointsAwarded: 5, createdAt: day(4), status: "completed" },
      { pointsAwarded: 5, createdAt: day(1), status: "completed" },
    ],
    now,
  );
  assert.equal(gapped.currentStreak, 1);
  assert.equal(gapped.longestStreak, 1);
});

test("drill ticket is sealed to the subject and skills stay on one shape", () => {
  const secret = "test-secret";
  const ticket = {
    membershipId: "mem-1",
    skillCategory: "coaching-discovery",
    scenario: "Buyer pauses.",
    expectedBehaviors: ["Wait"],
    trapBehaviors: ["Fill the silence"],
    rubric: "Stay with the pause.",
    exp: Date.now() + 60_000,
  };
  const token = sealDrillTicket(ticket, secret);
  assert.deepEqual(openDrillTicket(token, secret)?.scenario, "Buyer pauses.");
  assert.equal(openDrillTicket(token, "other"), null);
  assert.equal(openDrillTicket(token.slice(0, -2) + (token.endsWith("a") ? "b" : "a"), secret), null);
  assert.equal(openDrillTicket(sealDrillTicket({ ...ticket, exp: Date.now() - 5 }, secret), secret), null);
  assert.equal(foreignSubject("mem-1", { membershipId: "mem-2" }), true);
  assert.equal(foreignSubject("mem-1", { actorMembershipId: "mem-1" }), false);
  assert.equal(foreignSubject("mem-1", {}), false);
  assert.equal(drillsForOrg("company"), true);
  assert.equal(drillsForOrg("sales"), true);
  assert.equal(drillsForOrg("homeschool"), false);
  assert.equal(drillShape("learner", []), "AE");
  assert.equal(drillShape("learner", ["coach"]), "LEADER");
  assert.equal(skillsForShape("AE").some((skill) => skill.slug === "leadership"), false);
  assert.equal(skillsForShape("LEADER").every((skill) => skill.audience === "coach"), true);
  assert.equal(improveLabel({ improveButtonLabel: "  Practice  " }), "Practice");
  assert.equal(improveLabel({}), "Improve");
});

test("coaching drill mutate is one POST gated before identity, and events stay unchanged", () => {
  const route = read("src/app/api/coaching/drills/route.ts");
  const postAt = route.indexOf("export async function POST");
  const getAt = route.indexOf("export async function GET");
  assert.ok(getAt >= 0 && postAt > getAt);
  const getBody = route.slice(getAt, postAt);
  const postBody = route.slice(postAt);
  assert.match(getBody, /generateDrillPrompt/);
  assert.doesNotMatch(getBody, /recordDrillAttempt|requireCoachingWrite/);
  assert.match(postBody, /identityFromRequest/);
  const gate = postBody.indexOf("const blocked = requireCoachingWrite()");
  assert.ok(gate > 0);
  assert.equal(postBody.slice(0, gate).includes("await "), false);
  assert.equal(postBody.split("recordDrillAttempt(").length - 1, 1);
  assert.doesNotMatch(postBody, /generateDrillPrompt/);
  assert.match(route, /kind === "child"/);
  assert.match(route, /foreignSubject/);
  assert.match(route, /desk\.open/);

  const write = read("src/app/api/coaching/drills/write.ts");
  assert.match(write, /kind: "drill"/);
  assert.match(write, /membershipId: input\.subject\.membershipId/);
  assert.match(write, /stance: input\.subject\.stance/);
  assert.match(write, /from "@\/lib\/ai\/prompts\/drills"/);
  assert.doesNotMatch(write, /lib\/ai\/client|reduceCourseProgress|generateDrillPrompt/);

  const persist = read("src/app/api/coaching/drills/persist.ts");
  assert.match(persist, /insert\(drillAttempts\)/);
  assert.match(persist, /recordEvent\(/);
  assert.match(persist, /actor\.membershipId/);

  const events = read("src/app/api/events/route.ts");
  assert.match(events, /const KINDS = new Set\(\["watch", "quiz", "assignment", "diagnostic"\]\)/);
  assert.doesNotMatch(events, /drill/);

  const guarded = [
    "src/app/api/coaching/drills/route.ts",
    "src/app/api/coaching/drills/write.ts",
    "src/app/api/coaching/drills/persist.ts",
    "src/app/api/coaching/drills/load.ts",
    "src/app/improve/page.tsx",
    "src/app/improve/drill-runner.tsx",
  ];
  for (const rel of guarded) {
    const source = read(rel);
    assert.doesNotMatch(source, /reduceCourseProgress/, rel);
    assert.doesNotMatch(source, /AUTH_URL/, rel);
    assert.doesNotMatch(source, /COACHING_WRITES\s*=/, rel);
    assert.doesNotMatch(source, /COACHING_SHELL\s*=/, rel);
  }
});

test("station, panels, and pattern use AE cards and primary buttons", () => {
  const files = {
    quiz: read("src/components/quiz-panel.tsx"),
    assignment: read("src/components/assignment-panel.tsx"),
    station: read("src/app/c/[courseSlug]/s/[slug]/page.tsx"),
    pattern: read("src/app/pattern/page.tsx"),
    improve: read("src/app/improve/page.tsx"),
    runner: read("src/app/improve/drill-runner.tsx"),
  };
  for (const [name, source] of Object.entries(files)) {
    assert.match(source, /className="card/, name);
    assert.doesNotMatch(source, /components\/ui\/button/, name);
  }
  for (const name of ["quiz", "assignment", "station", "pattern", "runner"]) {
    assert.match(files[name], /btn-primary/, name);
  }
  assert.match(files.assignment, /className="input/);
  assert.match(files.pattern, /className="input/);
  assert.match(files.runner, /className="input/);
  assert.match(files.station, /className="h-page/);
  assert.match(files.pattern, /className="h-page/);
  assert.match(files.improve, /className="h-page/);
  assert.match(files.quiz, /shareTitle/);
  assert.match(files.quiz, /ToolResultActions/);
  assert.match(files.station, /kind: "watch"/);
  assert.match(files.station, /kind: "assignment"/);
  assert.match(files.station, /kind: "quiz"/);
  assert.doesNotMatch(files.station, /kind: "drill"/);
  assert.doesNotMatch(files.station, /reduceCourseProgress/);
  assert.match(files.pattern, /child subset from the pinned fp-50-v1/);
  assert.match(files.pattern, /search\.get\("child"\)/);
  assert.match(files.pattern, /membership_id: childMembershipId/);
  assert.match(files.improve, /redirect\("\/login\?next=\/improve"\)/);
  assert.match(files.improve, /identityFromRequest/);
  assert.match(files.runner, /method: "POST"/);
  assert.equal(files.runner.split('method: "POST"').length - 1, 1);
});

test("sales learner Improve nav is ready and household stays without it", () => {
  const learner = coachingNav({ orgKind: "sales", capabilities: [], platformAdmin: false });
  const improve = learner.find((item) => item.label === "Improve");
  assert.equal(improve?.href, "/improve");
  assert.equal(improve?.disabled, false);
  assert.equal(learner.find((item) => item.href === "/quizzes")?.disabled, true);
  const coach = coachingNav({ orgKind: "sales", capabilities: ["coach"], platformAdmin: false });
  assert.equal(coach.some((item) => item.href === "/improve"), false);
  const home = coachingNav({ orgKind: "household", capabilities: [], platformAdmin: false });
  assert.equal(home.some((item) => item.href === "/improve"), false);
});
