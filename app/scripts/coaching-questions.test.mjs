import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import {
  canAuthorQuestions,
  canMutateQuestion,
  questionVisible,
  visibleQuestions,
} from "../src/app/api/coaching/questions/access.ts";
import { coachingNav } from "../src/lib/coaching/nav.ts";
import { requireCoachingWrite } from "../src/lib/coaching/writes.ts";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const platformAdmin = { platformAdmin: true, capabilities: [], orgId: "org-a" };
const leader = { platformAdmin: false, capabilities: ["leader"], orgId: "org-a" };
const orgAdmin = { platformAdmin: false, capabilities: ["admin"], orgId: "org-a" };
const coach = { platformAdmin: false, capabilities: ["coach"], orgId: "org-a" };
const learner = { platformAdmin: false, capabilities: ["learner"], orgId: "org-a" };

function authorStatus(actor) {
  return canAuthorQuestions(actor) ? 200 : 403;
}

test("platform_admin and leader can author; org admin, coach, and learner are 403", () => {
  assert.equal(authorStatus(platformAdmin), 200);
  assert.equal(authorStatus(leader), 200);
  assert.equal(authorStatus(orgAdmin), 403);
  assert.equal(authorStatus(coach), 403);
  assert.equal(authorStatus(learner), 403);

  const bank = [
    { id: "platform", orgId: null },
    { id: "ours", orgId: "org-a" },
    { id: "secret", orgId: "org-b" },
  ];
  assert.deepEqual(
    visibleQuestions(leader, bank).map((row) => row.id),
    ["platform", "ours"],
  );
  assert.deepEqual(
    visibleQuestions(platformAdmin, bank).map((row) => row.id),
    ["platform", "ours"],
  );
  assert.equal(questionVisible(leader, { orgId: null }), true);
  assert.equal(questionVisible(orgAdmin, { orgId: "org-a" }), false);
  assert.equal(visibleQuestions(coach, bank).length, 0);
});

test("platform row mutate is platform_admin only", () => {
  const platformRow = { orgId: null };
  assert.equal(canMutateQuestion(platformAdmin, platformRow) ? 200 : 403, 200);
  assert.equal(canMutateQuestion(leader, platformRow) ? 200 : 403, 403);
  assert.equal(questionVisible(leader, platformRow), true);
  assert.equal(canMutateQuestion(leader, { orgId: "org-a" }) ? 200 : 403, 200);
  assert.equal(canMutateQuestion(platformAdmin, { orgId: "org-a" }) ? 200 : 403, 200);
  assert.equal(canMutateQuestion(leader, { orgId: "org-b" }), false);
  assert.equal(canMutateQuestion(orgAdmin, platformRow), false);
});

test("requireCoachingWrite is 403 when writes are off and mutating routes call it first", async () => {
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
    ["src/app/api/coaching/questions/route.ts", ["POST"]],
    ["src/app/api/coaching/questions/[id]/route.ts", ["PATCH", "DELETE"]],
    ["src/app/api/coaching/questions/generate/route.ts", ["POST"]],
    ["src/app/api/coaching/questions/enhance/route.ts", ["POST"]],
    ["src/app/api/coaching/questions/smart-bulk/route.ts", ["POST"]],
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

  const api = [
    "src/app/api/coaching/questions/generate/route.ts",
    "src/app/api/coaching/questions/enhance/route.ts",
    "src/app/api/coaching/questions/smart-bulk/route.ts",
    "src/app/api/coaching/questions/persist.ts",
    "src/app/api/coaching/questions/access.ts",
  ]
    .map(read)
    .join("\n");
  assert.match(api, /generateQuestions\(/);
  assert.match(api, /enhanceMcOption\(/);
  assert.match(api, /generateSmartBulkQuestions\(/);
  assert.doesNotMatch(api, /selectQuizQuestions/);
  assert.doesNotMatch(api, /lib\/ai\/client/);
});

test("READY includes /coaching/questions and org admin nav lacks Questions", () => {
  const nav = read("src/lib/coaching/nav.ts");
  const ready = nav.slice(nav.indexOf("const READY"), nav.indexOf("function item"));
  assert.match(ready, /"\/coaching\/questions"/);

  const leaderNav = coachingNav({ orgKind: "sales", capabilities: ["leader"], platformAdmin: false });
  const questions = leaderNav.find((item) => item.href === "/coaching/questions");
  assert.equal(questions?.label, "Questions");
  assert.equal(questions?.disabled, false);

  const platformNav = coachingNav({ orgKind: "sales", capabilities: [], platformAdmin: true });
  assert.equal(platformNav.find((item) => item.href === "/coaching/questions")?.disabled, false);

  const adminNav = coachingNav({ orgKind: "sales", capabilities: ["admin"], platformAdmin: false });
  assert.equal(
    adminNav.some((item) => item.label === "Questions" || item.href === "/coaching/questions"),
    false,
  );
  const coachNav = coachingNav({ orgKind: "sales", capabilities: ["coach"], platformAdmin: false });
  assert.equal(coachNav.some((item) => item.href === "/coaching/questions"), false);

  const ui = ["src/app/coaching/questions/page.tsx", "src/app/coaching/questions/questions-editor.tsx"]
    .map(read)
    .join("\n");
  assert.match(ui, /h-page/);
  assert.match(ui, /btn-primary/);
  assert.match(ui, /className="input/);
  assert.match(ui, /className="card/);
  assert.match(ui, /No questions in this bank yet/);
});
