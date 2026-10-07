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

export type OutcomeScope = "person" | "child";

export type OutcomeRowScope = {
  orgId: string;
  ownerKind: string;
  ownerMembershipId: string;
  childMembershipId: string | null;
};

export function outcomeWrite(
  actor: GapActor,
  scope: OutcomeScope,
  staff: boolean,
): { ok: true } | { ok: false; error: string } {
  if (actor.kind === "child") return { ok: false, error: "child_cannot_write" };
  if (scope === "person") return { ok: true };
  if (actor.orgSlug !== "household") return { ok: false, error: "sales_room_cannot_create_child_goal" };
  if (!canWriteIntent(actor, staff)) return { ok: false, error: "household_guardian_only" };
  return { ok: true };
}

export function canWriteOutcome(actor: GapActor, scope: OutcomeScope, staff: boolean) {
  return outcomeWrite(actor, scope, staff).ok;
}

export function canReadOutcome(actor: GapActor, row: OutcomeRowScope, staff: boolean) {
  if (actor.kind === "child") return false;
  if (row.orgId !== actor.orgId) return false;
  if (row.ownerKind === "child" && !canReadIntent(actor, staff) && !staff) return false;
  if (staff) return true;
  return row.ownerMembershipId === actor.membershipId;
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
  ownerKind: OutcomeScope;
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
