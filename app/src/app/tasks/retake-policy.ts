export function tasksBadgeCount(input: {
  openWorkItems: number;
  hasWorkItems: boolean;
  isCoach: boolean;
  openRetakes: number;
}) {
  const open = Math.max(0, input.openWorkItems);
  if (input.isCoach && input.hasWorkItems) return open + Math.max(0, input.openRetakes);
  return open;
}

export function coachSeesRetake(input: {
  isCoach: boolean;
  actorMembershipId: string;
  requesterMembershipId: string;
  canAccessRequester: boolean;
}) {
  if (!input.isCoach) return false;
  if (!input.canAccessRequester) return false;
  return input.requesterMembershipId !== input.actorMembershipId;
}
