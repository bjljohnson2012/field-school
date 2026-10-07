import { and, eq, inArray, isNotNull, max, min } from "drizzle-orm";
import { applyProfileM2Sql } from "@/lib/assessments/sql";
import { getDb } from "@/lib/db/client";
import { assessmentRuns } from "@/lib/db/schema-profile-m2";
import { mediaPath } from "@/lib/enrichment/model";
import {
  instrumentRuns,
  kidProfiles,
  members,
  memberships,
  userProfiles,
  wards,
} from "@/lib/db/schema";
import {
  adultSetup,
  kidSetup,
  listOfStrings,
  markGate,
  readGateMarks,
  type AdultGateId,
  type AdultPatch,
  type GateMarks,
} from "./model";
import { applyProfileSql } from "./sql";

export type ProfileOwner = { memberId: string; name: string };

async function ownMembershipIds(memberId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.memberId, memberId));
  return rows.map((row) => row.id);
}

async function fieldPatternSpan(memberId: string) {
  const ids = await ownMembershipIds(memberId);
  if (!ids.length) return null;
  const db = getDb();
  const [row] = await db
    .select({ firstAt: min(instrumentRuns.createdAt), lastAt: max(instrumentRuns.createdAt) })
    .from(instrumentRuns)
    .where(
      and(
        inArray(instrumentRuns.membershipId, ids),
        eq(instrumentRuns.instrumentSlug, "fp-50-v1"),
        eq(instrumentRuns.subset, "adult"),
      ),
    );
  if (!row?.firstAt || !row.lastAt) return null;
  return { firstAt: new Date(row.firstAt), lastAt: new Date(row.lastAt) };
}

async function wizardPersonalitySpan(memberId: string) {
  await applyProfileM2Sql();
  const [row] = await getDb()
    .select({ firstAt: min(assessmentRuns.completedAt), lastAt: max(assessmentRuns.completedAt) })
    .from(assessmentRuns)
    .where(
      and(
        eq(assessmentRuns.memberId, memberId),
        eq(assessmentRuns.track, "personality"),
        isNotNull(assessmentRuns.completedAt),
      ),
    );
  if (!row?.firstAt || !row.lastAt) return null;
  return { firstAt: new Date(row.firstAt), lastAt: new Date(row.lastAt) };
}

/**
 * G-personality reads the adult Field Pattern runs the User took about themself, and
 * finished Personality runs of the assessment wizard. Either one meets the gate.
 */
async function personalityMark(memberId: string) {
  const spans = [await fieldPatternSpan(memberId), await wizardPersonalitySpan(memberId)].flatMap((span) =>
    span ? [span] : [],
  );
  if (!spans.length) return null;
  const first = Math.min(...spans.map((span) => span.firstAt.getTime()));
  const last = Math.max(...spans.map((span) => span.lastAt.getTime()));
  return { firstAt: new Date(first).toISOString(), lastAt: new Date(last).toISOString() };
}

async function ensureRow(owner: ProfileOwner) {
  await applyProfileM2Sql();
  const db = getDb();
  await db
    .insert(userProfiles)
    .values({ memberId: owner.memberId, displayName: owner.name })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.memberId, owner.memberId))
    .limit(1);
  return row;
}

function shapeAdult(
  row: typeof userProfiles.$inferSelect,
  owner: ProfileOwner,
  marks: GateMarks,
  now: Date,
) {
  const setup = adultSetup(marks, row.completedAt ? row.completedAt.toISOString() : null, now);
  return {
    memberId: row.memberId,
    displayName: row.displayName || owner.name,
    photoUrl: row.photoUrl || "",
    photoSrc: row.photoMediaId ? mediaPath(row.photoMediaId) : "",
    currentProjects: listOfStrings(row.currentProjects),
    skillsAdapted: listOfStrings(row.skillsAdapted),
    setup,
  };
}

export type AdultProfile = ReturnType<typeof shapeAdult>;

