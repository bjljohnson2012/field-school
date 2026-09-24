export function viewerIsLearner(input: {
  stance: string;
  capabilities: readonly string[];
  platformAdmin: boolean;
}) {
  if (input.platformAdmin) return false;
  const elevated = new Set(["coach", "leader", "admin"]);
  if (elevated.has(input.stance)) return false;
  return !input.capabilities.some((capability) => elevated.has(capability));
}

export function isDirectorOnlyRecommendation(row: { routeTo?: string; category?: string }) {
  const route = String(row.routeTo ?? "").toLowerCase();
  const category = String(row.category ?? "").toUpperCase();
  return route === "coach" || category === "PERSONALITY" || category === "LEADERSHIP";
}

export function hideDirectorOnlyRecommendations<T extends { routeTo?: string; category?: string }>(
  rows: T[],
  learner: boolean,
) {
  if (!learner) return rows;
  return rows.filter((row) => !isDirectorOnlyRecommendation(row));
}

export function hasVpLink(
  links: ReadonlyArray<{
    orgId: string;
    coachMembershipId: string;
    subjectMembershipId: string;
    kind: string;
  }>,
  orgId: string,
  actorMembershipId: string,
  subjectMembershipId: string,
) {
  return links.some(
    (row) =>
      row.orgId === orgId &&
      row.kind === "vp" &&
      row.coachMembershipId === actorMembershipId &&
      row.subjectMembershipId === subjectMembershipId,
  );
}

export function canSeeDirectorTypeLabels(input: {
  actorMembershipId: string;
  subjectMembershipId: string;
  stance: string;
  capabilities: readonly string[];
  platformAdmin: boolean;
  vpLink: boolean;
}) {
  if (input.actorMembershipId === input.subjectMembershipId) return true;
  if (input.platformAdmin) return true;
  const held = new Set([input.stance, ...input.capabilities]);
  if (held.has("admin") || held.has("leader")) return true;
  if (input.vpLink) return true;
  return false;
}

export type DirectorTypes = {
  enneagramType: string | null;
  discProfile: string | null;
  mbtiType: string | null;
};

export function presentDirectorTypes(types: DirectorTypes, allowed: boolean): DirectorTypes {
  if (allowed) return types;
  return { enneagramType: null, discProfile: null, mbtiType: null };
}
