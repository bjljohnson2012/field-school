import { eq } from "drizzle-orm";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { livingBrains, livingProfiles } from "@/lib/db/schema";
import {
  readForTool,
  shapeBrain,
  updateOutcome,
  type BrainActor,
  type LivingBrain,
  type Room,
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
