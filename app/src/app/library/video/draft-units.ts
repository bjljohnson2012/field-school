import type { LessonSpec } from "./lesson-spec";

/** Locked Cap take. Pointing at it is refused. The take is not opened. */
export const JUST_CAP_ID = "27pn9xs0zk8a73g";

/** Locked master digest. A pointer that carries it is refused. */
export const DEST_SHA256 =
  "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";

const LOCKED_MASTER = "everything-made-up.mp4";
const CAP_HOST = "cap.fieldschool.ai";
const CAP_ID = /^[a-z0-9]{10,20}$/;
const ORG_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,47})$/;
const MAX_CHAPTERS = 40;
const MAX_POINTER = 500;
const MAX_OUTCOME = 400;
const MAX_TITLE = 120;
const MAX_UNIT_TITLE = 80;

export type VideoPointer =
  | { kind: "cap"; takeId: string }
  | { kind: "mp4"; name: string };

export type DraftInput = {
  org: string;
  pointer: string;
  title?: string;
  outcome: string;
  chapters?: string;
};

export type DraftResult =
  | { ok: true; spec: LessonSpec; pointer: VideoPointer }
  | { ok: false; error: string };

export function draftLessonFromPointer(input: DraftInput): DraftResult {
  const org = input.org.trim();
  if (!org || !ORG_SLUG.test(org)) return { ok: false, error: "org_required" };
  if (org === "household") return { ok: false, error: "household_org" };

  const outcome = clip(input.outcome, MAX_OUTCOME);
  if (!outcome) return { ok: false, error: "outcome_required" };

  const parsed = parseVideoPointer(input.pointer);
  if (!parsed.ok) return parsed;

  const chapters = input.chapters ?? "";
  if (chapters.length > 8000) return { ok: false, error: "too_many_chapters" };

  const title = clip(input.title?.trim() || pointerTitle(parsed.pointer), MAX_TITLE);
  const chapterTitles = titlesFromChapters(chapters, title);
  if (!chapterTitles.ok) return chapterTitles;

  const id = specId(org, parsed.pointer);
  const spec: LessonSpec = {
    id,
    org,
    title,
    outcome,
    units: chapterTitles.titles.map((unitTitle, index) => ({
      id: `${id}-u${index + 1}`,
      title: unitTitle,
      source_unit_id: `src-${id}-u${index + 1}`,
    })),
    mode: "video",
  };
  return { ok: true, spec, pointer: parsed.pointer };
}

export function renameDraftUnit(spec: LessonSpec, index: number, title: string): LessonSpec {
  const next = clip(title, MAX_UNIT_TITLE);
  if (!next) return spec;
  if (index < 0 || index >= spec.units.length) return spec;
  return {
    ...spec,
    units: spec.units.map((unit, unitIndex) =>
      unitIndex === index ? { ...unit, title: next } : unit,
    ),
  };
}

export function parseVideoPointer(
  raw: string,
): { ok: true; pointer: VideoPointer } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "pointer_required" };
  if (value.length > MAX_POINTER) return { ok: false, error: "pointer_unrecognized" };

  const locked = lockError(value);
  if (locked) return { ok: false, error: locked };

  const url = readUrl(value);
  if (url) {
    const name = basename(url.pathname);
    if (name.toLowerCase().endsWith(".mp4")) {
      return { ok: true, pointer: { kind: "mp4", name } };
    }
    if (url.hostname !== CAP_HOST) return { ok: false, error: "pointer_unrecognized" };
    const takeId = url.pathname
      .split("/")
      .filter(Boolean)
      .find((part) => CAP_ID.test(part));
    if (!takeId) return { ok: false, error: "pointer_unrecognized" };
    return { ok: true, pointer: { kind: "cap", takeId } };
  }

  const name = basename(value);
  if (/\.mp4$/i.test(name)) {
    if (!/^[^/\\]+\.mp4$/i.test(name)) return { ok: false, error: "pointer_unrecognized" };
    return { ok: true, pointer: { kind: "mp4", name } };
  }
  if (CAP_ID.test(value)) return { ok: true, pointer: { kind: "cap", takeId: value } };
  return { ok: false, error: "pointer_unrecognized" };
}

function lockError(value: string): "just_locked" | "dest_locked" | null {
  const lower = value.toLowerCase();
  if (lower.includes(DEST_SHA256) || lower.includes(LOCKED_MASTER)) return "dest_locked";
  if (lower.includes(JUST_CAP_ID)) return "just_locked";
  return null;
}

function readUrl(value: string): URL | null {
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function basename(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function pointerTitle(pointer: VideoPointer): string {
  if (pointer.kind === "cap") return `Cap take ${pointer.takeId}`;
  const stem = pointer.name.replace(/\.mp4$/i, "").replace(/[-_]+/g, " ").trim();
  if (!stem) return "Untitled take";
  return stem.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function titlesFromChapters(
  chapters: string,
  fallback: string,
): { ok: true; titles: string[] } | { ok: false; error: string } {
  const titles = chapters
    .split("\n")
    .map(cleanChapter)
    .filter(Boolean)
    .map((title) => clip(title, MAX_UNIT_TITLE));
  if (titles.length > MAX_CHAPTERS) return { ok: false, error: "too_many_chapters" };
  if (titles.length === 0) return { ok: true, titles: [clip(fallback, MAX_UNIT_TITLE)] };
  return { ok: true, titles };
}

function cleanChapter(line: string): string {
  return line.trim().replace(/^\d{1,2}:\d{2}(?::\d{2})?(?:\s+|$)/, "").trim();
}

function specId(org: string, pointer: VideoPointer): string {
  const key = pointer.kind === "cap" ? pointer.takeId : pointer.name.replace(/\.mp4$/i, "");
  return `video-${slugPart(org)}-${slugPart(key)}`;
}

function slugPart(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "take";
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 3)}...`;
}
