import { and, desc, eq } from "drizzle-orm";
import {
  crossReferencePrepDoc,
  generateOneOnOnePrep,
  type OneOnOnePrepInput,
} from "@/lib/ai/prompts/plans";
import { assertCanAccessMember, type Actor, type CoachingWorld } from "@/lib/coaching/access";
import { getDb } from "@/lib/db/client";
import {
  coachingNotes,
  coachingProfiles,
  oneOnOnePreps,
  organizations,
  skillStates,
  skills,
} from "@/lib/db/schema";
import { loadSubjectIdentity } from "@/lib/coaching/scores";
import { applyConfirmedProfile, explicitProfileConfirm } from "./profile";

export class PrepFlowError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "PrepFlowError";
    this.code = code;
    this.status = status;
  }
}

export type PrepOptions = {
  prepDocText: string;
  crossReference: boolean;
  confirmProfile: unknown;
  profile: unknown;
};

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function prepRole(stance: string): "AE" | "DIRECTOR" {
  if (stance === "coach" || stance === "leader" || stance === "admin") return "DIRECTOR";
  return "AE";
}

export function prepDto(row: typeof oneOnOnePreps.$inferSelect) {
  return {
    id: row.id,
    subjectMembershipId: row.subjectMembershipId,
    authorMembershipId: row.authorMembershipId,
    prepDocText: row.prepDocText,
    status: row.status,
    error: row.error,
    generated: row.generated,
    modelName: row.modelName,
    createdAt: row.createdAt.toISOString(),
  };
}

async function buildInput(orgId: string, subjectMembershipId: string, prepDocText: string) {
  const subject = await loadSubjectIdentity(subjectMembershipId);
  if (!subject || subject.orgId !== orgId) throw new PrepFlowError("not_found", 404);
  const db = getDb();
  const [profile] = await db
    .select()
    .from(coachingProfiles)
    .where(and(eq(coachingProfiles.orgId, orgId), eq(coachingProfiles.membershipId, subjectMembershipId)))
    .limit(1);
  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
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
  const skillScores = scoreRows.flatMap((row) => {
    if (row.score == null) return [];
    const score = Number(row.score);
    if (!Number.isFinite(score)) return [];
    return [{ category: row.category, score }];
  });
  const strengths = stringList(profile?.strengths);
  const weaknesses = stringList(profile?.weaknesses);
  const input: OneOnOnePrepInput = {
    aeProfile: {
      name: subject.name,
      role: prepRole(subject.stance),
      personalitySummary: profile?.personalitySummary ?? null,
      salesStyleSummary: profile?.salesStyleSummary ?? null,
      leadershipSummary: profile?.leadershipSummary ?? null,
      forecastingSummary: profile?.forecastingSummary ?? null,
      communicationSummary: profile?.communicationSummary ?? null,
      enneagramType: profile?.enneagramType ?? null,
      discProfile: profile?.discProfile ?? null,
      mbtiType: profile?.mbtiType ?? null,
      strengths,
      weaknesses,
      skillScores,
      motivations: stringList(profile?.motivations),
    },
    recentNotes: noteRows.map((row) => ({
      date: row.createdAt.toISOString().slice(0, 10),
      content: row.body,
    })),
    prepDocText,
  };
  return {
    input,
    cross: {
      aeProfile: {
        name: subject.name,
        personalitySummary: profile?.personalitySummary ?? null,
        salesStyleSummary: profile?.salesStyleSummary ?? null,
        communicationSummary: profile?.communicationSummary ?? null,
        strengths,
        weaknesses,
        skillScores,
      },
      prepDoc: {
        weekOf: new Date().toISOString().slice(0, 10),
        title: null,
        content: prepDocText,
      },
      companyContext: { name: org?.name ?? "", salesMethodology: null },
    },
  };
}

async function finish(id: string, orgId: string, subjectMembershipId: string, options: PrepOptions) {
  const db = getDb();
  let saved: typeof oneOnOnePreps.$inferSelect;
  try {
    const built = await buildInput(orgId, subjectMembershipId, options.prepDocText);
    const prep = await generateOneOnOnePrep(built.input);
    const crossReference = options.crossReference ? await crossReferencePrepDoc(built.cross) : undefined;
    const generated = crossReference ? { prep, crossReference } : { prep };
    const [row] = await db
      .update(oneOnOnePreps)
      .set({
        prepDocText: options.prepDocText,
        generated,
        status: "ready",
        error: null,
      })
      .where(eq(oneOnOnePreps.id, id))
      .returning();
    if (!row) throw new PrepFlowError("not_found", 404);
    saved = row;
  } catch (error) {
    if (error instanceof PrepFlowError) throw error;
    const [failed] = await db
      .update(oneOnOnePreps)
      .set({ status: "failed", error: "generate_failed" })
      .where(eq(oneOnOnePreps.id, id))
      .returning();
    if (!failed) throw new PrepFlowError("not_found", 404);
    return failed;
  }
  if (explicitProfileConfirm(options.confirmProfile)) {
    await applyConfirmedProfile(true, orgId, subjectMembershipId, options.profile);
  }
  return saved;
}

export async function listPreps(actor: Actor, subjectMembershipId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(oneOnOnePreps)
    .where(
      and(eq(oneOnOnePreps.orgId, actor.orgId), eq(oneOnOnePreps.subjectMembershipId, subjectMembershipId)),
    )
    .orderBy(desc(oneOnOnePreps.createdAt));
  return rows.map(prepDto);
}

export async function generatePrep(world: CoachingWorld, actor: Actor, subjectMembershipId: string, options: PrepOptions) {
  if (!assertCanAccessMember(world, actor, subjectMembershipId)) throw new PrepFlowError("forbidden", 403);
  const db = getDb();
  const [created] = await db
    .insert(oneOnOnePreps)
    .values({
      orgId: actor.orgId,
      subjectMembershipId,
      authorMembershipId: actor.membershipId,
      prepDocText: options.prepDocText,
      generated: {},
      status: "generating",
      error: null,
    })
    .returning();
  if (!created) throw new PrepFlowError("prep_unavailable", 500);
  return prepDto(await finish(created.id, actor.orgId, subjectMembershipId, options));
}

export async function retryPrep(world: CoachingWorld, actor: Actor, id: string, options: PrepOptions) {
  const db = getDb();
  const [existing] = await db.select().from(oneOnOnePreps).where(eq(oneOnOnePreps.id, id)).limit(1);
  if (!existing || existing.orgId !== actor.orgId) throw new PrepFlowError("not_found", 404);
  if (!assertCanAccessMember(world, actor, existing.subjectMembershipId)) {
    throw new PrepFlowError("forbidden", 403);
  }
  const prepDocText = options.prepDocText.trim() ? options.prepDocText.trim() : existing.prepDocText;
  await db
    .update(oneOnOnePreps)
    .set({ status: "generating", error: null, prepDocText })
    .where(eq(oneOnOnePreps.id, existing.id));
  return prepDto(
    await finish(existing.id, actor.orgId, existing.subjectMembershipId, { ...options, prepDocText }),
  );
}
