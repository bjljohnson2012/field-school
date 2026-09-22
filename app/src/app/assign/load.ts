import { and, eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { assignments, learningEvents, members, memberships, organizations, wards } from "@/lib/db/schema";
import {
  assigneeAllowed,
  assignedLine,
  draftAssignment,
  leaderCanAssign,
  peopleOnDesk,
  roomForOrg,
  visibleAssignments,
  type DeskActor,
  type DeskPerson,
  type DeskRoom,
  type OpenAssignment,
} from "./desk";
import { parseLessonSpec } from "./lesson-spec";
import { portionAfterTeach, unitForPortion } from "./next-portion";
import { noteUse } from "@/lib/living-brain/store";

export type DeskPayload = {
  ok: true;
  room: DeskRoom | null;
  leader: boolean;
  actorMembershipId: string;
  doors: DeskRoom[];
  people: DeskPerson[];
  assignments: OpenAssignment[];
};

export type DeskFailure = { ok: false; status: number; error: string };

function actorFromIdentity(identity: {
  membershipId: string;
  kind: string;
  stance: string;
  orgSlug: string;
}): DeskActor {
  return {
    membershipId: identity.membershipId,
    kind: identity.kind,
    stance: identity.stance,
    org: identity.orgSlug,
  };
}

function asRoom(value: unknown): DeskRoom | null {
  return value === "household" || value === "sales" ? value : null;
}

function readAssignment(row: {
  id: string;
  membershipId: string;
  name: string;
  raw: unknown;
}): OpenAssignment | null {
  if (!row.raw || typeof row.raw !== "object") return null;
  const raw = row.raw as Record<string, unknown>;
  const spec = parseLessonSpec(raw.lessonSpec);
  const room = asRoom(raw.room);
  if (!spec || !room) return null;
  const login = raw.login === "none" || raw.login === "member" ? raw.login : null;
  if (!login) return null;
  const storedId = typeof raw.nextUnitId === "string" ? raw.nextUnitId : undefined;
  const unit = unitForPortion(spec.units, storedId);
  return {
    id: row.id,
    membershipId: row.membershipId,
    name: row.name,
    title: spec.title,
    outcome: spec.outcome,
    nextUnit: unit?.title || "",
    nextUnitId: unit?.id,
    sourceUnitId: unit?.source_unit_id,
    lessonId: spec.id,
    units: spec.units,
    login,
    buyer: raw.buyer === true,
    ownsPath: raw.ownsPath === true,
    room,
  };
}

async function peopleForRoom(
  room: DeskRoom,
  actor: DeskActor,
  orgId: string,
): Promise<DeskPerson[]> {
  const db = getDb();
  if (room === "household") {
    const rows = await db
      .select({
        membershipId: memberships.id,
        stance: memberships.stance,
        name: members.name,
        kind: members.kind,
        org: organizations.slug,
      })
      .from(wards)
      .innerJoin(memberships, eq(memberships.id, wards.childMembershipId))
      .innerJoin(members, eq(members.id, memberships.memberId))
      .innerJoin(organizations, eq(organizations.id, memberships.orgId))
      .where(
        and(eq(wards.orgId, orgId), eq(wards.guardianMembershipId, actor.membershipId)),
      );
    return peopleOnDesk(
      room,
      rows.map((row) => ({
        membershipId: row.membershipId,
        name: row.name,
        kind: row.kind,
        stance: row.stance,
        org: row.org,
        login: row.kind === "child" ? "none" : "member",
      })),
      actor.membershipId,
    );
  }
  const rows = await db
    .select({
      membershipId: memberships.id,
      stance: memberships.stance,
      name: members.name,
      kind: members.kind,
      org: organizations.slug,
    })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(and(eq(memberships.orgId, orgId), eq(organizations.slug, "sales")));
  return peopleOnDesk(
    room,
    rows.map((row) => ({
      membershipId: row.membershipId,
      name: row.name,
      kind: row.kind,
      stance: row.stance,
      org: row.org,
      login: row.kind === "child" ? "none" : "member",
    })),
    actor.membershipId,
  );
}

async function openAssignments(orgId: string, room: DeskRoom, actor: DeskActor, leader: boolean) {
  const db = getDb();
  const rows = await db
    .select({
      id: assignments.id,
      membershipId: assignments.membershipId,
      name: members.name,
      raw: assignments.raw,
    })
    .from(assignments)
    .innerJoin(memberships, eq(memberships.id, assignments.membershipId))
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(
      and(
        eq(assignments.orgId, orgId),
        eq(assignments.objectType, "lesson_spec"),
        eq(assignments.status, "open"),
      ),
    );
  const parsed = rows.flatMap((row) => {
    const item = readAssignment(row);
    return item ? [item] : [];
  });
  return visibleAssignments(room, parsed, actor.membershipId, leader);
}

export async function loadDesk(request: Request): Promise<DeskPayload | DeskFailure> {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };
    if (auth.identity.kind === "child") {
      return { ok: false, status: 403, error: "child_has_no_login" };
    }
    const actor = actorFromIdentity(auth.identity);
    const doors = auth.memberships
      .map((row) => roomForOrg(row.orgSlug))
      .filter((room): room is DeskRoom => room !== null);
    const room = roomForOrg(actor.org);
    if (!room) {
      return {
        ok: true,
        room: null,
        leader: false,
        actorMembershipId: actor.membershipId,
        doors: [...new Set(doors)],
        people: [],
        assignments: [],
      };
    }
    const leader = leaderCanAssign(actor);
    const people = leader ? await peopleForRoom(room, actor, auth.identity.orgId) : [];
    const assigned = await openAssignments(auth.identity.orgId, room, actor, leader);
    return {
      ok: true,
      room,
      leader,
      actorMembershipId: actor.membershipId,
      doors: [...new Set(doors)],
      people,
      assignments: assigned,
    };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}

