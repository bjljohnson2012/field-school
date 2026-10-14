import { getSql } from "@/lib/db/client";
import { GapFieldsError } from "@/lib/gap-loop/errors";
import { burnEventForState, readIndividualPlan, type IndividualBurnEvent } from "./config.ts";
import { applyIndividualPlanSqlIfConfigured } from "./sql.ts";
import {
  adultMaySelfRate,
  applyBurn,
  creditCapSummary,
  itemsFromRequirements,
  monthlyGrant,
  uploadAllowed,
  withinCount,
  type RequirementSeed,
} from "./plan.ts";

type Row = Record<string, unknown>;

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export async function assertPersonOutcomeCap(input: { enabled: boolean; orgId: string; ownerKind: string }) {
  if (!input.enabled || input.ownerKind !== "person") return;
  const config = readIndividualPlan();
  const sql = getSql();
  const rows = (await sql`
    SELECT count(*)::int AS n
    FROM outcomes
    WHERE org_id = ${input.orgId}
      AND owner_kind = 'person'
      AND status NOT IN ('done', 'cancelled', 'archived')
  `) as Row[];
  if (!withinCount(num(rows[0]?.n), config.caps.activeOutcomes)) {
    throw new GapFieldsError("outcome_cap");
  }
}

export async function assertPersonResearchCap(input: { ownerKind: string; orgId: string }) {
  const config = readIndividualPlan();
  if (!config.enabled || input.ownerKind !== "person") return { ok: true as const };
  const sql = getSql();
  const rows = (await sql`
    SELECT count(*)::int AS n
    FROM research_tasks
    WHERE org_id = ${input.orgId}
      AND owner_kind = 'person'
      AND channel = 'web'
      AND created_at >= date_trunc('month', now())
  `) as Row[];
  if (!withinCount(num(rows[0]?.n), config.caps.researchTasksPerMonth)) {
    return { ok: false as const, error: "research_cap" as const };
  }
  return { ok: true as const };
}

export async function assertPersonUpload(input: { ownerKind: string; orgId: string; bytes: number }) {
  const config = readIndividualPlan();
  if (!config.enabled || input.ownerKind !== "person") return;
  const sql = getSql();
  const rows = (await sql`
    SELECT count(*)::int AS n
    FROM knowledge_nodes
    WHERE org_id = ${input.orgId}
      AND owner_kind = 'person'
      AND kind = 'evidence'
  `) as Row[];
  const fit = uploadAllowed({ files: num(rows[0]?.n) + 1, bytes: input.bytes, config });
  if (!fit.ok) throw new GapFieldsError("upload_too_large");
}

export function selfRateGate(input: { enabled: boolean; actorKind: string; ownerKind: string; samePerson: boolean }) {
  if (!input.enabled || input.ownerKind !== "person") return { ok: true as const };
  if (!adultMaySelfRate(input)) return { ok: false as const, error: "self_rate_only" as const };
  return { ok: true as const };
}

async function ensureAccount(orgId: string, membershipId: string) {
  const sql = getSql();
  const existing = (await sql`
    SELECT id, units, mode
    FROM credits
    WHERE org_id = ${orgId} AND status = 'current'
    LIMIT 1
  `) as Row[];
  if (existing[0]) return existing[0];
  const created = (await sql`
    INSERT INTO credits (org_id, parent_membership_id, mode, status, units)
    VALUES (${orgId}, ${membershipId}, 'platform', 'current', 0)
    RETURNING id, units, mode
  `) as Row[];
  return created[0];
}

async function grantIfDue(account: Row, orgId: string, membershipId: string) {
  const config = readIndividualPlan();
  const grant = monthlyGrant(config);
  const sql = getSql();
  const creditId = text(account, "id");
  const recent = (await sql`
    SELECT id FROM credit_ledger
    WHERE credit_id = ${creditId}
      AND event_name = 'monthly_grant'
      AND created_at >= date_trunc('month', now())
    LIMIT 1
  `) as Row[];
  if (recent[0]) return account;
  const next = num(account.units) + grant.units;
  const updated = (await sql`
    UPDATE credits SET units = ${next} WHERE id = ${creditId} RETURNING id, units, mode
  `) as Row[];
  await sql`
    INSERT INTO credit_ledger (
      org_id, credit_id, parent_membership_id, event_name, direction, units, note
    ) VALUES (
      ${orgId}, ${creditId}, ${membershipId}, 'monthly_grant', 'grant', ${grant.units}, ''
    )
  `;
  return updated[0] ?? account;
}

export async function precheckPersonCredits(input: {
  ownerKind: string;
  orgId: string;
  membershipId: string;
  runId: string;
  state: string;
}) {
  const config = readIndividualPlan();
  if (!config.enabled || input.ownerKind !== "person") return { apply: false as const };
  const account = await grantIfDue(await ensureAccount(input.orgId, input.membershipId), input.orgId, input.membershipId);
  const mode = text(account, "mode") === "byok" ? "byok" : "platform";
  const decision = applyBurn({
    balance: num(account.units),
    mode,
    event: burnEventForState(input.state),
    config,
  });
  if (!decision.capped) return { apply: true as const, capped: false as const, event: decision.usageEvent };
  await markRunCapped(input.runId);
  return { apply: true as const, capped: true as const, summary: decision.summary };
}

