import type { ToolResult } from "@/lib/portal";

const KEY = "fsu-pending-tool";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "number");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "string");
}

export function parseToolResult(value: unknown): ToolResult | null {
  if (!isRecord(value)) return null;
  if (typeof value.toolSlug !== "string" || !value.toolSlug.trim()) return null;
  if (typeof value.completedAt !== "string") return null;
  if (typeof value.summary !== "string" || !value.summary.trim()) return null;
  if (!isNumberRecord(value.scores) || !isStringRecord(value.labels)) return null;
  return {
    toolSlug: value.toolSlug,
    completedAt: value.completedAt,
    summary: value.summary,
    scores: value.scores,
    labels: value.labels,
  };
}

export function stashPendingTool(result: ToolResult) {
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function takePendingTool(slug: string): ToolResult | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = parseToolResult(JSON.parse(raw));
    if (!parsed || parsed.toolSlug !== slug) return null;
    sessionStorage.removeItem(KEY);
    return parsed;
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}
