import { individualOffer, individualPlanName } from "../billing/offer-names.ts";
import { CHECKOUT_GO_LIVE } from "../billing/checkout-destination.ts";
import { memberDoors, MEMBER_RAIL_DEFAULT } from "../shell/m9-shell.ts";
import { individualBranch } from "../onboarding/graph.ts";
import { readIndividualPlan, type IndividualPlanConfig } from "./config.ts";
import { openPlan, type LearningPlan, type PlanChange, type RequirementSeed } from "./plan.ts";

type Env = Record<string, string | undefined>;

const PRICE_TOKENS = ["$10", "$10/month", "10 a month"];

export function individualSurface(env: Env = process.env) {
  const config = readIndividualPlan(env);
  return {
    ...config,
    displayName: individualPlanName(),
    offer: individualOffer(env),
    public: false as const,
  };
}

export function roomLabelMap(env: Env = process.env) {
  const config = readIndividualPlan(env);
  if (!config.enabled) return {} as Record<string, string>;
  return { individual: config.branchLabel };
}

export function onboardingPublicPayload(env: Env = process.env) {
  const config = readIndividualPlan(env);
  return {
    rooms: individualBranch(config.enabled),
    roomLabels: roomLabelMap(env),
    rail: memberDoors(MEMBER_RAIL_DEFAULT).map((door) => door.label),
    railPx: 240,
  };
}

export function billingPublicPayload(env: Env = process.env) {
  const surface = individualSurface(env);
  return {
    offers: ["Do It Yourself", "Coaching", "Consulting"],
    checkoutGoLive: CHECKOUT_GO_LIVE,
    individual: surface.enabled ? { name: surface.displayName } : null,
  };
}

export function planPublicPayload(input: {
  env?: Env;
  requirements?: readonly RequirementSeed[];
  changes?: readonly PlanChange[];
}) {
  const surface = individualSurface(input.env);
  if (!surface.enabled) {
    return {
      available: false,
      title: "Not available",
      items: [] as { position: number; label: string; kind: string }[],
      changes: [] as string[],
      ariaLive: "",
      cta: "",
      widthPx: 375,
    };
  }
  const plan = input.requirements ? openPlan("plan", "outcome", input.requirements) : null;
  return planBuilderView({
    enabled: true,
    displayName: surface.displayName,
    plan,
    changes: input.changes ?? [],
  });
}

export function planBuilderView(input: {
  enabled: boolean;
  displayName: string;
  plan: LearningPlan | null;
  changes: readonly PlanChange[];
}) {
  if (!input.enabled) {
    return {
      available: false,
      title: "Not available",
      items: [] as { position: number; label: string; kind: string }[],
      changes: [] as string[],
      ariaLive: "",
      cta: "",
      widthPx: 375,
    };
  }
  const changes = input.changes.map((change) => `${change.type}: ${change.label}`);
  return {
    available: true,
    title: input.displayName,
    items: (input.plan?.items ?? []).map((item) => ({
      position: item.position,
      label: item.label,
      kind: item.kind,
    })),
    changes,
    ariaLive: changes.length ? `Plan updated. ${changes.join(" ")}` : "Plan ready.",
    cta: "Continue",
    widthPx: 375,
  };
}

export function leaksHiddenPlan(body: unknown, config: IndividualPlanConfig & { displayName: string }) {
  const json = typeof body === "string" ? body : JSON.stringify(body);
  if (config.displayName && json.includes(config.displayName)) return true;
  if (config.branchLabel && json.includes(config.branchLabel)) return true;
  return PRICE_TOKENS.some((token) => json.includes(token));
}

export function flagOffBodies(env: Env = { INDIVIDUAL_PLAN_ENABLED: "false" }) {
  const surface = individualSurface(env);
  return {
    surface,
    onboarding: onboardingPublicPayload(env),
    billing: billingPublicPayload(env),
    plan: planPublicPayload({ env }),
    nav: memberDoors(MEMBER_RAIL_DEFAULT).map((door) => door.label),
  };
}
