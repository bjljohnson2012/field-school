import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildFamilySignals,
  confidenceLabel,
  rollupConfidence,
} from "../src/lib/family/signals.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("Now / Confidence / Next hangs on the Child, not a User score", () => {
  const signals = buildFamilySignals({
    childName: "Ada",
    intent: { subjects: ["math", "reading"], timeHorizon: "this term" },
    pathItems: [
      { title: "Reading on the farm", subject: "reading" },
      { title: "Fractions kitchen", subject: "math" },
      { title: "Writing a paragraph", subject: "writing" },
    ],
    completed: [{ title: "Reading on the farm", subject: "reading", status: "completed", confidence: "ready" }],
    inProgress: [
      {
        title: "Fractions kitchen",
        subject: "math",
        status: "in_progress",
        confidence: "getting_there",
        flag: "stuck",
      },
    ],
    recommended: [{ title: "Writing a paragraph", subject: "writing", status: "recommended" }],
    units: [
      { title: "Reading on the farm", subject: "reading", status: "completed", confidence: "ready" },
      {
        title: "Fractions kitchen",
        subject: "math",
        status: "in_progress",
        confidence: "getting_there",
        flag: "stuck",
      },
      { title: "Writing a paragraph", subject: "writing", status: "recommended" },
    ],
    portion: {
      title: "Kitchen math",
      reason: "Remaining accepted-path stations for this child.",
      items: [{ title: "Fractions kitchen", subject: "math" }],
    },
    locked: true,
  });
  assert.match(signals.now.copy, /Math on this path are Getting there/);
  assert.match(signals.now.copy, /Revisit Fractions kitchen/);
  assert.equal(signals.now.coverageLabel, "1 of 3 units on this path");
  assert.match(signals.now.intentMatch, /reading covered/);
  assert.equal(signals.confidence.state, "getting_there");
  assert.equal(signals.confidence.label, "Getting there");
  assert.deepEqual(signals.confidence.stuck, ["Fractions kitchen"]);
  assert.equal(signals.next.locked, true);
  assert.equal(signals.next.items[0]?.title, "Fractions kitchen");
  assert.equal(signals.next.empty, false);
  assert.equal(confidenceLabel("not_yet"), "Not yet");
  assert.equal(rollupConfidence([{ confidence: "ready" }, { confidence: "ready" }]), "ready");
  const empty = buildFamilySignals({
    childName: "Ada",
    intent: null,
    pathItems: [],
    completed: [],
    inProgress: [],
    recommended: [],
    units: [],
    portion: null,
    locked: false,
  });
  assert.match(empty.now.copy, /No units complete yet for Ada/);
  assert.equal(empty.next.empty, true);
  assert.doesNotMatch(JSON.stringify(signals), /XP|streak|GPA|80% watched|\+50/);
});