async function personInOrg(orgId: string, membershipId: string): Promise<DeskPerson | null> {
  const db = getDb();
  const [row] = await db
    .select({
      membershipId: memberships.id,
      stance: memberships.stance,
      name: members.name,
      kind: members.kind,
      org: organizations.slug,
    })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(and(eq(memberships.id, membershipId), eq(memberships.orgId, orgId)))
    .limit(1);
  if (!row) return null;
  return {
    membershipId: row.membershipId,
    name: row.name,
    kind: row.kind,
    stance: row.stance,
    org: row.org,
    login: row.kind === "child" ? "none" : "member",
  };
}

export async function saveAssignment(
  request: Request,
  body: { membershipId?: string; spec?: unknown },
): Promise<{ ok: true; assignment: OpenAssignment; line: string } | DeskFailure> {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };
    if (auth.identity.kind === "child") {
      return { ok: false, status: 403, error: "child_has_no_login" };
    }
    const actor = actorFromIdentity(auth.identity);
    const room = roomForOrg(actor.org);
    if (!room) return { ok: false, status: 403, error: "wrong_desk" };
    const membershipId = typeof body.membershipId === "string" ? body.membershipId.trim() : "";
    if (!membershipId) return { ok: false, status: 400, error: "not_on_desk" };
    const person = await personInOrg(auth.identity.orgId, membershipId);
    if (!person) return { ok: false, status: 404, error: "not_on_desk" };
    if (room === "household") {
      const db = getDb();
      const [ward] = await db
        .select({ id: wards.id })
        .from(wards)
        .where(
          and(
            eq(wards.orgId, auth.identity.orgId),
            eq(wards.guardianMembershipId, actor.membershipId),
            eq(wards.childMembershipId, membershipId),
          ),
        )
        .limit(1);
      if (!ward) return { ok: false, status: 403, error: "not_your_child" };
    }
    if (!assigneeAllowed(room, person, actor.membershipId)) {
      return { ok: false, status: 403, error: "wrong_desk" };
    }
    const drafted = draftAssignment({
      room,
      actor,
      person,
      spec: body.spec,
      orgId: auth.identity.orgId,
    });
    if (!drafted.ok) {
      const status =
        drafted.error === "spec_invalid" || drafted.error === "spec_mode" || drafted.error === "spec_org"
          ? 400
          : 403;
      return { ok: false, status, error: drafted.error };
    }
    const db = getDb();
    const [existing] = await db
      .select({ id: assignments.id })
      .from(assignments)
      .where(
        and(
          eq(assignments.orgId, drafted.draft.orgId),
          eq(assignments.membershipId, drafted.draft.membershipId),
          eq(assignments.objectType, "lesson_spec"),
          eq(assignments.objectId, drafted.draft.objectId),
          eq(assignments.status, "open"),
        ),
      )
      .limit(1);
    const rowId = existing?.id
      ? existing.id
      : (
          await db
            .insert(assignments)
            .values({
              orgId: drafted.draft.orgId,
              membershipId: drafted.draft.membershipId,
              objectType: drafted.draft.objectType,
              objectId: drafted.draft.objectId,
              status: drafted.draft.status,
              raw: drafted.draft.raw,
            })
            .returning({ id: assignments.id })
        )[0]?.id;
    if (!rowId) return { ok: false, status: 503, error: "database_unavailable" };
    if (!existing) {
      await db.insert(learningEvents).values({
        orgId: drafted.draft.orgId,
        membershipId: drafted.draft.membershipId,
        actorMembershipId: drafted.draft.actorMembershipId,
        actorStance: actor.stance,
        kind: "assignment",
        objectType: "lesson_spec",
        objectId: drafted.draft.objectId,
        raw: drafted.draft.raw,
      });
    }
    const spec = drafted.draft.raw.lessonSpec;
    const unit = unitForPortion(spec.units, drafted.draft.raw.nextUnitId);
    const step = unit?.title || spec.units[0].title;
    await noteUse({
      orgId: auth.identity.orgId,
      actor: { kind: actor.kind, stance: actor.stance, org: room, membershipId: actor.membershipId },
      signal: {
        kind: "assign",
        membershipId: person.membershipId,
        name: person.name,
        personKind: person.kind,
        login: person.login === "member" ? "member" : "none",
        step,
      },
    });
    const assignment: OpenAssignment = {
      id: rowId,
      membershipId: person.membershipId,
      name: person.name,
      title: spec.title,
      outcome: spec.outcome,
      nextUnit: unit?.title || spec.units[0].title,
      nextUnitId: unit?.id,
      sourceUnitId: unit?.source_unit_id,
      lessonId: spec.id,
      units: spec.units,
      login: drafted.draft.raw.login,
      buyer: false,
      ownsPath: false,
      room,
    };
    return {
      ok: true,
      assignment,
      line: assignedLine(person.name, unit?.title || spec.units[0].title),
    };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}

