/**
 * GL3 provisional config. CDM sealed these numbers on 2026-10-14, delegated by Ben.
 * Loop and billing read this module at runtime. They do not embed the numbers.
 */

import { INDIVIDUAL_PLAN_FLAG, individualPlanEnabled } from "./enabled.ts";

export { individualPlanEnabled };

export const INDIVIDUAL_PLAN_CONFIG = {
  flagName: INDIVIDUAL_PLAN_FLAG,
  branchLabel: "Learning for myself",
  monthlyGrantUnits: 200,
  burns: {
    loop_step: 1,
    loop_research: 5,
    plan_rebuild: 10,
  },
  caps: {
    activeOutcomes: 3,
    researchTasksPerMonth: 40,
    uploadFiles: 10,
    uploadMbEach: 10,
  },
  byokSkipsPerUseBurns: true,
  /** BYOK does not add a dollar meter. The hidden base still applies. */
  baseAppliesWhenByok: true,
  addedDollars: 0,
} as const;

export type IndividualBurnEvent = keyof typeof INDIVIDUAL_PLAN_CONFIG.burns;

export type IndividualPlanConfig = {
  flagName: string;
  enabled: boolean;
  branchLabel: string;
  monthlyGrantUnits: number;
  burns: { loop_step: number; loop_research: number; plan_rebuild: number };
  caps: {
    activeOutcomes: number;
    researchTasksPerMonth: number;
    uploadFiles: number;
    uploadMbEach: number;
  };
  byokSkipsPerUseBurns: boolean;
  baseAppliesWhenByok: boolean;
  addedDollars: 0;
};

type Env = Record<string, string | undefined>;

function units(raw: string | undefined, fallback: number) {
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > 1_000_000_000) return fallback;
  return value;
}

/** Public default is off. Production deploy templates default the same flag to false. */
export function readIndividualPlan(env: Env = process.env): IndividualPlanConfig {
  const defaults = INDIVIDUAL_PLAN_CONFIG;
  return {
    flagName: defaults.flagName,
    enabled: individualPlanEnabled(env),
    branchLabel: defaults.branchLabel,
    monthlyGrantUnits: units(env.INDIVIDUAL_MONTHLY_GRANT, defaults.monthlyGrantUnits),
    burns: {
      loop_step: units(env.INDIVIDUAL_BURN_LOOP_STEP, defaults.burns.loop_step),
      loop_research: units(env.INDIVIDUAL_BURN_LOOP_RESEARCH, defaults.burns.loop_research),
      plan_rebuild: units(env.INDIVIDUAL_BURN_PLAN_REBUILD, defaults.burns.plan_rebuild),
    },
    caps: {
      activeOutcomes: units(env.INDIVIDUAL_CAP_ACTIVE_OUTCOMES, defaults.caps.activeOutcomes),
      researchTasksPerMonth: units(env.INDIVIDUAL_CAP_RESEARCH_TASKS, defaults.caps.researchTasksPerMonth),
      uploadFiles: units(env.INDIVIDUAL_CAP_UPLOAD_FILES, defaults.caps.uploadFiles),
      uploadMbEach: units(env.INDIVIDUAL_CAP_UPLOAD_MB, defaults.caps.uploadMbEach),
    },
    byokSkipsPerUseBurns: defaults.byokSkipsPerUseBurns,
    baseAppliesWhenByok: defaults.baseAppliesWhenByok,
    addedDollars: 0,
  };
}

export function burnUnits(event: IndividualBurnEvent, env: Env = process.env) {
  return readIndividualPlan(env).burns[event];
}

export function burnEventForState(state: string): IndividualBurnEvent {
  if (state === "researching") return "loop_research";
  if (state === "rescore") return "plan_rebuild";
  return "loop_step";
}
