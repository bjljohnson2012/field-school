import { getSql } from "@/lib/db/client";
import { assertEvidence, type Citation } from "./citations.ts";
import { GapAccessError, GapFieldsError } from "./errors.ts";
import { lessonPaths } from "./inputs.ts";
import { transition, type LoopEventName, type LoopState } from "./machine.ts";
import { canReadOutcome, outcomeWrite, type GapActor, type OutcomeScope } from "./rules.ts";
import { outcomeSignals } from "./signals.ts";
import type { StepCommit, StepStore, StoredEvent } from "./step.ts";
import type { EventView, GapView, OutcomeView, RequirementView, RunView, TaskView, WorkspaceView } from "./view.ts";

type Row = Record<string, unknown>;
export type LoopScope = {
  orgId: string;
  growthUnitId: string;
  ownerKind: OutcomeScope;
  ownerMembershipId: string;
  childMembershipId: string | null;
};
type Scope = LoopScope;

const COUNTED = ["start", "scored", "asked", "respond", "decline", "integrated", "rescored"];

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
function num(row: Row, key: string) {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : 0;
}
function nullable(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" && value ? value : null;
}
function when(row: Row, key: string) {
  const value = row[key];
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}
function asScope(row: Row): Scope {
  const kind = text(row, "owner_kind") === "child" ? "child" : "person";
  return {
    orgId: text(row, "org_id"),
    growthUnitId: text(row, "growth_unit_id"),
    ownerKind: kind,
    ownerMembershipId: text(row, "owner_membership_id"),
    childMembershipId: nullable(row, "child_membership_id"),
  };
}
function citations(value: unknown): Citation[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Row;
      return { table: text(row, "table"), id: text(row, "id"), label: text(row, "label") };
    })
    .filter((item) => item.table && item.id && item.label);
}
function doneCondition(value: unknown) {
  const row = value && typeof value === "object" ? (value as Row) : {};
  return {
    evidenceType: text(row, "evidenceType") || "upload",
    text: text(row, "text") || "Evidence that this is done",
  };
}

function assertWritable(actor: GapActor, staff: boolean, row: Row) {
  if (actor.kind === "child") throw new GapAccessError(403, "child_cannot_write");
  const scope = asScope(row);
  if (!canReadOutcome(actor, { orgId: scope.orgId, ownerKind: scope.ownerKind, ownerMembershipId: scope.ownerMembershipId, childMembershipId: scope.childMembershipId }, staff)) {
    throw new GapAccessError(403, "forbidden");
  }
  const gate = outcomeWrite(actor, scope.ownerKind, staff);
  if (!gate.ok) throw new GapAccessError(403, gate.error);
  if (!staff && scope.ownerMembershipId !== actor.membershipId) throw new GapAccessError(403, "forbidden");
  return scope;
}

async function outcomeRow(actor: GapActor, outcomeId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM outcomes WHERE id = ${outcomeId} AND org_id = ${actor.orgId} LIMIT 1
  `) as Row[];
  return rows[0] ?? null;
}

async function runForOutcome(outcomeId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM loop_runs WHERE outcome_id = ${outcomeId} ORDER BY created_at DESC LIMIT 1
  `) as Row[];
  return rows[0] ?? null;
}

export async function claimLease(runId: string, runnerId: string) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const locked = (await tx`
      SELECT id FROM loop_runs
      WHERE id = ${runId}
        AND (lease_until IS NULL OR lease_until < now() OR lease_owner = ${runnerId})
      FOR UPDATE SKIP LOCKED
    `) as Row[];
    if (!locked.length) return false;
    await tx`
      UPDATE loop_runs
      SET lease_owner = ${runnerId}, lease_until = now() + interval '90 seconds', updated_at = now()
      WHERE id = ${runId}
    `;
    return true;
  });
}

export async function releaseLease(runId: string, runnerId: string) {
  const sql = getSql();
  await sql`
    UPDATE loop_runs
    SET lease_owner = NULL, lease_until = NULL, updated_at = now()
    WHERE id = ${runId} AND lease_owner = ${runnerId}
  `;
}

export async function loadRun(runId: string) {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM loop_runs WHERE id = ${runId} LIMIT 1`) as Row[];
  const row = rows[0];
  if (!row) return null;
  const seq = (await sql`SELECT coalesce(max(seq), 0) + 1 AS n FROM loop_events WHERE run_id = ${runId}`) as Row[];
  return {
    id: text(row, "id"),
    state: text(row, "state") as LoopState,
    cycle: num(row, "cycle"),
    stepCount: num(row, "step_count"),
    noProgressCycles: num(row, "no_progress_cycles"),
    lastScore: num(row, "last_score"),
    ownerMembershipId: text(row, "owner_membership_id"),
    nextSeq: num(seq[0] || {}, "n") || 1,
    outcomeId: text(row, "outcome_id"),
  };
}

export async function stepsToday(ownerMembershipId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT count(*)::int AS n FROM loop_events
    WHERE owner_membership_id = ${ownerMembershipId}
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'utc')
      AND kind = ANY(${COUNTED})
  `) as Row[];
  return num(rows[0] || {}, "n");
}

function mapEvent(row: Row): StoredEvent {
  return {
    idempotencyKey: text(row, "idempotency_key"),
    seq: num(row, "seq"),
    fromState: text(row, "from_state"),
    toState: text(row, "to_state"),
    kind: text(row, "kind"),
    summary: text(row, "summary"),
    detail: row.detail ?? {},
  };
}

