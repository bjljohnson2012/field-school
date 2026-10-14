import { transition, type LoopState } from "../gap-loop/machine.ts";
import { advance, attachOrg, openSignup, SIGNUP_LESSON_BUDGET_MS, type FlowAction, type FlowSnapshot } from "../onboarding/graph.ts";
import { openPlan, reshapePlan, type RequirementSeed } from "./plan.ts";

const TICK_MS = 15_000;

const SEEDS: RequirementSeed[] = [
  { id: "req-skill", label: "Explain the idea", kind: "skill", sortOrder: 1 },
  { id: "req-knowledge", label: "Name the parts", kind: "knowledge", sortOrder: 0 },
  { id: "req-demo", label: "Show the work", kind: "demonstration", sortOrder: 2 },
];

/**
 * Flag-on walk from signup to the first loop CTA and a versioned plan.
 * Fixture time stays inside the 10 minute onboarding budget.
 */
export function scriptedIndividualToFirstCta(start = 0) {
  let t = start;
  const tick = () => {
    t += TICK_MS;
    return new Date(t).toISOString();
  };
  let flow = openSignup("individual-learner");
  const run = (action: FlowAction) => {
    const result = advance(flow, action, tick(), { individualEnabled: true });
    if (!result.ok) throw new Error(result.error);
    flow = result.flow;
  };
  run({ type: "brain-name", brainName: "My brain" });
  const org = attachOrg(flow, "org-individual");
  if (!org.ok) throw new Error(org.error);
  flow = org.flow;
  run({ type: "room", room: "individual" });
  run({ type: "org-name", orgName: "My learning" });
  run({ type: "adult-gates", gates: { "G-personality": true, "G-skills": true, "G-other": true } });
  run({ type: "first-goal", aim: "Learn the next skill and show it" });

  let state: LoopState = "draft";
  const events = ["start", "confirm", "scored", "asked"] as const;
  const timeline: { state: LoopState; summary: string }[] = [];
  for (const event of events) {
    tick();
    const moved = transition(state, event, {
      stepsThisRun: 0,
      stepsToday: 0,
      noProgressCycles: 0,
      scoreDelta: 0,
      allMet: false,
    });
    if (!moved.ok) throw new Error(moved.error);
    state = moved.state;
    timeline.push({ state, summary: moved.summary });
  }

  const plan = openPlan("plan-1", flow.outcomeId || "outcome-1", SEEDS);
  const reshaped = reshapePlan(plan, [
    SEEDS[1],
    { id: "req-skill", label: "Explain the idea", kind: "skill", sortOrder: 0 },
    { id: "req-new", label: "Practice once", kind: "demonstration", sortOrder: 2 },
  ]);

  return {
    elapsedMs: t - start,
    widthPx: 375,
    budgetMs: SIGNUP_LESSON_BUDGET_MS,
    flow,
    state,
    timeline,
    plan,
    reshaped,
  };
}

export function individualFlowRoom(flow: FlowSnapshot) {
  return flow.room;
}
