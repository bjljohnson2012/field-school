import { and, desc, eq, inArray } from "drizzle-orm";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { getDb } from "@/lib/db/client";
import { drillAttempts, membershipCapabilities, organizations, skillStates, skills } from "@/lib/db/schema";
import {
  drillShape,
  drillsForOrg,
  improveLabel,
  rubricText,
  skillsForShape,
  summarizeAttempts,
  type DrillShape,
  type DrillSkill,
  type DrillStats,
} from "./math";

export type ImproveDesk = {
  orgName: string;
  orgKind: string;
  open: boolean;
  label: string;
  shape: DrillShape;
  skills: DrillSkill[];
  stats: DrillStats;
  recentBySkill: Record<string, string[]>;
  rubricBySkill: Record<string, string>;
};

function scoreNumber(value: unknown): number | null {
  if (value == null) return null;
  const score = typeof value === "number" ? value : Number(value);
  return Number.isFinite(score) ? score : null;
}

export async function loadImproveDesk(identity: LearnerIdentity): Promise<ImproveDesk> {
  const db = getDb();
  const [org] = await db
    .select({ name: organizations.name, kind: organizations.kind, features: organizations.features })
    .from(organizations)
    .where(eq(organizations.id, identity.orgId))
    .limit(1);
  const caps = await db
    .select({ capability: membershipCapabilities.capability })
    .from(membershipCapabilities)
    .where(eq(membershipCapabilities.membershipId, identity.membershipId));
  const shape = drillShape(
    identity.stance,
    caps.map((row) => row.capability),
  );
  const catalog = skillsForShape(shape);
  const slugs = catalog.map((skill) => skill.slug);
  const [stateRows, skillRows, attempts] = await Promise.all([
    db
      .select({ slug: skills.slug, score: skillStates.score })
      .from(skillStates)
      .innerJoin(skills, eq(skills.id, skillStates.skillId))
      .where(and(eq(skillStates.orgId, identity.orgId), eq(skillStates.membershipId, identity.membershipId))),
    db
      .select({ slug: skills.slug, rubric: skills.rubric })
      .from(skills)
      .where(and(eq(skills.orgId, identity.orgId), inArray(skills.slug, slugs))),
    db
      .select({
        skillCategory: drillAttempts.skillCategory,
        prompt: drillAttempts.prompt,
        pointsAwarded: drillAttempts.pointsAwarded,
        status: drillAttempts.status,
        createdAt: drillAttempts.createdAt,
      })
      .from(drillAttempts)
      .where(and(eq(drillAttempts.orgId, identity.orgId), eq(drillAttempts.membershipId, identity.membershipId)))
      .orderBy(desc(drillAttempts.createdAt)),
  ]);
  const scoreBySlug = new Map(stateRows.map((row) => [row.slug, scoreNumber(row.score)]));
  const rubricBySlug = new Map(skillRows.map((row) => [row.slug, row.rubric]));
  const skillsOut = catalog
    .map((skill) => ({
      category: skill.slug,
      label: skill.name,
      score: scoreBySlug.get(skill.slug) ?? null,
    }))
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
  const recentBySkill: Record<string, string[]> = {};
  for (const row of attempts) {
    const list = recentBySkill[row.skillCategory] ?? [];
    if (list.length >= 5) continue;
    list.push(row.prompt);
    recentBySkill[row.skillCategory] = list;
  }
  const rubricBySkill: Record<string, string> = {};
  for (const skill of catalog) {
    rubricBySkill[skill.slug] = rubricText(skill.name, rubricBySlug.get(skill.slug));
  }
  const orgKind = org?.kind ?? "";
  return {
    orgName: org?.name?.trim() || "your org",
    orgKind,
    open: drillsForOrg(orgKind),
    label: improveLabel(org?.features),
    shape,
    skills: skillsOut,
    stats: summarizeAttempts(attempts),
    recentBySkill,
    rubricBySkill,
  };
}
