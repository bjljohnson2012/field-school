import { decomposeOutcome, formulateRequest, judgeCoverage } from "../ai/prompts/gap-loop.ts";
import { GapAccessError } from "./errors.ts";
import { loadEvidence, type PoolItem } from "./inputs.ts";
import { LOOP_LIMITS } from "./machine.ts";
import { embedPassage } from "./embed-text.ts";
import { parseVector } from "./embedding.ts";
import { grokWebSearch } from "./web-search.ts";
import { genericWebQuery, queryHitsIdentifier, runApprovedSearch } from "./research.ts";
import {
  coverageMatch,
  coverageOf,
  detectGap,
  evidenceKey,
  gapPriority,
  gapSummary,
  systemConfidence,
  type GapKind,
  type ScoreEvidence,
} from "./score.ts";
import type { StepAction } from "./step.ts";
import {
  awaitingResponse,
  cell,
  childNames,
  ensureCitedNode,
  ensureEdge,
  loadBundle,
  loadRun,
  logResearchCap,
  logSameStateEvent,
  markIntegrated,
  openTask,
  recordResearchSpend,
  replaceRequirements,
  researchSpendMicros,
  saveAssessment,
  saveNodeEmbedding,
  setTaskStatus,
  topOpenGap,
  type LoopScope,
} from "./store.ts";
import { parseOutcomeScope } from "./rules.ts";
import { getSql } from "@/lib/db/client";
import { assertPersonResearchCap } from "@/lib/individual/ledger";

type Bundle = NonNullable<Awaited<ReturnType<typeof loadBundle>>>;

function scopeOf(bundle: Bundle): LoopScope {
  const kind = parseOutcomeScope(cell(bundle.outcome, "owner_kind"));
  return {
    orgId: cell(bundle.outcome, "org_id"),
    growthUnitId: cell(bundle.outcome, "growth_unit_id"),
    ownerKind: kind,
    ownerMembershipId: cell(bundle.outcome, "owner_membership_id"),
    childMembershipId: cell(bundle.outcome, "child_membership_id") || null,
  };
}

async function promptScope(bundle: Bundle) {
  const scope = scopeOf(bundle);
  const names =
    scope.ownerKind === "child" && scope.childMembershipId
      ? await childNames(scope.orgId, scope.childMembershipId)
      : { name: "", identifiers: [] as string[] };
  return {
    scope,
    text: {
      ownerKind: scope.ownerKind,
      statement: cell(bundle.outcome, "statement"),
      horizon: cell(bundle.outcome, "horizon"),
      childName: names.name,
      identifiers: names.identifiers,
      orgId: scope.orgId,
    },
  };
}

function matchedPool(
  requirementId: string,
  label: string,
  pool: PoolItem[],
  forced: string[],
  embeddings: Map<string, number[]>,
): ScoreEvidence[] {
  const items: ScoreEvidence[] = [];
  const requirementVector = embeddings.get(requirementId) || null;
  for (const item of pool) {
    const pinned = item.requirementId === requirementId || forced.includes(item.id);
    const match = pinned ? 1 : coverageMatch(label, `${item.label} ${item.text}`, requirementVector, embeddings.get(item.id) || null);
    if (match <= 0) continue;
    items.push({
      id: item.id,
      kind: item.kind,
      match,
      ageDays: item.ageDays,
      sourceId: item.sourceId,
      materialOnHand: item.materialOnHand,
      provesUse: item.provesUse,
    });
  }
  const ready = items.some((item) => item.kind === "parent_ready");
  const notYet = items.some((item) => item.kind === "parent_not_yet");
  if (!ready || !notYet) return items;
  return items.map((item) => (item.kind === "parent_not_yet" ? { ...item, disagreesWith: "parent_ready" } : item));
}

