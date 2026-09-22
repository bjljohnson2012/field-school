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
  return {
    id: row.id,
    membershipId: row.membershipId,
    name: row.name,
    title: spec.title,
    outcome: spec.outcome,
    nextUnit: spec.units[0]?.title || "",
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
    const assignment: OpenAssignment = {
      id: rowId,
      membershipId: person.membershipId,
      name: person.name,
      title: spec.title,
      outcome: spec.outcome,
      nextUnit: spec.units[0].title,
      login: drafted.draft.raw.login,
      buyer: false,
      ownsPath: false,
      room,
    };
    return {
      ok: true,
      assignment,
      line: assignedLine(person.name, spec.units[0].title),
    };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}