export async function recordPersonUse(input: {
  ownerKind: string;
  orgId: string;
  membershipId: string;
  state: string;
}) {
  const config = readIndividualPlan();
  if (!config.enabled || input.ownerKind !== "person") return { burned: false as const };
  const event = burnEventForState(input.state);
  const sql = getSql();
  const account = await ensureAccount(input.orgId, input.membershipId);
  const mode = text(account, "mode") === "byok" ? "byok" : "platform";
  const decision = applyBurn({ balance: num(account.units), mode, event, config });
  if (decision.capped) return { burned: false as const, capped: true as const, summary: decision.summary };
  const creditId = text(account, "id");
  if (decision.ledgerUnits > 0) {
    await sql`
      UPDATE credits SET units = ${decision.balance} WHERE id = ${creditId}
    `;
    await sql`
      INSERT INTO credit_ledger (
        org_id, credit_id, parent_membership_id, event_name, direction, units, note
      ) VALUES (
        ${input.orgId}, ${creditId}, ${input.membershipId}, 'usage_burn', 'burn', ${decision.ledgerUnits}, ${event}
      )
    `;
  }
  await sql`
    INSERT INTO usage_events (
      org_id, credit_id, parent_membership_id, event_name, units
    ) VALUES (
      ${input.orgId}, ${creditId}, ${input.membershipId}, ${decision.usageEvent}, ${decision.usageUnits}
    )
  `;
  return { burned: true as const, capped: false as const, addedDollars: decision.addedDollars };
}

async function markRunCapped(runId: string) {
  const sql = getSql();
  const runs = (await sql`
    SELECT id, org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id, state
    FROM loop_runs WHERE id = ${runId} LIMIT 1
  `) as Row[];
  const run = runs[0];
  if (!run || text(run, "state") === "capped") return;
  const summary = creditCapSummary();
  await sql`
    UPDATE loop_runs
    SET state = 'capped', stop_reason = 'credit_cap', updated_at = now()
    WHERE id = ${runId}
  `;
  const seqRows = (await sql`
    SELECT COALESCE(MAX(seq), 0)::int AS n FROM loop_events WHERE run_id = ${runId}
  `) as Row[];
  const seq = num(seqRows[0]?.n) + 1;
  const key = `credit-cap:${runId}`;
  const child = typeof run.child_membership_id === "string" && run.child_membership_id ? run.child_membership_id : null;
  await sql`
    INSERT INTO loop_events (
      org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
      run_id, seq, idempotency_key, from_state, to_state, kind, summary, detail
    ) VALUES (
      ${text(run, "org_id")}, ${text(run, "growth_unit_id")}, ${text(run, "owner_kind")},
      ${text(run, "owner_membership_id")}, ${child},
      ${runId}, ${seq}, ${key}, ${text(run, "state")}, 'capped', 'cap', ${summary}, ${sql.json({ reason: "credits" })}
    )
    ON CONFLICT (idempotency_key) DO NOTHING
  `;
}

export async function syncPlanVersion(input: {
  ownerKind: string;
  outcomeId: string;
  requirements: readonly RequirementSeed[];
}) {
  const config = readIndividualPlan();
  if (!config.enabled || input.ownerKind !== "person") return null;
  const applied = await applyIndividualPlanSqlIfConfigured();
  if (!applied) return null;
  const sql = getSql();
  const scopeRows = (await sql`
    SELECT org_id, growth_unit_id, owner_membership_id
    FROM outcomes WHERE id = ${input.outcomeId} LIMIT 1
  `) as Row[];
  const scope = scopeRows[0];
  if (!scope) return null;
  const items = itemsFromRequirements(input.requirements);
  const plans = (await sql`
    SELECT id, version FROM learning_plans
    WHERE outcome_id = ${input.outcomeId} AND status = 'active'
    ORDER BY version DESC
    LIMIT 1
  `) as Row[];
  let planId = text(plans[0], "id");
  let version = num(plans[0]?.version) || 1;
  if (!planId) {
    const created = (await sql`
      INSERT INTO learning_plans (
        org_id, growth_unit_id, owner_membership_id, kind, version, status, outcome_id
      ) VALUES (
        ${text(scope, "org_id")}, ${text(scope, "growth_unit_id")}, ${text(scope, "owner_membership_id")},
        'individual', 1, 'active', ${input.outcomeId}
      ) RETURNING id, version
    `) as Row[];
    planId = text(created[0], "id");
    version = 1;
  } else {
    version += 1;
    await sql`
      UPDATE learning_plans SET version = ${version}, updated_at = now() WHERE id = ${planId}
    `;
  }
  for (const item of items) {
    await sql`
      INSERT INTO plan_items (
        learning_plan_id, position, label, kind, outcome_requirement_id, version
      ) VALUES (
        ${planId}, ${item.position}, ${item.label}, ${item.kind}, ${item.requirementId}, ${version}
      )
    `;
  }
  return { id: planId, version, items };
}

export function eventForState(state: string): IndividualBurnEvent {
  return burnEventForState(state);
}
