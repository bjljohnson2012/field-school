import {
  LOOP_LIMITS,
  clientShouldStep,
  isTerminal,
  transition,
  type LoopEventName,
  type LoopState,
  type TransitionCtx,
} from "./machine.ts";

export type RunSnap = {
  id: string;
  state: LoopState;
  cycle: number;
  stepCount: number;
  noProgressCycles: number;
  lastScore: number;
  ownerMembershipId: string;
  nextSeq: number;
};

export type StoredEvent = {
  idempotencyKey: string;
  seq: number;
  fromState: string;
  toState: string;
  kind: string;
  summary: string;
  detail: unknown;
};

export type StepCommit = {
  runId: string;
  seq: number;
  idempotencyKey: string;
  fromState: LoopState;
  toState: LoopState;
  kind: string;
  summary: string;
  detail: unknown;
  stepCount: number;
  noProgressCycles: number;
  lastScore: number;
  stopReason: string | null;
  cycle: number;
};

export type StepStore = {
  claim(runId: string, runnerId: string): Promise<boolean>;
  release(runId: string, runnerId: string): Promise<void>;
  load(runId: string): Promise<RunSnap | null>;
  stepsToday(ownerMembershipId: string): Promise<number>;
  findEvent(key: string): Promise<StoredEvent | null>;
  commit(input: StepCommit): Promise<{ inserted: boolean; event: StoredEvent }>;
};

export type StepAction = {
  event: LoopEventName;
  ctx?: Partial<TransitionCtx>;
  detail?: unknown;
  lastScore?: number;
};

const KEY = /^[^:\s]+:\d+:[a-z_]+$/;

export function idempotencyKeyOk(key: string, run: { id: string; cycle: number; state: string }) {
  if (!KEY.test(key)) return false;
  const [runId, cycle, state] = key.split(":");
  return runId === run.id && Number(cycle) === run.cycle && state === run.state;
}

export async function runStep(
  store: StepStore,
  opts: {
    runId: string;
    idempotencyKey: string;
    runnerId: string;
    act: (run: RunSnap) => Promise<StepAction>;
  },
): Promise<
  | { ok: true; replay: boolean; state: string; summary: string; hold: boolean; event: StoredEvent }
  | { ok: false; error: string; status: number }
> {
  const held = await store.claim(opts.runId, opts.runnerId);
  if (!held) return { ok: false, error: "lease_held", status: 409 };
  try {
    const existing = await store.findEvent(opts.idempotencyKey);
    if (existing) {
      return {
        ok: true,
        replay: true,
        state: existing.toState,
        summary: existing.summary,
        hold: !clientShouldStep(existing.toState as LoopState) || isTerminal(existing.toState as LoopState),
        event: existing,
      };
    }
    const run = await store.load(opts.runId);
    if (!run) return { ok: false, error: "unknown_run", status: 404 };
    if (!idempotencyKeyOk(opts.idempotencyKey, run)) {
      return { ok: false, error: "idempotency_key_invalid", status: 400 };
    }
    if (!clientShouldStep(run.state) && run.state !== "waiting_on_user") {
      return { ok: false, error: "not_a_system_step", status: 409 };
    }
    const stepsToday = await store.stepsToday(run.ownerMembershipId);
    const base: TransitionCtx = {
      stepsThisRun: run.stepCount,
      stepsToday,
      noProgressCycles: run.noProgressCycles,
      scoreDelta: 0,
      allMet: false,
    };
    const atCap = run.stepCount >= LOOP_LIMITS.stepsPerRun || stepsToday >= LOOP_LIMITS.stepsPerOwnerPerDay;
    const action = atCap ? { event: "scored" as const, ctx: {}, detail: { capped: true } } : await opts.act(run);
    const moved = transition(run.state, action.event, {
      ...base,
      ...action.ctx,
      stepsThisRun: atCap ? Math.max(run.stepCount, LOOP_LIMITS.stepsPerRun) : run.stepCount,
      stepsToday: atCap ? Math.max(stepsToday, LOOP_LIMITS.stepsPerOwnerPerDay) : stepsToday,
    });
    if (!moved.ok) return { ok: false, error: moved.error, status: 409 };
    const committed = await store.commit({
      runId: run.id,
      seq: run.nextSeq,
      idempotencyKey: opts.idempotencyKey,
      fromState: run.state,
      toState: moved.state,
      kind: atCap ? "cap" : action.event,
      summary: moved.summary,
      detail: action.detail ?? {},
      stepCount: moved.counted ? run.stepCount + 1 : run.stepCount,
      noProgressCycles: moved.noProgressCycles,
      lastScore: action.lastScore ?? run.lastScore,
      stopReason: moved.stopReason,
      cycle: moved.state === "analyze" && run.state === "rescore" ? run.cycle + 1 : run.cycle,
    });
    return {
      ok: true,
      replay: !committed.inserted,
      state: moved.state,
      summary: moved.summary,
      hold: !clientShouldStep(moved.state),
      event: committed.event,
    };
  } finally {
    await store.release(opts.runId, opts.runnerId);
  }
}
