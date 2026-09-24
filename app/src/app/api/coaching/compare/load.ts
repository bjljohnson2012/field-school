import { and, eq, inArray } from "drizzle-orm";
import { generateCompareNarrative } from "@/lib/ai/prompts/loop";
import { generatePersonalityComparison, type PersonalitySide } from "@/lib/ai/prompts/person";
import { assertCanAccessMember, memberHasPlatformAdmin, type Actor, type CoachingWorld } from "@/lib/coaching/access";
import { getDb } from "@/lib/db/client";
import { coachingProfiles, members, memberships, recommendations, skillStates, skills } from "@/lib/db/schema";
import {
  canSeeDirectorTypeLabels,
  hasVpLink,
  hideDirectorOnlyRecommendations,
  presentDirectorTypes,
  viewerIsLearner,
  type DirectorTypes,
} from "@/app/coaching/compare/policy";

export class CompareFlowError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "CompareFlowError";
    this.code = code;
    this.status = status;
  }
}

function strings(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function actorCaps(world: CoachingWorld, actor: Actor) {
  return world.capabilities.filter((row) => row.membershipId === actor.membershipId).map((row) => row.capability);
}

function roleFor(stance: string, vp: boolean): PersonalitySide["role"] {
  if (stance === "admin") return "ORG_ADMIN";
  if (vp || stance === "leader") return "VP_SALES";
  if (stance === "coach") return "DIRECTOR";
  return "AE";
}

async function roster(orgId: string) {
  const db = getDb();
  return db
    .select({ id: memberships.id, name: members.name, stance: memberships.stance })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(eq(memberships.orgId, orgId));
}

export async function compareRoster(world: CoachingWorld, actor: Actor) {
  const rows = await roster(actor.orgId);
  const visible = rows.filter((row) => assertCanAccessMember(world, actor, row.id));
  return {
    aes: visible.filter((row) => row.stance === "learner" || row.stance === "teammate"),
    directors: visible.filter((row) => row.stance === "coach" || row.stance === "leader" || row.stance === "admin"),
    learner: viewerIsLearner({
      stance: actor.stance,
      capabilities: actorCaps(world, actor),
      platformAdmin: memberHasPlatformAdmin(world, actor.memberId),
    }),
  };
}

async function profilesFor(orgId: string, ids: string[]) {
  const db = getDb();
  const people = await roster(orgId);
  const names = new Map(people.map((row) => [row.id, row]));
  const profileRows = await db
    .select()
    .from(coachingProfiles)
    .where(and(eq(coachingProfiles.orgId, orgId), inArray(coachingProfiles.membershipId, ids)));
  const scoreRows = await db
    .select({ membershipId: skillStates.membershipId, slug: skills.slug, score: skillStates.score })
    .from(skillStates)
    .innerJoin(skills, eq(skills.id, skillStates.skillId))
    .where(and(eq(skillStates.orgId, orgId), inArray(skillStates.membershipId, ids)));
  const recRows = await db
    .select()
    .from(recommendations)
    .where(and(eq(recommendations.orgId, orgId), inArray(recommendations.subjectMembershipId, ids)));
  const profiles = new Map(profileRows.map((row) => [row.membershipId, row]));
  return ids.map((id) => {
    const person = names.get(id);
    const profile = profiles.get(id);
    return {
      id,
      name: person?.name || "Member",
      stance: person?.stance || "learner",
      enneagramType: profile?.enneagramType ?? null,
      discProfile: profile?.discProfile ?? null,
      mbtiType: profile?.mbtiType ?? null,
      personalitySummary: profile?.personalitySummary ?? null,
      salesStyleSummary: profile?.salesStyleSummary ?? null,
      communicationSummary: profile?.communicationSummary ?? null,
      strengths: strings(profile?.strengths),
      weaknesses: strings(profile?.weaknesses),
      motivations: strings(profile?.motivations),
      skillScores: scoreRows
        .filter((row) => row.membershipId === id)
        .map((row) => ({ category: row.slug, score: Number(row.score) })),
      recommendations: recRows
        .filter((row) => row.subjectMembershipId === id)
        .map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          routeTo: row.routeTo,
          category: row.category,
        })),
    };
  });
}

