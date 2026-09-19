import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { familyOperatorCopy, panelFromFamilyApis } from "../src/lib/family/operator.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("API error codes become plain parent copy", () => {
  assert.equal(
    familyOperatorCopy("intent_required", "fail"),
    "Save a learning intent before proposing a path.",
  );
  assert.equal(
    familyOperatorCopy("path_required", "fail"),
    "Accept a curriculum path before suggesting a next portion.",
  );
  assert.equal(
    familyOperatorCopy("portion_required", "fail"),
    "Suggest a next portion before locking.",
  );
  assert.equal(familyOperatorCopy("not_your_child", "fail"), "not_your_child");
  assert.equal(familyOperatorCopy(undefined, "Could not save intent."), "Could not save intent.");
});

test("scripted empty Next refreshes after accept + suggest", () => {
  const empty = panelFromFamilyApis({ childName: "Ada" });
  assert.equal(empty.signals.next.empty, true);
  assert.equal(empty.signals.next.title, "");
  assert.equal(empty.intentVersion, null);
  assert.equal(empty.pathAccepted, false);
  assert.equal(empty.portionLocked, false);
  assert.match(empty.signals.now.copy, /No units complete yet for Ada/);
  assert.match(empty.signals.now.copy, /Save intent, then accept a path/);

  const afterIntent = panelFromFamilyApis({
    childName: "Ada",
    intent: { version: 1, subjects: ["math"], timeHorizon: "this term" },
  });
  assert.equal(afterIntent.intentVersion, 1);
  assert.equal(afterIntent.signals.next.empty, true);

  const afterSecondIntent = panelFromFamilyApis({
    childName: "Ada",
    intent: { version: 2, subjects: ["math", "reading"], timeHorizon: "this term" },
    path: {
      version: 1,
      status: "proposed",
      items: [{ title: "Fractions kitchen", subject: "math" }],
    },
  });
  assert.equal(afterSecondIntent.intentVersion, 2);
  assert.ok(afterSecondIntent.intentVersion > afterIntent.intentVersion);
  assert.equal(afterSecondIntent.pathAccepted, false);
  assert.equal(afterSecondIntent.signals.next.empty, true);

  const afterAcceptSuggestLock = panelFromFamilyApis({
    childName: "Ada",
    intent: { version: 2, subjects: ["math", "reading"], timeHorizon: "this term" },
    path: {
      version: 1,
      status: "accepted",
      items: [
        { title: "Fractions kitchen", subject: "math" },
        { title: "Writing a paragraph", subject: "writing" },
      ],
    },
    assigned: {
      version: 1,
      status: "accepted",
      items: [
        { title: "Fractions kitchen", subject: "math" },
        { title: "Writing a paragraph", subject: "writing" },
      ],
    },
    portion: {
      title: "Kitchen math",
      reason: "Remaining accepted-path stations for this child.",
      items: [{ title: "Fractions kitchen", subject: "math" }],
    },
    locked: {
      title: "Kitchen math",
      reason: "Remaining accepted-path stations for this child.",
      items: [{ title: "Fractions kitchen", subject: "math" }],
    },
  });
  assert.equal(afterAcceptSuggestLock.intentVersion, 2);
  assert.equal(afterAcceptSuggestLock.pathAccepted, true);
  assert.equal(afterAcceptSuggestLock.pathStatus, "accepted");
  assert.equal(afterAcceptSuggestLock.portionLocked, true);
  assert.equal(afterAcceptSuggestLock.signals.next.empty, false);
  assert.equal(afterAcceptSuggestLock.signals.next.title, "Kitchen math");
  assert.equal(afterAcceptSuggestLock.signals.next.locked, true);
  assert.deepEqual(afterAcceptSuggestLock.signals.next.items, [
    { title: "Fractions kitchen", subject: "math" },
  ]);
});

test("FamilyV1Home writes intent, path, and portion without cloning the desk", () => {
  const home = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const operator = read("src/lib/family/operator.ts");

  assert.match(home, /Save intent version/);
  assert.match(home, /Propose path/);
  assert.match(home, /Accept path/);
  assert.match(home, /Suggest next portion/);
  assert.match(home, /Lock portion/);
  assert.match(home, /method: "POST"/);
  assert.match(home, /\/api\/intent/);
  assert.match(home, /\/api\/curriculum/);
  assert.match(home, /\/api\/portion/);
  assert.match(home, /\/api\/ledger/);
  assert.match(home, /action: "accept"/);
  assert.match(home, /action: "lock"/);
  assert.match(home, /childMembershipId: child.membershipId/);
  assert.match(home, /familyOperatorCopy/);
  assert.match(home, /panelFromFamilyApis/);
  assert.match(home, /login none/);
  assert.match(home, /Intent \{intentVersion/);
  assert.match(home, /pathAccepted/);
  assert.match(home, /Portion \{locked \? "locked"/);
  assert.doesNotMatch(home, /Save edited path|Re-prompt path|Override portion/);
  assert.doesNotMatch(home, /type="email"|type='email'/);
  assert.doesNotMatch(home, /Student|child seat|fourth SKU/i);
  assert.doesNotMatch(home, /\/api\/chooser|\/api\/progress|\/api\/credits|\/api\/keys/);
  assert.doesNotMatch(home, /Knowledge brain|select-unit|growth unit/);
  assert.doesNotMatch(home, /Cap|Remotion|VOX|27pn9xs0zk8a73g/);

  assert.match(childrenDb, /<FamilyV1Home/);
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /Save intent version/);
  assert.match(childrenDb, /Propose path/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);

  assert.match(operator, /intent_required/);
  assert.match(operator, /path_required/);
  assert.match(operator, /portion_required/);
});

test("guest Grok Bot, AUTH_URL, Stripe, factory, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /family-v1-home|panelFromFamilyApis|familyOperatorCopy/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const progress = read("src/app/api/progress/route.ts");
  assert.match(progress, /reduceCourseProgress/);
  assert.doesNotMatch(progress, /panelFromFamilyApis|familyOperatorCopy/);
  const chooser = read("src/app/api/chooser/route.ts");
  assert.match(chooser, /chooseNext/);
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat|fourth/i);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.doesNotMatch(read("src/lib/family/operator.ts"), /2\.24\.64\.248|27pn9xs0zk8a73g|Remotion|VOX/);
  assert.doesNotMatch(read("src/components/family-v1-home.tsx"), /vite\.config|migrations\/0001/);
  assert.equal(existsSync(join(root, "src/app/family/page.tsx")), false);
  assert.equal(existsSync(join(root, "db/0012_family_operator.sql")), false);
});