export async function assessOutcome(outcomeId: string) {
  const bundle = await loadBundle(outcomeId);
  if (!bundle) throw new GapAccessError(404, "unknown_outcome");
  const { scope, text } = await promptScope(bundle);
  const pool = await loadEvidence({
    ownerKind: scope.ownerKind,
    orgId: scope.orgId,
    growthUnitId: scope.growthUnitId,
    memberId: bundle.memberId,
    childMembershipId: scope.childMembershipId,
  });
  const requirements = bundle.requirements.map((row) => ({
    id: cell(row, "id"),
    label: cell(row, "label"),
  }));
  const judged = await judgeCoverage(
    text,
    requirements,
    pool.map((item) => ({ id: item.id, table: item.table, label: item.label, text: item.text })),
  );
  const forced = new Map(judged.matches.map((match) => [match.requirementId, match.evidenceIds]));
  const embeddings = new Map<string, number[]>();
  for (const node of bundle.nodes) {
    const vector = parseVector(node.embedding);
    const id = cell(node, "id");
    const requirementId = cell(node, "requirement_id");
    if (!vector) continue;
    if (id) embeddings.set(id, vector);
    if (requirementId) embeddings.set(requirementId, vector);
  }
  const goal = bundle.nodes.find((row) => cell(row, "kind") === "goal");
  const rows = bundle.requirements.map((row) => {
    const id = cell(row, "id");
    const label = cell(row, "label");
    const weight = Number(row.weight) || 1;
    if (cell(row, "status") === "waived") {
      return { id, coverage: Number(row.coverage) || 0, systemConfidence: "Low", status: "waived", gap: null, evidenceKey: "" };
    }
    const evidence = matchedPool(id, label, pool, forced.get(id) || [], embeddings);
    const coverage = coverageOf(evidence);
    const reqNode = bundle.nodes.find((node) => cell(node, "kind") === "requirement" && cell(node, "requirement_id") === id);
    const linked = bundle.edges.some((edge) => {
      const from = cell(edge, "from_node");
      const to = cell(edge, "to_node");
      return cell(edge, "rel") === "supports" && (to === cell(reqNode, "id") || from === cell(reqNode, "id"));
    });
    const tableClusters = new Set(pool.filter((item) => evidence.some((hit) => hit.id === item.id)).map((item) => item.table)).size;
    const kind = detectGap(
      {
        id,
        label,
        weight,
        depth: 0,
        evidence,
        expectedLinkMissing: Boolean(goal && reqNode && !linked),
        coveredClusters: tableClusters,
        ownerConfirmed: cell(row, "origin") === "owner" || cell(bundle.outcome, "status") === "active",
      },
      coverage,
    );
    const key = evidenceKey(evidence);
    const blocked = bundle.gaps.some(
      (gap) => cell(gap, "requirement_id") === id && cell(gap, "status") === "rejected" && cell(gap, "evidence_key") === key,
    );
    const confidence = systemConfidence(evidence, cell(row, "origin") === "owner");
    const met = !kind && coverage >= LOOP_LIMITS.metAt;
    return {
      id,
      coverage,
      systemConfidence: confidence,
      status: met ? "met" : "open",
      evidenceKey: key,
      gap: kind && !blocked ? { kind, summary: gapSummary(kind, label), priority: gapPriority(weight, coverage, 0), evidenceKey: key } : null,
    };
  });
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.coverage, 0) / rows.length) : 0;
  const allMet = rows.length > 0 && rows.every((row) => row.status === "met" || row.status === "waived");
  return { bundle, scope, text, rows, average, allMet, judged, pool };
}

export async function freshKeyForGap(gapId: string) {
  const sql = getSql();
  const rows = (await sql`SELECT outcome_id, requirement_id FROM gap_findings WHERE id = ${gapId} LIMIT 1`) as Record<string, unknown>[];
  const outcomeId = cell(rows[0], "outcome_id");
  const requirementId = cell(rows[0], "requirement_id");
  if (!outcomeId) return "";
  const assessed = await assessOutcome(outcomeId);
  return assessed.rows.find((item) => item.id === requirementId)?.evidenceKey || "";
}