export async function findEvent(key: string) {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM loop_events WHERE idempotency_key = ${key} LIMIT 1`) as Row[];
  return rows[0] ? mapEvent(rows[0]) : null;
}

export async function commitStep(input: StepCommit & { model?: string | null }) {
  const sql = getSql();
  const detail = input.detail ?? {};
  const model =
    input.model ||
    (detail && typeof detail === "object" && typeof (detail as { model?: unknown }).model === "string"
      ? (detail as { model: string }).model
      : null);
  try {
    return await sql.begin(async (tx) => {
      const inserted = (await tx`
        INSERT INTO loop_events (
          org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
          run_id, seq, idempotency_key, from_state, to_state, kind, summary, detail, model, tokens_in, tokens_out
        )
        SELECT org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
          id, ${input.seq}, ${input.idempotencyKey}, ${input.fromState}, ${input.toState},
          ${input.kind}, ${input.summary}, ${tx.json(JSON.parse(JSON.stringify(detail ?? {})))}, ${model}, NULL, NULL
        FROM loop_runs WHERE id = ${input.runId}
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING *
      `) as Row[];
      const row = inserted[0];
      if (!row) {
        const existing = (await tx`SELECT * FROM loop_events WHERE idempotency_key = ${input.idempotencyKey} LIMIT 1`) as Row[];
        return { inserted: false, event: mapEvent(existing[0] || {}) };
      }
      await tx`
        UPDATE loop_runs
        SET state = ${input.toState}, cycle = ${input.cycle}, step_count = ${input.stepCount},
            no_progress_cycles = ${input.noProgressCycles}, last_score = ${input.lastScore},
            stop_reason = ${input.stopReason}, updated_at = now()
        WHERE id = ${input.runId}
      `;
      await tx`
        UPDATE outcomes SET
          status = CASE
            WHEN ${input.toState} = 'paused' THEN 'paused'
            WHEN ${input.toState} = 'done' THEN 'done'
            WHEN ${input.toState} = 'cancelled' THEN 'archived'
            WHEN ${input.toState} = 'analyze' AND ${input.fromState} IN ('paused', 'decompose') THEN 'active'
            ELSE status
          END,
          updated_at = now()
        WHERE id = (SELECT outcome_id FROM loop_runs WHERE id = ${input.runId})
      `;
      return { inserted: true, event: mapEvent(row) };
    });
  } catch (error) {
    const existing = await findEvent(input.idempotencyKey);
    if (existing) return { inserted: false, event: existing };
    throw error;
  }
}

export const stepStore: StepStore = {
  claim: claimLease,
  release: releaseLease,
  load: async (runId) => {
    const run = await loadRun(runId);
    if (!run) return null;
    return run;
  },
  stepsToday,
  findEvent,
  commit: commitStep,
};

async function ensureGrowthUnit(actor: GapActor, scope: OutcomeScope, childMembershipId: string | null) {
  const sql = getSql();
  if (scope === "child") {
    if (!childMembershipId) throw new GapFieldsError("child_membership_id_required");
    const kids = (await sql`
      SELECT m.id FROM memberships m
      JOIN members mem ON mem.id = m.member_id
      WHERE m.id = ${childMembershipId} AND m.org_id = ${actor.orgId} AND mem.kind = 'child'
      LIMIT 1
    `) as Row[];
    if (!kids.length) throw new GapFieldsError("child_not_in_org");
    const existing = (await sql`
      SELECT id FROM growth_units
      WHERE org_id = ${actor.orgId} AND kind = 'child' AND child_membership_id = ${childMembershipId}
      LIMIT 1
    `) as Row[];
    if (existing[0]) return text(existing[0], "id");
    const created = (await sql`
      INSERT INTO growth_units (org_id, parent_membership_id, child_membership_id, kind, title, status)
      VALUES (${actor.orgId}, ${actor.membershipId}, ${childMembershipId}, 'child', 'Child', 'current')
      RETURNING id
    `) as Row[];
    return text(created[0], "id");
  }
  const existing = (await sql`
    SELECT id FROM growth_units
    WHERE org_id = ${actor.orgId} AND kind = 'person'
      AND parent_membership_id = ${actor.membershipId} AND child_membership_id IS NULL
    LIMIT 1
  `) as Row[];
  if (existing[0]) return text(existing[0], "id");
  const created = (await sql`
    INSERT INTO growth_units (org_id, parent_membership_id, child_membership_id, kind, title, status)
    SELECT ${actor.orgId}, ${actor.membershipId}, NULL, 'person', 'Self', 'current'
    WHERE NOT EXISTS (
      SELECT 1 FROM growth_units
      WHERE org_id = ${actor.orgId} AND kind = 'person'
        AND parent_membership_id = ${actor.membershipId} AND child_membership_id IS NULL
    )
    RETURNING id
  `) as Row[];
  if (created[0]) return text(created[0], "id");
  const again = (await sql`
    SELECT id FROM growth_units
    WHERE org_id = ${actor.orgId} AND kind = 'person'
      AND parent_membership_id = ${actor.membershipId} AND child_membership_id IS NULL
    LIMIT 1
  `) as Row[];
  return text(again[0] || {}, "id");
}

function mapOutcome(row: Row): OutcomeView {
  return {
    id: text(row, "id"),
    title: text(row, "title"),
    statement: text(row, "statement"),
    horizon: text(row, "horizon"),
    status: text(row, "status"),
    version: num(row, "version"),
    ownerKind: text(row, "owner_kind"),
    childMembershipId: nullable(row, "child_membership_id"),
    createdAt: when(row, "created_at"),
  };
}

export async function createOutcome(
  actor: GapActor,
  staff: boolean,
  body: { ownerKind?: string; statement?: string; title?: string; horizon?: string; childMembershipId?: string },
) {
  const ownerKind: OutcomeScope = body.ownerKind === "child" ? "child" : "person";
  const gate = outcomeWrite(actor, ownerKind, staff);
  if (!gate.ok) throw new GapAccessError(403, gate.error);
  const statement = (body.statement || "").replace(/\s+/g, " ").trim();
  if (statement.length < 3) throw new GapFieldsError("statement_required");
  const title = (body.title || statement).replace(/\s+/g, " ").trim().slice(0, 140);
  const horizon = (body.horizon || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const childMembershipId = ownerKind === "child" ? body.childMembershipId || null : null;
  const growthUnitId = await ensureGrowthUnit(actor, ownerKind, childMembershipId);
  const sql = getSql();
  const outcome = ((await sql`
    INSERT INTO outcomes (
      org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
      title, statement, horizon, status, version
    ) VALUES (
      ${actor.orgId}, ${growthUnitId}, ${ownerKind}, ${actor.membershipId}, ${childMembershipId},
      ${title}, ${statement}, ${horizon}, 'draft', 1
    ) RETURNING *
  `) as Row[])[0];
  await sql`
    INSERT INTO loop_runs (
      org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
      outcome_id, state, max_steps
    ) VALUES (
      ${actor.orgId}, ${growthUnitId}, ${ownerKind}, ${actor.membershipId}, ${childMembershipId},
      ${text(outcome, "id")}, 'draft', 12
    )
  `;
  return mapOutcome(outcome);
}

export async function listOutcomes(actor: GapActor, staff: boolean) {
  const gate = outcomeWrite(actor, "person", staff);
  if (!gate.ok) throw new GapAccessError(403, gate.error);
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM outcomes WHERE org_id = ${actor.orgId} AND status <> 'archived' ORDER BY created_at DESC LIMIT 100
  `) as Row[];
  const outcomes = rows
    .filter((row) => {
      const scope = asScope(row);
      return canReadOutcome(actor, scope, staff);
    })
    .map(mapOutcome);
  return { outcomes, childGoals: outcomeWrite(actor, "child", staff).ok };
}