/** Reads the profile and stores completeness the first time every required gate is met. */
export async function loadAdultProfile(owner: ProfileOwner, now = new Date()): Promise<AdultProfile> {
  const row = await ensureRow(owner);
  let marks = readGateMarks(row.gates);
  const personality = await personalityMark(owner.memberId);
  if (personality) marks = { ...marks, "G-personality": personality };
  const shaped = shapeAdult(row, owner, marks, now);
  const storedGates = JSON.stringify(readGateMarks(row.gates));
  const needsCompleted = shaped.setup.completedAt && !row.completedAt;
  if (needsCompleted || storedGates !== JSON.stringify(marks)) {
    const db = getDb();
    await db
      .update(userProfiles)
      .set({
        gates: marks,
        completedAt: row.completedAt ?? (shaped.setup.completedAt ? new Date(shaped.setup.completedAt) : null),
        updatedAt: now,
      })
      .where(eq(userProfiles.memberId, owner.memberId));
  }
  return shaped;
}

export async function updateAdultProfile(owner: ProfileOwner, patch: AdultPatch) {
  await ensureRow(owner);
  const db = getDb();
  const set: Partial<typeof userProfiles.$inferInsert> = { updatedAt: new Date() };
  if (patch.displayName !== undefined) set.displayName = patch.displayName;
  if (patch.photoUrl !== undefined) set.photoUrl = patch.photoUrl;
  if (patch.currentProjects !== undefined) set.currentProjects = patch.currentProjects;
  if (patch.skillsAdapted !== undefined) set.skillsAdapted = patch.skillsAdapted;
  await db.update(userProfiles).set(set).where(eq(userProfiles.memberId, owner.memberId));
  return loadAdultProfile(owner);
}

/** Server write for Tools Skill / Intelligence saves. A re-run moves freshness only. */
export async function recordAdultGate(owner: ProfileOwner, gate: AdultGateId, now = new Date()) {
  const row = await ensureRow(owner);
  const marks = markGate(readGateMarks(row.gates), gate, now);
  const db = getDb();
  await db
    .update(userProfiles)
    .set({ gates: marks, updatedAt: now })
    .where(eq(userProfiles.memberId, owner.memberId));
  return loadAdultProfile(owner, now);
}

export type KidScope = { orgId: string; parentMembershipId: string };

async function wardChildren(scope: KidScope) {
  const db = getDb();
  return db
    .select({ membershipId: wards.childMembershipId, name: members.name })
    .from(wards)
    .innerJoin(memberships, eq(memberships.id, wards.childMembershipId))
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(
      and(
        eq(wards.orgId, scope.orgId),
        eq(wards.guardianMembershipId, scope.parentMembershipId),
        eq(members.kind, "child"),
      ),
    );
}

export async function isGuardianOf(scope: KidScope, childMembershipId: string) {
  const rows = await wardChildren(scope);
  return rows.some((row) => row.membershipId === childMembershipId);
}

function shapeKid(
  child: { membershipId: string; name: string },
  row: typeof kidProfiles.$inferSelect | undefined,
) {
  return {
    membershipId: child.membershipId,
    kind: "child" as const,
    login: "none" as const,
    displayName: row?.displayName || child.name,
    setup: kidSetup(row?.intakeDoneAt ? row.intakeDoneAt.toISOString() : null),
  };
}

export type KidProfile = ReturnType<typeof shapeKid>;

export async function listKidProfiles(scope: KidScope): Promise<KidProfile[]> {
  await applyProfileSql();
  const children = await wardChildren(scope);
  if (!children.length) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(kidProfiles)
    .where(
      and(
        eq(kidProfiles.orgId, scope.orgId),
        inArray(
          kidProfiles.childMembershipId,
          children.map((child) => child.membershipId),
        ),
      ),
    );
  return children.map((child) =>
    shapeKid(child, rows.find((row) => row.childMembershipId === child.membershipId)),
  );
}

export async function loadKidProfile(scope: KidScope, childMembershipId: string) {
  const kids = await listKidProfiles(scope);
  return kids.find((kid) => kid.membershipId === childMembershipId) ?? null;
}

export async function updateKidProfile(
  scope: KidScope,
  childMembershipId: string,
  patch: { displayName: string },
) {
  await applyProfileSql();
  const db = getDb();
  const now = new Date();
  await db
    .insert(kidProfiles)
    .values({
      orgId: scope.orgId,
      childMembershipId,
      parentMembershipId: scope.parentMembershipId,
      displayName: patch.displayName,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [kidProfiles.orgId, kidProfiles.childMembershipId],
      set: { displayName: patch.displayName, updatedAt: now },
    });
  return loadKidProfile(scope, childMembershipId);
}
