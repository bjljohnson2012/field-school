import { and, eq, inArray } from "drizzle-orm";
import { isStaffEmail } from "@/lib/auth/staff";
import { canReadBrain } from "@/lib/brain/rules";
import { applyBrainSqlIfConfigured } from "@/lib/brain/sql";
import { listKnowledgeBrains } from "@/lib/brain/store";
import { identityFromRequest, type LearnerIdentity } from "@/lib/campus-runtime/identity";
import { knowledgeUnits, lessons } from "@/lib/composer/schema";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import type { Room } from "@/lib/living-brain/model";
import type { MediaDoc } from "@/lib/records/model";
import { listMedia, loadFamily, loadFamilyMilestones, loadSelfMilestones } from "@/lib/records/store";
import {
  brainLessonGraph,
  brainsForRoom,
  EMPTY_GRAPH,
  mergeGraphs,
  personMilestoneGraph,
  type BrainLessonRows,
  type Graph,
  type GraphFocus,
} from "./graph";

export type KnowledgeLoad =
  | { ok: true; room: Room | null; graph: Graph; media: readonly MediaDoc[] }
  | { ok: false; status: number; error: string };

type Auth = Extract<Awaited<ReturnType<typeof identityFromRequest>>, { ok: true }>;

function roomOf(identity: LearnerIdentity): Room | null {
  return identity.orgSlug === "household" || identity.orgSlug === "sales" ? identity.orgSlug : null;
}

async function brainLessons(auth: Auth, room: Room | null): Promise<Graph> {
  const identity = auth.identity;
  const staff = isStaffEmail(identity.email);
  const features = auth.memberships.find((row) => row.membershipId === identity.membershipId)?.features;
  if (!canReadBrain({ ...identity, features }, staff)) return EMPTY_GRAPH;
  await applyBrainSqlIfConfigured();
  const listed = await listKnowledgeBrains({ actor: identity, staff });
  const units = "units" in listed ? (listed.units ?? []) : [];
  const brains: BrainLessonRows["brains"][number][] = [];
  const items: BrainLessonRows["items"][number][] = [];
  for (const { unit, current } of units) {
    if (!current) continue;
    brains.push({ id: current.id, title: unit.title || "Brain", childMembershipId: unit.childMembershipId });
    const rows = [
      ...current.sources.map((row) => ({ table: "brain_sources" as const, row })),
      ...current.notes.map((row) => ({ table: "brain_notes" as const, row })),
      ...current.artifacts.map((row) => ({ table: "brain_artifacts" as const, row })),
    ];
    for (const { table, row } of rows) {
      if (row.composerUnitId) {
        items.push({ table, id: row.id, brainId: current.id, title: row.title, unitId: row.composerUnitId });
      }
    }
  }
  const unitIds = [...new Set(items.map((item) => item.unitId))];
  if (!unitIds.length) return EMPTY_GRAPH;
  const db = getDb();
  const unitRows = await db
    .select({ id: knowledgeUnits.id, lessonId: knowledgeUnits.lessonId, title: knowledgeUnits.title })
    .from(knowledgeUnits)
    .where(and(eq(knowledgeUnits.orgId, identity.orgId), inArray(knowledgeUnits.id, unitIds)));
  const lessonIds = [...new Set(unitRows.flatMap((unit) => (unit.lessonId ? [unit.lessonId] : [])))];
  const lessonRows = lessonIds.length
    ? await db
        .select({ id: lessons.id, title: lessons.title })
        .from(lessons)
        .where(and(eq(lessons.orgId, identity.orgId), inArray(lessons.id, lessonIds)))
    : [];
  return brainLessonGraph(
    { brains: brainsForRoom(room, brains), items, units: unitRows, lessons: lessonRows },
    (id) => `/o/${identity.orgSlug}/l/${id}`,
  );
}

async function familyGraph(identity: LearnerIdentity, only?: string): Promise<Graph | null> {
  if (identity.kind === "child" || identity.orgSlug !== "household") return null;
  const family = await loadFamily({ orgId: identity.orgId, parentMembershipId: identity.membershipId });
  const children = only ? family.children.filter((child) => child.person.membershipId === only) : family.children;
  if (only && !children.length) return null;
  const milestones = await loadFamilyMilestones({ ...family, children });
  return mergeGraphs(
    ...children.map((child) =>
      personMilestoneGraph(
        { ref: child.person, label: child.displayName, href: `/profile/kids/${child.person.membershipId}` },
        milestones,
      ),
    ),
  );
}

/**
 * The one read for knowledge edges. Every query is scoped to the active org (or, for `self`, to the
 * signed-in member). Sales never receives a tracked child; a leader never receives a learner's own milestones.
 */
export async function loadKnowledge(focus: GraphFocus, request?: Request): Promise<KnowledgeLoad> {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };
    const identity = auth.identity;
    const room = roomOf(identity);
    if (focus.kind === "brains") {
      return { ok: true, room, graph: await brainLessons(auth, room), media: [] };
    }
    if (focus.kind === "library") {
      const graph = await brainLessons(auth, room);
      const lessonIds = graph.entities.flatMap((entity) => (entity.ref.kind === "lesson" ? [entity.ref.id] : []));
      return { ok: true, room, graph, media: await listMedia(identity.orgId, focus.lessonIds ?? lessonIds) };
    }
    if (focus.kind === "self") {
      if (identity.kind === "child") return { ok: false, status: 403, error: "child_has_no_adult_profile" };
      const milestones = await loadSelfMilestones(identity.memberId);
      const self = { as: "self" as const, memberId: identity.memberId };
      return { ok: true, room, graph: personMilestoneGraph({ ref: self, label: "You", href: "/profile" }, milestones), media: [] };
    }
    const graph = await familyGraph(identity, focus.kind === "child" ? focus.membershipId : undefined);
    if (!graph) {
      return { ok: false, status: 403, error: identity.orgSlug === "household" ? "not_your_child" : "household_only" };
    }
    return { ok: true, room, graph, media: [] };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return { ok: false, status: 503, error: "database_unavailable" };
    throw error;
  }
}
