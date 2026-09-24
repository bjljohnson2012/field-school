import {
  assignableMembershipIds,
  memberHasPlatformAdmin,
  type Actor,
  type CoachingWorld,
} from "@/lib/coaching/access";

export const TASK_STATUSES = ["open", "in_progress", "done", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const NEXT_STATUS: Record<string, TaskStatus> = {
  open: "in_progress",
  in_progress: "done",
};

export type TaskAccessRow = {
  orgId: string;
  assigneeMembershipId: string;
  authorMembershipId: string;
  status: string;
};

/** Membership id is enough. A learner profile is not required. */
export function canAssign(world: CoachingWorld, actor: Actor, assigneeMembershipId: string) {
  return assignableMembershipIds(world, actor).includes(assigneeMembershipId);
}

export function canListTask(world: CoachingWorld, actor: Actor, task: TaskAccessRow) {
  if (task.orgId !== actor.orgId) return false;
  return canAssign(world, actor, task.assigneeMembershipId);
}

export function isTaskAdmin(world: CoachingWorld, actor: Actor) {
  if (memberHasPlatformAdmin(world, actor.memberId)) return true;
  if (actor.stance === "admin") return true;
  return world.capabilities.some(
    (row) => row.membershipId === actor.membershipId && row.capability === "admin",
  );
}

export function canChangeStatus(
  world: CoachingWorld,
  actor: Actor,
  task: TaskAccessRow,
  next: string,
) {
  if (task.orgId !== actor.orgId) return false;
  const assignee = task.assigneeMembershipId === actor.membershipId;
  const author = task.authorMembershipId === actor.membershipId;
  if (next === "cancelled") {
    if (task.status !== "open" && task.status !== "in_progress") return false;
    return author || isTaskAdmin(world, actor);
  }
  if (NEXT_STATUS[task.status] !== next) return false;
  return assignee || author;
}

export function subjectAllowed(world: CoachingWorld, orgId: string, subjectMembershipId: string | null) {
  if (!subjectMembershipId) return true;
  return world.memberships.some((row) => row.id === subjectMembershipId && row.orgId === orgId);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}
