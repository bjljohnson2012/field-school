import { roomSlug } from "./orgs.ts";

const ACCOUNTABLE = new Set(["guardian", "admin", "teacher", "owner"]);

export type BackfillOrg = { id: string; slug: string; kind: string; name: string };
export type BackfillMember = { id: string; name: string; email: string; kind: string };
export type BackfillMembership = { id: string; orgId: string; memberId: string; stance: string };
export type BackfillWard = { orgId: string; guardianMembershipId: string; childMembershipId: string };
export type BackfillInvite = {
  orgId: string;
  email: string;
  status: string;
  invitedByMembershipId: string | null;
};

export type FamilyMove = {
  slug: string;
  name: string;
  kind: "family";
  homeschoolMode: true;
  createdBy: string;
  isolation: "strict";
  ownerMemberId: string;
  learnerMemberIds: string[];
};

export type TeamMove = {
  slug: string;
  name: string;
  kind: "team";
  homeschoolMode: false;
  createdBy: string;
  isolation: "platform_plus";
  ownerMemberId: string;
  learnerMemberIds: string[];
};

export type BackfillPlan = {
  families: FamilyMove[];
  teams: TeamMove[];
  skipped: { memberId: string; reason: string }[];
  counts: {
    families: number;
    teams: number;
    memberships: number;
    wards: number;
    skipped: number;
    excluded: number;
  };
};

export function planBackfill(input: {
  orgs: readonly BackfillOrg[];
  members: readonly BackfillMember[];
  memberships: readonly BackfillMembership[];
  wards: readonly BackfillWard[];
  invites: readonly BackfillInvite[];
  excludedMemberIds: readonly string[];
}): BackfillPlan {
  const excluded = new Set(input.excludedMemberIds);
  const members = new Map(input.members.map((row) => [row.id, row]));
  const membershipById = new Map(input.memberships.map((row) => [row.id, row]));
  const families = planFamilies(input, excluded, members, membershipById);
  const { teams, skipped: teamSkips } = planTeams(input, excluded, members, membershipById);
  const familySkips = families.skipped;
  const skipped = [...familySkips, ...teamSkips];
  const memberships =
    families.moves.reduce((sum, row) => sum + 1 + row.learnerMemberIds.length, 0) +
    teams.reduce((sum, row) => sum + 1 + row.learnerMemberIds.length, 0);
  const wards = families.moves.reduce((sum, row) => sum + row.learnerMemberIds.length, 0);
  return {
    families: families.moves,
    teams,
    skipped,
    counts: {
      families: families.moves.length,
      teams: teams.length,
      memberships,
      wards,
      skipped: skipped.length,
      excluded: excluded.size,
    },
  };
}

function planFamilies(
  input: {
    orgs: readonly BackfillOrg[];
    memberships: readonly BackfillMembership[];
    wards: readonly BackfillWard[];
  },
  excluded: Set<string>,
  members: Map<string, BackfillMember>,
  membershipById: Map<string, BackfillMembership>,
): { moves: FamilyMove[]; skipped: { memberId: string; reason: string }[] } {
  const household = input.orgs.find((org) => org.slug === "household");
  const moves: FamilyMove[] = [];
  const skipped: { memberId: string; reason: string }[] = [];
  if (!household) return { moves, skipped };
  for (const adult of input.memberships) {
    if (adult.orgId !== household.id || !ACCOUNTABLE.has(adult.stance)) continue;
    const person = members.get(adult.memberId);
    if (!person || person.kind === "child") continue;
    if (excluded.has(adult.memberId)) {
      skipped.push({ memberId: adult.memberId, reason: "excluded" });
      continue;
    }
    const learnerMemberIds = [
      ...new Set(
        input.wards
          .filter((ward) => ward.orgId === household.id && ward.guardianMembershipId === adult.id)
          .map((ward) => membershipById.get(ward.childMembershipId))
          .filter((row): row is BackfillMembership => !!row && row.orgId === household.id)
          .map((row) => row.memberId)
          .filter((memberId) => {
            const child = members.get(memberId);
            return !!child && child.kind === "child" && !excluded.has(memberId);
          }),
      ),
    ];
    if (!learnerMemberIds.length) {
      skipped.push({ memberId: adult.memberId, reason: "no_children" });
      continue;
    }
    const who = person.name.trim().slice(0, 60) || "Family";
    moves.push({
      slug: roomSlug(adult.memberId, "family"),
      name: `${who} family`,
      kind: "family",
      homeschoolMode: true,
      createdBy: adult.memberId,
      isolation: "strict",
      ownerMemberId: adult.memberId,
      learnerMemberIds,
    });
  }
  return { moves, skipped };
}

function planTeams(
  input: {
    orgs: readonly BackfillOrg[];
    memberships: readonly BackfillMembership[];
    invites: readonly BackfillInvite[];
  },
  excluded: Set<string>,
  members: Map<string, BackfillMember>,
  membershipById: Map<string, BackfillMembership>,
): { teams: TeamMove[]; skipped: { memberId: string; reason: string }[] } {
  const sales = input.orgs.find((org) => org.slug === "sales");
  const teams: TeamMove[] = [];
  const skipped: { memberId: string; reason: string }[] = [];
  if (!sales) return { teams, skipped };
  const groups = new Map<string, string[]>();
  for (const membership of input.memberships) {
    if (membership.orgId !== sales.id) continue;
    const person = members.get(membership.memberId);
    if (!person || person.kind === "child") continue;
    if (excluded.has(person.id)) {
      skipped.push({ memberId: person.id, reason: "excluded" });
      continue;
    }
    const inviters = [
      ...new Set(
        input.invites
          .filter(
            (invite) =>
              invite.orgId === sales.id &&
              invite.status === "accepted" &&
              invite.email.trim().toLowerCase() === person.email.trim().toLowerCase() &&
              !!invite.invitedByMembershipId,
          )
          .map((invite) => invite.invitedByMembershipId as string),
      ),
    ];
    if (inviters.length === 0) {
      skipped.push({ memberId: person.id, reason: "no_invite" });
      continue;
    }
    if (inviters.length > 1) {
      skipped.push({ memberId: person.id, reason: "ambiguous_inviters" });
      continue;
    }
    const list = groups.get(inviters[0]) ?? [];
    list.push(person.id);
    groups.set(inviters[0], list);
  }
  for (const [inviterMembershipId, learnerIds] of groups) {
    const inviterMembership = membershipById.get(inviterMembershipId);
    const inviter = inviterMembership ? members.get(inviterMembership.memberId) : undefined;
    if (!inviterMembership || !inviter || inviter.kind === "child" || excluded.has(inviter.id)) {
      for (const memberId of learnerIds) skipped.push({ memberId, reason: "inviter_unavailable" });
      continue;
    }
    const learnerMemberIds = [...new Set(learnerIds.filter((id) => id !== inviter.id && !excluded.has(id)))];
    const who = inviter.name.trim().slice(0, 60) || "Team";
    teams.push({
      slug: roomSlug(inviter.id, "team"),
      name: `${who} team`,
      kind: "team",
      homeschoolMode: false,
      createdBy: inviter.id,
      isolation: "platform_plus",
      ownerMemberId: inviter.id,
      learnerMemberIds,
    });
  }
  return { teams, skipped };
}
