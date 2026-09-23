import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { memberHasPlatformAdmin } from "../src/lib/coaching/access.ts";
import { requireCoachingWrite } from "../src/lib/coaching/writes.ts";
import {
  COACHING_SKILLS,
  SALES_SKILLS,
  deskScoresRejection,
  personSurface,
  preferPlatformAdmin,
  refuseSkillScore,
  toPersonDto,
} from "../src/lib/campus-runtime/lessons.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("POST /api/coaching/scores is 403 when COACHING_WRITES is unset or 0", async () => {
  const previous = process.env.COACHING_WRITES;
  delete process.env.COACHING_WRITES;
  try {
    const unset = requireCoachingWrite();
    assert.ok(unset);
    assert.equal(unset.status, 403);
    assert.deepEqual(await unset.json(), { error: "writes_disabled" });
    const zero = requireCoachingWrite({ COACHING_WRITES: "0" });
    assert.equal(zero?.status, 403);
    assert.deepEqual(await zero.json(), { error: "writes_disabled" });
  } finally {
    if (previous === undefined) delete process.env.COACHING_WRITES;
    else process.env.COACHING_WRITES = previous;
  }

  const route = read("src/app/api/coaching/scores/route.ts");
  const gate = route.indexOf("const blocked = requireCoachingWrite()");
  const apply = route.indexOf("await applySkillScore(");
  assert.ok(gate >= 0 && apply > gate);
  assert.match(route, /if \(blocked\) return blocked/);
  assert.match(route, /source: "coach_override"/);
});

test("desk scores reject outside 1-4 and reject 0-100 slugs", () => {
  assert.equal(deskScoresRejection("sales", { discovery: 0 }), "score_rejected");
  assert.equal(deskScoresRejection("sales", { discovery: 5 }), "score_rejected");
  assert.equal(deskScoresRejection("sales", { discovery: 100 }), "score_rejected");
  assert.equal(deskScoresRejection("sales", { discovery: 1.5 }), "score_rejected");
  assert.equal(deskScoresRejection("household", { morning: 0 }), "score_rejected");
  assert.equal(deskScoresRejection("sales", { discovery: 3 }), null);
  assert.equal(deskScoresRejection("household", { chores: 4 }), null);
  for (const skill of COACHING_SKILLS) {
    assert.equal(deskScoresRejection("sales", { [skill.slug]: 3 }), "slug_rejected");
    assert.equal(skill.scale, "0-100");
  }
  assert.equal(SALES_SKILLS.some((skill) => skill.slug === "discovery"), true);
  assert.equal(COACHING_SKILLS.some((skill) => skill.slug === "coaching-discovery"), true);
  assert.equal(SALES_SKILLS.some((skill) => skill.slug === "coaching-discovery"), false);
  assert.equal(
    refuseSkillScore({ orgSlug: "sales", skillSlug: "discovery", scale: "0-100", score: 80 }),
    "desk_slug",
  );
  assert.equal(
    refuseSkillScore({ orgSlug: "household", skillSlug: "coaching-discovery", scale: "0-100", score: 80 }),
    "household",
  );
  assert.equal(
    refuseSkillScore({ orgSlug: "sales", skillSlug: "coaching-discovery", scale: "1-4", score: 80 }),
    "scale",
  );
  assert.equal(
    refuseSkillScore({ orgSlug: "sales", skillSlug: "coaching-discovery", scale: "0-100", score: 80 }),
    null,
  );

  const scores = read("src/lib/coaching/scores.ts");
  assert.match(scores, /onConflictDoNothing/);
  assert.match(scores, /COACHING_SKILLS/);
  assert.doesNotMatch(scores, /slug: "discovery"/);
  const skillsRoute = read("src/app/api/skills/route.ts");
  assert.match(skillsRoute, /deskScoresRejection/);
  assert.match(skillsRoute, /skillScale\(skill\.slug\) !== "1-4"/);
});

test("platformAdmin folds across memberships, including field-school while sales is active", () => {
  const folded = {
    memberships: [
      { id: "m-fs", orgId: "org-fs", memberId: "op", stance: "admin" },
      { id: "m-sales", orgId: "org-sales", memberId: "op", stance: "learner" },
    ],
    capabilities: [{ membershipId: "m-fs", capability: "platform_admin" }],
    links: [],
    wards: [],
  };
  assert.equal(memberHasPlatformAdmin(folded, "op"), true);
  assert.equal(
    memberHasPlatformAdmin(
      {
        memberships: [{ id: "m-sales", orgId: "org-sales", memberId: "op", stance: "learner" }],
        capabilities: [],
        links: [],
        wards: [],
      },
      "op",
    ),
    false,
  );
  assert.equal(preferPlatformAdmin(true, false), true);
  assert.equal(preferPlatformAdmin(undefined, false), false);
  assert.equal(preferPlatformAdmin(false, true), false);

  const me = read("src/app/api/me/route.ts");
  assert.match(me, /memberPlatformAdmin\(session\.member\.id\)/);
  assert.match(me, /platformAdmin/);
  const helper = read("src/lib/coaching/scores.ts");
  assert.match(helper, /memberHasPlatformAdmin\(/);
  assert.match(helper, /eq\(memberships\.memberId, memberId\)/);
  const chrome = read("src/components/chrome.tsx");
  assert.match(chrome, /platformAdmin=\{platformAdmin\}/);
  assert.match(chrome, /memberPlatformAdmin/);
  const shell = read("src/components/app-shell.tsx");
  assert.match(shell, /preferPlatformAdmin\(session\?\.platformAdmin, platformAdminProp\)/);
  assert.match(shell, /platformAdmin: platformAdminProp = false/);
  assert.match(shell, /href="\/card"/);
  assert.match(shell, /My card/);
  assert.match(shell, /Sign out/);
  assert.doesNotMatch(shell, /Help/);
});

test("own membership is the card view and the learner DTO omits hints", () => {
  assert.equal(personSurface("self", "self"), "card");
  assert.equal(personSurface("coach", "learner"), "coach");
  const card = toPersonDto(
    "card",
    { membershipId: "self" },
    { hints: ["secret"], reasoning: "because", hiddenNoteCount: 2 },
  );
  assert.equal("hints" in card, false);
  assert.equal("reasoning" in card, false);
  assert.equal("hiddenNoteCount" in card, false);
  const coach = toPersonDto(
    "coach",
    { membershipId: "learner" },
    { hints: ["secret"], reasoning: "because", hiddenNoteCount: 2 },
  );
  assert.deepEqual(coach.hints, ["secret"]);
  const page = read("src/app/people/[membershipId]/page.tsx");
  assert.match(page, /assertCanAccessMember/);
  assert.match(page, /skillStates/);
  assert.match(page, /personSurface/);
  assert.match(page, /toPersonDto/);
  assert.match(page, /data-surface=\{surface\}/);
  const events = read("src/lib/campus-runtime/events.ts");
  assert.match(events, /actor\?: \{ membershipId: string; stance: string \}/);
  assert.match(events, /actor\?\.membershipId \?\? subject\.membershipId/);
  const publicEvents = read("src/app/api/events/route.ts");
  assert.match(publicEvents, /"watch", "quiz", "assignment", "diagnostic"/);
  assert.doesNotMatch(publicEvents, /skill_override/);
});