async function requirementRows(outcomeId: string) {
  const sql = getSql();
  return (await sql`
    SELECT * FROM outcome_requirements WHERE outcome_id = ${outcomeId} ORDER BY sort_order ASC
  `) as Row[];
}

function mapRequirement(row: Row): RequirementView {
  const confidence = text(row, "system_confidence");
  return {
    id: text(row, "id"),
    label: text(row, "label"),
    kind: text(row, "kind"),
    weight: num(row, "weight"),
    coverage: num(row, "coverage"),
    systemConfidence: confidence === "High" || confidence === "Medium" ? confidence : "Low",
    status: text(row, "status"),
    sortOrder: num(row, "sort_order"),
    doneCondition: doneCondition(row.done_condition),
  };
}

function mapGap(row: Row): GapView {
  return {
    id: text(row, "id"),
    requirementId: text(row, "requirement_id"),
    kind: text(row, "kind"),
    summary: text(row, "summary"),
    coverage: num(row, "coverage_at_find"),
    priority: num(row, "priority"),
    status: text(row, "status"),
    rejectReason: text(row, "reject_reason"),
    evidenceKey: text(row, "evidence_key"),
  };
}

export async function getWorkspace(actor: GapActor, staff: boolean, outcomeId: string): Promise<WorkspaceView> {
  if (actor.kind === "child") throw new GapAccessError(403, "child_cannot_write");
  const outcome = await outcomeRow(actor, outcomeId);
  if (!outcome) throw new GapAccessError(404, "unknown_outcome");
  const scope = asScope(outcome);
  if (!canReadOutcome(actor, scope, staff)) throw new GapAccessError(403, "forbidden");
  const run = await runForOutcome(outcomeId);
  if (!run) throw new GapAccessError(404, "unknown_run");
  const sql = getSql();
  const requirements = (await requirementRows(outcomeId)).map(mapRequirement);
  const gaps = ((await sql`
    SELECT * FROM gap_findings WHERE outcome_id = ${outcomeId} AND org_id = ${actor.orgId}
    ORDER BY priority DESC, created_at ASC
  `) as Row[]).map(mapGap);
  const tasks = (await sql`
    SELECT t.* FROM research_tasks t
    JOIN gap_findings g ON g.id = t.gap_id
    WHERE g.outcome_id = ${outcomeId} AND t.org_id = ${actor.orgId} AND t.status = 'awaiting_user'
    ORDER BY t.created_at DESC LIMIT 1
  `) as Row[];
  const events = ((await sql`
    SELECT * FROM loop_events WHERE run_id = ${text(run, "id")} ORDER BY seq ASC LIMIT 200
  `) as Row[]).map(mapEventView);
  const sources = ((await sql`
    SELECT id, label, filename FROM knowledge_nodes
    WHERE org_id = ${scope.orgId} AND kind = 'evidence' AND status = 'active'
      AND requirement_id IN (SELECT id FROM outcome_requirements WHERE outcome_id = ${outcomeId})
    ORDER BY created_at DESC LIMIT 40
  `) as Row[]).map((row) => ({ id: text(row, "id"), label: text(row, "label"), filename: text(row, "filename") }));
  const paths = text(tasks[0] || {}, "channel") === "lesson" ? await lessonPaths(scope.orgId, scope.growthUnitId) : [];
  const task = tasks[0] ? mapTask(tasks[0], paths) : null;
  const openGap = gaps.find((gap) => gap.status === "open" || gap.status === "asked");
  const signals = outcomeSignals({
    title: text(outcome, "title"),
    requirements,
    topGap: openGap?.summary || task?.question || null,
    intentLinked: Boolean(nullable(outcome, "intent_id")),
  });
  const runView: RunView = {
    id: text(run, "id"),
    state: text(run, "state"),
    cycle: num(run, "cycle"),
    stepCount: num(run, "step_count"),
    noProgressCycles: num(run, "no_progress_cycles"),
    lastScore: num(run, "last_score"),
    stopReason: nullable(run, "stop_reason"),
  };
  return {
    outcome: mapOutcome(outcome),
    run: runView,
    requirements,
    gaps,
    task,
    events,
    sources,
    signals: {
      now: { coverageLabel: signals.now.coverageLabel, copy: signals.now.copy },
      confidence: null,
      systemConfidence: signals.systemConfidence,
      next: { title: signals.next.title, reason: signals.next.reason, locked: false },
    },
  };
}