export async function rescoreOwned(outcomeId: string) {
  const assessed = await assessOutcome(outcomeId);
  const runId = cell(assessed.bundle.run, "id");
  await saveAssessment({ outcomeId, runId, rows: assessed.rows, average: assessed.average });
  const state = cell(assessed.bundle.run, "state");
  const sql = getSql();
  if (assessed.allMet && state !== "done" && state !== "cancelled") {
    await sql`UPDATE loop_runs SET state = 'done', stop_reason = 'done', last_score = ${assessed.average}, updated_at = now() WHERE id = ${runId}`;
    await sql`UPDATE outcomes SET status = 'done', updated_at = now() WHERE id = ${outcomeId}`;
    const seqRows = (await sql`SELECT coalesce(max(seq), 0) + 1 AS n FROM loop_events WHERE run_id = ${runId}`) as { n: number }[];
    const key = `${runId}:met:${assessed.average}`;
    await sql`
      INSERT INTO loop_events (
        org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
        run_id, seq, idempotency_key, from_state, to_state, kind, summary, detail, model, tokens_in, tokens_out
      )
      SELECT org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
        id, ${Number(seqRows[0]?.n) || 1}, ${key}, ${state}, 'done', 'rescored', 'This goal is met.', ${sql.json({ average: assessed.average })}, NULL, NULL, NULL
      FROM loop_runs WHERE id = ${runId}
      ON CONFLICT (idempotency_key) DO NOTHING
    `;
    return;
  }
  if (!assessed.allMet && (state === "waiting_on_user" || state === "formulate" || state === "stalled")) {
    const open = await topOpenGap(outcomeId);
    if (open) {
      await sql`UPDATE loop_runs SET state = 'analyze', updated_at = now() WHERE id = ${runId}`;
    }
  }
}

export async function actForRun(run: { id: string; lastScore: number; state: string }): Promise<StepAction> {
  const loaded = await loadRun(run.id);
  if (!loaded) throw new GapAccessError(404, "unknown_run");
  const outcomeId = loaded.outcomeId;
  if (run.state === "draft") return draftAct(outcomeId);
  if (run.state === "analyze") return analyzeAct(outcomeId, run.lastScore);
  if (run.state === "formulate") return formulateAct(outcomeId);
  if (run.state === "waiting_on_user") return waitingAct(outcomeId);
  if (run.state === "researching") return researchAct(outcomeId);
  if (run.state === "integrate") return integrateAct(outcomeId);
  if (run.state === "rescore") return analyzeAct(outcomeId, run.lastScore, true);
  throw new GapAccessError(409, "not_a_system_step");
}

async function draftAct(outcomeId: string): Promise<StepAction> {
  const bundle = await loadBundle(outcomeId);
  if (!bundle) throw new GapAccessError(404, "unknown_outcome");
  const { scope, text } = await promptScope(bundle);
  const decomposed = await decomposeOutcome(text);
  if (bundle.requirements.length < 3) await replaceRequirements(scope, outcomeId, decomposed.requirements, "system");
  await ensureCitedNode({
    scope,
    requirementId: null,
    kind: "goal",
    label: cell(bundle.outcome, "title") || "Goal",
    body: cell(bundle.outcome, "statement"),
    sha256: null,
    filename: null,
    refTable: "outcomes",
    refId: outcomeId,
    evidence: [{ table: "outcomes", id: outcomeId, label: cell(bundle.outcome, "title") || "Goal" }],
  });
  return { event: "start", detail: { source: decomposed.source, model: decomposed.model, count: decomposed.requirements.length } };
}

async function analyzeAct(outcomeId: string, lastScore: number, rescore = false): Promise<StepAction> {
  const assessed = await assessOutcome(outcomeId);
  await saveAssessment({
    outcomeId,
    runId: cell(assessed.bundle.run, "id"),
    rows: assessed.rows,
    average: assessed.average,
  });
  return {
    event: rescore ? "rescored" : "scored",
    ctx: { allMet: assessed.allMet, scoreDelta: assessed.average - lastScore },
    lastScore: assessed.average,
    detail: { source: assessed.judged.source, model: assessed.judged.model },
  };
}

