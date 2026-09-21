import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HIRE_PATH_CHILD_IDS = ["play-child", "hire-child"] as const;
export type HirePathChildId = (typeof HIRE_PATH_CHILD_IDS)[number];
export const SUPERVISED_PORTION_FR = ["FR-5"] as const;
export const PORTION_STATUSES = ["suggested", "locked", "overridden"] as const;
export type PortionStatus = (typeof PORTION_STATUSES)[number];

export type PortionPathItem = {
  sortOrder?: number;
  title: string;
  subject?: string;
  play?: string;
};

export type PortionIntentHint = {
  timeHorizon?: string;
  goals?: string[];
  subjects?: string[];
  name?: string;
};

export type SupervisedPortionItem = {
  sortOrder: number;
  title: string;
  subject: string;
  kind: "station";
  source: "path" | "override";
  play: string;
};

export type SupervisedPortionChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  horizon: string;
  status: PortionStatus;
  items: SupervisedPortionItem[];
};

export type SupervisedPortion = {
  ok: true;
  fr: typeof SUPERVISED_PORTION_FR;
  distribute: false;
  launch: "CLOSED 0/8";
  selected_child_id: string;
  children: SupervisedPortionChild[];
};

function isHirePathChildId(value: string | null | undefined): value is HirePathChildId {
  return Boolean(value && (HIRE_PATH_CHILD_IDS as readonly string[]).includes(value));
}

function destPath() {
  if (process.env.SUPERVISED_PORTION_PATH?.trim()) {
    return process.env.SUPERVISED_PORTION_PATH.trim();
  }
  if (process.env.NODE_ENV === "production") {
    return "/app/data/supervised-portion.json";
  }
  return join(process.cwd(), "public/lessons/hls/supervised-portion.json");
}

const PUBLIC_SEED = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../public/lessons/hls/supervised-portion.json",
);

export function emptySupervisedPortion(): SupervisedPortion {
  return {
    ok: true,
    fr: SUPERVISED_PORTION_FR,
    distribute: false,
    launch: "CLOSED 0/8",
    selected_child_id: "play-child",
    children: [],
  };
}

function norm(value: string) {
  return value.toLowerCase().trim();
}

function defaultName(id: string, hint?: string) {
  return hint || (id === "hire-child" ? "Hire Child" : "Play Child");
}

function asHorizon(value: string | undefined, childId: string) {
  const horizon = String(value || "").trim();
  if (horizon) return horizon.slice(0, 80);
  return childId === "hire-child" ? "next portion" : "this hire";
}

function sliceSize(horizon: string) {
  return norm(horizon) === "module" ? 4 : 3;
}

function parseItems(value: unknown, source: SupervisedPortionItem["source"]): SupervisedPortionItem[] {
  if (!Array.isArray(value)) return [];
  const items: SupervisedPortionItem[] = [];
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
    const key = norm(title);
    if (!title || seen.has(key)) continue;
    seen.add(key);
    items.push({
      sortOrder: items.length + 1,
      title,
      subject: typeof raw.subject === "string" ? raw.subject.trim().slice(0, 200) : "",
      kind: "station",
      source: raw.source === "override" ? "override" : source,
      play:
        typeof raw.play === "string" && raw.play.startsWith("/")
          ? raw.play.slice(0, 80)
          : "/play/lesson-spine",
    });
  }
  return items;
}

export function sliceHirePathPortion(
  pathItems: PortionPathItem[] | undefined,
  horizon: string,
): SupervisedPortionItem[] {
  const pool = parseItems(pathItems || [], "path");
  return pool.slice(0, sliceSize(horizon)).map((item, index) => ({
    ...item,
    sortOrder: index + 1,
    source: "path",
  }));
}

