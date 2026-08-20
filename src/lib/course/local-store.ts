import type { ExamState, ProgressMap, StaffDesk } from "./types";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function progressKey(slug: string) {
  return `jfsu-progress:${slug}`;
}

export function examKey(slug: string) {
  return `jfsu-exam:${slug}`;
}

export function deskKey(slug: string) {
  return `jfsu-desk:${slug}`;
}

export function readLocalProgress(slug: string): ProgressMap {
  if (!slug) return {};
  return readJson<ProgressMap>(progressKey(slug), {});
}

export function writeLocalProgress(slug: string, map: ProgressMap) {
  if (!slug) return;
  writeJson(progressKey(slug), map);
}

export function readLocalExam(slug: string): ExamState {
  if (!slug) return null;
  const value = readJson<ExamState>(examKey(slug), null);
  if (!value || typeof value.score !== "number") return null;
  return value;
}

export function writeLocalExam(slug: string, exam: ExamState) {
  if (!slug || !exam) return;
  writeJson(examKey(slug), exam);
}

export function readLocalDesk(slug: string): StaffDesk | null {
  if (!slug) return null;
  const value = readJson<StaffDesk | null>(deskKey(slug), null);
  if (!value || typeof value !== "object") return null;
  return value;
}

export function writeLocalDesk(slug: string, desk: StaffDesk) {
  if (!slug) return;
  writeJson(deskKey(slug), desk);
}
