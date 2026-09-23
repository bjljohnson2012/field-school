export const OPERATOR_ORG_SLUG = "field-school";
export const PLATFORM_ADMIN = "platform_admin";

export type OrgRef = { slug: string };

export type MembershipRow = {
  id: string;
  orgId: string;
  memberId: string;
  stance: string;
};

export type CapabilityRow = {
  membershipId: string;
  capability: string;
};

export type LinkRow = {
  orgId: string;
  coachMembershipId: string;
  subjectMembershipId: string;
  kind: "director" | "vp";
};

export type WardRow = {
  orgId: string;
  guardianMembershipId: string;
  childMembershipId: string;
};

export type CoachingWorld = {
  memberships: MembershipRow[];
  capabilities: CapabilityRow[];
  links: LinkRow[];
  wards: WardRow[];
};

export type Actor = {
  memberId: string;
  membershipId: string;
  orgId: string;
  stance: string;
};

const RANK: Record<string, number> = {
  platform_admin: 5,
  admin: 4,
  leader: 3,
  coach: 2,
  learner: 1,
  teammate: 1,
  teacher: 1,
  trainer: 1,
  guardian: 1,
};

export function ensureOperatorMembership(org: OrgRef): {
  stance: "learner" | "admin";
  capabilities: string[];
} {
  if (org.slug === OPERATOR_ORG_SLUG) {
    return { stance: "admin", capabilities: [PLATFORM_ADMIN] };
  }
  return { stance: "learner", capabilities: [] };
}

export function stanceBackfillCapability(stance: string): string | null {
  if (stance === PLATFORM_ADMIN) return null;
  return stance;
}

export function memberHasPlatformAdmin(world: CoachingWorld, memberId: string) {
  const membershipIds = new Set(
    world.memberships.filter((row) => row.memberId === memberId).map((row) => row.id),
  );
  return world.capabilities.some(
    (row) => membershipIds.has(row.membershipId) && row.capability === PLATFORM_ADMIN,
  );
}

function holds(world: CoachingWorld, membershipId: string, capability: string) {
  if (capability === PLATFORM_ADMIN) return false;
  if (
    world.capabilities.some(
      (row) => row.membershipId === membershipId && row.capability === capability,
    )
  ) {
    return true;
  }
  const membership = world.memberships.find((row) => row.id === membershipId);
  return membership?.stance === capability;
}

function rankOf(world: CoachingWorld, membership: MembershipRow) {
  if (memberHasPlatformAdmin(world, membership.memberId)) return RANK.platform_admin;
  let rank = RANK[membership.stance] ?? 1;
  for (const row of world.capabilities) {
    if (row.membershipId !== membership.id) continue;
    rank = Math.max(rank, RANK[row.capability] ?? 1);
  }
  return rank;
}

function subjects(
  world: CoachingWorld,
  orgId: string,
  coachMembershipId: string,
  kind: LinkRow["kind"],
) {
  return world.links
    .filter(
      (row) =>
        row.orgId === orgId &&
        row.kind === kind &&
        row.coachMembershipId === coachMembershipId,
    )
    .map((row) => row.subjectMembershipId);
}

function directorLink(
  world: CoachingWorld,
  coachMembershipId: string,
  subjectMembershipId: string,
  orgId: string,
) {
  return world.links.some(
    (row) =>
      row.orgId === orgId &&
      row.kind === "director" &&
      row.coachMembershipId === coachMembershipId &&
      row.subjectMembershipId === subjectMembershipId,
  );
}

function leaderReaches(
  world: CoachingWorld,
  actorMembershipId: string,
  subjectMembershipId: string,
  orgId: string,
) {
  const coaches = subjects(world, orgId, actorMembershipId, "vp");
  if (coaches.includes(subjectMembershipId)) return true;
  return coaches.some((coachId) =>
    directorLink(world, coachId, subjectMembershipId, orgId),
  );
}

function wardLink(
  world: CoachingWorld,
  orgId: string,
  guardianMembershipId: string,
  childMembershipId: string,
) {
  return world.wards.some(
    (row) =>
      row.orgId === orgId &&
      row.guardianMembershipId === guardianMembershipId &&
      row.childMembershipId === childMembershipId,
  );
}

export function assertCanAccessMember(
  world: CoachingWorld,
  actor: Actor,
  subjectMembershipId: string,
) {
  const subject = world.memberships.find((row) => row.id === subjectMembershipId) ?? null;
  if (!subject || subject.orgId !== actor.orgId) return null;
  if (subject.id === actor.membershipId) return subject;
  if (memberHasPlatformAdmin(world, actor.memberId)) return subject;
  if (holds(world, actor.membershipId, "admin")) return subject;
  if (directorLink(world, actor.membershipId, subject.id, actor.orgId)) return subject;
  if (leaderReaches(world, actor.membershipId, subject.id, actor.orgId)) return subject;
  if (wardLink(world, actor.orgId, actor.membershipId, subject.id)) return subject;
  return null;
}

function leaderAssignable(world: CoachingWorld, actor: Actor) {
  const ids = new Set<string>([actor.membershipId]);
  for (const coachId of subjects(world, actor.orgId, actor.membershipId, "vp")) {
    ids.add(coachId);
    for (const learnerId of subjects(world, actor.orgId, coachId, "director")) {
      ids.add(learnerId);
    }
  }
  return [...ids];
}

function coachAssignable(world: CoachingWorld, actor: Actor) {
  const ids = new Set<string>([actor.membershipId]);
  for (const learnerId of subjects(world, actor.orgId, actor.membershipId, "director")) {
    ids.add(learnerId);
  }
  return [...ids];
}

export function assignableMembershipIds(world: CoachingWorld, actor: Actor) {
  const inOrg = world.memberships.filter((row) => row.orgId === actor.orgId);
  if (memberHasPlatformAdmin(world, actor.memberId)) return inOrg.map((row) => row.id);
  if (holds(world, actor.membershipId, "admin")) {
    return inOrg.filter((row) => rankOf(world, row) <= RANK.admin).map((row) => row.id);
  }
  if (holds(world, actor.membershipId, "leader")) return leaderAssignable(world, actor);
  if (holds(world, actor.membershipId, "coach")) return coachAssignable(world, actor);
  return [actor.membershipId];
}

export function isGuardianOf(
  actor: { stance: string; orgId: string; membershipId: string },
  childMembershipId: string,
  wards: WardRow[] = [],
) {
  if (actor.stance === "admin") return true;
  return wards.some(
    (row) =>
      row.orgId === actor.orgId &&
      row.guardianMembershipId === actor.membershipId &&
      row.childMembershipId === childMembershipId,
  );
}
