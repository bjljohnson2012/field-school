import { and, desc, eq } from "drizzle-orm";
import { generateCoachingPlan, type CoachingPlanInput } from "@/lib/ai/prompts/plans";
import {
  assertCanAccessMember,
  memberHasPlatformAdmin,
  type Actor,
  type CoachingWorld,
} from "@/lib/coaching/access";
import { getDb } from "@/lib/db/client";
import { coachingNotes, coachingPlans, coachingProfiles, skillStates, skills } from "@/lib/db/schema";
import { loadSubjectIdentity } from "@/lib/coaching/scores";

export class PlanFlowError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "PlanFlowError";
    this.code = code;
    this.status = status;
  }
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function roleFor(world: CoachingWorld, subject: { memberId: string; stance: string }) {
  if (memberHasPlatformAdmin(world, subject.memberId)) return "COMPANY_ADMIN" as const;
  if (subject.stance === "leader") return "VP_SALES" as const;
  if (subject.stance === "coach") return "DIRECTOR" as const;
  if (subject.stance === "admin") return "ORG_ADMIN" as const;
  return "AE" as const;
}

export function planDto(row: typeof coachingPlans.$inferSelect) {
  return {
    id: row.id,
    subjectMembershipId: row.subjectMembershipId,
    authorMembershipId: row.authorMembershipId,
    status: row.status,
    error: row.error,
    generated: row.generated,
    modelName: row.modelName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function buildInput(world: CoachingWorld, orgId: string, subjectMembershipId: string) {
  const subject = await loadSubjectIdentity(subjectMembershipId);
  if (!subject || subject.orgId !== orgId) throw new PlanFlowError("not_found", 404);
  const db = getDb();
  const [profile] = await db
    .select()
    .from(coachingProfiles)
    .where(and(eq(coachingProfiles.orgId, orgId), eq(coachingProfiles.membershipId, subjectMembershipId)))
    .limit(1);
  const scoreRows = await db
    .select({ category: skills.slug, score: skillStates.score })
    .from(skillStates)
    .innerJoin(skills, eq(skills.id, skillStates.skillId))
    .where(and(eq(skillStates.orgId, orgId), eq(skillStates.membershipId, subjectMembershipId)));
  const noteRows = await db
    .select({ createdAt: coachingNotes.createdAt, body: coachingNotes.body })
    .from(coachingNotes)
    .where(and(eq(coachingNotes.orgId, orgId), eq(coachingNotes.subjectMembershipId, subjectMembershipId)))
    .orderBy(desc(coachingNotes.createdAt))
    .limit(8);
  const input: CoachingPlanInput = {
    name: subject.name,
    role: roleFor(world, subject),
    enneagramType: profile?.enneagramType ?? null,
    discProfile: profile?.discProfile ?? null,
    mbtiType: profile?.mbtiType ?? null,
    personalitySummary: profile?.personalitySummary ?? null,
    strengths: stringList(profile?.strengths),
    weaknesses: stringList(profile?.weaknesses),
    motivations: stringList(profile?.motivations),
    skillScores: scoreRows.flatMap((row) => {
      if (row.score == null) return [];
      const score = Number(row.score);
      if (!Number.isFinite(score)) return [];
      return [{ category: row.category, score }];
    }),
    recentNotes: noteRows.map((row) => ({
      date: row.createdAt.toISOString().slice(0, 10),
      content: row.body,
    })),
  };
  return input;
}

async function finish(id: string, input: CoachingPlanInput) {
  const db = getDb();
  try {
    const generated = await generateCoachingPlan(input);
    const [saved] = await db
      .update(coachingPlans)
      .set({ generated, status: "ready", error: null, updatedAt: new Date() })
      .where(eq(coachingPlans.id, id))
      .returning();
    if (!saved) throw new PlanFlowError("not_found", 404);
    return saved;
  } catch (error) {
    if (error instanceof PlanFlowError) throw error;
    const [saved] = await db
      .update(coachingPlans)
      .set({ status: "failed", error: "generate_failed", updatedAt: new Date() })
      .where(eq(coachingPlans.id, id))
      .returning();
    if (!saved) throw new PlanFlowError("not_found", 404);
    return saved;
  }
}

export async function listPlans(actor: Actor, subjectMembershipId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(coachingPlans)
    .where(and(eq(coachingPlans.orgId, actor.orgId), eq(coachingPlans.subjectMembershipId, subjectMembershipId)))
    .orderBy(desc(coachingPlans.createdAt));
  return rows.map(planDto);
}

export async function generatePlan(world: CoachingWorld, actor: Actor, subjectMembershipId: string) {
  if (!assertCanAccessMember(world, actor, subjectMembershipId)) throw new PlanFlowError("forbidden", 403);
  const input = await buildInput(world, actor.orgId, subjectMembershipId);
  const db = getDb();
  const [created] = await db
    .insert(coachingPlans)
    .values({
      orgId: actor.orgId,
      subjectMembershipId,
      authorMembershipId: actor.membershipId,
      generated: {},
      status: "generating",
      error: null,
    })
    .returning();
  if (!created) throw new PlanFlowError("plan_unavailable", 500);
  return planDto(await finish(created.id, input));
}

export async function retryPlan(world: CoachingWorld, actor: Actor, id: string) {
  const db = getDb();
  const [existing] = await db.select().from(coachingPlans).where(eq(coachingPlans.id, id)).limit(1);
  if (!existing || existing.orgId !== actor.orgId) throw new PlanFlowError("not_found", 404);
  if (!assertCanAccessMember(world, actor, existing.subjectMembershipId)) {
    throw new PlanFlowError("forbidden", 403);
  }
  await db
    .update(coachingPlans)
    .set({ status: "generating", error: null, updatedAt: new Date() })
    .where(eq(coachingPlans.id, existing.id));
  const input = await buildInput(world, actor.orgId, existing.subjectMembershipId);
  return planDto(await finish(existing.id, input));
}