function mapEventView(row: Row): EventView {
  return {
    seq: num(row, "seq"),
    kind: text(row, "kind"),
    summary: text(row, "summary"),
    fromState: text(row, "from_state"),
    toState: text(row, "to_state"),
    createdAt: when(row, "created_at"),
  };
}

function mapTask(row: Row, extra: { href: string; label: string }[]): TaskView {
  const channel = text(row, "channel");
  const links = channel === "lesson" ? [{ href: "/play/lesson-spine", label: "Open the lesson spine" }, ...extra] : extra;
  return {
    id: text(row, "id"),
    gapId: text(row, "gap_id"),
    question: text(row, "question"),
    channel,
    requestCopy: text(row, "request_copy"),
    status: text(row, "status"),
    links,
  };
}

export async function eventsAfter(actor: GapActor, staff: boolean, outcomeId: string, after: number) {
  const workspace = await getWorkspace(actor, staff, outcomeId);
  return workspace.events.filter((event) => event.seq > after);
}

async function hold<T>(runId: string, runnerId: string, fn: () => Promise<T>) {
  const claimed = await claimLease(runId, runnerId);
  if (!claimed) throw new GapAccessError(409, "lease_held");
  try {
    return await fn();
  } finally {
    await releaseLease(runId, runnerId);
  }
}

async function move(runId: string, event: LoopEventName, key: string, summaryDetail: unknown) {
  const existing = await findEvent(key);
  if (existing) return existing;
  const run = await loadRun(runId);
  if (!run) throw new GapAccessError(404, "unknown_run");
  const today = await stepsToday(run.ownerMembershipId);
  const moved = transition(run.state, event, {
    stepsThisRun: run.stepCount,
    stepsToday: today,
    noProgressCycles: run.noProgressCycles,
    scoreDelta: 0,
    allMet: false,
  });
  if (!moved.ok) throw new GapFieldsError(moved.error);
  const committed = await commitStep({
    runId,
    seq: run.nextSeq,
    idempotencyKey: key,
    fromState: run.state,
    toState: moved.state,
    kind: event,
    summary: moved.summary,
    detail: summaryDetail ?? {},
    stepCount: run.stepCount,
    noProgressCycles: moved.noProgressCycles,
    lastScore: run.lastScore,
    stopReason: moved.stopReason,
    cycle: run.cycle,
  });
  return committed.event;
}

export async function loadBundle(outcomeId: string) {
  const sql = getSql();
  const outcomes = (await sql`SELECT * FROM outcomes WHERE id = ${outcomeId} LIMIT 1`) as Row[];
  const outcome = outcomes[0];
  if (!outcome) return null;
  const run = await runForOutcome(outcomeId);
  if (!run) return null;
  const requirements = await requirementRows(outcomeId);
  const gaps = (await sql`SELECT * FROM gap_findings WHERE outcome_id = ${outcomeId}`) as Row[];
  const tasks = (await sql`
    SELECT t.* FROM research_tasks t
    JOIN gap_findings g ON g.id = t.gap_id
    WHERE g.outcome_id = ${outcomeId}
    ORDER BY t.created_at DESC
  `) as Row[];
  const nodes = (await sql`
    SELECT * FROM knowledge_nodes WHERE org_id = ${text(outcome, "org_id")} AND growth_unit_id = ${text(outcome, "growth_unit_id")} AND status = 'active'
  `) as Row[];
  const edges = (await sql`
    SELECT * FROM knowledge_edges WHERE org_id = ${text(outcome, "org_id")} AND growth_unit_id = ${text(outcome, "growth_unit_id")}
  `) as Row[];
  const members = (await sql`
    SELECT member_id FROM memberships WHERE id = ${text(outcome, "owner_membership_id")} LIMIT 1
  `) as Row[];
  return { outcome, run, requirements, gaps, tasks, nodes, edges, memberId: text(members[0] || {}, "member_id") };
}

