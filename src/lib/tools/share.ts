export type AssessmentShare = {
  toolSlug: string;
  title: string;
  summary: string;
  completedAt: string;
  lines: string[];
};

export const SHARE_SLUGS = ["skill", "intelligence", "quiz"] as const;

export function isShareSlug(value: unknown): value is (typeof SHARE_SLUGS)[number] {
  return typeof value === "string" && (SHARE_SLUGS as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAssessmentShare(value: unknown): AssessmentShare | null {
  if (!isRecord(value)) return null;
  const record = value;
  if (!isShareSlug(record.toolSlug)) return null;
  if (typeof record.title !== "string" || !record.title.trim()) return null;
  if (typeof record.summary !== "string" || !record.summary.trim()) return null;
  if (typeof record.completedAt !== "string") return null;
  if (!Array.isArray(record.lines)) return null;
  const title = record.title.trim().slice(0, 120);
  const summary = record.summary.trim().slice(0, 500);
  const lines = record.lines
    .filter((line): line is string => typeof line === "string")
    .map((line) => line.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 24);
  if (!lines.length) return null;
  return {
    toolSlug: record.toolSlug,
    title,
    summary,
    completedAt: record.completedAt,
    lines,
  };
}