async function formulateAct(outcomeId: string): Promise<StepAction> {
  const bundle = await loadBundle(outcomeId);
  if (!bundle) throw new GapAccessError(404, "unknown_outcome");
  const awaiting = bundle.tasks.find((row) => cell(row, "status") === "awaiting_user");
  if (awaiting) return { event: "asked", detail: { taskId: cell(awaiting, "id") } };
  const { scope, text } = await promptScope(bundle);
  const open = await topOpenGap(outcomeId);
  if (!open) return { event: "asked", detail: { empty: true } };
  const kind = (cell(open, "kind") || "missing_knowledge") as GapKind;
  const label = cell(open, "label") || "this requirement";
  if (kind === "missing_knowledge") {
    const blocked = scope.ownerKind === "child" ? [text.childName || "", ...(text.identifiers || [])] : [];
    const query = genericWebQuery(label);
    if (query && !queryHitsIdentifier(query, blocked)) {
      const taskId = await openTask({
        scope,
        gapId: cell(open, "id"),
        question: query,
        channel: "web",
        requestCopy: "Approve this search, or decline it.",
        queryText: query,
        leaveStatus: cell(open, "status") === "rejected",
      });
      return { event: "asked", detail: { taskId, channel: "web", model: null } };
    }
  }
  const cited = bundle.nodes
    .filter((row) => cell(row, "requirement_id") === cell(open, "requirement_id"))
    .slice(0, 4)
    .map((row) => ({ table: "knowledge_nodes", id: cell(row, "id"), label: cell(row, "label") || "Evidence" }));
  const asked = await formulateRequest(text, { kind, label }, cited.length ? cited : [{ table: "outcomes", id: outcomeId, label: cell(bundle.outcome, "title") || "Goal" }]);
  const labels = asked.citations.map((row) => row.label).filter(Boolean).slice(0, 3);
  const requestCopy = labels.length ? `${asked.requestCopy} Cited: ${labels.join(", ")}.` : asked.requestCopy;
  const taskId = await openTask({
    scope,
    gapId: cell(open, "id"),
    question: asked.question,
    channel: asked.channel,
    requestCopy,
    leaveStatus: cell(open, "status") === "rejected",
  });
  return { event: "asked", detail: { taskId, source: asked.source, model: asked.model, channel: asked.channel } };
}

async function waitingAct(outcomeId: string): Promise<StepAction> {
  const response = await awaitingResponse(outcomeId);
  if (!response || response.integrated) throw new GapAccessError(409, "needs_response");
  if (response.kind === "decline") return { event: "decline", detail: { taskId: response.taskId } };
  const bundle = await loadBundle(outcomeId);
  if (!bundle) throw new GapAccessError(404, "unknown_outcome");
  const scope = scopeOf(bundle);
  const gap = bundle.gaps.find((row) => cell(row, "id") === response.gapId);
  const label = response.filename || response.kind || "Upload";
  await ensureCitedNode({
    scope,
    requirementId: cell(gap, "requirement_id") || null,
    kind: "evidence",
    label,
    body: response.text,
    sha256: response.sha256 || null,
    filename: response.filename || null,
    refTable: response.evidenceKind,
    refId: response.taskId,
    evidence: [{ table: "research_tasks", id: response.taskId, label }],
  });
  await markIntegrated(response.taskId);
  return { event: "respond", detail: { taskId: response.taskId, model: null } };
}

