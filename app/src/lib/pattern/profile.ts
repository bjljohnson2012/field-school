import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  memberProfileRevisions,
  memberProfiles,
  memberships,
  instrumentRuns,
  profileArtifacts,
  skillObservations,
  skills,
  wards,
} from "@/lib/db/schema";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { INSTRUMENT_SLUG } from "./items";
import {
  asBearing,
  inferBearingFromTranscript,
  mergeNarratives,
  nudgeBearing,
  scoreAnswers,
  type BearingMap,
  type PatternResult,
} from "./score";
import { ensureInstrument, ensureOrgSkills } from "./seed";

export class ProfileLockedError extends Error {
  constructor() {
    super("profile_locked");
    this.name = "ProfileLockedError";
  }
}

export class WardOrgScopeError extends Error {
  constructor() {
    super("child_not_in_org");
    this.name = "WardOrgScopeError";
  }
}

export class ProfileMissingError extends Error {
  constructor() {
    super("profile_required");
    this.name = "ProfileMissingError";
  }
}

type ProfileRow = typeof memberProfiles.$inferSelect;

function dimsFromProfile(profile: ProfileRow): BearingMap {
  const blob = profile.correspondence as { dims?: unknown } | BearingMap;
  if (blob && typeof blob === "object" && "dims" in blob) {
    return asBearing(blob.dims);
  }
  return asBearing(blob);
}