export async function replaceRequirements(
  scope: Scope,
  outcomeId: string,
  rows: { label: string; kind: string; weight: number; doneCondition: { evidenceType: string; text: string } }[],
  origin: "system" | "owner",
) {
  const sql = getSql();
  await sql.begin(async (tx) => {
    await tx`
      DELETE FROM knowledge_nodes
      WHERE kind = 'requirement'
        AND requirement_id IN (SELECT id FROM outcome_requirements WHERE outcome_id = ${outcomeId})
    `;
    await tx`DELETE FROM outcome_requirements WHERE outcome_id = ${outcomeId}`;
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      await tx`
        INSERT INTO outcome_requirements (
          org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
          outcome_id, sort_order, label, kind, weight, done_condition, origin
        ) VALUES (
          ${scope.orgId}, ${scope.growthUnitId}, ${scope.ownerKind}, ${scope.ownerMembershipId}, ${scope.childMembershipId},
          ${outcomeId}, ${index}, ${row.label}, ${row.kind}, ${row.weight}, ${tx.json(row.doneCondition)}, ${origin}
        )
      `;
    }
  });
}

export async function ensureCitedNode(input: {
  scope: Scope;
  requirementId: string | null;
  kind: "goal" | "requirement" | "evidence";
  label: string;
  body: string;
  sha256: string | null;
  filename: string | null;
  refTable: string | null;
  refId: string | null;
  evidence: Citation[];
}) {
  let evidence: Citation[];
  try {
    evidence = assertEvidence(input.evidence);
  } catch {
    throw new GapFieldsError("evidence_required");
  }
  const sql = getSql();
  if (input.refId) {
    const existing = (await sql`
      SELECT id FROM knowledge_nodes
      WHERE org_id = ${input.scope.orgId} AND ref_id = ${input.refId} AND kind = ${input.kind}
      LIMIT 1
    `) as Row[];
    if (existing[0]) return text(existing[0], "id");
  }
  const created = (await sql`
    INSERT INTO knowledge_nodes (
      org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
      requirement_id, kind, label, body, sha256, filename, ref_table, ref_id, evidence
    ) VALUES (
      ${input.scope.orgId}, ${input.scope.growthUnitId}, ${input.scope.ownerKind}, ${input.scope.ownerMembershipId}, ${input.scope.childMembershipId},
      ${input.requirementId}, ${input.kind}, ${input.label}, ${input.body}, ${input.sha256}, ${input.filename},
      ${input.refTable}, ${input.refId}, ${sql.json(evidence)}
    ) RETURNING id
  `) as Row[];
  return text(created[0], "id");
}

export async function ensureEdge(input: {
  scope: Scope;
  from: string;
  to: string;
  rel: "supports" | "requires" | "part_of" | "contradicts";
  because: string;
  evidence: Citation[];
}) {
  let evidence: Citation[];
  try {
    evidence = assertEvidence(input.evidence);
  } catch {
    throw new GapFieldsError("evidence_required");
  }
  const sql = getSql();
  const existing = (await sql`
    SELECT id FROM knowledge_edges
    WHERE from_node = ${input.from} AND to_node = ${input.to} AND rel = ${input.rel}
    LIMIT 1
  `) as Row[];
  if (existing[0]) return text(existing[0], "id");
  const created = (await sql`
    INSERT INTO knowledge_edges (
      org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
      from_node, to_node, rel, because, evidence, origin
    ) VALUES (
      ${input.scope.orgId}, ${input.scope.growthUnitId}, ${input.scope.ownerKind}, ${input.scope.ownerMembershipId}, ${input.scope.childMembershipId},
      ${input.from}, ${input.to}, ${input.rel}, ${input.because}, ${sql.json(evidence)}, 'system'
    ) RETURNING id
  `) as Row[];
  return text(created[0], "id");
}

export async function saveAssessment(input: {
  outcomeId: string;
  runId: string;
  rows: {
    id: string;
    coverage: number;
    systemConfidence: string;
    status: string;
    gap: { kind: string; summary: string; priority: number; evidenceKey: string } | null;
  }[];
  average: number;
}) {
  const sql = getSql();
  const prior = (await sql`SELECT * FROM gap_findings WHERE outcome_id = ${input.outcomeId}`) as Row[];
  await sql.begin(async (tx) => {
    for (const row of input.rows) {
      await tx`
        UPDATE outcome_requirements
        SET coverage = ${row.coverage}, system_confidence = ${row.systemConfidence}, status = ${row.status}, updated_at = now()
        WHERE id = ${row.id}
      `;
      const existing = prior.filter((gap) => text(gap, "requirement_id") === row.id);
      const rejected = existing.find((gap) => text(gap, "status") === "rejected" && text(gap, "evidence_key") === (row.gap?.evidenceKey || ""));
      if (!row.gap || rejected) {
        for (const gap of existing) {
          if (text(gap, "status") === "open" || text(gap, "status") === "asked" || text(gap, "status") === "closing") {
            await tx`UPDATE gap_findings SET status = 'closed', updated_at = now() WHERE id = ${text(gap, "id")}`;
          }
        }
        continue;
      }
      const live = existing.find((gap) => ["open", "asked", "closing"].includes(text(gap, "status")));
      if (live) {
        await tx`
          UPDATE gap_findings
          SET kind = ${row.gap.kind}, summary = ${row.gap.summary}, coverage_at_find = ${row.coverage},
              priority = ${row.gap.priority}, evidence_key = ${row.gap.evidenceKey}, updated_at = now()
          WHERE id = ${text(live, "id")}
        `;
        continue;
      }
      const waived = existing.find((gap) => text(gap, "status") === "waived");
      if (waived || row.status === "waived" || row.status === "met") continue;
      await tx`
        INSERT INTO gap_findings (
          org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
          outcome_id, requirement_id, kind, summary, coverage_at_find, priority, status, evidence_key, found_in_run_id
        )
        SELECT org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
          ${input.outcomeId}, ${row.id}, ${row.gap.kind}, ${row.gap.summary}, ${row.coverage},
          ${row.gap.priority}, 'open', ${row.gap.evidenceKey}, ${input.runId}
        FROM outcomes WHERE id = ${input.outcomeId}
      `;
    }
    await tx`UPDATE loop_runs SET last_score = ${input.average}, updated_at = now() WHERE id = ${input.runId}`;
  });
}

