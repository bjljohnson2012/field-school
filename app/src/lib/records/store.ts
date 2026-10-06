import { and, eq, inArray } from "drizzle-orm";
import { sources } from "@/lib/composer/schema";
import { getDb } from "@/lib/db/client";
import { kidProfiles, progressLedgers, progressLedgerUnits, userProfiles } from "@/lib/db/schema";
import { readGateMarks } from "@/lib/profile/model";
import { listKidProfiles, type KidScope } from "@/lib/profile/store";
import { applyProfileSql } from "@/lib/profile/sql";
import { listToolResults } from "@/lib/tools/results-store";
import { deriveMilestones, type Family, type MediaDoc, type Milestone } from "./model";

/** Household only, guardian's own wards. Household is one shared org, so a Family is a guardian plus wards. */
export async function loadFamily(scope: KidScope): Promise<Family> {
  const kids = await listKidProfiles(scope);
  return {
    collection: "families",
    orgId: scope.orgId,
    guardianMembershipId: scope.parentMembershipId,
    children: kids.map((kid) => ({
      collection: "student-profiles",
      person: { as: "tracked-child", membershipId: kid.membershipId },
      displayName: kid.displayName,
      login: "none",
    })),
  };
}

/** The User's own milestones. Never loaded for anyone but the signed-in member. */
export async function loadSelfMilestones(memberId: string): Promise<Milestone[]> {
  await applyProfileSql();
  const [row] = await getDb()
    .select({ gates: userProfiles.gates, completedAt: userProfiles.completedAt })
    .from(userProfiles)
    .where(eq(userProfiles.memberId, memberId))
    .limit(1);
  const tools = await listToolResults(memberId);
  return deriveMilestones({
    self: {
      memberId,
      gates: readGateMarks(row?.gates),
      completedAt: row?.completedAt ? row.completedAt.toISOString() : null,
      tools: tools.map((tool) => ({
        attemptId: tool.attemptId,
        toolSlug: tool.toolSlug,
        summary: tool.summary,
        completedAt: tool.completedAt,
      })),
    },
    kids: [],
    ledgerUnits: [],
  });
}

/** Tracked children's milestones, limited to the family's own wards and the current ledger version. */
export async function loadFamilyMilestones(family: Family): Promise<Milestone[]> {
  const ids = family.children.map((child) => child.person.membershipId);
  if (!ids.length) return [];
  await applyProfileSql();
  const db = getDb();
  const [kids, units] = await Promise.all([
    db
      .select({ membershipId: kidProfiles.childMembershipId, intakeDoneAt: kidProfiles.intakeDoneAt })
      .from(kidProfiles)
      .where(and(eq(kidProfiles.orgId, family.orgId), inArray(kidProfiles.childMembershipId, ids))),
    db
      .select({
        id: progressLedgerUnits.id,
        childMembershipId: progressLedgerUnits.childMembershipId,
        title: progressLedgerUnits.title,
        status: progressLedgerUnits.status,
        completedAt: progressLedgerUnits.completedAt,
      })
      .from(progressLedgerUnits)
      .innerJoin(progressLedgers, eq(progressLedgers.id, progressLedgerUnits.ledgerId))
      .where(
        and(
          eq(progressLedgerUnits.orgId, family.orgId),
          eq(progressLedgers.status, "current"),
          inArray(progressLedgerUnits.childMembershipId, ids),
        ),
      ),
  ]);
  return deriveMilestones({
    self: null,
    kids: kids.map((kid) => ({
      membershipId: kid.membershipId,
      intakeDoneAt: kid.intakeDoneAt ? kid.intakeDoneAt.toISOString() : null,
    })),
    ledgerUnits: units.map((unit) => ({
      ...unit,
      completedAt: unit.completedAt ? unit.completedAt.toISOString() : null,
    })),
  });
}

function mediaKind(row: { fileName: string | null; url: string | null }): MediaDoc["kind"] {
  if (row.fileName) return "file";
  return row.url ? "link" : "text";
}

/** Lesson sources in one org, as Media docs. */
export async function listMedia(orgId: string, lessonIds: readonly string[]): Promise<MediaDoc[]> {
  if (!lessonIds.length) return [];
  const rows = await getDb()
    .select({
      id: sources.id,
      lessonId: sources.lessonId,
      title: sources.title,
      fileName: sources.fileName,
      url: sources.url,
      mime: sources.mime,
    })
    .from(sources)
    .where(and(eq(sources.orgId, orgId), inArray(sources.lessonId, [...lessonIds])));
  return rows.map((row) => ({
    collection: "media",
    id: row.id,
    lessonId: row.lessonId,
    title: row.title || row.fileName || row.url || "Untitled",
    kind: mediaKind(row),
    mime: row.mime,
    url: row.url,
  }));
}
