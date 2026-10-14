import { bearerMatches } from "@/app/api/cron/coaching/route";
import { getSql } from "@/lib/db/client";
import { actForRun } from "./advance.ts";
import { applyGl2SqlIfConfigured } from "./gl2-sql.ts";
import { runStep, type StepStore } from "./step.ts";
import { stepStore } from "./store.ts";

export const KNOWLEDGE_CRON_RUNNER = "knowledge-cron";

type Row = Record<string, unknown>;

export type KnowledgeCronDeps = {
  env?: NodeJS.ProcessEnv;
  drain?: () => Promise<number>;
};

function finiteCount(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export async function handleKnowledgeCron(request: Request, deps: KnowledgeCronDeps = {}): Promise<Response> {
  const env = deps.env ?? process.env;
  if (!bearerMatches(request.headers.get("authorization"), env.CRON_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const drain = deps.drain ?? drainKnowledgeLoop;
  try {
    const rowsChanged = finiteCount(await drain());
    console.info(JSON.stringify({ event: "knowledge.cron", rowsChanged }));
    return Response.json({ ok: true, rowsChanged });
  } catch {
    console.info(JSON.stringify({ event: "knowledge.cron", rowsChanged: 0, stop: "cron_failed" }));
    return Response.json({ error: "cron_failed" }, { status: 500 });
  }
}

/** Claim a free researching, analyze, or integrate run and advance it once. A second pass replays. */
export async function drainKnowledgeLoop(store: StepStore = stepStore): Promise<number> {
  const ready = await applyGl2SqlIfConfigured();
  if (!ready) return 0;
  const sql = getSql();
  const runs = (await sql`
    SELECT id, cycle, state
    FROM loop_runs
    WHERE state IN ('researching', 'analyze', 'integrate')
      AND (lease_until IS NULL OR lease_until < now())
      AND updated_at < now() - interval '20 seconds'
    ORDER BY updated_at ASC
    LIMIT 20
  `) as Row[];
  let changed = 0;
  for (const row of runs) {
    const id = typeof row.id === "string" ? row.id : "";
    const state = typeof row.state === "string" ? row.state : "";
    const cycle = Number(row.cycle) || 1;
    if (!id || !state) continue;
    const result = await runStep(store, {
      runId: id,
      idempotencyKey: `${id}:${cycle}:${state}`,
      runnerId: KNOWLEDGE_CRON_RUNNER,
      act: (run) => actForRun(run),
    });
    if (result.ok && !result.replay) changed += 1;
  }
  return changed;
}
