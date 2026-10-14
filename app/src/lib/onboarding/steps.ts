import type { OnboardingContext, OnboardingStep } from "@onboardjs/core";
import { STEP_IDS, nextStepId, stepApplies, type BranchContext } from "./graph.ts";

export type M12Context = OnboardingContext & {
  flowData: BranchContext & Record<string, unknown>;
};

function branchFrom(ctx: M12Context): BranchContext {
  const data = ctx.flowData ?? {};
  return {
    entry: data.entry === "invite" ? "invite" : "signup",
    room: data.room === "family" || data.room === "team" ? data.room : null,
    childAdded: data.childAdded === true,
    brainNamed: data.brainNamed === true,
  };
}

/** OnboardJS step list. Field School components render the canvas. */
export function m12EngineSteps(): OnboardingStep<M12Context>[] {
  return STEP_IDS.map((id) => ({
    id,
    type: "CUSTOM_COMPONENT" as const,
    payload: { componentKey: id },
    condition: (ctx: M12Context) => stepApplies(id, branchFrom(ctx)),
    nextStep: (ctx: M12Context) => nextStepId(id, branchFrom(ctx)),
  }));
}
