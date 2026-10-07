export const LOOP_LIMITS = {
  stepsPerRun: 12,
  stepsPerOwnerPerDay: 40,
  stallCycles: 3,
  minGainPoints: 2,
  gapBelow: 60,
  metAt: 80,
  freshnessDays: 180,
  requirementsMin: 3,
  requirementsMax: 12,
} as const;

export const LOOP_STATES = [
  "draft",
  "decompose",
  "analyze",
  "formulate",
  "waiting_on_user",
  "integrate",
  "rescore",
  "paused",
  "done",
  "capped",
  "stalled",
  "cancelled",
] as const;

export type LoopState = (typeof LOOP_STATES)[number];

export const LOOP_EVENTS = [
  "start",
  "confirm",
  "revise",
  "scored",
  "asked",
  "respond",
  "decline",
  "integrated",
  "rescored",
  "pause",
  "resume",
  "cancel",
] as const;

export type LoopEventName = (typeof LOOP_EVENTS)[number];

export type TransitionCtx = {
  stepsThisRun: number;
  stepsToday: number;
  noProgressCycles: number;
  scoreDelta: number;
  allMet: boolean;
};

export type Transition =
  | {
      ok: true;
      state: LoopState;
      stopReason: string | null;
      summary: string;
      noProgressCycles: number;
      counted: boolean;
    }
  | { ok: false; error: "illegal_transition" };

const TERMINAL = new Set<LoopState>(["done", "capped", "stalled", "cancelled"]);

const SYSTEM = new Set<LoopEventName>(["start", "scored", "asked", "respond", "decline", "integrated", "rescored"]);

export function isTerminal(state: LoopState) {
  return TERMINAL.has(state);
}

/** States the client may advance by itself. Confirm, pause, and a user request wait. */
export function clientShouldStep(state: LoopState) {
  return state === "draft" || state === "analyze" || state === "formulate" || state === "integrate" || state === "rescore";
}

function capped(ctx: TransitionCtx): Transition {
  return {
    ok: true,
    state: "capped",
    stopReason: "step_cap",
    summary: "Paused at your limit.",
    noProgressCycles: ctx.noProgressCycles,
    counted: false,
  };
}

function ok(
  state: LoopState,
  summary: string,
  ctx: TransitionCtx,
  extra?: { stopReason?: string | null; counted?: boolean; noProgressCycles?: number },
): Transition {
  return {
    ok: true,
    state,
    stopReason: extra?.stopReason ?? null,
    summary,
    noProgressCycles: extra?.noProgressCycles ?? ctx.noProgressCycles,
    counted: extra?.counted ?? false,
  };
}

export function transition(state: LoopState, event: LoopEventName, ctx: TransitionCtx): Transition {
  if (TERMINAL.has(state)) return { ok: false, error: "illegal_transition" };

  if (event === "pause") {
    return ok("paused", "Paused. Nothing runs until you resume.", ctx);
  }
  if (event === "cancel") {
    return ok("cancelled", "Archived. Saved material stays.", ctx, { stopReason: "cancelled" });
  }
  if (event === "resume") {
    if (state !== "paused") return { ok: false, error: "illegal_transition" };
    return ok("analyze", "Resumed. Scoring again.", ctx);
  }

  if (SYSTEM.has(event) && (ctx.stepsThisRun >= LOOP_LIMITS.stepsPerRun || ctx.stepsToday >= LOOP_LIMITS.stepsPerOwnerPerDay)) {
    return capped(ctx);
  }

  if (state === "draft" && event === "start") {
    return ok("decompose", "Proposed the requirements. Confirm them to score.", ctx, { counted: true });
  }
  if (state === "decompose" && event === "confirm") {
    return ok("analyze", "Requirements confirmed. Scoring what is already on hand.", ctx);
  }
  if (state === "decompose" && event === "revise") {
    return ok("decompose", "Requirements updated. Confirm them when they look right.", ctx);
  }
  if (state === "analyze" && event === "scored") {
    if (ctx.allMet) {
      return ok("done", "This goal is met.", ctx, { stopReason: "done", counted: true });
    }
    return ok("formulate", "Scored the requirements. Writing one request.", ctx, { counted: true });
  }
  if (state === "formulate" && event === "asked") {
    return ok("waiting_on_user", "One request is ready.", ctx, { counted: true });
  }
  if (state === "waiting_on_user" && event === "respond") {
    return ok("integrate", "Adding what you sent.", ctx, { counted: true });
  }
  if (state === "waiting_on_user" && event === "decline") {
    return ok("rescore", "Request declined. Scoring again.", ctx, { counted: true });
  }
  if (state === "integrate" && event === "integrated") {
    return ok("rescore", "Material is in. Scoring again.", ctx, { counted: true });
  }
  if (state === "rescore" && event === "rescored") {
    const gained = ctx.scoreDelta >= LOOP_LIMITS.minGainPoints;
    const cycles = gained ? 0 : ctx.noProgressCycles + 1;
    if (ctx.allMet) {
      return ok("done", "This goal is met.", ctx, { stopReason: "done", counted: true, noProgressCycles: cycles });
    }
    if (!gained && cycles >= LOOP_LIMITS.stallCycles) {
      return ok("stalled", "Stuck. Change the goal, add material, or waive a requirement.", ctx, {
        stopReason: "stalled",
        counted: true,
        noProgressCycles: cycles,
      });
    }
    return ok("analyze", gained ? "Coverage moved. Scoring the next pass." : "Coverage barely moved. Scoring the next pass.", ctx, {
      counted: true,
      noProgressCycles: cycles,
    });
  }

  return { ok: false, error: "illegal_transition" };
}
