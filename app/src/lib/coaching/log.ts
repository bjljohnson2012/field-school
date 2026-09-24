/**
 * One JSON object per coaching log line.
 * Answer text, profile narrative, invite URLs, and secrets are not fields.
 */

export const COACHING_LOG_EVENTS = [
  "coaching.access.deny",
  "coaching.score.write",
  "coaching.ai.job",
  "coaching.import",
  "coaching.cron",
] as const;

export type CoachingLogEvent = (typeof COACHING_LOG_EVENTS)[number];

export type CoachingTokenUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

const URLISH = /:\/\//;
const SECRETISH = /api[_-]?key|secret|password|smtp_|bearer\s|sk-|xai-/i;

function plain(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\r\n]+/g, " ").trim();
  if (!text || text.length > 200) return null;
  if (URLISH.test(text) || SECRETISH.test(text)) return null;
  return text;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function write(line: Record<string, unknown>) {
  console.info(JSON.stringify(line));
}

export function coachingAccessDenyLine(input: {
  actorMembershipId?: string | null;
  subjectMembershipId?: string | null;
  orgId?: string | null;
  reason?: string | null;
}) {
  return {
    event: "coaching.access.deny" as const,
    actorMembershipId: plain(input.actorMembershipId),
    subjectMembershipId: plain(input.subjectMembershipId),
    orgId: plain(input.orgId),
    reason: plain(input.reason),
  };
}

export function logCoachingAccessDeny(input: Parameters<typeof coachingAccessDenyLine>[0]) {
  write(coachingAccessDenyLine(input));
}

export function coachingScoreWriteLine(input: {
  slug?: string | null;
  source?: string | null;
  orgId?: string | null;
  note?: string | null;
}) {
  return {
    event: "coaching.score.write" as const,
    slug: plain(input.slug),
    source: plain(input.source),
    orgId: plain(input.orgId),
  };
}

export function logCoachingScoreWrite(input: Parameters<typeof coachingScoreWriteLine>[0]) {
  write(coachingScoreWriteLine(input));
}

export function coachingAiJobLine(input: {
  jobId?: string | null;
  orgId?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  status?: string | null;
  usage?: unknown;
  answer?: string | null;
  narrative?: string | null;
}) {
  return {
    event: "coaching.ai.job" as const,
    jobId: plain(input.jobId),
    orgId: plain(input.orgId),
    model: plain(input.model),
    latencyMs: finite(input.latencyMs),
    status: plain(input.status),
    usage: tokenUsage(input.usage),
  };
}

export function logCoachingAiJob(input: Parameters<typeof coachingAiJobLine>[0]) {
  write(coachingAiJobLine(input));
}

export function coachingImportLine(input: {
  table?: string | null;
  counts?: unknown;
  inviteUrl?: string | null;
}) {
  return {
    event: "coaching.import" as const,
    table: plain(input.table),
    counts: numericCounts(input.counts),
  };
}

export function logCoachingImport(input: Parameters<typeof coachingImportLine>[0]) {
  write(coachingImportLine(input));
}

export function coachingCronLine(input: {
  branch?: string | null;
  rowsChanged?: number | null;
}) {
  return {
    event: "coaching.cron" as const,
    branch: plain(input.branch),
    rowsChanged: finite(input.rowsChanged) ?? 0,
  };
}

export function logCoachingCron(input: Parameters<typeof coachingCronLine>[0]) {
  write(coachingCronLine(input));
}

function tokenUsage(usage: unknown): CoachingTokenUsage | null {
  if (!usage || typeof usage !== "object") return null;
  const record = usage as Record<string, unknown>;
  const num = (key: string) => finite(record[key]);
  const line = {
    promptTokens: num("promptTokens") ?? num("prompt_tokens"),
    completionTokens: num("completionTokens") ?? num("completion_tokens"),
    totalTokens: num("totalTokens") ?? num("total_tokens"),
  };
  if (line.promptTokens == null && line.completionTokens == null && line.totalTokens == null) {
    return null;
  }
  return line;
}

function numericCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    const name = plain(key);
    const count = finite(item);
    if (!name || count == null) continue;
    out[name] = count;
  }
  return out;
}
