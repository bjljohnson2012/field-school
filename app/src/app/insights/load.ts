import { eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import {
  assignments,
  creditLedger,
  credits,
  learningEvents,
  members,
  memberships,
  nextPortionItems,
  nextPortions,
  organizations,
  progressLedgerUnits,
  skillStates,
  skills,
  usageEvents,
} from "@/lib/db/schema";
import { knowledgeUnits } from "@/lib/composer/schema";
import { chooseNextStep, type Room } from "@/lib/living-brain/model";
import { toolRead } from "@/lib/living-brain/store";
import { buildInsights, type InsightInput, type InsightsModel } from "./aggregate";

const HIRER_STANCES = new Set(["admin", "guardian", "trainer", "teacher"]);

export type InsightsLoad =
  | { ok: true; model: InsightsModel }
  | { ok: false; status: number; error: string };

function finiteScore(value: string | null) {
  if (value == null) return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export async function loadInsights(): Promise<InsightsLoad> {
  try {
    const auth = await identityFromRequest();
    if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };
    if (auth.identity.kind === "child") {
      return { ok: false, status: 403, error: "child_has_no_login" };
    }
    if (!HIRER_STANCES.has(auth.identity.stance)) {
      return { ok: false, status: 403, error: "hirer_only" };
    }

    const orgId = auth.identity.orgId;
    const db = getDb();
    const [org] = await db
      .select({ name: organizations.name, slug: organizations.slug })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    if (!org) return { ok: false, status: 404, error: "unknown_org" };

    const people = await db
      .select({
        membershipId: memberships.id,
        name: members.name,
        kind: members.kind,
        stance: memberships.stance,
      })
      .from(memberships)
      .innerJoin(members, eq(members.id, memberships.memberId))
      .where(eq(memberships.orgId, orgId));

    const events = await db
      .select({
        membershipId: learningEvents.membershipId,
        kind: learningEvents.kind,
        objectType: learningEvents.objectType,
        objectId: learningEvents.objectId,
        raw: learningEvents.raw,
        createdAt: learningEvents.createdAt,
      })
      .from(learningEvents)
      .where(eq(learningEvents.orgId, orgId));

    const portions = await db
      .select({
        id: nextPortions.id,
        membershipId: nextPortions.childMembershipId,
        version: nextPortions.version,
        status: nextPortions.status,
      })
      .from(nextPortions)
      .where(eq(nextPortions.orgId, orgId));

    const portionItems = await db
      .select({
        portionId: nextPortionItems.portionId,
        membershipId: nextPortionItems.childMembershipId,
        unitId: nextPortionItems.composerUnitId,
      })
      .from(nextPortionItems)
      .where(eq(nextPortionItems.orgId, orgId));

    const assignmentRows = await db
      .select({
        membershipId: assignments.membershipId,
        status: assignments.status,
        objectType: assignments.objectType,
      })
      .from(assignments)
      .where(eq(assignments.orgId, orgId));

    const ledgerUnits = await db
      .select({
        membershipId: progressLedgerUnits.childMembershipId,
        status: progressLedgerUnits.status,
        unitId: progressLedgerUnits.composerUnitId,
      })
      .from(progressLedgerUnits)
      .where(eq(progressLedgerUnits.orgId, orgId));

    const skillRows = await db
      .select({ id: skills.id, slug: skills.slug, name: skills.name })
      .from(skills)
      .where(eq(skills.orgId, orgId));

    const stateRows = await db
      .select({
        skillId: skillStates.skillId,
        membershipId: skillStates.membershipId,
        score: skillStates.score,
      })
      .from(skillStates)
      .where(eq(skillStates.orgId, orgId));

    const creditRows = await db
      .select({ id: credits.id, mode: credits.mode })
      .from(credits)
      .where(eq(credits.orgId, orgId));

    const ledger = await db
      .select({
        creditId: creditLedger.creditId,
        direction: creditLedger.direction,
        units: creditLedger.units,
        parentMembershipId: creditLedger.parentMembershipId,
        childMembershipId: creditLedger.childMembershipId,
      })
      .from(creditLedger)
      .where(eq(creditLedger.orgId, orgId));

    const usage = await db
      .select({
        creditId: usageEvents.creditId,
        units: usageEvents.units,
        parentMembershipId: usageEvents.parentMembershipId,
        childMembershipId: usageEvents.childMembershipId,
      })
      .from(usageEvents)
      .where(eq(usageEvents.orgId, orgId));

    const units = await db
      .select({ id: knowledgeUnits.id, title: knowledgeUnits.title })
      .from(knowledgeUnits)
      .where(eq(knowledgeUnits.orgId, orgId));

    const input: InsightInput = {
      orgSlug: org.slug,
      orgName: org.name,
      now: new Date().toISOString(),
      people,
      events: events.map((row) => ({
        membershipId: row.membershipId,
        kind: row.kind,
        objectType: row.objectType,
        objectId: row.objectId,
        raw: row.raw,
        createdAt: row.createdAt.toISOString(),
      })),
      portions,
      portionItems,
      assignments: assignmentRows,
      ledgerUnits,
      skills: skillRows,
      skillStates: stateRows.map((row) => ({
        skillId: row.skillId,
        membershipId: row.membershipId,
        score: finiteScore(row.score),
      })),
      credits: creditRows,
      ledger,
      usage,
      units,
    };

    const model = buildInsights(input);
    let brainNext: InsightsModel["brainNext"] = null;
    const room: Room | null = org.slug === "household" || org.slug === "sales" ? org.slug : null;
    if (room) {
      try {
        const brain = await toolRead(orgId);
        const chosen = chooseNextStep({ room, brain, storedTitle: "" });
        if (chosen && chosen.from !== "stored") {
          brainNext = { title: chosen.title, name: chosen.name, login: chosen.login, from: chosen.from };
        }
      } catch {
        brainNext = null;
      }
    }
    return { ok: true, model: { ...model, brainNext } };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}
