import { buildFamilySignals, type SignalIntent, type SignalPortion, type SignalUnit } from "./signals.ts";

export type FamilyOperatorIntent = SignalIntent & { version?: number; constraints?: string[] };

export type FamilyOperatorPath = {
  version?: number;
  status?: string;
  items?: Array<{ title: string; subject?: string }>;
} | null;

export type FamilyOperatorLedger = {
  completed?: SignalUnit[];
  inProgress?: SignalUnit[];
  recommended?: SignalUnit[];
  current?: { units?: SignalUnit[] };
} | null;

export function familyOperatorCopy(error: string | undefined, fallback: string) {
  if (error === "intent_required") return "Save a learning intent before proposing a path.";
  if (error === "path_required") return "Accept a curriculum path before suggesting a next portion.";
  if (error === "portion_required") return "Suggest a next portion before locking.";
  if (error === "intent_fields_required") return "Add a goal, subject, theme, horizon, or constraint.";
  if (error === "remaining_required") return "No remaining stations on the accepted path.";
  return error || fallback;
}

export function operatorLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function intentDraftFromCurrent(intent: FamilyOperatorIntent | null | undefined) {
  return {
    goals: (intent?.goals ?? []).join("\n"),
    subjects: (intent?.subjects ?? []).join("\n"),
    themes: (intent?.themes ?? []).join("\n"),
    timeHorizon: intent?.timeHorizon ?? "",
    constraints: (intent?.constraints ?? []).join("\n"),
  };
}

export function panelFromFamilyApis(input: {
  childName: string;
  intent?: FamilyOperatorIntent | null;
  path?: FamilyOperatorPath;
  assigned?: FamilyOperatorPath;
  portion?: SignalPortion;
  locked?: SignalPortion | boolean | null;
  ledger?: FamilyOperatorLedger;
}) {
  const assigned =
    input.assigned ?? (input.path?.status === "accepted" ? input.path : null);
  const pathItems = assigned?.items ?? input.path?.items ?? [];
  const lockedRow = typeof input.locked === "object" && input.locked ? input.locked : null;
  const portion = lockedRow ?? input.portion ?? null;
  const locked = Boolean(input.locked);
  const completed = input.ledger?.completed ?? [];
  const inProgress = input.ledger?.inProgress ?? [];
  const recommended = input.ledger?.recommended ?? [];
  const units = input.ledger?.current?.units ?? [...completed, ...inProgress, ...recommended];
  return {
    intent: input.intent ?? null,
    intentVersion: input.intent?.version ?? null,
    intentDraft: intentDraftFromCurrent(input.intent ?? null),
    pathItems,
    pathAccepted: Boolean(assigned),
    pathVersion: assigned?.version ?? input.path?.version ?? null,
    pathStatus: assigned ? "accepted" : input.path?.status || "",
    portion,
    portionLocked: locked,
    completed,
    inProgress,
    recommended,
    units,
    signals: buildFamilySignals({
      childName: input.childName,
      intent: input.intent ?? null,
      pathItems,
      completed,
      inProgress,
      recommended,
      units,
      portion,
      locked,
    }),
  };
}
