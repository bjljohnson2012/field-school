import { and, eq } from "drizzle-orm";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { assignments, livingBrains, livingProfiles, members, memberships } from "@/lib/db/schema";
import {
  actorMayWrite,
  readForTool,
  refreshFromUse,
  shapeBrain,
  updateOutcome,
  type BrainActor,
  type LivingBrain,
  type Room,
  type UseKind,
  type UseSignal,
} from "./model";

export class LivingBrainUnavailableError extends DatabaseUnavailableError {}

function asRoom(value: string): Room | null {
  return value === "household" || value === "sales" ? value : null;
}

function asLogin(value: string): "none" | "member" | null {
  return value === "none" || value === "member" ? value : null;
}

export async function loadLivingBrain(orgId: string): Promise<LivingBrain | null> {
  const db = getDb();
  const [head] = await db.select().from(livingBrains).where(eq(livingBrains.orgId, orgId)).limit(1);
  if (!head) return null;
  const room = asRoom(head.room);
  if (!room) return null;
  const rows = await db.select().from(livingProfiles).where(eq(livingProfiles.orgId, orgId));
  const shaped = shapeBrain({
    orgId,
    room,
    facts: head.facts,
    actorId: "",
    people: rows.flatMap((row) => {
      const login = asLogin(row.login);
      if (!login || row.ownsOutcomes) return [];
      return [
        {
          membershipId: row.membershipId,
          name: row.name,
          kind: row.kind,
          login,
          profile: row.profile,
          outcomes: row.outcomes,
        },
      ];
    }),
  });
  if (!shaped.ok) return null;
  return shaped.brain;
}

export async function saveLivingBrain(brain: LivingBrain) {
  const db = getDb();
  const now = new Date();
  await db
    .insert(livingBrains)
    .values({ orgId: brain.orgId, room: brain.room, facts: brain.facts, updatedAt: now })
    .onConflictDoUpdate({
      target: livingBrains.orgId,
      set: { room: brain.room, facts: brain.facts, updatedAt: now },
    });
  for (const person of brain.people) {
    await db
      .insert(livingProfiles)
      .values({
        orgId: brain.orgId,
        membershipId: person.membershipId,
        name: person.name,
        kind: person.kind,
        login: person.login,
        profile: person.profile,
        outcomes: person.outcomes,
        ownsOutcomes: false,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [livingProfiles.orgId, livingProfiles.membershipId],
        set: {
          name: person.name,
          kind: person.kind,
          login: person.login,
          profile: person.profile,
          outcomes: person.outcomes,
          ownsOutcomes: false,
          updatedAt: now,
        },
      });
  }
}

export async function writeOutcome(input: {
  orgId: string;
  actor: BrainActor;
  membershipId: string;
  outcomes: string;
  person: { name: string; kind: string; login: "none" | "member"; profile: string };
}) {
  const current = await loadLivingBrain(input.orgId);
  const base =
    current && current.room === input.actor.org
      ? current
      : {
          orgId: input.orgId,
          room: input.actor.org,
          facts: current?.facts || "",
          people: [],
        };
  const exists = base.people.some((row) => row.membershipId === input.membershipId);
  const withPerson: LivingBrain = exists
    ? base
    : {
        ...base,
        people: [
          ...base.people,
          {
            membershipId: input.membershipId,
            name: input.person.name,
            kind: input.person.kind,
            login: input.person.login,
            profile: input.person.profile,
            outcomes: "",
            ownsOutcomes: false,
          },
        ],
      };
  const next = updateOutcome(withPerson, input.actor, input.membershipId, input.outcomes);
  if (!next.ok) return next;
  await saveLivingBrain(next.brain);
  return { ok: true as const, brain: readForTool(next.brain, input.orgId) };
}

export async function toolRead(orgId: string) {
  const brain = await loadLivingBrain(orgId);
  if (!brain) return null;
  return readForTool(brain, orgId);
}

export async function noteUse(input: { orgId: string; actor: BrainActor; signal: UseSignal }) {
  const current = await loadLivingBrain(input.orgId);
  const base: LivingBrain =
    current && current.room === input.actor.org
      ? current
      : { orgId: input.orgId, room: input.actor.org, facts: "", people: [] };
  const next = refreshFromUse(base, input.actor, input.signal);
  if (!next.ok) return next;
  await saveLivingBrain(next.brain);
  return { ok: true as const, brain: readForTool(next.brain, input.orgId) };
}

async function personOnDesk(orgId: string, membershipId: string) {
  const db = getDb();
  const [row] = await db
    .select({ membershipId: memberships.id, name: members.name, kind: members.kind })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(and(eq(memberships.id, membershipId), eq(memberships.orgId, orgId)))
    .limit(1);
  if (!row) return null;
  const login = row.kind === "child" ? "none" : "member";
  return { membershipId: row.membershipId, name: row.name, kind: row.kind, login: login as "none" | "member" };
}

async function soleOpenLearner(orgId: string, room: Room) {
  const db = getDb();
  const rows = await db
    .select({
      membershipId: assignments.membershipId,
      name: members.name,
      kind: members.kind,
      raw: assignments.raw,
    })
    .from(assignments)
    .innerJoin(memberships, eq(memberships.id, assignments.membershipId))
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(and(eq(assignments.orgId, orgId), eq(assignments.objectType, "lesson_spec"), eq(assignments.status, "open")));
  const matches = rows.flatMap((row) => {
    if (!row.raw || typeof row.raw !== "object") return [];
    const raw = row.raw as Record<string, unknown>;
    if (raw.room !== room) return [];
    if (room === "household" && (raw.login !== "none" || row.kind !== "child")) return [];
    if (room === "sales" && (raw.login !== "member" || row.kind === "child")) return [];
    return [row];
  });
  if (matches.length !== 1) return null;
  const row = matches[0];
  return {
    membershipId: row.membershipId,
    name: row.name,
    kind: row.kind,
    login: (room === "household" ? "none" : "member") as "none" | "member",
  };
}

/** Learn is a watch. Progress is a quiz. The open path names the person when the leader is the one signed in. */
export async function noteUseFromEvent(input: {
  orgId: string;
  room: Room;
  actor: BrainActor;
  actorName: string;
  kind: Extract<UseKind, "learn" | "progress">;
  step: string;
  aboutMembershipId?: string;
}) {
  const about = input.aboutMembershipId?.trim() || "";
  let person: { membershipId: string; name: string; kind: string; login: "none" | "member" } | null = null;
  if (about && about !== input.actor.membershipId) {
    person = await personOnDesk(input.orgId, about);
  } else if (input.room === "sales" && input.actor.kind !== "child" && !actorMayWrite(input.actor)) {
    person = {
      membershipId: input.actor.membershipId,
      name: input.actorName,
      kind: input.actor.kind || "adult",
      login: "member",
    };
  } else if (actorMayWrite(input.actor)) {
    person = await soleOpenLearner(input.orgId, input.room);
  }
  if (!person) return { ok: false as const, error: "not_on_desk" };
  return noteUse({
    orgId: input.orgId,
    actor: input.actor,
    signal: {
      kind: input.kind,
      membershipId: person.membershipId,
      name: person.name,
      personKind: person.kind,
      login: person.login,
      step: input.step,
    },
  });
}