function requireAccess(world: CoachingWorld, actor: Actor, ids: string[]) {
  for (const id of ids) {
    const subject = world.memberships.find((row) => row.id === id);
    if (!subject || subject.orgId !== actor.orgId) throw new CompareFlowError("forbidden", 403);
    if (!assertCanAccessMember(world, actor, id)) throw new CompareFlowError("forbidden", 403);
  }
}

export async function compareAes(world: CoachingWorld, actor: Actor, membershipIds: string[]) {
  const ids = [...new Set(membershipIds)];
  if (ids.length < 2 || ids.length > 4) throw new CompareFlowError("invalid_body", 400);
  requireAccess(world, actor, ids);
  const people = await profilesFor(actor.orgId, ids);
  const narrative = await generateCompareNarrative(
    people.map((person) => ({
      name: person.name,
      enneagramType: person.enneagramType,
      discProfile: person.discProfile,
      mbtiType: person.mbtiType,
      strengths: person.strengths,
      weaknesses: person.weaknesses,
      motivations: person.motivations,
      skillScores: person.skillScores,
    })),
  );
  const learner = viewerIsLearner({
    stance: actor.stance,
    capabilities: actorCaps(world, actor),
    platformAdmin: memberHasPlatformAdmin(world, actor.memberId),
  });
  const recommendations = hideDirectorOnlyRecommendations(
    people.flatMap((person) => person.recommendations.map((row) => ({ ...row, subjectName: person.name }))),
    learner,
  );
  return { narrative, recommendations, orgId: actor.orgId };
}

function typesOf(person: { enneagramType: string | null; discProfile: string | null; mbtiType: string | null }): DirectorTypes {
  return {
    enneagramType: person.enneagramType,
    discProfile: person.discProfile,
    mbtiType: person.mbtiType,
  };
}

export async function compareDirectors(world: CoachingWorld, actor: Actor, leaderMembershipId: string, targetMembershipId: string) {
  if (!leaderMembershipId || !targetMembershipId || leaderMembershipId === targetMembershipId) {
    throw new CompareFlowError("invalid_body", 400);
  }
  requireAccess(world, actor, [leaderMembershipId, targetMembershipId]);
  const [leader, target] = await profilesFor(actor.orgId, [leaderMembershipId, targetMembershipId]);
  if (!leader || !target) throw new CompareFlowError("not_found", 404);
  const caps = actorCaps(world, actor);
  const platformAdmin = memberHasPlatformAdmin(world, actor.memberId);
  const leaderAllowed = canSeeDirectorTypeLabels({
    actorMembershipId: actor.membershipId,
    subjectMembershipId: leader.id,
    stance: actor.stance,
    capabilities: caps,
    platformAdmin,
    vpLink: hasVpLink(world.links, actor.orgId, actor.membershipId, leader.id),
  });
  const targetAllowed = canSeeDirectorTypeLabels({
    actorMembershipId: actor.membershipId,
    subjectMembershipId: target.id,
    stance: actor.stance,
    capabilities: caps,
    platformAdmin,
    vpLink: hasVpLink(world.links, actor.orgId, actor.membershipId, target.id),
  });
  const leaderTypes = presentDirectorTypes(typesOf(leader), leaderAllowed);
  const targetTypes = presentDirectorTypes(typesOf(target), targetAllowed);
  const side = (person: typeof leader, types: DirectorTypes, vp: boolean): PersonalitySide => ({
    name: person.name,
    role: roleFor(person.stance, vp),
    enneagramType: types.enneagramType,
    discProfile: types.discProfile,
    mbtiType: types.mbtiType,
    personalitySummary: person.personalitySummary,
    styleSummary: person.salesStyleSummary,
    communicationSummary: person.communicationSummary,
    strengths: person.strengths,
    weaknesses: person.weaknesses,
    motivations: person.motivations,
    skillScores: person.skillScores,
  });
  const narrative = await generatePersonalityComparison({
    leader: side(leader, leaderTypes, hasVpLink(world.links, actor.orgId, leader.id, target.id)),
    target: side(target, targetTypes, false),
  });
  return {
    narrative,
    leader: { name: leader.name, types: leaderTypes, typesVisible: leaderAllowed },
    target: { name: target.name, types: targetTypes, typesVisible: targetAllowed },
  };
}
