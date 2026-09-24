import { and, desc, eq, inArray } from "drizzle-orm";
import { assignableMembershipIds, type Actor, type CoachingWorld } from "@/lib/coaching/access";
import { getDb } from "@/lib/db/client";
import { members, memberships, skillStates, skills, workItems } from "@/lib/db/schema";
import { canAssign, canChangeStatus, canListTask, subjectAllowed } from "./access";

export class TaskError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "TaskError";
    this.code = code;
    this.status = status;
  }
}

export type TaskDto = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  assigneeMembershipId: string;
  authorMembershipId: string;
  subjectMembershipId: string | null;
  assigneeName: string;
  dueAt: string | null;
  createdAt: string;
};

export type AssigneeOption = {
  id: string;
  name: string;
  stance: string;
};

type WorkRow = typeof workItems.$inferSelect;

function iso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function toDto(row: WorkRow, names: Map<string, string>): TaskDto {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status,
    assigneeMembershipId: row.assigneeMembershipId,
    authorMembershipId: row.authorMembershipId,
    subjectMembershipId: row.subjectMembershipId,
    assigneeName: names.get(row.assigneeMembershipId) || "Member",
    dueAt: iso(row.dueAt),
    createdAt: iso(row.createdAt) || "",
  };
}

async function namesFor(orgId: string, ids: string[]) {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return new Map<string, string>();
  const db = getDb();
  const rows = await db
    .select({ id: memberships.id, name: members.name })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(and(eq(memberships.orgId, orgId), inArray(memberships.id, unique)));
  return new Map(rows.map((row) => [row.id, row.name]));
}

export async function countOpenTasks(orgId: string, membershipId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: workItems.id })
    .from(workItems)
    .where(
      and(
        eq(workItems.orgId, orgId),
        eq(workItems.assigneeMembershipId, membershipId),
        eq(workItems.status, "open"),
      ),
    );
  return rows.length;
}

export async function listTasks(world: CoachingWorld, actor: Actor) {
  const db = getDb();
  const rows = await db
    .select()
    .from(workItems)
    .where(eq(workItems.orgId, actor.orgId))
    .orderBy(desc(workItems.createdAt));
  const visible = rows.filter((row) => canListTask(world, actor, row));
  const names = await namesFor(
    actor.orgId,
    visible.map((row) => row.assigneeMembershipId),
  );
  return visible.map((row) => toDto(row, names));
}

export function assigneeOptions(world: CoachingWorld, actor: Actor, names: Map<string, string>): AssigneeOption[] {
  const allowed = new Set(assignableMembershipIds(world, actor));
  return world.memberships
    .filter((row) => row.orgId === actor.orgId && allowed.has(row.id))
    .map((row) => ({
      id: row.id,
      name: names.get(row.id) || "Member",
      stance: row.stance,
    }));
}

export async function loadAssigneeChoices(world: CoachingWorld, actor: Actor) {
  const ids = assignableMembershipIds(world, actor);
  const names = await namesFor(actor.orgId, ids);
  return assigneeOptions(world, actor, names);
}

export type TaskDraft = {
  title: string;
  body: string | null;
  assigneeMembershipId: string;
  subjectMembershipId: string | null;
  dueAt: Date | null;
};

export async function createTask(world: CoachingWorld, actor: Actor, draft: TaskDraft) {
  if (!draft.title.trim()) throw new TaskError("invalid_body", 400);
  if (!canAssign(world, actor, draft.assigneeMembershipId)) throw new TaskError("forbidden", 403);
  if (!subjectAllowed(world, actor.orgId, draft.subjectMembershipId)) {
    throw new TaskError("invalid_subject", 400);
  }
  const db = getDb();
  const [row] = await db
    .insert(workItems)
    .values({
      orgId: actor.orgId,
      assigneeMembershipId: draft.assigneeMembershipId,
      authorMembershipId: actor.membershipId,
      subjectMembershipId: draft.subjectMembershipId,
      title: draft.title.trim(),
      body: draft.body,
      status: "open",
      dueAt: draft.dueAt,
    })
    .returning();
  const names = await namesFor(actor.orgId, [row.assigneeMembershipId]);
  return toDto(row, names);
}

export async function setTaskStatus(world: CoachingWorld, actor: Actor, id: string, status: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(workItems)
    .where(and(eq(workItems.id, id), eq(workItems.orgId, actor.orgId)))
    .limit(1);
  if (!row) throw new TaskError("not_found", 404);
  if (!canChangeStatus(world, actor, row, status)) throw new TaskError("forbidden", 403);
  const now = new Date();
  const [updated] = await db
    .update(workItems)
    .set({
      status,
      updatedAt: now,
      completedAt: status === "done" ? now : row.completedAt,
    })
    .where(eq(workItems.id, row.id))
    .returning();
  const names = await namesFor(actor.orgId, [updated.assigneeMembershipId]);
  return toDto(updated, names);
}

export async function assigneeCoachingContext(orgId: string, membershipId: string) {
  const db = getDb();
  const [person] = await db
    .select({ name: members.name, stance: memberships.stance })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(and(eq(memberships.id, membershipId), eq(memberships.orgId, orgId)))
    .limit(1);
  const scores = await db
    .select({ category: skills.slug, score: skillStates.score })
    .from(skillStates)
    .innerJoin(skills, eq(skills.id, skillStates.skillId))
    .where(and(eq(skillStates.orgId, orgId), eq(skillStates.membershipId, membershipId)));
  const open = await db
    .select({ title: workItems.title })
    .from(workItems)
    .where(
      and(
        eq(workItems.orgId, orgId),
        eq(workItems.assigneeMembershipId, membershipId),
        eq(workItems.status, "open"),
      ),
    );
  return {
    aeName: person?.name?.trim() || "AE",
    stance: person?.stance || "learner",
    strengths: [] as string[],
    weaknesses: [] as string[],
    skillScores: scores.map((row) => ({
      category: row.category,
      score: Number(row.score ?? 0),
    })),
    existingOpenTasks: open.map((row) => ({ title: row.title })),
  };
}

export type GeneratedDraft = {
  title: string;
  description?: string;
  dueInDays?: number;
};

export async function insertGeneratedTasks(
  actor: Actor,
  assigneeMembershipId: string,
  generated: GeneratedDraft[],
) {
  const now = Date.now();
  const values = generated
    .filter((task) => task.title.trim())
    .map((task) => ({
      orgId: actor.orgId,
      assigneeMembershipId,
      authorMembershipId: actor.membershipId,
      subjectMembershipId: null,
      title: task.title.trim(),
      body: task.description?.trim() || null,
      status: "open" as const,
      dueAt: Number.isFinite(task.dueInDays) ? new Date(now + Number(task.dueInDays) * 86_400_000) : null,
    }));
  if (!values.length) return [];
  const db = getDb();
  const rows = await db.insert(workItems).values(values).returning();
  const names = await namesFor(
    actor.orgId,
    rows.map((row) => row.assigneeMembershipId),
  );
  return rows.map((row) => toDto(row, names));
}
