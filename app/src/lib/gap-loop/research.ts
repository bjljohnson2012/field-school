import { EMBEDDING_CONFIG } from "./embedding.ts";

/** $0.25 per task and $10 per month. Integer micros so the cap does not drift. */
export const RESEARCH_CAPS = {
  perTaskUsdMicros: 250_000,
  perMonthUsdMicros: 10_000_000,
  searchCallUsdMicros: 5_000,
  maxOutputTokens: 400,
  assumedInputTokens: 200,
  inputUsdMicrosPerMillion: 5_000_000,
  outputUsdMicrosPerMillion: 15_000_000,
} as const;

const LEVEL_WORDS = "overview";

export function genericWebQuery(label: string) {
  const clean = label.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  if (clean.length < 2) return "";
  return `${clean} ${LEVEL_WORDS}`.replace(/\s+/g, " ").trim();
}

export function queryHitsIdentifier(query: string, identifiers: readonly string[]) {
  const hay = query.toLowerCase();
  for (const raw of identifiers) {
    const token = raw.trim().toLowerCase();
    if (token.length < 2) continue;
    if (hay.includes(token)) return true;
  }
  return false;
}

export function estimateSearchMicros(inputTokens = RESEARCH_CAPS.assumedInputTokens) {
  const input = Math.ceil((Math.max(0, inputTokens) * RESEARCH_CAPS.inputUsdMicrosPerMillion) / 1_000_000);
  const output = Math.ceil((RESEARCH_CAPS.maxOutputTokens * RESEARCH_CAPS.outputUsdMicrosPerMillion) / 1_000_000);
  return RESEARCH_CAPS.searchCallUsdMicros + input + output;
}

/** 10_000_000_000 ticks = 1 USD. */
export function ticksToUsdMicros(ticks: number) {
  if (!Number.isFinite(ticks) || ticks < 0) return null;
  return Math.ceil(ticks / 10_000);
}

export function allowSpend(taskMicros: number, monthMicros: number, nextMicros: number) {
  const task = Math.max(0, taskMicros);
  const month = Math.max(0, monthMicros);
  const next = Math.max(0, nextMicros);
  if (task + next > RESEARCH_CAPS.perTaskUsdMicros) return { ok: false as const, error: "task_cap" as const };
  if (month + next > RESEARCH_CAPS.perMonthUsdMicros) return { ok: false as const, error: "month_cap" as const };
  return { ok: true as const };
}

export type ApprovalEvent = { kind: "kid_query_blocked"; summary: string };

export function decideApproval(input: {
  storedQuery: string;
  submittedQuery: string;
  identifiers: readonly string[];
  declined?: boolean;
}) {
  if (input.declined) return { ok: false as const, error: "declined" as const, called: false };
  const stored = input.storedQuery.trim();
  const submitted = input.submittedQuery.trim();
  if (!stored || stored !== submitted) return { ok: false as const, error: "query_mismatch" as const, called: false };
  if (queryHitsIdentifier(stored, input.identifiers) || queryHitsIdentifier(submitted, input.identifiers)) {
    return {
      ok: false as const,
      error: "kid_identifier_blocked" as const,
      called: false,
      event: { kind: "kid_query_blocked" as const, summary: "Search blocked." },
    };
  }
  return { ok: true as const, query: stored, called: false };
}

export type WebHit = { url: string; title: string; retrievedOn: string; usdMicros: number };

export function webCitation(hit: WebHit) {
  const url = hit.url.trim();
  const retrieved = hit.retrievedOn.trim();
  const title = hit.title.replace(/\s+/g, " ").trim() || url;
  if (!/^https?:\/\//i.test(url) || !retrieved) return null;
  return {
    table: "web",
    id: url,
    label: title,
    url,
    retrieved,
  };
}

export async function runApprovedSearch(input: {
  query: string;
  identifiers: readonly string[];
  taskSpentMicros: number;
  monthSpentMicros: number;
  declined?: boolean;
  search: (query: string) => Promise<WebHit | null>;
}) {
  const decision = decideApproval({
    storedQuery: input.query,
    submittedQuery: input.query,
    identifiers: input.identifiers,
    declined: input.declined,
  });
  if (!decision.ok) return { ...decision, node: null };
  const estimate = estimateSearchMicros();
  const gate = allowSpend(input.taskSpentMicros, input.monthSpentMicros, estimate);
  if (!gate.ok) return { ok: false as const, error: gate.error, called: false, node: null, usdMicros: 0 };
  if (input.taskSpentMicros > 0) {
    return { ok: false as const, error: "already_ran" as const, called: false, node: null };
  }
  const hit = await input.search(decision.query);
  if (!hit) return { ok: false as const, error: "research_failed" as const, called: true, node: null, usdMicros: estimate };
  const citation = webCitation(hit);
  if (!citation) return { ok: false as const, error: "research_failed" as const, called: true, node: null, usdMicros: hit.usdMicros || estimate };
  const usdMicros = hit.usdMicros > 0 ? hit.usdMicros : estimate;
  const after = allowSpend(0, input.monthSpentMicros, usdMicros);
  return {
    ok: true as const,
    called: true,
    usdMicros,
    hardStop: !after.ok,
    node: {
      kind: "evidence" as const,
      label: citation.label,
      body: citation.label,
      evidence: [citation],
    },
  };
}

export function embeddingModelName() {
  return `${EMBEDDING_CONFIG.provider}:${EMBEDDING_CONFIG.model}:${EMBEDDING_CONFIG.dimensions}`;
}