export function cell(row: Row | null | undefined, key: string) {
  if (!row) return "";
  return text(row, key);
}

export async function openTask(input: {
  scope: Scope;
  gapId: string;
  question: string;
  channel: string;
  requestCopy: string;
  leaveStatus?: boolean;
}) {
  if (input.channel === "web") throw new GapFieldsError("web_research_not_in_m1");
  const sql = getSql();
  const existing = (await sql`
    SELECT id FROM research_tasks WHERE gap_id = ${input.gapId} AND status = 'awaiting_user' LIMIT 1
  `) as Row[];
  if (existing[0]) return text(existing[0], "id");
  const created = (await sql`
    INSERT INTO research_tasks (
      org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
      gap_id, question, channel, request_copy, status
    ) VALUES (
      ${input.scope.orgId}, ${input.scope.growthUnitId}, ${input.scope.ownerKind}, ${input.scope.ownerMembershipId}, ${input.scope.childMembershipId},
      ${input.gapId}, ${input.question}, ${input.channel}, ${input.requestCopy}, 'awaiting_user'
    ) RETURNING id
  `) as Row[];
  if (!input.leaveStatus) {
    await sql`UPDATE gap_findings SET status = 'asked', updated_at = now() WHERE id = ${input.gapId}`;
  }
  return text(created[0], "id");
}