async function researchAct(outcomeId: string): Promise<StepAction> {
  const bundle = await loadBundle(outcomeId);
  if (!bundle) throw new GapAccessError(404, "unknown_outcome");
  const scope = scopeOf(bundle);
  const task = bundle.tasks.find((row) => cell(row, "channel") === "web" && ["approved", "running", "done"].includes(cell(row, "status")));
  if (!task) return { event: "research_failed", detail: { reason: "no_task" } };
  const taskId = cell(task, "id");
  if (cell(task, "status") === "done") return { event: "research_done", detail: { taskId, replay: true } };
  const names =
    scope.ownerKind === "child" && scope.childMembershipId
      ? await childNames(scope.orgId, scope.childMembershipId)
      : { name: "", identifiers: [] as string[] };
  const identifiers = scope.ownerKind === "child" ? [names.name, ...names.identifiers].filter(Boolean) : [];
  const researchCap = await assertPersonResearchCap({ ownerKind: scope.ownerKind, orgId: scope.orgId });
  if (!researchCap.ok) return { event: "research_failed", detail: { reason: researchCap.error } };
  const spent = await researchSpendMicros(taskId);
  if (cell(task, "status") === "approved") await setTaskStatus(taskId, "running", null);
  const result = await runApprovedSearch({
    query: cell(task, "query_text"),
    identifiers,
    taskSpentMicros: spent.task,
    monthSpentMicros: spent.month,
    search: (query) => grokWebSearch(query, { block: identifiers }),
  });
  if (!result.ok) {
    if ("event" in result && result.event) await logSameStateEvent(cell(bundle.run, "id"), result.event.kind, result.event.summary);
    if (result.error === "task_cap" || result.error === "month_cap") {
      logResearchCap({ taskId, stop: result.error, usdMicros: 0 });
    }
    return { event: "research_failed", detail: { reason: result.error } };
  }
  await recordResearchSpend(scope.orgId, taskId, result.usdMicros, "web");
  if (result.hardStop) logResearchCap({ taskId, stop: "task_cap", usdMicros: result.usdMicros });
  const citation = result.node.evidence[0];
  const gap = bundle.gaps.find((row) => cell(row, "id") === cell(task, "gap_id"));
  const nodeId = await ensureCitedNode({
    scope,
    requirementId: cell(gap, "requirement_id") || null,
    kind: "evidence",
    label: result.node.label,
    body: result.node.body,
    sha256: null,
    filename: null,
    refTable: "web",
    refId: taskId,
    evidence: [citation],
  });
  const vector = await embedPassage(result.node.label);
  if (vector) await saveNodeEmbedding(nodeId, vector);
  await setTaskStatus(taskId, "done", null);
  return { event: "research_done", detail: { taskId, citation: { table: citation.table, id: citation.id, label: citation.label } } };
}

async function integrateAct(outcomeId: string): Promise<StepAction> {
  const bundle = await loadBundle(outcomeId);
  if (!bundle) throw new GapAccessError(404, "unknown_outcome");
  const scope = scopeOf(bundle);
  const goal = bundle.nodes.find((row) => cell(row, "kind") === "goal");
  for (const node of bundle.nodes.filter((row) => cell(row, "kind") === "evidence")) {
    const requirement = bundle.nodes.find(
      (row) => cell(row, "kind") === "requirement" && cell(row, "requirement_id") === cell(node, "requirement_id"),
    );
    const evidence = [{ table: "knowledge_nodes", id: cell(node, "id"), label: cell(node, "label") || "Evidence" }];
    if (requirement) {
      await ensureEdge({
        scope,
        from: cell(node, "id"),
        to: cell(requirement, "id"),
        rel: "supports",
        because: "This material supports the requirement.",
        evidence,
      });
    }
    if (requirement && goal) {
      await ensureEdge({
        scope,
        from: cell(requirement, "id"),
        to: cell(goal, "id"),
        rel: "part_of",
        because: "This requirement is part of the goal.",
        evidence: [{ table: "outcomes", id: outcomeId, label: cell(bundle.outcome, "title") || "Goal" }],
      });
    }
  }
  return { event: "integrated", detail: {} };
}

