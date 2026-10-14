import { and, eq } from "drizzle-orm";
import { isStaffEmail } from "@/lib/auth/staff";
import { setActiveOrgCookie } from "@/lib/campus-runtime/org";
import { getDb, getSql } from "@/lib/db/client";
import { memberships, organizations } from "@/lib/db/schema";
import { applyGapLoopSqlIfConfigured } from "@/lib/gap-loop/sql";
import { createOutcome } from "@/lib/gap-loop/store";
import type { GapActor } from "@/lib/gap-loop/rules";
import { recordAdultGate } from "@/lib/profile/store";
import { applyTenancySqlIfConfigured } from "@/lib/tenancy/sql";
import { firstGoalInput } from "./aim.ts";
import {
  ADULT_GATE_IDS,
  ONBOARDING_EVENT,
  attachOrg,
  brainSlug,
  nextOrgKind,
  reloadFlow,
  withMembership,
  withOutcome,
  type AdultGateMap,
  type FlowSnapshot,
  type OnboardingEvent,
  type PersonDraft,
  type RoomChoice,
} from "./graph.ts";
import { applyOnboardingSql } from "./sql.ts";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function bool(row: Row, key: string) {
  return row[key] === true;
}

function nullableBool(row: Row, key: string) {
  if (row[key] === true) return true;
  if (row[key] === false) return false;
  return null;
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function peopleOf(value: unknown): PersonDraft[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Row;
      const role = text(row, "role") === "child" ? "child" : "member";
      const login = role === "child" ? "none" : "member";
      return { name: text(row, "name"), role, login } as PersonDraft;
    })
    .filter((person) => person.name);
}

function gatesOf(value: unknown): AdultGateMap {
  const row = value && typeof value === "object" ? (value as Row) : {};
  return {
    "G-personality": row["G-personality"] === true,
    "G-skills": row["G-skills"] === true,
    "G-other": row["G-other"] === true,
  };
}

function eventsOf(value: unknown): OnboardingEvent[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Row;
    return {
      kind: ONBOARDING_EVENT.kind,
      objectType: ONBOARDING_EVENT.objectType,
      objectId: text(row, "objectId") || text(row, "object_id"),
      destination: ONBOARDING_EVENT.destination,
      at: text(row, "at"),
    };
  });
}

function fromRow(row: Row): FlowSnapshot {
  const room = text(row, "room");
  return {
    accountId: text(row, "member_id"),
    orgId: text(row, "org_id") || null,
    invitingOrgId: text(row, "inviting_org_id") || null,
    membershipId: text(row, "membership_id") || null,
    entry: text(row, "entry") === "invite" ? "invite" : "signup",
    stepId: text(row, "step_id") as FlowSnapshot["stepId"],
    brainNamed: bool(row, "brain_named"),
    brainName: text(row, "brain_name"),
    room: room === "family" || room === "team" || room === "individual" ? room : null,
    orgName: text(row, "org_name"),
    homeschoolMode: nullableBool(row, "homeschool_mode"),
    people: peopleOf(row.people),
    adultGates: gatesOf(row.adult_gates),
    kidIntakeDone: bool(row, "kid_intake_done"),
    aim: text(row, "aim"),
    outcomeId: text(row, "outcome_id") || null,
    campusReady: bool(row, "campus_ready"),
    profileDone: bool(row, "profile_done"),
    createdOrgIds: list(row.created_org_ids),
    events: eventsOf(row.events),
  };
}

export async function loadOnboarding(memberId: string) {
  await applyOnboardingSql();
  const sql = getSql();
  const rows = (await sql`SELECT * FROM onboarding_flows WHERE member_id = ${memberId} LIMIT 1`) as Row[];
  return rows[0] ? fromRow(rows[0]) : null;
}

async function insertLearningEvent(
  actor: { orgId: string; membershipId: string; stance: string },
  event: OnboardingEvent,
) {
  const sql = getSql();
  await sql`
    INSERT INTO learning_events (
      org_id, membership_id, actor_membership_id, actor_stance,
      kind, object_type, object_id, raw
    ) VALUES (
      ${actor.orgId}, ${actor.membershipId}, ${actor.membershipId}, ${actor.stance},
      ${ONBOARDING_EVENT.kind}, ${ONBOARDING_EVENT.objectType}, ${event.objectId},
      ${sql.json({ at: event.at, destination: ONBOARDING_EVENT.destination })}
    )
  `;
}

