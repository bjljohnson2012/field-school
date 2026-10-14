/** Flag name is owned by INDIVIDUAL_PLAN_CONFIG. This module stays free of credit numbers. */
export const INDIVIDUAL_PLAN_FLAG = "INDIVIDUAL_PLAN_ENABLED";

type Env = Record<string, string | undefined>;

export function individualPlanEnabled(env: Env = process.env) {
  const raw = env[INDIVIDUAL_PLAN_FLAG];
  return raw === "1" || raw === "true" || raw === "on";
}
