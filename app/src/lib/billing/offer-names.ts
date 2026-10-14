export const coachingMailto = "mailto:ben@fieldschool.ai?subject=Coaching";

export const consultingMailto = "mailto:ben@fieldschool.ai?subject=Consulting";

export const freeCourseHref = "/signup?plan=course";

export const coachingTiers = [
  {
    key: "assess" as const,
    name: "Assess",
    priceLabel: "$300",
    cadence: "a month",
    line: "One 60-minute session a month. You leave with a written recap and a next-step plan in the portal.",
  },
  {
    key: "model" as const,
    name: "Model",
    priceLabel: "$600",
    cadence: "a month",
    line: "Two sessions a month. You get a recap, updates to the model, and answers to email questions within 2 business days.",
  },
  {
    key: "build" as const,
    name: "Build",
    priceLabel: "$1,500",
    cadence: "a month",
    line: "Four working sessions a month. Ben builds the model with you, replies to priority email within 1 business day, and you sit a quarterly review.",
  },
];

import { individualPlanEnabled } from "../individual/enabled.ts";

export const offerDisplayNames = {
  diy: "Do It Yourself",
  coaching: "Coaching",
  assess: "Assess",
  model: "Model",
  build: "Build",
  consulting: "Consulting",
} as const;

/** M8 plan-name config. Public offer keys stay in offerDisplayNames. */
export const m8PlanNames = {
  ...offerDisplayNames,
  individual: "Individual",
} as const;

export function individualPlanName() {
  return m8PlanNames.individual;
}

type FlagEnv = Record<string, string | undefined>;

/** Null while the visibility flag is off. No public price in either state. */
export function individualOffer(env?: FlagEnv): string | null {
  if (!individualPlanEnabled(env)) return null;
  return individualPlanName();
}

const retiredCartPlanIds = ["10", "50", "1059", "100", "200", "1000"] as const;

export function isRetiredCartPlan(plan: string | null | undefined): boolean {
  return Boolean(plan && (retiredCartPlanIds as readonly string[]).includes(plan));
}

export function pricingVisibleText() {
  const hidden = individualOffer();
  const lines = [
    "Coaching",
    "$300, $600, or $1,500 a month. Every plan includes the portal, the Saturday email, and your knowledge brain.",
    "One course is free. No card.",
    "Start free",
    "A leader buys the same seat. The work is the team's standard, not a different price.",
    "In person in Dayton is available when you are both there.",
    "Short on time? One Saturday email a week still keeps your people moving.",
    "Not ready? Start with one free course or the free assessment.",
    "Email Ben",
    ...coachingTiers.flatMap((tier) => [tier.name, tier.priceLabel, tier.cadence, tier.line]),
  ];
  if (hidden) lines.push(String(hidden));
  return lines.join("\n");
}
