import { readCandidate, parseProfileUrl, type ImportCandidate } from "./linkedin.ts";
import { PROJECT_NAME_MAX, SKILL_NAME_MAX, cleanName } from "./names.ts";

export const SKILL_LEVELS = ["learning", "working", "strong", "expert"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export type SkillInput = { name: string; useId: string | null; level: SkillLevel | null; notes: string };
export type ProjectInput = { name: string; useId: string | null; role: string; link: string; description: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function field(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null ? Object.getOwnPropertyDescriptor(body, key)?.value : undefined;
}

function text(body: unknown, key: string, max: number): string | null {
  const value = field(body, key) ?? "";
  if (typeof value !== "string") return null;
  const clean = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : null;
}

function useId(body: unknown): string | null | undefined {
  const value = field(body, "useId");
  if (value === undefined || value === null) return null;
  return isUuid(value) ? value : undefined;
}

export function parseSkillInput(body: unknown): SkillInput | null {
  const name = cleanName(field(body, "name"), SKILL_NAME_MAX);
  const use = useId(body);
  const level = field(body, "level") ?? null;
  const notes = text(body, "notes", 500);
  if (use === undefined || notes === null || (!name && !use)) return null;
  const knownLevel = SKILL_LEVELS.find((candidate) => candidate === level) ?? null;
  if (level !== null && !knownLevel) return null;
  return { name: name ?? "", useId: use, level: knownLevel, notes };
}

export function parseProjectInput(body: unknown): ProjectInput | null {
  const name = cleanName(field(body, "name"), PROJECT_NAME_MAX);
  const use = useId(body);
  const role = text(body, "role", 120);
  const link = text(body, "link", 500);
  const description = text(body, "description", 1000);
  if (use === undefined || role === null || link === null || description === null || (!name && !use)) return null;
  if (link && !/^https:\/\/[^\s]+$/.test(link)) return null;
  return { name: name ?? "", useId: use, role, link, description };
}

export function parseNameCheck(body: unknown): { kind: "skill" | "project"; name: string } | null {
  const kind = field(body, "kind");
  if (kind !== "skill" && kind !== "project") return null;
  const name = cleanName(field(body, "name"), kind === "skill" ? SKILL_NAME_MAX : PROJECT_NAME_MAX);
  return name ? { kind, name } : null;
}

const MAX_ACCEPT = 80;

/** What the User accepted from the review list, re-checked field by field. */
export function parseAcceptance(
  body: unknown,
): { profileUrl: string | null; items: { candidate: ImportCandidate; useId: string | null }[] } | null {
  const rawUrl = field(body, "profileUrl");
  const profileUrl = rawUrl === undefined || rawUrl === null || rawUrl === "" ? null : parseProfileUrl(rawUrl);
  if (rawUrl && !profileUrl) return null;
  const items = field(body, "items");
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ACCEPT) return null;
  const out: { candidate: ImportCandidate; useId: string | null }[] = [];
  for (const item of items) {
    const candidate = readCandidate(field(item, "candidate"));
    const use = useId(item);
    if (!candidate || use === undefined) return null;
    out.push({ candidate, useId: candidate.kind === "skill" ? use : null });
  }
  return { profileUrl, items: out };
}

export function mediaPath(id: string) {
  return `/api/media/${id}`;
}

export function listOfAliases(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((value): value is string => typeof value === "string") : [];
}
