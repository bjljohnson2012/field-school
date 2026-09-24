import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HIRE_PATH_CHILD_IDS = ["play-child"] as const;
const DRIFT_CHILD_NAMES = /^(play child|hire child)$/i;
export type HirePathChildId = (typeof HIRE_PATH_CHILD_IDS)[number];
export const SUPERVISED_BRAIN_FR = ["FR-KB-1", "FR-KB-2"] as const;
export const BRAIN_STATUSES = ["suggested", "started", "updated"] as const;
export type BrainStatus = (typeof BRAIN_STATUSES)[number];
export const BRAIN_CONFIDENCE_STATES = ["not_yet", "getting_there", "ready"] as const;
export type BrainConfidenceState = (typeof BRAIN_CONFIDENCE_STATES)[number];
export const BRAIN_CONFIDENCE_LABELS: Record<BrainConfidenceState, string> = {
  not_yet: "Not yet",
  getting_there: "Getting there",
  ready: "Ready",
};

export type BrainConfidence = {
  state: BrainConfidenceState;
  label: string;
  owned: "parent" | "hire_path";
};

export type BrainIntentHint = {
  goals?: string[];
  subjects?: string[];
  themes?: string[];
  timeHorizon?: string;
  constraints?: string[];
  name?: string;
};

export type BrainPathItem = {
  title: string;
  play?: string;
};

export type BrainPortionHint = {
  horizon?: string;
  items?: BrainPathItem[];
};

export type BrainProgressHint = {
  now?: { title?: string; copy?: string };
  confidence?: { state?: string; label?: string };
  next?: { title?: string; copy?: string };
};

export type BrainNote = {
  title: string;
  body: string;
};

export type SupervisedBrainChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  title: string;
  status: BrainStatus;
  version: number;
  intent: {
    goals: string[];
    subjects: string[];
    themes: string[];
    timeHorizon: string;
    constraints: string[];
  };
  paths: { items: Array<{ title: string; play: string }> };
  portion: { horizon: string; items: Array<{ title: string; play: string }> };
  progress: {
    now: { title: string; copy: string };
    confidence: BrainConfidence;
    next: { title: string; copy: string };
  };
  sources: BrainNote[];
  notes: BrainNote[];
  summary: {
    sources: number;
    notes: number;
    intent_bound: true;
    path_bound: true;
    portion_bound: true;
  };
};

export type SupervisedBrain = {
  ok: true;
  fr: typeof SUPERVISED_BRAIN_FR;
  distribute: false;
  launch: "CLOSED 0/8";
  selected_child_id: string;
  children: SupervisedBrainChild[];
};

function isHirePathChildId(value: string | null | undefined): value is HirePathChildId {
  return Boolean(value && (HIRE_PATH_CHILD_IDS as readonly string[]).includes(value));
}

function destPath() {
  if (process.env.SUPERVISED_BRAIN_PATH?.trim()) {
    return process.env.SUPERVISED_BRAIN_PATH.trim();
  }
  if (process.env.NODE_ENV === "production") {
    return "/app/data/supervised-brain.json";
  }
  return join(process.cwd(), "public/lessons/hls/supervised-brain.json");
}

const PUBLIC_SEED = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../public/lessons/hls/supervised-brain.json",
);

export function emptySupervisedBrain(): SupervisedBrain {
  return {
    ok: true,
    fr: SUPERVISED_BRAIN_FR,
    distribute: false,
    launch: "CLOSED 0/8",
    selected_child_id: "play-child",
    children: [],
  };
}

function defaultName(_id: string, hint?: string) {
  const value = hint?.trim() || "";
  if (!value || DRIFT_CHILD_NAMES.test(value)) return "Child";
  return value.slice(0, 200);
}

function cleanPhrase(value: string) {
  return value.replace(/\bPlay Child\b/g, "Child").replace(/\bHire Child\b/g, "Child");
}

