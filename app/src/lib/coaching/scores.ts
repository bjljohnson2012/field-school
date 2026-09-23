import { and, eq, inArray } from "drizzle-orm";
import { recordEvent } from "@/lib/campus-runtime/events";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import {
  COACHING_SKILLS,
  refuseSkillScore,
} from "@/lib/campus-runtime/lessons";
import { getDb } from "@/lib/db/client";
import {
  coachingLinks,
  members,
  membershipCapabilities,
  memberships,
  organizations,
  skillObservations,
  skillStates,
  skills,
  wards,
} from "@/lib/db/schema";
import {
  memberHasPlatformAdmin,
  type Actor,
  type CoachingWorld,
} from "@/lib/coaching/access";

export class SkillScoreError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.name = "SkillScoreError";
    this.code = code;
  }
}

export function canCoachOverride(world: CoachingWorld, actor: Actor) {
  if (memberHasPlatformAdmin(world, actor.memberId)) return true;
  if (actor.stance === "coach" || actor.stance === "leader" || actor.stance === "admin") {
    return true;
  }
  return world.capabilities.some(
    (row) =>
      row.membershipId === actor.membershipId &&
      (row.capability === "coach" || row.capability === "leader" || row.capability === "admin"),
  );
}

export async function memberPlatformAdmin(memberId: string) {
  const db = getDb();
  const rows = await db.select().from(memberships).where(eq(memberships.memberId, memberId));
  if (!rows.length) return false;
  const caps = await db
    .select()
    .from(membershipCapabilities)
    .where(
      inArray(
        membershipCapabilities.membershipId,
        rows.map((row) => row.id),
      ),
    );
  return memberHasPlatformAdmin(
    {
      memberships: rows.map((row) => ({
        id: row.id,
        orgId: row.orgId,
        memberId: row.memberId,
        stance: row.stance,
      })),
      capabilities: caps.map((row) => ({
        membershipId: row.membershipId,
        capability: row.capability,
      })),
      links: [],
      wards: [],
    },
    memberId,
  );
}

export async function loadCoachingWorld(actor: { memberId: string; orgId: string }): Promise<CoachingWorld> {
  const db = getDb();
  const orgRows = await db.select().from(memberships).where(eq(memberships.orgId, actor.orgId));
  const memberRows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.memberId, actor.memberId));
  const byId = new Map<string, (typeof orgRows)[number]>();
  for (const row of [...orgRows, ...memberRows]) byId.set(row.id, row);
  const ids = [...byId.keys()];
  const caps = ids.length
    ? await db
        .select()
        .from(membershipCapabilities)
        .where(inArray(membershipCapabilities.membershipId, ids))
    : [];
  const linkRows = await db.select().from(coachingLinks).where(eq(coachingLinks.orgId, actor.orgId));
  const wardRows = await db.select().from(wards).where(eq(wards.orgId, actor.orgId));
  return {
    memberships: [...byId.values()].map((row) => ({
      id: row.id,
      orgId: row.orgId,
      memberId: row.memberId,
      stance: row.stance,
    })),
    capabilities: caps.map((row) => ({
      membershipId: row.membershipId,
      capability: row.capability,
    })),
    links: linkRows.flatMap((row) => {
      if (row.kind !== "director" && row.kind !== "vp") return [];
      return [
        {
          orgId: row.orgId,
          coachMembershipId: row.coachMembershipId,
          subjectMembershipId: row.subjectMembershipId,
          kind: row.kind,
        },
      ];
    }),
    wards: wardRows.map((row) => ({
      orgId: row.orgId,
      guardianMembershipId: row.guardianMembershipId,
      childMembershipId: row.childMembershipId,
    })),
  };
}

export async function loadSubjectIdentity(membershipId: string): Promise<LearnerIdentity | null> {
  const db = getDb();
  const [row] = await db
    .select({
      memberId: members.id,
      email: members.email,
      name: members.name,
      kind: members.kind,
      mode: members.mode,
      membershipId: memberships.id,
      stance: memberships.stance,
      orgId: organizations.id,
      orgSlug: organizations.slug,
      orgIsolation: organizations.isolation,
    })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(memberships.id, membershipId))
    .limit(1);
  if (!row) return null;
  return {
    memberId: row.memberId,
    email: row.email,
    name: row.name,
    kind: row.kind ?? "adult",
    mode: row.mode ?? "none",
    membershipId: row.membershipId,
    orgId: row.orgId,
    orgSlug: row.orgSlug,
    orgIsolation: row.orgIsolation,
    stance: row.stance,
  };
}

async function ensureCoachingSkill(orgId: string, slug: string) {
  const def = COACHING_SKILLS.find((skill) => skill.slug === slug);
  if (!def) return;
  const db = getDb();
  await db
    .insert(skills)
    .values({
      orgId,
      slug: def.slug,
      name: def.name,
      rubric: { scale: "0-100", audience: def.audience },
    })
    .onConflictDoNothing({ target: [skills.orgId, skills.slug] });
}

export async function applySkillScore(input: {
  actor: LearnerIdentity;
  subject: LearnerIdentity;
  skillSlug: string;
  score: number;
  source: "ai" | "coach_override" | "self" | "monthly_review";
  notes?: string;
}) {
  if (input.subject.orgId !== input.actor.orgId) throw new SkillScoreError("org_mismatch");
  const blocked = refuseSkillScore({
    orgSlug: input.subject.orgSlug,
    skillSlug: input.skillSlug,
    scale: "0-100",
    score: input.score,
  });
  if (blocked) throw new SkillScoreError(blocked);

  await ensureCoachingSkill(input.subject.orgId, input.skillSlug);
  const db = getDb();
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.orgId, input.subject.orgId), eq(skills.slug, input.skillSlug)))
    .limit(1);
  const rubric = (skill?.rubric ?? null) as { scale?: string; audience?: string } | null;
  const stored = refuseSkillScore({
    orgSlug: input.subject.orgSlug,
    skillSlug: input.skillSlug,
    scale: rubric?.scale,
    score: input.score,
  });
  if (!skill || stored) throw new SkillScoreError(stored ?? "scale");

  if (rubric?.audience === "coach") {
    const world = await loadCoachingWorld(input.actor);
    const actor: Actor = {
      memberId: input.actor.memberId,
      membershipId: input.actor.membershipId,
      orgId: input.actor.orgId,
      stance: input.actor.stance,
    };
    if (!canCoachOverride(world, actor)) throw new SkillScoreError("audience");
  }

  const raw = {
    scale: "0-100",
    source: input.source,
    notes: input.notes ?? null,
  };
  await db
    .insert(skillStates)
    .values({
      orgId: input.subject.orgId,
      membershipId: input.subject.membershipId,
      skillId: skill.id,
      score: String(input.score),
      raw,
    })
    .onConflictDoUpdate({
      target: [skillStates.orgId, skillStates.membershipId, skillStates.skillId],
      set: { score: String(input.score), raw, updatedAt: new Date() },
    });
  await db.insert(skillObservations).values({
    orgId: input.subject.orgId,
    membershipId: input.subject.membershipId,
    skillId: skill.id,
    score: String(input.score),
    evidence: input.notes ?? "",
  });
  await recordEvent(
    input.subject,
    {
      kind: input.source === "monthly_review" ? "monthly_review" : "skill_override",
      objectType: "skill",
      objectId: input.skillSlug,
      skillIds: [skill.id],
      score: input.score,
      raw,
    },
    { membershipId: input.actor.membershipId, stance: input.actor.stance },
  );
}
