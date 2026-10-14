import { canReadIntent, canWriteIntent } from "../intent/rules.ts";

export type GapActor = {
  kind: string;
  stance: string;
  orgSlug: string;
  orgId: string;
  membershipId: string;
  memberId: string;
  mode?: string;
  features?: unknown;
};

export const OUTCOME_SCOPES = ["person", "child", "family", "team", "org"] as const;
export type OutcomeScope = (typeof OUTCOME_SCOPES)[number];

const SCOPE_LEADERS = new Set(["admin", "leader", "owner", "coach"]);

export type OutcomeRowScope = {
  orgId: string;
  ownerKind: string;
  ownerMembershipId: string;
  childMembershipId: string | null;
};

export type DeskOutcome = OutcomeRowScope & { orgSlug?: string };

export function parseOutcomeScope(value: string): OutcomeScope {
  return (OUTCOME_SCOPES as readonly string[]).includes(value) ? (value as OutcomeScope) : "person";
}

export function isScopeLeader(actor: { stance: string }) {
  return SCOPE_LEADERS.has(actor.stance);
}

function household(actor: { orgSlug: string }) {
  return actor.orgSlug === "household";
}

export function outcomeWrite(
  actor: GapActor,
  scope: OutcomeScope,
  staff: boolean,
): { ok: true } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_cannot_write" };
  if (scope === "person") return { ok: true };
  if (scope === "child") {
    if (!household(actor)) return { ok: false, error: "sales_room_cannot_create_child_goal" };
    if (!canWriteIntent(actor, staff)) return { ok: false, error: "household_guardian_only" };
    return { ok: true };
  }
  if (scope === "family") {
    if (!household(actor)) return { ok: false, error: "sales_room_cannot_create_family_goal" };
    if (!canWriteIntent(actor, staff)) return { ok: false, error: "household_guardian_only" };
    return { ok: true };
  }
  if (scope === "team") {
    if (household(actor)) return { ok: false, error: "household_cannot_create_team_goal" };
    if (!(staff || isScopeLeader(actor))) return { ok: false, error: "team_leader_only" };
    return { ok: true };
  }
  if (scope === "org") {
    if (!(staff || isScopeLeader(actor))) return { ok: false, error: "org_leader_only" };
    return { ok: true };
  }
  return { ok: false, error: "unknown_scope" };
}

export function writableScopes(actor: GapActor, staff: boolean) {
  return OUTCOME_SCOPES.filter((scope) => outcomeWrite(actor, scope, staff).ok);
}

export function canWriteOutcome(actor: GapActor, scope: OutcomeScope, staff: boolean) {
  return outcomeWrite(actor, scope, staff).ok;
}

export function canReadOutcome(actor: GapActor, row: OutcomeRowScope, staff: boolean) {
  if (actor.kind === "child") return false;
  if (row.orgId !== actor.orgId) return false;
  if (row.ownerKind === "child" && !canReadIntent(actor, staff) && !staff) return false;
  if (staff) return true;
  if ((row.ownerKind === "team" || row.ownerKind === "org") && isScopeLeader(actor)) return true;
  if (row.ownerKind === "family" && canWriteIntent(actor, false)) return true;
  return row.ownerMembershipId === actor.membershipId;
}

/** One desk, one room. A sales query result never keeps a household row. */
export function rowsForDesk<T extends DeskOutcome>(actor: GapActor, rows: readonly T[], staff: boolean) {
  return rows.filter((row) => {
    if (row.orgId !== actor.orgId) return false;
    if (row.orgSlug === "household" && actor.orgSlug !== "household") return false;
    if (actor.orgSlug === "household" && row.orgSlug && row.orgSlug !== "household") return false;
    return canReadOutcome(actor, row, staff);
  });
}

/** Child-scope model text. The name becomes "the learner". Profile identifiers are dropped. */
export function redactChildForPrompt(text: string, childName: string, identifiers: readonly string[] = []) {
  let next = text;
  const name = childName.trim();
  if (name.length >= 2) {
    const pattern = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    next = next.replace(pattern, "the learner");
  }
  for (const raw of identifiers) {
    const token = raw.trim();
    if (token.length < 3) continue;
    const pattern = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    next = next.replace(pattern, "");
  }
  return next.replace(/\s+/g, " ").trim();
}

export function modelUserPayload(input: {
  ownerKind: string;
  statement: string;
  horizon: string;
  childName?: string;
  identifiers?: readonly string[];
}) {
  const statement =
    input.ownerKind === "child"
      ? redactChildForPrompt(input.statement, input.childName || "", input.identifiers || [])
      : input.statement.trim();
  const horizon =
    input.ownerKind === "child"
      ? redactChildForPrompt(input.horizon, input.childName || "", input.identifiers || [])
      : input.horizon.trim();
  return {
    learner: input.ownerKind === "child" ? "the learner" : "the owner",
    statement,
    horizon,
  };
}