function asList(value: unknown, max = 16) {
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

function parseConfidence(value: unknown, owned: BrainConfidence["owned"] = "hire_path"): BrainConfidence | undefined {
  if (typeof value === "string") {
    const state = value.trim().toLowerCase().replace(/\s+/g, "_");
    if ((BRAIN_CONFIDENCE_STATES as readonly string[]).includes(state)) {
      const key = state as BrainConfidenceState;
      return { state: key, label: BRAIN_CONFIDENCE_LABELS[key], owned };
    }
    return undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const fromState = typeof raw.state === "string" ? raw.state.trim().toLowerCase().replace(/\s+/g, "_") : "";
  const fromLabel = typeof raw.label === "string" ? raw.label.trim().toLowerCase() : "";
  const mapped =
    (BRAIN_CONFIDENCE_STATES as readonly string[]).includes(fromState)
      ? (fromState as BrainConfidenceState)
      : fromLabel === "not yet"
        ? "not_yet"
        : fromLabel === "getting there"
          ? "getting_there"
          : fromLabel === "ready"
            ? "ready"
            : undefined;
  if (!mapped) return undefined;
  const ownedRaw = raw.owned === "parent" || raw.owned === "hire_path" ? raw.owned : owned;
  return { state: mapped, label: BRAIN_CONFIDENCE_LABELS[mapped], owned: ownedRaw };
}

function parseNotes(value: unknown, fallbackTitle = "Parent note"): BrainNote[] {
  if (!Array.isArray(value)) return [];
  const notes: BrainNote[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      const body = entry.trim().slice(0, 2000);
      if (!body) continue;
      notes.push({ title: fallbackTitle, body });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 200) : "";
    const body = typeof raw.body === "string" ? raw.body.trim().slice(0, 2000) : "";
    if (!title && !body) continue;
    notes.push({ title: title || fallbackTitle, body });
  }
  return notes.slice(0, 16);
}

function parsePathItems(value: unknown): Array<{ title: string; play: string }> {
  if (!Array.isArray(value)) return [];
  const items: Array<{ title: string; play: string }> = [];
  const seen = new Set<string>();
  for (const entry of value) {
    const raw =
      typeof entry === "string"
        ? { title: entry }
        : entry && typeof entry === "object"
          ? (entry as Record<string, unknown>)
          : null;
    if (!raw) continue;
    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 400) : "";
    const key = title.toLowerCase();
    if (!title || seen.has(key)) continue;
    seen.add(key);
    items.push({
      title,
      play:
        typeof raw.play === "string" && raw.play.startsWith("/")
          ? raw.play.slice(0, 80)
          : "/play/lesson-spine",
    });
  }
  return items.slice(0, 12);
}

function defaultProgress(_id: HirePathChildId): SupervisedBrainChild["progress"] {
  return {
    now: { title: "LessonSpine Ready / HLS", copy: "Child is on the locked LessonSpine rail. Parent owns the plan." },
    confidence: { state: "getting_there", label: "Getting there", owned: "hire_path" },
    next: { title: "QuizBumper next-up", copy: "Next is the next-up beat, then Parent review. No child login." },
  };
}

function suggestedChild(
  id: HirePathChildId,
  existing: SupervisedBrainChild | undefined,
  hint: {
    intent?: BrainIntentHint;
    pathItems?: BrainPathItem[];
    portion?: BrainPortionHint;
    progress?: BrainProgressHint;
    name?: string;
    title?: string;
    sources?: unknown;
    notes?: unknown;
    confidence?: unknown;
  },
): SupervisedBrainChild {
  const name = defaultName(id, hint.name || hint.intent?.name || existing?.name);
  const horizon =
    hint.portion?.horizon ||
    hint.intent?.timeHorizon ||
    existing?.portion.horizon ||
    "this hire";
  const pathItems = parsePathItems(hint.pathItems || existing?.paths.items);
  const portionItems = parsePathItems(hint.portion?.items || existing?.portion.items || pathItems);
  const progressHint = hint.progress;
  const fallback = existing?.progress || defaultProgress(id);
  const sources = hint.sources !== undefined ? parseNotes(hint.sources, "Parent source") : existing?.sources || [];
  const notes = hint.notes !== undefined ? parseNotes(hint.notes, "Parent note") : existing?.notes || [];
  const parentConfidence = parseConfidence(hint.confidence, "parent");
  const existingConfidence = parseConfidence(existing?.progress.confidence);
  const hireConfidence = parseConfidence(progressHint?.confidence, existingConfidence?.owned || "hire_path");
  const confidence =
    parentConfidence ||
    (existingConfidence?.owned === "parent" ? existingConfidence : undefined) ||
    hireConfidence ||
    fallback.confidence;
  return {
    id,
    name,
    kind: "child",
    login: "none",
    user: false,
    title: cleanPhrase((hint.title || existing?.title || `${name} knowledge brain`).trim()).slice(0, 200),
    status: existing?.status && existing.status !== "suggested" ? existing.status : "suggested",
    version: existing?.version || 0,
    intent: {
      goals: asList(hint.intent?.goals || existing?.intent.goals),
      subjects: asList(hint.intent?.subjects || existing?.intent.subjects),
      themes: asList(hint.intent?.themes || existing?.intent.themes),
      timeHorizon: String(hint.intent?.timeHorizon || existing?.intent.timeHorizon || horizon).slice(0, 80),
      constraints: asList(
        hint.intent?.constraints || existing?.intent.constraints || ["Child is not a User", "No child login"],
      ),
    },
    paths: { items: pathItems },
    portion: { horizon, items: portionItems },
    progress: {
      now: {
        title: cleanPhrase(progressHint?.now?.title || fallback.now.title),
        copy: cleanPhrase(progressHint?.now?.copy || fallback.now.copy),
      },
      confidence,
      next: {
        title: cleanPhrase(progressHint?.next?.title || fallback.next.title),
        copy: cleanPhrase(progressHint?.next?.copy || fallback.next.copy),
      },
    },
    sources,
    notes,
    summary: {
      sources: sources.length,
      notes: notes.length,
      intent_bound: true,
      path_bound: true,
      portion_bound: true,
    },
  };
}