export async function childNames(orgId: string, childMembershipId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT kp.display_name, kp.id AS profile_id, mem.name
    FROM memberships m
    JOIN members mem ON mem.id = m.member_id
    LEFT JOIN kid_profiles kp ON kp.child_membership_id = m.id AND kp.org_id = m.org_id
    WHERE m.id = ${childMembershipId} AND m.org_id = ${orgId}
    LIMIT 1
  `) as Row[];
  const row = rows[0];
  if (!row) return { name: "", identifiers: [childMembershipId] };
  const name = text(row, "display_name") || text(row, "name");
  const identifiers = [childMembershipId, text(row, "profile_id")].filter((value) => value.length >= 3);
  return { name, identifiers };
}

export async function confirmOutcome(
  actor: GapActor,
  staff: boolean,
  outcomeId: string,
  runnerId: string,
  requirements: { label: string; kind: string; weight: number; doneCondition: { evidenceType: string; text: string } }[] | null,
) {
  const outcome = await outcomeRow(actor, outcomeId);
  if (!outcome) throw new GapAccessError(404, "unknown_outcome");
  const scope = assertWritable(actor, staff, outcome);
  const run = await runForOutcome(outcomeId);
  if (!run) throw new GapAccessError(404, "unknown_run");
  const runId = text(run, "id");
  return hold(runId, runnerId, async () => {
    const fresh = await loadRun(runId);
    if (!fresh || fresh.state !== "decompose") throw new GapFieldsError("confirm_requires_decompose");
    const key = `${runId}:${fresh.cycle}:confirm`;
    const existing = await findEvent(key);
    if (existing) return getWorkspace(actor, staff, outcomeId);
    const current = await requirementRows(outcomeId);
    const next = requirements && requirements.length ? requirements : current.map((row) => ({
      label: text(row, "label"),
      kind: text(row, "kind"),
      weight: num(row, "weight"),
      doneCondition: doneCondition(row.done_condition),
    }));
    if (next.length < 3 || next.length > 12) throw new GapFieldsError("requirements_out_of_range");
    if (requirements && requirements.length) await replaceRequirements(scope, outcomeId, next, "owner");
    else {
      const sql = getSql();
      await sql`UPDATE outcome_requirements SET origin = 'owner', updated_at = now() WHERE outcome_id = ${outcomeId}`;
    }
    const saved = await requirementRows(outcomeId);
    const goalId = await ensureCitedNode({
      scope,
      requirementId: null,
      kind: "goal",
      label: text(outcome, "title") || "Goal",
      body: text(outcome, "statement"),
      sha256: null,
      filename: null,
      refTable: "outcomes",
      refId: outcomeId,
      evidence: [{ table: "outcomes", id: outcomeId, label: text(outcome, "title") || "Goal" }],
    });
    for (const row of saved) {
      const nodeId = await ensureCitedNode({
        scope,
        requirementId: text(row, "id"),
        kind: "requirement",
        label: text(row, "label"),
        body: text(row, "label"),
        sha256: null,
        filename: null,
        refTable: "outcome_requirements",
        refId: text(row, "id"),
        evidence: [{ table: "outcomes", id: outcomeId, label: text(outcome, "title") || "Goal" }],
      });
      await ensureEdge({
        scope,
        from: nodeId,
        to: goalId,
        rel: "part_of",
        because: "This requirement is part of the goal.",
        evidence: [{ table: "outcomes", id: outcomeId, label: text(outcome, "title") || "Goal" }],
      });
    }
    await move(runId, "confirm", key, { requirements: saved.length });
    return getWorkspace(actor, staff, outcomeId);
  });
}

export async function editOutcome(
  actor: GapActor,
  staff: boolean,
  outcomeId: string,
  runnerId: string,
  body: { title?: string; statement?: string; horizon?: string },
) {
  const outcome = await outcomeRow(actor, outcomeId);
  if (!outcome) throw new GapAccessError(404, "unknown_outcome");
  assertWritable(actor, staff, outcome);
  const run = await runForOutcome(outcomeId);
  if (!run) throw new GapAccessError(404, "unknown_run");
  const state = text(run, "state");
  if (state === "done" || state === "cancelled") throw new GapFieldsError("illegal_transition");
  const statement = (body.statement ?? text(outcome, "statement")).replace(/\s+/g, " ").trim();
  if (statement.length < 3) throw new GapFieldsError("statement_required");
  const title = (body.title ?? text(outcome, "title")).replace(/\s+/g, " ").trim().slice(0, 140);
  const horizon = (body.horizon ?? text(outcome, "horizon")).replace(/\s+/g, " ").trim().slice(0, 80);
  const sql = getSql();
  const bump = text(outcome, "status") === "active" || text(outcome, "status") === "paused";
  await sql`
    UPDATE outcomes
    SET title = ${title}, statement = ${statement}, horizon = ${horizon},
        version = version + ${bump ? 1 : 0}, updated_at = now()
    WHERE id = ${outcomeId}
  `;
  const runId = text(run, "id");
  if (state === "decompose") {
    await hold(runId, runnerId, async () => {
      const fresh = await loadRun(runId);
      if (!fresh) return;
      await move(runId, "revise", `${runId}:${fresh.cycle}:revise:${title}:${statement}`, {});
    });
  }
  return getWorkspace(actor, staff, outcomeId);
}

export async function setRunControl(actor: GapActor, staff: boolean, outcomeId: string, runnerId: string, action: "pause" | "resume" | "archive") {
  const outcome = await outcomeRow(actor, outcomeId);
  if (!outcome) throw new GapAccessError(404, "unknown_outcome");
  assertWritable(actor, staff, outcome);
  const run = await runForOutcome(outcomeId);
  if (!run) throw new GapAccessError(404, "unknown_run");
  const runId = text(run, "id");
  const event: LoopEventName = action === "archive" ? "cancel" : action;
  await hold(runId, runnerId, async () => {
    const fresh = await loadRun(runId);
    if (!fresh) throw new GapAccessError(404, "unknown_run");
    await move(runId, event, `${runId}:${fresh.cycle}:${event}`, {});
  });
  return getWorkspace(actor, staff, outcomeId);
}

export async function taskResponse(taskId: string, actor: GapActor) {
  const sql = getSql();
  const rows = (await sql`
    SELECT t.*, g.outcome_id, g.requirement_id, o.owner_kind, o.owner_membership_id, o.child_membership_id, o.org_id, o.growth_unit_id
    FROM research_tasks t
    JOIN gap_findings g ON g.id = t.gap_id
    JOIN outcomes o ON o.id = g.outcome_id
    WHERE t.id = ${taskId} AND t.org_id = ${actor.orgId}
    LIMIT 1
  `) as Row[];
  return rows[0] ?? null;
}

export async function saveTaskResponse(row: Row, response: { kind: string; text: string; sha256: string; filename: string; rating: string; evidenceKind: string; provesUse: boolean }) {
  if (text(row, "channel") === "web") throw new GapFieldsError("web_research_not_in_m1");
  if (text(row, "status") !== "awaiting_user") throw new GapFieldsError("task_closed");
  const sql = getSql();
  const status = response.kind === "decline" ? "declined" : "done";
  await sql`
    UPDATE research_tasks
    SET status = ${status}, response = ${sql.json(response)}, updated_at = now()
    WHERE id = ${text(row, "id")}
  `;
  if (status === "declined") {
    await sql`UPDATE gap_findings SET status = 'open', updated_at = now() WHERE id = ${text(row, "gap_id")}`;
  } else {
    await sql`UPDATE gap_findings SET status = 'closing', updated_at = now() WHERE id = ${text(row, "gap_id")}`;
  }
}

export async function patchGap(actor: GapActor, staff: boolean, gapId: string, runnerId: string, action: "reject" | "waive" | "reopen", reason: string, freshKey = "") {
  const sql = getSql();
  const rows = (await sql`
    SELECT g.*, o.org_id, o.growth_unit_id, o.owner_kind, o.owner_membership_id, o.child_membership_id
    FROM gap_findings g JOIN outcomes o ON o.id = g.outcome_id
    WHERE g.id = ${gapId} AND g.org_id = ${actor.orgId}
    LIMIT 1
  `) as Row[];
  const gap = rows[0];
  if (!gap) throw new GapAccessError(404, "unknown_gap");
  assertWritable(actor, staff, gap);
  if (action === "reopen" && text(gap, "status") === "rejected" && freshKey === text(gap, "evidence_key")) {
    throw new GapFieldsError("rejected_without_new_evidence");
  }
  const outcomeId = text(gap, "outcome_id");
  const run = await runForOutcome(outcomeId);
  if (!run) throw new GapAccessError(404, "unknown_run");
  const status = action === "reject" ? "rejected" : action === "waive" ? "waived" : "open";
  await sql`
    UPDATE gap_findings
    SET status = ${status}, reject_reason = ${action === "reject" ? reason : text(gap, "reject_reason")}, updated_at = now()
    WHERE id = ${gapId}
  `;
  if (action === "waive") {
    await sql`UPDATE outcome_requirements SET status = 'waived', updated_at = now() WHERE id = ${text(gap, "requirement_id")}`;
    await sql`
      UPDATE research_tasks SET status = 'expired', updated_at = now()
      WHERE gap_id = ${gapId} AND status = 'awaiting_user'
    `;
  }
  if (action === "reject") {
    await sql`
      UPDATE research_tasks SET status = 'expired', updated_at = now()
      WHERE gap_id = ${gapId} AND status = 'awaiting_user'
    `;
  }
  const runId = text(run, "id");
  await hold(runId, runnerId, async () => {
    const fresh = await loadRun(runId);
    if (!fresh) return;
    const key = `${runId}:${fresh.cycle}:${action}:${gapId}:${reason}`;
    if (await findEvent(key)) return;
    const sql = getSql();
    const seq = fresh.nextSeq;
    await sql`
      INSERT INTO loop_events (
        org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
        run_id, seq, idempotency_key, from_state, to_state, kind, summary, detail, model, tokens_in, tokens_out
      )
      SELECT org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
        id, ${seq}, ${key}, ${fresh.state}, ${fresh.state}, ${action},
        ${action === "waive" ? "Requirement waived." : action === "reject" ? "Finding rejected." : "Finding reopened."},
        ${sql.json({ gapId })}, NULL, NULL, NULL
      FROM loop_runs WHERE id = ${runId}
      ON CONFLICT (idempotency_key) DO NOTHING
    `;
  });
  return outcomeId;
}

export async function deleteNode(actor: GapActor, staff: boolean, nodeId: string, runnerId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT n.*, coalesce(req.outcome_id, goal.outcome_id, latest.outcome_id) AS outcome_id
    FROM knowledge_nodes n
    LEFT JOIN outcome_requirements req ON req.id = n.requirement_id
    LEFT JOIN outcomes goal ON n.ref_table = 'outcomes' AND goal.id::text = n.ref_id
    LEFT JOIN LATERAL (
      SELECT id AS outcome_id FROM outcomes
      WHERE org_id = n.org_id AND growth_unit_id = n.growth_unit_id
      ORDER BY created_at DESC LIMIT 1
    ) latest ON true
    WHERE n.id = ${nodeId} AND n.org_id = ${actor.orgId}
    LIMIT 1
  `) as Row[];
  const node = rows[0];
  if (!node) throw new GapAccessError(404, "unknown_node");
  assertWritable(actor, staff, node);
  if (!citations(node.evidence).length) throw new GapFieldsError("evidence_required");
  await sql`DELETE FROM knowledge_edges WHERE from_node = ${nodeId} OR to_node = ${nodeId}`;
  await sql`DELETE FROM knowledge_nodes WHERE id = ${nodeId} AND org_id = ${actor.orgId}`;
  const outcomeId = text(node, "outcome_id");
  const run = await runForOutcome(outcomeId);
  if (run) {
    const runId = text(run, "id");
    await hold(runId, runnerId, async () => {
      const fresh = await loadRun(runId);
      if (!fresh) return;
      const key = `${runId}:delete:${nodeId}`;
      if (await findEvent(key)) return;
      await sql`
        INSERT INTO loop_events (
          org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
          run_id, seq, idempotency_key, from_state, to_state, kind, summary, detail, model, tokens_in, tokens_out
        )
        SELECT org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
          id, ${fresh.nextSeq}, ${key}, ${fresh.state}, ${fresh.state}, 'delete',
          'Removed a source and scored again.', ${sql.json({ nodeId })}, NULL, NULL, NULL
        FROM loop_runs WHERE id = ${runId}
        ON CONFLICT (idempotency_key) DO NOTHING
      `;
    });
  }
  return outcomeId;
}

