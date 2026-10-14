import { readIndividualPlan, type IndividualBurnEvent, type IndividualPlanConfig } from "./config.ts";

export const PLAN_ITEM_KINDS = ["knowledge", "skill", "demonstration"] as const;
export type PlanItemKind = (typeof PLAN_ITEM_KINDS)[number];
export const PLAN_STATUSES = ["draft", "active", "archived"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export type PlanItem = {
  requirementId: string;
  label: string;
  kind: PlanItemKind;
  position: number;
};

export type LearningPlan = {
  id: string;
  outcomeId: string;
  version: number;
  status: PlanStatus;
  items: PlanItem[];
};

export type PlanChange = { type: "added" | "removed" | "moved"; label: string };

export type RequirementSeed = {
  id: string;
  label: string;
  kind: string;
  sortOrder: number;
};

const CREDIT_CAP_SUMMARY = "Paused until credits are available.";

export function asPlanItemKind(value: string): PlanItemKind {
  return value === "skill" || value === "demonstration" ? value : "knowledge";
}

export function itemsFromRequirements(requirements: readonly RequirementSeed[]): PlanItem[] {
  return [...requirements]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((row, position) => ({
      requirementId: row.id,
      label: row.label,
      kind: asPlanItemKind(row.kind),
      position,
    }));
}

export function openPlan(id: string, outcomeId: string, requirements: readonly RequirementSeed[]): LearningPlan {
  return {
    id,
    outcomeId,
    version: 1,
    status: "active",
    items: itemsFromRequirements(requirements),
  };
}

export function diffItems(before: readonly PlanItem[], after: readonly PlanItem[]): PlanChange[] {
  const changes: PlanChange[] = [];
  const previous = new Map(before.map((item) => [item.requirementId, item]));
  const next = new Map(after.map((item) => [item.requirementId, item]));
  for (const item of after) {
    const prior = previous.get(item.requirementId);
    if (!prior) changes.push({ type: "added", label: item.label });
    else if (prior.position !== item.position) changes.push({ type: "moved", label: item.label });
  }
  for (const item of before) {
    if (!next.has(item.requirementId)) changes.push({ type: "removed", label: item.label });
  }
  return changes;
}

export function reshapePlan(plan: LearningPlan, requirements: readonly RequirementSeed[]) {
  const items = itemsFromRequirements(requirements);
  return {
    plan: { ...plan, version: plan.version + 1, items },
    changes: diffItems(plan.items, items),
  };
}

export function withinCount(count: number, cap: number) {
  return Number.isInteger(count) && count >= 0 && count < cap;
}

/** `files` is the count after this upload. `bytes` is this file. */
export function uploadAllowed(input: { files: number; bytes: number; config?: IndividualPlanConfig }) {
  const config = input.config ?? readIndividualPlan();
  const maxBytes = config.caps.uploadMbEach * 1024 * 1024;
  if (!Number.isInteger(input.files) || input.files < 1 || input.files > config.caps.uploadFiles) {
    return { ok: false as const, error: "upload_files" as const };
  }
  if (!Number.isFinite(input.bytes) || input.bytes < 0 || input.bytes > maxBytes) {
    return { ok: false as const, error: "upload_bytes" as const };
  }
  return { ok: true as const };
}

export function adultMaySelfRate(input: { actorKind: string; ownerKind: string; samePerson: boolean }) {
  return input.actorKind !== "child" && input.ownerKind === "person" && input.samePerson;
}

export function copyWithConsent<T>(input: { consent: boolean; items: readonly T[] }) {
  if (input.consent !== true) return { ok: false as const, error: "consent_required" as const };
  return { ok: true as const, mode: "copy" as const, items: input.items.map((item) => ({ ...item })) };
}

export type MeterInput = {
  balance: number;
  mode: "platform" | "byok";
  event: IndividualBurnEvent;
  config?: IndividualPlanConfig;
};

export function applyBurn(input: MeterInput) {
  const config = input.config ?? readIndividualPlan();
  const usageUnits = config.burns[input.event];
  const addedDollars = config.addedDollars;
  if (input.mode === "byok" && config.byokSkipsPerUseBurns) {
    return {
      usageEvent: input.event,
      usageUnits,
      ledgerUnits: 0,
      balance: input.balance,
      capped: false,
      addedDollars,
      baseApplies: config.baseAppliesWhenByok,
      summary: "Recorded. Your key covers this step.",
      timeline: null,
    };
  }
  if (input.balance < usageUnits) {
    return {
      usageEvent: input.event,
      usageUnits: 0,
      ledgerUnits: 0,
      balance: input.balance,
      capped: true,
      addedDollars,
      baseApplies: config.baseAppliesWhenByok,
      summary: CREDIT_CAP_SUMMARY,
      timeline: { kind: "cap", summary: CREDIT_CAP_SUMMARY, toState: "capped" },
    };
  }
  return {
    usageEvent: input.event,
    usageUnits,
    ledgerUnits: usageUnits,
    balance: input.balance - usageUnits,
    capped: false,
    addedDollars,
    baseApplies: config.baseAppliesWhenByok,
    summary: "Step recorded.",
    timeline: null,
  };
}

export function monthlyGrant(config = readIndividualPlan()) {
  return {
    event: "monthly_grant" as const,
    units: config.monthlyGrantUnits,
    addedDollars: config.addedDollars,
  };
}

export function creditCapSummary() {
  return CREDIT_CAP_SUMMARY;
}
