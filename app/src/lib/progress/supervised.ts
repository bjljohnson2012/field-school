import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SUPERVISED_FR = ["FR-2", "FR-6"] as const;

export type SupervisedChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  now: { title: string; copy: string };
  confidence: { state: "not_yet" | "getting_there" | "ready"; label: string };
  next: { title: string; copy: string };
};

export type SupervisedProgress = {
  ok: true;
  fr: typeof SUPERVISED_FR;
  distribute: false;
  launch: "CLOSED 0/8";
  selected_child_id: string;
  children: SupervisedChild[];
};

function destPath() {
  if (process.env.SUPERVISED_PROGRESS_PATH?.trim()) {
    return process.env.SUPERVISED_PROGRESS_PATH.trim();
  }
  if (process.env.NODE_ENV === "production") {
    return "/app/data/supervised-progress.json";
  }
  return join(process.cwd(), "public/lessons/hls/supervised-progress.json");
}

const PUBLIC_SEED = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../public/lessons/hls/supervised-progress.json",
);

export function emptySupervisedProgress(): SupervisedProgress {
  return {
    ok: true,
    fr: SUPERVISED_FR,
    distribute: false,
    launch: "CLOSED 0/8",
    selected_child_id: "play-child",
    children: [],
  };
}

function parseProgress(raw: string): SupervisedProgress | null {
  try {
    const body = JSON.parse(raw) as SupervisedProgress;
    const children = Array.isArray(body.children)
      ? body.children.filter(
          (child) =>
            child &&
            child.kind === "child" &&
            child.login === "none" &&
            child.user === false &&
            child.now &&
            child.confidence &&
            child.next,
        )
      : [];
    const selected =
      children.find((child) => child.id === body.selected_child_id)?.id ||
      children[0]?.id ||
      "play-child";
    return {
      ...emptySupervisedProgress(),
      ...body,
      distribute: false,
      launch: "CLOSED 0/8",
      selected_child_id: selected,
      children,
    };
  } catch {
    return null;
  }
}

export function readSupervisedProgress(): SupervisedProgress {
  for (const dest of [
    destPath(),
    PUBLIC_SEED,
    join(process.cwd(), "public/lessons/hls/supervised-progress.json"),
  ]) {
    if (!existsSync(dest)) continue;
    const parsed = parseProgress(readFileSync(dest, "utf8"));
    if (parsed) return parsed;
  }
  return emptySupervisedProgress();
}

export function selectSupervisedChild(childId?: string | null) {
  const evidence = readSupervisedProgress();
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
