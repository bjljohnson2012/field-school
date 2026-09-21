import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isHirePathChildId,
  selectSupervisedIntent,
  type HirePathChildId,
  type SupervisedIntentFields,
} from "./supervised-intent.ts";

export const SUPERVISED_PATH_FR = ["FR-4", "FR-3", "FR-2"] as const;

export type SupervisedPathItem = {
  sortOrder: number;
  title: string;
  subject: string;
  kind: "station";
  reason: string;
  source: "intent" | "catalog";
  play: string;
};

export type SupervisedPathChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  intent: SupervisedIntentFields;
  items: SupervisedPathItem[];
};

export type SupervisedPath = {
  ok: true;
  fr: typeof SUPERVISED_PATH_FR;
  distribute: false;
  launch: "CLOSED 0/8";
  selected_child_id: string;
  children: SupervisedPathChild[];
};

const HIRE_CATALOG = [
  {
    needle: "lesson",
    title: "LessonSpine Ready / HLS",
    subject: "LessonSpine",
    play: "/play/lesson-spine",
  },
  {
    needle: "learnwithben",
    title: "Learn with Ben hire",
    subject: "Learn with Ben",
    play: "/metering",
  },
];

function destPath() {
  if (process.env.SUPERVISED_PATH_PATH?.trim()) {
    return process.env.SUPERVISED_PATH_PATH.trim();
  }
  if (process.env.NODE_ENV === "production") {
    return "/app/data/supervised-path.json";
  }
  return join(process.cwd(), "public/lessons/hls/supervised-path.json");
}

const PUBLIC_SEED = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../public/lessons/hls/supervised-path.json",
);

export function emptySupervisedPath(): SupervisedPath {
  return {
    ok: true,
    fr: SUPERVISED_PATH_FR,
    distribute: false,
    launch: "CLOSED 0/8",
    selected_child_id: "play-child",
    children: [],
  };
}

function norm(value: string) {
  return value.toLowerCase().trim();
}

function snapshotIntent(fields: SupervisedIntentFields): SupervisedIntentFields {
  return {
    goals: [...fields.goals],
    subjects: [...fields.subjects],
    themes: [...fields.themes],
    timeHorizon: fields.timeHorizon,
    constraints: [...fields.constraints],
  };
}

function matchCatalog(needle: string) {
  const key = norm(needle).replace(/[\s-]/g, "");
  if (!key) return null;
  return (
    HIRE_CATALOG.find((row) => {
      const hay = row.needle.replace(/[\s-]/g, "");
      return key.includes(hay) || hay.includes(key);
    }) || null
  );
}