export async function saveOnboarding(
  flow: FlowSnapshot,
  actor: { orgId: string; membershipId: string; stance: string } | null,
) {
  await applyOnboardingSql();
  const prior = await loadOnboarding(flow.accountId);
  if (actor) {
    const seen = prior?.events.length ?? 0;
    for (const event of flow.events.slice(seen)) {
      await insertLearningEvent(actor, event);
    }
  }
  const sql = getSql();
  await sql`
    INSERT INTO onboarding_flows (
      member_id, org_id, inviting_org_id, membership_id, entry, step_id, brain_named, brain_name,
      room, org_name, homeschool_mode, people, adult_gates, kid_intake_done, aim, outcome_id,
      campus_ready, profile_done, created_org_ids, events, updated_at
    ) VALUES (
      ${flow.accountId}, ${flow.orgId}, ${flow.invitingOrgId}, ${flow.membershipId}, ${flow.entry},
      ${flow.stepId}, ${flow.brainNamed}, ${flow.brainName}, ${flow.room}, ${flow.orgName},
      ${flow.homeschoolMode}, ${sql.json(JSON.parse(JSON.stringify(flow.people)))},
      ${sql.json(JSON.parse(JSON.stringify(flow.adultGates)))}, ${flow.kidIntakeDone}, ${flow.aim},
      ${flow.outcomeId}, ${flow.campusReady}, ${flow.profileDone},
      ${sql.json(JSON.parse(JSON.stringify(flow.createdOrgIds)))},
      ${sql.json(JSON.parse(JSON.stringify(flow.events)))}, now()
    )
    ON CONFLICT (member_id) DO UPDATE SET
      org_id = EXCLUDED.org_id,
      inviting_org_id = EXCLUDED.inviting_org_id,
      membership_id = EXCLUDED.membership_id,
      entry = EXCLUDED.entry,
      step_id = EXCLUDED.step_id,
      brain_named = EXCLUDED.brain_named,
      brain_name = EXCLUDED.brain_name,
      room = EXCLUDED.room,
      org_name = EXCLUDED.org_name,
      homeschool_mode = EXCLUDED.homeschool_mode,
      people = EXCLUDED.people,
      adult_gates = EXCLUDED.adult_gates,
      kid_intake_done = EXCLUDED.kid_intake_done,
      aim = EXCLUDED.aim,
      outcome_id = EXCLUDED.outcome_id,
      campus_ready = EXCLUDED.campus_ready,
      profile_done = EXCLUDED.profile_done,
      created_org_ids = EXCLUDED.created_org_ids,
      events = EXCLUDED.events,
      updated_at = now()
  `;
  return flow;
}

export async function ensureBrainOrg(member: { id: string; name: string }, brainName: string) {
  await applyTenancySqlIfConfigured();
  const db = getDb();
  const slug = brainSlug(member.id);
  const [existing] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  const org =
    existing ??
    (
      await db
        .insert(organizations)
        .values({
          slug,
          name: brainName,
          kind: "family",
          isolation: "strict",
          homeschoolMode: false,
          createdBy: member.id,
        })
        .returning()
    )[0];
  if (existing && existing.name !== brainName) {
    await db.update(organizations).set({ name: brainName }).where(eq(organizations.id, existing.id));
  }
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, org.id), eq(memberships.memberId, member.id)))
    .limit(1);
  const row =
    membership ??
    (
      await db
        .insert(memberships)
        .values({ orgId: org.id, memberId: member.id, stance: "owner" })
        .returning()
    )[0];
  await setActiveOrgCookie(org.slug);
  return { orgId: org.id, membershipId: row.id, slug: org.slug, stance: row.stance };
}

export async function applyRoomChoice(orgId: string, room: RoomChoice) {
  const db = getDb();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) return;
  const kind = nextOrgKind(org.kind, room);
  const isolation = kind === "team" ? "platform_plus" : org.isolation;
  await db.update(organizations).set({ kind, isolation }).where(eq(organizations.id, orgId));
}

export async function applyOrgName(orgId: string, name: string) {
  const db = getDb();
  await db.update(organizations).set({ name }).where(eq(organizations.id, orgId));
}

export async function applyHomeschoolMode(orgId: string, homeschoolMode: boolean) {
  const db = getDb();
  await db.update(organizations).set({ homeschoolMode }).where(eq(organizations.id, orgId));
}

export async function syncAdultGates(member: { id: string; name: string }, gates: AdultGateMap) {
  for (const id of ADULT_GATE_IDS) {
    if (gates[id]) await recordAdultGate({ memberId: member.id, name: member.name }, id);
  }
}

export async function saveFirstGoal(
  actor: GapActor,
  staff: boolean,
  aim: string,
) {
  await applyGapLoopSqlIfConfigured();
  const body = firstGoalInput(aim);
  return createOutcome(actor, staff, {
    ownerKind: body.ownerKind,
    statement: body.statement,
    title: body.title,
    horizon: body.horizon,
  });
}

export function staffFor(email: string) {
  return isStaffEmail(email);
}

export async function bindBrain(flow: FlowSnapshot, member: { id: string; name: string }, brainName: string) {
  if (flow.entry === "invite") return flow;
  const created = await ensureBrainOrg(member, brainName);
  const attached = attachOrg(flow, created.orgId);
  if (!attached.ok) throw new Error(attached.error);
  return withMembership(attached.flow, created.membershipId);
}

export async function bindOutcome(flow: FlowSnapshot, actor: GapActor, staff: boolean) {
  const outcome = await saveFirstGoal(actor, staff, flow.aim);
  return withOutcome(flow, outcome.id);
}

export function parseStored(raw: string) {
  return reloadFlow(raw);
}