function parsePortion(raw: string): SupervisedPortion | null {
  try {
    const body = JSON.parse(raw) as SupervisedPortion;
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
      ...emptySupervisedPortion(),
      ...body,
      distribute: false,
      launch: "CLOSED 0/8",
      selected_child_id: selected,
      children: children.map((child) => {
        const status = PORTION_STATUSES.includes(child.status) ? child.status : "suggested";
        return {
          id: child.id,
          name: child.name,
          kind: "child",
          login: "none",
          user: false,
          horizon: asHorizon(child.horizon, child.id),
          status,
          items: parseItems(child.items, status === "overridden" ? "override" : "path"),
        };
      }),
    };
  } catch {
    return null;
  }
}

export function readSupervisedPortion(): SupervisedPortion {
  for (const dest of [
    destPath(),
    PUBLIC_SEED,
    join(process.cwd(), "public/lessons/hls/supervised-portion.json"),
  ]) {
    if (!existsSync(dest)) continue;
    const parsed = parsePortion(readFileSync(dest, "utf8"));
    if (parsed) return parsed;
  }
  return emptySupervisedPortion();
}

function writeEvidence(evidence: SupervisedPortion) {
  const dest = destPath();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(evidence, null, 2)}\n`);
}

function suggestedChild(
  id: HirePathChildId,
  existing: SupervisedPortionChild | undefined,
  hint: PortionIntentHint | undefined,
  pathItems: PortionPathItem[] | undefined,
): SupervisedPortionChild {
  const horizon = asHorizon(hint?.timeHorizon || existing?.horizon, id);
  return {
    id,
    name: defaultName(id, hint?.name || existing?.name),
    kind: "child",
    login: "none",
    user: false,
    horizon,
    status: "suggested",
    items: sliceHirePathPortion(pathItems, horizon),
  };
}

export function selectSupervisedPortion(
  childId?: string | null,
  hint?: {
    pathItems?: PortionPathItem[];
    horizon?: string;
    name?: string;
  },
) {
  const evidence = readSupervisedPortion();
  const wanted = String(childId || "").trim();
  const stored =
    evidence.children.find((child) => child.id === wanted) ||
    evidence.children.find((child) => child.id === evidence.selected_child_id) ||
    evidence.children[0] ||
    null;
  const id = (isHirePathChildId(wanted) ? wanted : stored?.id) as HirePathChildId | undefined;
  let selected = stored;
  if (id && (!stored || stored.status === "suggested")) {
    selected = suggestedChild(
      id,
      stored || undefined,
      { timeHorizon: hint?.horizon || stored?.horizon, name: hint?.name || stored?.name },
      hint?.pathItems,
    );
  }
  return {
    ...evidence,
    selected_child_id: selected?.id || evidence.selected_child_id,
    selected,
  };
}

export function writeSupervisedPortion(
  childId: string | null | undefined,
  action: string | null | undefined,
  opts?: {
    pathItems?: PortionPathItem[];
    horizon?: string;
    name?: string;
    items?: unknown;
  },
) {
  const id = String(childId || "").trim();
  if (!isHirePathChildId(id)) {
    return { ok: false as const, error: "unknown_child" };
  }
  const op = String(action || "").trim().toLowerCase();
  if (op !== "lock" && op !== "override") {
    return { ok: false as const, error: "action_required" };
  }
  const current = readSupervisedPortion();
  const existing = current.children.find((child) => child.id === id);
  const suggested = suggestedChild(
    id,
    existing,
    { timeHorizon: opts?.horizon || existing?.horizon, name: opts?.name || existing?.name },
    opts?.pathItems,
  );
  let nextChild: SupervisedPortionChild;
  if (op === "lock") {
    const items = existing?.status === "overridden" ? existing.items : suggested.items;
    if (!items.length) {
      return { ok: false as const, error: "slice_required" };
    }
    nextChild = {
      ...suggested,
      items,
      status: "locked",
    };
  } else {
    const items = parseItems(opts?.items, "override");
    if (!items.length) {
      return { ok: false as const, error: "items_required" };
    }
    nextChild = {
      ...suggested,
      items,
      status: "overridden",
    };
  }
  const children = existing
    ? current.children.map((child) => (child.id === id ? nextChild : child))
    : [...current.children, nextChild];
  const next: SupervisedPortion = {
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
