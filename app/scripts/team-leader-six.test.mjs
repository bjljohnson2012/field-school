import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { SALES_SLUG } from "../src/lib/campus-runtime/rules.ts";
import {
  AUTH_URL,
  LESSON_SPINE_PLAY,
  LESSON_SPINE_SHA,
  TEAM_ORG,
  fireLeaderSession,
  readTeamPortion,
  teammateWork,
} from "../src/lib/team/leader-session.ts";

const ORG = "org-sales-1";
const leader = {
  membershipId: "mem-leader",
  memberId: "member-leader",
  email: "leader@fieldschool.ai",
  name: "Hired Leader",
  kind: "adult",
  orgId: ORG,
  orgSlug: "sales",
  stance: "trainer",
};
const teammate = {
  membershipId: "mem-teammate",
  memberId: "member-teammate",
  email: "teammate@fieldschool.ai",
  name: "Teammate",
  kind: "adult",
  orgId: ORG,
  orgSlug: "sales",
  stance: "learner",
};

function tempStore() {
  const dir = mkdtempSync(join(tmpdir(), "team-six-"));
  return { dir, path: join(dir, "team-leader-session.json") };
}

test("one leader session fires the team six", () => {
  assert.equal(TEAM_ORG, SALES_SLUG);
  assert.equal(AUTH_URL, "https://portal.fieldschool.ai");
  const store = tempStore();
  try {
    const fired = fireLeaderSession(
      leader,
      teammate,
      { goals: ["Leave a dated next step"], portion: "lock" },
      store.path,
    );
    assert.equal(fired.ok, true);
    if (!fired.ok) return;
    assert.equal(fired.events.length, 6);
    assert.equal(fired.events[0].event, "signed_in");
    assert.equal(fired.events[0].authUrl, AUTH_URL);
    assert.equal(fired.events[0].hired, true);
    assert.equal(fired.events[1].event, "teammate_selected");
    assert.equal(fired.events[1].buyer, false);
    assert.notEqual(fired.record.teammateMembershipId, fired.record.leaderMembershipId);
    assert.equal(fired.events[2].event, "work");
    assert.equal(fired.events[2].play, LESSON_SPINE_PLAY);
    assert.equal(fired.events[2].spine, "LessonSpine");
    assert.equal(fired.events[2].sha256, LESSON_SPINE_SHA);
    assert.equal(fired.events[2].completed, true);
    assert.equal(fired.events[3].event, "intent");
    assert.equal(fired.events[3].owner, "leader");
    assert.equal(fired.events[3].ownerMembershipId, leader.membershipId);
    assert.equal(fired.events[4].event, "path");
    assert.equal(fired.events[4].owner, "leader");
    assert.equal(fired.events[4].teammateMembershipId, teammate.membershipId);
    assert.equal(fired.events[5].event, "portion");
    assert.equal(fired.events[5].shown, true);
    assert.equal(fired.events[5].status, "locked");
    assert.equal(fired.events[5].availableWithoutConversation, true);
    assert.equal(fired.record.teammateBuys, false);
    assert.equal(fired.record.teammateOwnsPath, false);
    assert.equal(fired.record.teammateMaySignIn, true);
    const raw = JSON.stringify(fired.record);
    assert.equal(raw.includes("1000"), false);
    assert.equal(raw.includes("\"price\""), false);
    assert.equal(raw.includes("sku"), false);
    console.log(JSON.stringify({ command: "fireLeaderSession", events: fired.events }));

    const later = readTeamPortion(teammate.membershipId, store.path);
    assert.equal(later.ok, true);
    if (!later.ok) return;
    assert.equal(later.record.portion.status, "locked");
    assert.equal(later.record.portion.availableWithoutConversation, true);
    assert.equal(later.record.portion.title, "LessonSpine Ready / HLS");
    console.log(JSON.stringify({ command: "readTeamPortion", portion: later.record.portion.status }));

    const work = teammateWork(teammate, "work", store.path);
    assert.equal(work.ok, true);
    if (!work.ok) return;
    assert.equal(work.record.portion.leaderMembershipId, leader.membershipId);
    assert.equal(work.record.teammateBuys, false);
    assert.equal(work.record.teammateOwnsPath, false);
    console.log(JSON.stringify({ command: "teammateWork", buys: false, ownsPath: false }));

    const buy = teammateWork(teammate, "buy", store.path);
    assert.equal(buy.ok, false);
    if (buy.ok) return;
    assert.equal(buy.error, "teammate_does_not_buy");
    const own = teammateWork(teammate, "own", store.path);
    assert.equal(own.ok, false);
    if (own.ok) return;
    assert.equal(own.error, "teammate_does_not_own_path");
  } finally {
    rmSync(store.dir, { recursive: true, force: true });
  }
});

test("leader override holds the next portion for the teammate", () => {
  const store = tempStore();
  try {
    const fired = fireLeaderSession(
      leader,
      teammate,
      { portion: "override", overrideTitle: "Qualification call before noon" },
      store.path,
    );
    assert.equal(fired.ok, true);
    if (!fired.ok) return;
    assert.equal(fired.record.portion.status, "overridden");
    assert.equal(fired.record.portion.shown, true);
    const later = readTeamPortion(teammate.membershipId, store.path);
    assert.equal(later.ok, true);
    if (!later.ok) return;
    assert.equal(later.record.portion.title, "Qualification call before noon");
    assert.equal(later.record.portion.availableWithoutConversation, true);
  } finally {
    rmSync(store.dir, { recursive: true, force: true });
  }
});

test("team room rejects the buyer as teammate, a child, and the household org", () => {
  const store = tempStore();
  try {
    const same = fireLeaderSession(leader, { ...leader }, {}, store.path);
    assert.equal(same.ok, false);
    const child = fireLeaderSession(
      leader,
      { ...teammate, kind: "child" },
      {},
      store.path,
    );
    assert.equal(child.ok, false);
    if (child.ok) return;
    assert.equal(child.error, "child_not_in_team_room");
    const household = fireLeaderSession(
      { ...leader, orgSlug: "household", stance: "guardian" },
      { ...teammate, orgSlug: "household" },
      {},
      store.path,
    );
    assert.equal(household.ok, false);
    const hirePath = fireLeaderSession(leader, teammate, {}, "/tmp/supervised-intent.json");
    assert.equal(hirePath.ok, false);
    if (hirePath.ok) return;
    assert.equal(hirePath.error, "hire_path_store");
  } finally {
    rmSync(store.dir, { recursive: true, force: true });
  }
});

test("team files stay off hire-path and family lanes", () => {
  const lib = readFileSync(new URL("../src/lib/team/leader-session.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../src/app/api/team/session/route.ts", import.meta.url), "utf8");
  const blob = lib + route;
  assert.equal(blob.includes("lib/progress/supervised"), false);
  assert.equal(blob.includes("from \"@/lib/progress"), false);
  assert.equal(blob.includes("family-v1-home"), false);
  assert.equal(blob.includes("children-database"), false);
  assert.equal(/from ["'][^"']*learning_intents/.test(blob), false);
  assert.equal(/from ["'][^"']*curriculum_paths/.test(blob), false);
  assert.equal(blob.includes("/api/progress"), false);
  assert.equal(blob.includes("/api/intent"), false);
  assert.equal(blob.includes("/api/brain"), false);
  assert.equal(blob.includes("$100"), false);
  assert.equal(blob.includes("$200"), false);
  assert.equal(blob.includes("$1,000"), false);
});
