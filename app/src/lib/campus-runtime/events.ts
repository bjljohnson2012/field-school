import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { learningEvents, memberships } from "@/lib/db/schema";
import type { LearnerIdentity } from "./identity";
import { emptyProgress } from "@/lib/course/content";
import type { ModuleProgress, ProgressMap } from "@/lib/course/types";

export type EventInput = {
  kind: string;
  objectType: string;
  objectId: string;
  skillIds?: string[];
  score?: number | null;
  raw?: Record<string, unknown>;
};

export function stationObjectId(course: string, station: string) {
  return `${course}:${station}`;
}

export async function recordEvent(
  subject: LearnerIdentity,
  input: EventInput,
  actor?: { membershipId: string; stance: string },
) {
  const db = getDb();
  if (actor) {
    const [actorRow] = await db
      .select({ orgId: memberships.orgId })
      .from(memberships)
      .where(eq(memberships.id, actor.membershipId))
      .limit(1);
    if (!actorRow || actorRow.orgId !== subject.orgId) {
      throw new Error("actor_org_mismatch");
    }
  }
  const [row] = await db
    .insert(learningEvents)
    .values({
      orgId: subject.orgId,
      membershipId: subject.membershipId,
      actorMembershipId: actor?.membershipId ?? subject.membershipId,
      actorStance: actor?.stance ?? subject.stance,
      kind: input.kind,
      objectType: input.objectType,
      objectId: input.objectId,
      skillIds: input.skillIds ?? [],
      score: input.score == null ? null : String(input.score),
      raw: input.raw ?? {},
    })
    .returning();
  return row;
}

export async function eventsForCourse(identity: LearnerIdentity, course: string) {
  const db = getDb();
  const prefix = `${course}:`;
  const rows = await db
    .select()
    .from(learningEvents)
    .where(
      and(
        eq(learningEvents.orgId, identity.orgId),
        eq(learningEvents.membershipId, identity.membershipId),
      ),
    )
    .orderBy(desc(learningEvents.createdAt));
  return rows.filter(
    (row) => row.objectId === course || row.objectId.startsWith(prefix),
  );
}

export function reduceCourseProgress(rows: Awaited<ReturnType<typeof eventsForCourse>>) {
  const modules: ProgressMap = {};
  for (const row of [...rows].reverse()) {
    const station = row.objectId.includes(":")
      ? row.objectId.slice(row.objectId.indexOf(":") + 1)
      : row.objectId;
    const cur: ModuleProgress = modules[station] ?? emptyProgress();
    const raw = (row.raw ?? {}) as Record<string, unknown>;
    if (row.kind === "watch") {
      cur.watched = true;
    }
    if (row.kind === "quiz") {
      const score = row.score == null ? cur.quizScore : Number(row.score);
      cur.quizScore = Number.isFinite(score) ? score : cur.quizScore;
      cur.quizPassed = Boolean(raw.passed) || cur.quizPassed;
    }
    if (row.kind === "assignment") {
      if (raw.assignment && typeof raw.assignment === "object") {
        cur.assignment = raw.assignment as Record<string, boolean>;
      }
      if (typeof raw.notes === "string") cur.notes = raw.notes;
    }
    cur.passed = Boolean(cur.watched && cur.quizPassed);
    modules[station] = cur;
  }
  return modules;
}