export async function saveNextPortion(
  request: Request,
  body: { assignmentId?: string; unitId?: string },
): Promise<{ ok: true; assignment: OpenAssignment; line: string } | DeskFailure> {
  try {
    const auth = await identityFromRequest(request);
    if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };
    if (auth.identity.kind === "child") {
      return { ok: false, status: 403, error: "child_has_no_login" };
    }
    const actor = actorFromIdentity(auth.identity);
    const room = roomForOrg(actor.org);
    if (!room || !leaderCanAssign(actor)) return { ok: false, status: 403, error: "not_leader" };
    const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId.trim() : "";
    if (!assignmentId) return { ok: false, status: 400, error: "not_on_desk" };
    const db = getDb();
    const [row] = await db
      .select({
        id: assignments.id,
        membershipId: assignments.membershipId,
        name: members.name,
        kind: members.kind,
        raw: assignments.raw,
      })
      .from(assignments)
      .innerJoin(memberships, eq(memberships.id, assignments.membershipId))
      .innerJoin(members, eq(members.id, memberships.memberId))
      .where(
        and(
          eq(assignments.id, assignmentId),
          eq(assignments.orgId, auth.identity.orgId),
          eq(assignments.status, "open"),
        ),
      )
      .limit(1);
    if (!row || !row.raw || typeof row.raw !== "object") {
      return { ok: false, status: 404, error: "not_on_desk" };
    }
    const raw = row.raw as Record<string, unknown>;
    const spec = parseLessonSpec(raw.lessonSpec);
    if (!spec || asRoom(raw.room) !== room) return { ok: false, status: 403, error: "wrong_desk" };
    if (room === "household" && raw.login !== "none") {
      return { ok: false, status: 403, error: "child_has_no_login" };
    }
    const requested = typeof body.unitId === "string" ? body.unitId.trim() : "";
    const currentId = typeof raw.nextUnitId === "string" ? raw.nextUnitId : spec.units[0].id;
    const next = requested
      ? spec.units.find((unit) => unit.id === requested) || null
      : portionAfterTeach(spec.units, currentId);
    if (!next) return { ok: false, status: 400, error: "spec_invalid" };
    const nextRaw = {
      ...raw,
      nextUnitId: next.id,
      source_unit_id: next.source_unit_id,
      login: raw.login,
      buyer: false,
      ownsPath: false,
    };
    await db
      .update(assignments)
      .set({ raw: nextRaw, updatedAt: new Date() })
      .where(and(eq(assignments.id, row.id), eq(assignments.orgId, auth.identity.orgId)));
    const login = raw.login === "member" ? "member" : "none";
    if (!(room === "sales" && row.kind === "child")) {
      await noteUse({
        orgId: auth.identity.orgId,
        actor: { kind: actor.kind, stance: actor.stance, org: room, membershipId: actor.membershipId },
        signal: {
          kind: "teach",
          membershipId: row.membershipId,
          name: row.name,
          personKind: room === "household" ? "child" : row.kind || "adult",
          login,
          step: next.title,
        },
      });
    }
    const assignment: OpenAssignment = {
      id: row.id,
      membershipId: row.membershipId,
      name: row.name,
      title: spec.title,
      outcome: spec.outcome,
      nextUnit: next.title,
      nextUnitId: next.id,
      sourceUnitId: next.source_unit_id,
      lessonId: spec.id,
      units: spec.units,
      login,
      buyer: false,
      ownsPath: false,
      room,
    };
    return { ok: true, assignment, line: assignedLine(row.name, next.title) };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}
