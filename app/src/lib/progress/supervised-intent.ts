import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SUPERVISED_INTENT_FR = ["FR-3", "FR-2"] as const;
export const HIRE_PATH_CHILD_IDS = ["play-child"] as const;
const DRIFT_CHILD_NAMES = /^(play child|hire child)$/i;

function trackedChildName(name: unknown) {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value || DRIFT_CHILD_NAMES.test(value)) return "Child";
  return value.slice(0, 200);
}

export type HirePathChildId = (typeof HIRE_PATH_CHILD_IDS)[number];

export type SupervisedIntentFields = {
  goals: string[];
  subjects: string[];
  themes: string[];
  timeHorizon: string;
  constraints: string[];
};

export type SupervisedIntentChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
} & SupervisedIntentFields;

export type SupervisedIntent = {
  ok: true;
  fr: typeof SUPERVISED_INTENT_FR;
  distribute: false;
  launch: "CLOSED 0/8";
  selected_child_id: string;
  children: SupervisedIntentChild[];
};

function destPath() {
  if (process.env.SUPERVISED_INTENT_PATH?.trim()) {
    return process.env.SUPERVISED_INTENT_PATH.trim();
  }
  if (process.env.NODE_ENV === "production") {
    return "/app/data/supervised-intent.json";
  }
  return join(process.cwd(), "public/lessons/hls/supervised-intent.json");
}

const PUBLIC_SEED = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../public/lessons/hls/supervised-intent.json",
);

export function emptySupervisedIntent(): SupervisedIntent {
  return {
    ok: true,
    fr: SUPERVISED_INTENT_FR,
    distribute: false,
    launch: "CLOSED 0/8",
    selected_child_id: "play-child",
    children: [],
  };
}

function asStringList(value: unknown, max = 32) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,]/)
      : [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, max)
    .map((item) => item.slice(0, 400));
}

function asTimeHorizon(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

export function parseSupervisedIntentFields(
  body: Record<string, unknown>,
): SupervisedIntentFields {
  return {
    goals: asStringList(body.goals),
    subjects: asStringList(body.subjects),
    themes: asStringList(body.themes),
    timeHorizon: asTimeHorizon(body.timeHorizon ?? body.time_horizon),
    constraints: asStringList(body.constraints),
  };
}

export function mergeSupervisedIntentFields(
  base: SupervisedIntentFields,
  next: SupervisedIntentFields,
): SupervisedIntentFields {
  return {
    goals: next.goals.length ? next.goals : base.goals,
    subjects: next.subjects.length ? next.subjects : base.subjects,
    themes: next.themes.length ? next.themes : base.themes,
    timeHorizon: next.timeHorizon || base.timeHorizon,
    constraints: next.constraints.length ? next.constraints : base.constraints,
  };
}

export function isHirePathChildId(value: string | null | undefined): value is HirePathChildId {
  return Boolean(value && (HIRE_PATH_CHILD_IDS as readonly string[]).includes(value));
}

function parseIntent(raw: string): SupervisedIntent | null {
  try {
    const body = JSON.parse(raw) as SupervisedIntent;
    const children = Array.isArray(body.children)
      ? body.children.filter(
          (child) =>
            child &&
            isHirePathChildId(child.id) &&
            child.kind === "child" &&
            child.login === "none" &&
            child.user === false,
        )
      : [];
    const selected =
      children.find((child) => child.id === body.selected_child_id)?.id ||
      children[0]?.id ||
      "play-child";
    return {
      ...emptySupervisedIntent(),
      ...body,
      distribute: false,
      launch: "CLOSED 0/8",
      selected_child_id: selected,
      children: children.map((child) => ({
        id: child.id,
        name: trackedChildName(child.name),
        kind: "child",
        login: "none",
        user: false,
        goals: asStringList(child.goals),
        subjects: asStringList(child.subjects),
        themes: asStringList(child.themes),
        timeHorizon: asTimeHorizon(child.timeHorizon),
        constraints: asStringList(child.constraints),
      })),
    };
  } catch {
    return null;
  }
}

export function readSupervisedIntent(): SupervisedIntent {
  for (const dest of [
    destPath(),
    PUBLIC_SEED,
    join(process.cwd(), "public/lessons/hls/supervised-intent.json"),
  ]) {
    if (!existsSync(dest)) continue;
    const parsed = parseIntent(readFileSync(dest, "utf8"));
    if (parsed) return parsed;
  }
  return emptySupervisedIntent();
}

export function selectSupervisedIntent(childId?: string | null) {
  const evidence = readSupervisedIntent();
  const wanted = String(childId || "").trim();
  const selected =
    evidence.children.find((child) => child.id === wanted) ||
    evidence.children.find((child) => child.id === evidence.selected_child_id) ||
    evidence.children[0] ||
    null;
  return {
    ...evidence,
    selected_child_id: selected?.id || evidence.selected_child_id,
    selected,
  };
}

function writeEvidence(evidence: SupervisedIntent) {
  const dest = destPath();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(evidence, null, 2)}\n`);
}

export function writeSupervisedIntent(
  childId: string | null | undefined,
  fields: SupervisedIntentFields,
) {
  const id = String(childId || "").trim();
  if (!isHirePathChildId(id)) {
    return { ok: false as const, error: "unknown_child" };
  }
  const current = readSupervisedIntent();
  const existing = current.children.find((child) => child.id === id);
  if (!existing) {
    return { ok: false as const, error: "unknown_child" };
  }
  const nextChild: SupervisedIntentChild = {
    ...existing,
    kind: "child",
    login: "none",
    user: false,
    ...mergeSupervisedIntentFields(existing, fields),
  };
  const next: SupervisedIntent = {
    ...current,
    distribute: false,
    launch: "CLOSED 0/8",
    selected_child_id: id,
    children: current.children.map((child) => (child.id === id ? nextChild : child)),
  };
  writeEvidence(next);
  return {
    ok: true as const,
    selected_child_id: id,
    selected: nextChild,
    evidence: next,
  };
}