export function assembleHirePathItems(intent: SupervisedIntentFields): SupervisedPathItem[] {
  const items: SupervisedPathItem[] = [];
  const seen = new Set<string>();

  const add = (draft: Omit<SupervisedPathItem, "sortOrder">) => {
    const key = norm(draft.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    items.push({ ...draft, sortOrder: items.length + 1 });
    return true;
  };

  const bind = (needle: string, subject: string, reason: string) => {
    const lesson = matchCatalog(needle);
    if (!lesson) return false;
    return add({
      title: lesson.title,
      subject: subject || lesson.subject,
      kind: "station",
      reason,
      source: "catalog",
      play: lesson.play,
    });
  };

  for (const subject of intent.subjects) {
    if (!bind(subject, subject, `Hire-path station bound from parent intent subject ${subject}`)) {
      add({
        title: subject,
        subject,
        kind: "station",
        reason: "From parent intent subject",
        source: "intent",
        play: "/intent",
      });
    }
  }

  for (const goal of intent.goals) {
    if (!bind(goal, intent.subjects[0] || "", `Hire-path station bound from parent intent goal ${goal}`)) {
      add({
        title: goal,
        subject: intent.subjects[0] || "",
        kind: "station",
        reason: "From parent intent goal",
        source: "intent",
        play: "/play/lesson-spine",
      });
    }
  }

  for (const theme of intent.themes) {
    if (!bind(theme, intent.subjects[0] || theme, `Hire-path station bound from parent intent theme ${theme}`)) {
      add({
        title: intent.subjects[0] ? `${theme} through ${intent.subjects[0]}` : theme,
        subject: intent.subjects[0] || theme,
        kind: "station",
        reason: "From parent intent theme",
        source: "intent",
        play: "/progress",
      });
    }
  }

  if (!items.length) {
    add({
      title: intent.timeHorizon || intent.constraints[0] || "Parent path",
      subject: intent.subjects[0] || "",
      kind: "station",
      reason: "From parent intent",
      source: "intent",
      play: "/intent",
    });
  }

  return items;
}

function parseItems(value: unknown): SupervisedPathItem[] {
  if (!Array.isArray(value)) return [];
  const items: SupervisedPathItem[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim().slice(0, 400) : "";
    const key = norm(title);
    if (!title || seen.has(key)) continue;
    seen.add(key);
    items.push({
      sortOrder: items.length + 1,
      title,
      subject: typeof row.subject === "string" ? row.subject.trim().slice(0, 200) : "",
      kind: "station",
      reason: typeof row.reason === "string" ? row.reason.trim().slice(0, 400) : "From parent intent",
      source: row.source === "catalog" ? "catalog" : "intent",
      play: typeof row.play === "string" && row.play.startsWith("/") ? row.play.slice(0, 80) : "/play/lesson-spine",
    });
  }
  return items;
}

function parsePath(raw: string): SupervisedPath | null {
  try {
    const body = JSON.parse(raw) as SupervisedPath;
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
      ...emptySupervisedPath(),
      ...body,
      distribute: false,
      launch: "CLOSED 0/8",
      selected_child_id: selected,
      children: children.map((child) => ({
        id: child.id,
        name: child.name,
        kind: "child",
        login: "none",
        user: false,
        intent: snapshotIntent({
          goals: Array.isArray(child.intent?.goals) ? child.intent.goals : [],
          subjects: Array.isArray(child.intent?.subjects) ? child.intent.subjects : [],
          themes: Array.isArray(child.intent?.themes) ? child.intent.themes : [],
          timeHorizon: child.intent?.timeHorizon || "",
          constraints: Array.isArray(child.intent?.constraints) ? child.intent.constraints : [],
        }),
        items: parseItems(child.items),
      })),
    };
  } catch {
    return null;
  }
}

export function readSupervisedPath(): SupervisedPath {
  for (const dest of [
    destPath(),
    PUBLIC_SEED,
    join(process.cwd(), "public/lessons/hls/supervised-path.json"),
  ]) {
    if (!existsSync(dest)) continue;
    const parsed = parsePath(readFileSync(dest, "utf8"));
    if (parsed) return parsed;
  }
  return emptySupervisedPath();
}

export function selectSupervisedPath(childId?: string | null) {
  const evidence = readSupervisedPath();
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

function writeEvidence(evidence: SupervisedPath) {
  const dest = destPath();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(evidence, null, 2)}\n`);
}

export function assembleSupervisedPath(childId: string | null | undefined) {
  const id = String(childId || "").trim();
  if (!isHirePathChildId(id)) {
    return { ok: false as const, error: "unknown_child" };
  }
  const intent = selectSupervisedIntent(id);
  if (!intent.selected) {
    return { ok: false as const, error: "unknown_child" };
  }
  const current = readSupervisedPath();
  const existing = current.children.find((child) => child.id === id);
  const nextChild: SupervisedPathChild = {
    id,
    name: existing?.name || intent.selected.name,
    kind: "child",
    login: "none",
    user: false,
    intent: snapshotIntent(intent.selected),
    items: assembleHirePathItems(intent.selected),
  };
  const children = existing
    ? current.children.map((child) => (child.id === id ? nextChild : child))
    : [...current.children, nextChild];
  const next: SupervisedPath = {
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