test("dedicated child home reuses family APIs and stays off Wave 2 chrome strings", () => {
  const home = read("src/components/family-v1-home.tsx");
  const childrenDb = read("src/components/children-database.tsx");
  const childrenPage = read("src/app/children/page.tsx");
  const childrenApi = read("src/app/api/children/route.ts");

  assert.match(home, /Now \/ Confidence \/ Next/);
  assert.match(home, /Switch child/);
  assert.match(home, /Save child/);
  assert.match(home, />\s*Play\s*</);
  assert.match(home, />\s*Complete\s*</);
  assert.match(home, /login none/);
  assert.match(home, /\/api\/intent/);
  assert.match(home, /\/api\/curriculum/);
  assert.match(home, /\/api\/portion/);
  assert.match(home, /\/api\/ledger/);
  assert.match(home, /\/api\/brain/);
  assert.match(home, /\/api\/brain\/sync/);
  assert.match(home, /\/api\/children/);
  assert.match(home, /childMembershipId: child.membershipId/);
  assert.match(home, /markUnit\("start"/);
  assert.match(home, /markUnit\("complete"/);
  assert.match(home, /action: "confidence"/);
  assert.match(home, /placeholder="Child name"/);
  assert.doesNotMatch(home, /type="email"|type='email'/);
  assert.doesNotMatch(home, /Student|child seat|fourth SKU/i);
  assert.doesNotMatch(home, /\/api\/chooser|\/api\/progress|\/api\/credits|\/api\/keys/);
  assert.doesNotMatch(home, /Knowledge brain|select-unit|growth unit/);
  assert.doesNotMatch(home, /Cap|Remotion|VOX|27pn9xs0zk8a73g/);

  assert.match(childrenDb, /<FamilyV1Home/);
  assert.match(childrenDb, /Select child/);
  assert.match(childrenDb, /Add a child/);
  assert.match(childrenDb, /placeholder="Child name"/);
  assert.doesNotMatch(childrenDb, /Now \/ Confidence \/ Next/);
  assert.doesNotMatch(childrenDb, /Knowledge brain|\/api\/brain|select-unit|growth unit/);
  assert.doesNotMatch(childrenDb, /Student/);
  assert.doesNotMatch(childrenDb, /type="email"|type='email'/);

  assert.match(childrenPage, /<ChildrenDatabase/);
  assert.doesNotMatch(childrenPage, /Now \/ Confidence \/ Next|knowledge brain|composer|\/teach/i);

  assert.match(childrenApi, /login: "none"/);
  assert.match(childrenApi, /name_required/);
  assert.match(childrenApi, /\.set\(\{ name: nextName \}\)/);
  assert.match(childrenApi, /child\.\$\{randomBytes/);
  assert.doesNotMatch(childrenApi, /authUserId|password|oauth/i);
  assert.doesNotMatch(childrenApi, /\/api\/brain|knowledge_brains|growth_units/);
});

test("family mode stays a parent flag; no fourth SKU, no child login, no metering", () => {
  const plans = read("src/lib/billing/plans.ts");
  assert.match(plans, /LEARN_WITH_BEN_PLAN_IDS = \["100", "200", "1000"\]/);
  assert.doesNotMatch(plans, /homeschool|family seat|child seat|fourth/i);
  assert.doesNotMatch(plans, /credits|BYOK|customer_api_keys/);
  const home = read("src/components/family-v1-home.tsx");
  assert.match(home, /x-fs-org": "household"/);
  assert.doesNotMatch(home, /href: "\/family"|\/c\/grok-bot/);
  assert.equal(existsSync(join(root, "src/app/family/page.tsx")), false);
  assert.equal(existsSync(join(root, "db/0011_family_v1.sql")), false);
});

test("guest Grok Bot, AUTH_URL, factory, Track B, and frozen trees stay untouched", () => {
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /family-v1-home|\/api\/ledger|Now \/ Confidence/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const progress = read("src/app/api/progress/route.ts");
  assert.match(progress, /reduceCourseProgress/);
  assert.doesNotMatch(progress, /family-v1-home|buildFamilySignals/);
  const chooser = read("src/app/api/chooser/route.ts");
  assert.match(chooser, /chooseNext/);
  const header = read("src/components/site-header.tsx");
  assert.match(header, /href: "\/children"/);
  assert.doesNotMatch(header, /href: "\/family"/);
  const prompt = readRepo("docs/campus-runtime/CURSOR_AGENT_PROMPT.md");
  assert.match(prompt, /AUTH_URL is https:\/\/university\.benjohnson\.ai|AUTH_URL is https:\/\/portal\.fieldschool\.ai/);
  assert.doesNotMatch(read("src/lib/family/signals.ts"), /2\.24\.64\.248|27pn9xs0zk8a73g|Remotion|VOX/);
  assert.doesNotMatch(read("src/components/family-v1-home.tsx"), /vite\.config|migrations\/0001/);
  assert.doesNotMatch(read("src/app/api/children/route.ts"), /2\.24\.64\.248|27pn9xs0zk8a73g/);
});