function parseBrain(raw: string): SupervisedBrain | null {
  try {
    const body = JSON.parse(raw) as SupervisedBrain;
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
      ...emptySupervisedBrain(),
      ...body,
      fr: SUPERVISED_BRAIN_FR,
      distribute: false,
      launch: "CLOSED 0/8",
      selected_child_id: selected,
      children: children.map((child) =>
        suggestedChild(child.id as HirePathChildId, child, {
          intent: child.intent,
          pathItems: child.paths?.items,
          portion: child.portion,
          progress: child.progress,
          name: child.name,
          title: child.title,
          sources: child.sources,
          notes: child.notes,
        }),
      ),
    };
  } catch {
    return null;
  }
}

export function readSupervisedBrain(): SupervisedBrain {
  for (const dest of [
    destPath(),
    PUBLIC_SEED,
    join(process.cwd(), "public/lessons/hls/supervised-brain.json"),
  ]) {
    if (!existsSync(dest)) continue;
    const parsed = parseBrain(readFileSync(dest, "utf8"));
    if (parsed) return parsed;
  }
  return emptySupervisedBrain();
}

function writeEvidence(evidence: SupervisedBrain) {
  const dest = destPath();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(evidence, null, 2)}\n`);
}

export function selectSupervisedBrain(
  childId?: string | null,
  hint?: {
    intent?: BrainIntentHint;
    pathItems?: BrainPathItem[];
    portion?: BrainPortionHint;
    progress?: BrainProgressHint;
    name?: string;
  },
) {
  const evidence = readSupervisedBrain();
  const wanted = String(childId || "").trim();
  const stored =
    evidence.children.find((child) => child.id === wanted) ||
    evidence.children.find((child) => child.id === evidence.selected_child_id) ||
    evidence.children[0] ||
    null;
  const id = (isHirePathChildId(wanted) ? wanted : stored?.id) as HirePathChildId | undefined;
  let selected = stored;
  if (id) {
    selected = suggestedChild(id, stored || undefined, hint || {});
  }
  return {
    ...evidence,
    selected_child_id: selected?.id || evidence.selected_child_id,
    selected,
  };
}

export function writeSupervisedBrain(
  childId: string | null | undefined,
  action: string | null | undefined,
  opts?: {
    intent?: BrainIntentHint;
    pathItems?: BrainPathItem[];
    portion?: BrainPortionHint;
    progress?: BrainProgressHint;
    name?: string;
    title?: string;
    sources?: unknown;
    notes?: unknown;
    confidence?: unknown;
  },
) {
  const id = String(childId || "").trim();
  if (!isHirePathChildId(id)) {
    return { ok: false as const, error: "unknown_child" };
  }
  const op = String(action || "").trim().toLowerCase();
  if (op !== "start" && op !== "create" && op !== "update" && op !== "sync" && op !== "confidence") {
    return { ok: false as const, error: "action_required" };
  }
  const current = readSupervisedBrain();
  const existing = current.children.find((child) => child.id === id);
  const nextChild = suggestedChild(id, existing, opts || {});
  const alreadyHeld = Boolean(existing?.status && existing.status !== "suggested");
  nextChild.status =
    (op === "update" || op === "sync" || op === "confidence") && alreadyHeld ? "updated" : "started";
  nextChild.version = (existing?.version || 0) + 1;
  const children = existing
    ? current.children.map((child) => (child.id === id ? nextChild : child))
    : [...current.children, nextChild];
  const next: SupervisedBrain = {
    ...current,
    distribute: false,
    launch: "CLOSED 0/8",
    selected_child_id: id,
    children,
  };
  writeEvidence(next);
  return {
    ok: true as const,
    selected_child_id: id as HirePathChildId,
    selected: nextChild,
    evidence: next,
  };
}