export async function isGuardianOf(
  actor: LearnerIdentity,
  childMembershipId: string,
) {
  if (actor.stance === "admin") return true;
  const db = getDb();
  const rows = await db
    .select({ id: wards.id })
    .from(wards)
    .innerJoin(memberships, eq(memberships.id, wards.childMembershipId))
    .where(
      and(
        eq(wards.orgId, actor.orgId),
        eq(memberships.orgId, actor.orgId),
        eq(wards.guardianMembershipId, actor.membershipId),
        eq(wards.childMembershipId, childMembershipId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function assertCanWrite(
  actor: LearnerIdentity,
  profile: ProfileRow,
) {
  const self = profile.membershipId === actor.membershipId;
  const guardian = await isGuardianOf(actor, profile.membershipId);
  if (profile.locked && !guardian && actor.stance !== "admin") {
    throw new ProfileLockedError();
  }
  if (!self && !guardian && actor.stance !== "admin") {
    throw new ProfileLockedError();
  }
}

async function findProfile(orgId: string, membershipId: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(memberProfiles)
    .where(and(eq(memberProfiles.orgId, orgId), eq(memberProfiles.membershipId, membershipId)))
    .limit(1);
  return existing[0] ?? null;
}

async function loadOrCreate(orgId: string, membershipId: string) {
  const existing = await findProfile(orgId, membershipId);
  if (existing) return existing;
  const db = getDb();
  const inserted = await db
    .insert(memberProfiles)
    .values({ orgId, membershipId, instrumentSlug: INSTRUMENT_SLUG })
    .returning();
  return inserted[0];
}

async function requireProfile(orgId: string, membershipId: string) {
  const existing = await findProfile(orgId, membershipId);
  if (!existing) throw new ProfileMissingError();
  return existing;
}

async function writeProfile(
  profile: ProfileRow,
  result: PatternResult,
  cause: string,
  raw: Record<string, unknown>,
  extra: Partial<typeof memberProfiles.$inferInsert> = {},
) {
  const db = getDb();
  const [updated] = await db
    .update(memberProfiles)
    .set({
      bearingDeg: String(result.bearing[result.primary]),
      bearingPrimary: result.primary,
      bearingSecondary: result.secondary,
      correspondence: { dims: result.bearing, estimates: result.correspondence },
      narratives: result.narratives,
      updatedAt: new Date(),
      ...extra,
    })
    .where(eq(memberProfiles.id, profile.id))
    .returning();
  await db.insert(memberProfileRevisions).values({
    profileId: profile.id,
    orgId: profile.orgId,
    membershipId: profile.membershipId,
    cause,
    bearingDeg: String(result.bearing[result.primary]),
    correspondence: { dims: result.bearing, estimates: result.correspondence },
    narratives: result.narratives,
    raw,
  });
  return updated;
}

export async function getLiveProfile(orgId: string, membershipId: string) {
  await ensureInstrument();
  return findProfile(orgId, membershipId);
}

export async function listRevisions(profileId: string, limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(memberProfileRevisions)
    .where(eq(memberProfileRevisions.profileId, profileId))
    .orderBy(desc(memberProfileRevisions.createdAt))
    .limit(limit);
}

export async function runInstrument(opts: {
  actor: LearnerIdentity;
  membershipId: string;
  subset: "adult" | "child";
  answers: Record<string, number>;
}) {
  await ensureInstrument();
  const profile = await loadOrCreate(opts.actor.orgId, opts.membershipId);
  await assertCanWrite(opts.actor, profile);
  const result = scoreAnswers(opts.answers, opts.subset);
  const db = getDb();
  await db.insert(instrumentRuns).values({
    orgId: opts.actor.orgId,
    membershipId: opts.membershipId,
    instrumentSlug: INSTRUMENT_SLUG,
    subset: opts.subset,
    answers: opts.answers,
    correspondence: { dims: result.bearing, estimates: result.correspondence },
    bearingDeg: String(result.bearing[result.primary]),
  });
  const updated = await writeProfile(profile, result, "pattern_run", {
    subset: opts.subset,
    answers: opts.answers,
  }, { lastRunAt: new Date() });
  return { profile: updated, result, reset: true };
}

export async function ingestArtifact(opts: {
  actor: LearnerIdentity;
  membershipId: string;
  kind: "paper" | "verbal" | "video";
  transcript: string;
}) {
  const profile = await requireProfile(opts.actor.orgId, opts.membershipId);
  await assertCanWrite(opts.actor, profile);
  const inferred = inferBearingFromTranscript(opts.transcript);
  const current = dimsFromProfile(profile);
  const nudged = nudgeBearing(current, inferred);
  const result: PatternResult = {
    ...nudged,
    narratives: mergeNarratives(
      (profile.narratives as Record<string, string>) ?? {},
      nudged,
      current,
    ),
  };
  const db = getDb();
  const [artifact] = await db
    .insert(profileArtifacts)
    .values({
      orgId: opts.actor.orgId,
      membershipId: opts.membershipId,
      kind: opts.kind,
      transcript: opts.transcript,
      inferred,
    })
    .returning();
  const updated = await writeProfile(profile, result, `artifact_${opts.kind}`, {
    artifactId: artifact.id,
    inferred,
  });
  await applySkillRubrics({
    orgId: opts.actor.orgId,
    membershipId: opts.membershipId,
    artifactId: artifact.id,
    transcript: opts.transcript,
  });
  return { profile: updated, result, artifact, reset: false };
}

async function applySkillRubrics(opts: {
  orgId: string;
  membershipId: string;
  artifactId: string;
  transcript: string;
}) {
  await ensureOrgSkills(opts.orgId);
  const db = getDb();
  const orgSkills = await db.select().from(skills).where(eq(skills.orgId, opts.orgId));
  const lower = opts.transcript.toLowerCase();
  for (const skill of orgSkills) {
    const rubric = skill.rubric as { keywords?: string[] } | null;
    const keywords = rubric?.keywords ?? [];
    if (!keywords.length) continue;
    const hits = keywords.filter((word) => lower.includes(word.toLowerCase()));
    if (!hits.length) continue;
    await db.insert(skillObservations).values({
      orgId: opts.orgId,
      membershipId: opts.membershipId,
      skillId: skill.id,
      artifactId: opts.artifactId,
      score: String(Math.min(1, hits.length / keywords.length)),
      evidence: hits.join(", "),
    });
  }
}

export async function setLock(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  locked: boolean;
}) {
  const allowed = await isGuardianOf(opts.actor, opts.childMembershipId);
  if (!allowed) throw new ProfileLockedError();
  const profile = await requireProfile(opts.actor.orgId, opts.childMembershipId);
  const db = getDb();
  const [updated] = await db
    .update(memberProfiles)
    .set({
      locked: opts.locked,
      lockedByMembershipId: opts.locked ? opts.actor.membershipId : null,
      lockedAt: opts.locked ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(memberProfiles.id, profile.id))
    .returning();
  return updated;
}

export async function linkWard(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
}) {
  if (opts.actor.stance !== "admin" && opts.actor.stance !== "guardian") {
    throw new ProfileLockedError();
  }
  const db = getDb();
  const [child] = await db
    .select({ id: memberships.id, orgId: memberships.orgId })
    .from(memberships)
    .where(eq(memberships.id, opts.childMembershipId))
    .limit(1);
  if (!child || child.orgId !== opts.actor.orgId) {
    throw new WardOrgScopeError();
  }
  const [row] = await db
    .insert(wards)
    .values({
      orgId: opts.actor.orgId,
      guardianMembershipId: opts.actor.membershipId,
      childMembershipId: opts.childMembershipId,
    })
    .onConflictDoNothing()
    .returning();
  return row;
}

export function publicProfile(profile: ProfileRow) {
  return {
    id: profile.id,
    membershipId: profile.membershipId,
    instrument: profile.instrumentSlug,
    bearing: {
      primary: profile.bearingPrimary,
      secondary: profile.bearingSecondary,
      dims: dimsFromProfile(profile),
    },
    correspondence: profile.correspondence,
    narratives: profile.narratives,
    locked: profile.locked,
    lastRunAt: profile.lastRunAt,
    updatedAt: profile.updatedAt,
  };
}