export async function awaitingResponse(outcomeId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT t.* FROM research_tasks t
    JOIN gap_findings g ON g.id = t.gap_id
    WHERE g.outcome_id = ${outcomeId} AND t.status IN ('done', 'declined')
    ORDER BY t.updated_at DESC LIMIT 1
  `) as Row[];
  const row = rows[0];
  if (!row || !row.response || typeof row.response !== "object") return null;
  const response = row.response as Row;
  return {
    taskId: text(row, "id"),
    gapId: text(row, "gap_id"),
    kind: text(response, "kind"),
    text: text(response, "text"),
    sha256: text(response, "sha256"),
    filename: text(response, "filename"),
    evidenceKind: text(response, "evidenceKind") || "upload",
    provesUse: response.provesUse === true,
    integrated: response.integrated === true,
  };
}

export async function markIntegrated(taskId: string) {
  const sql = getSql();
  const rows = (await sql`SELECT response FROM research_tasks WHERE id = ${taskId} LIMIT 1`) as Row[];
  const response = rows[0]?.response && typeof rows[0].response === "object" ? (rows[0].response as Row) : {};
  await sql`
    UPDATE research_tasks SET response = ${sql.json({ ...response, integrated: true })}, updated_at = now() WHERE id = ${taskId}
  `;
}

export async function topOpenGap(outcomeId: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT g.*, r.label FROM gap_findings g
    JOIN outcome_requirements r ON r.id = g.requirement_id
    WHERE g.outcome_id = ${outcomeId} AND g.status = 'open'
    ORDER BY g.priority DESC LIMIT 1
  `) as Row[];
  return rows[0] ?? null;
}

export { citations };
