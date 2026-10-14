import { RESEARCH_CAPS, allowSpend } from "../gap-loop/research.ts";
import { readCandidate, type ImportCandidate } from "./linkedin.ts";
import { proposeCertificationSkills } from "./import-plan.ts";

/** Output budget for one resume read. Priced with the GL2 rate card. */
export const RESUME_MAX_OUTPUT_TOKENS = 2_000;
const RESUME_TEXT_MAX = 60_000;

export const RESUME_SYSTEM =
  'Extract resume facts as JSON {"entries":[{"kind":"headline"|"experience"|"education"|"certification"|"skill","title":"","organization":"","startedOn":null,"endedOn":null}]}. Dates are YYYY or YYYY-MM, or null. Do not invent employers, schools, or skills. Education and certifications stay those kinds. A job is experience. Return JSON only.';

export function estimateResumeMicros(text: string) {
  const inputTokens = Math.ceil(Math.max(0, text.length) / 4) + 220;
  const input = Math.ceil((inputTokens * RESEARCH_CAPS.inputUsdMicrosPerMillion) / 1_000_000);
  const output = Math.ceil((RESUME_MAX_OUTPUT_TOKENS * RESEARCH_CAPS.outputUsdMicrosPerMillion) / 1_000_000);
  return input + output;
}

export function decideResumeParse(input: { adult: boolean; taskMicros: number; monthMicros: number; nextMicros: number }) {
  if (!input.adult) return { ok: false as const, error: "adults_only" as const, called: false as const };
  const gate = allowSpend(input.taskMicros, input.monthMicros, input.nextMicros);
  if (!gate.ok) return { ok: false as const, error: gate.error, called: false as const };
  return { ok: true as const, called: false as const };
}

/** Model JSON becomes review candidates. Invalid rows are dropped. Nothing is written. */
export function resumeProposalsFromModel(raw: unknown): ImportCandidate[] {
  const entries =
    raw && typeof raw === "object" && Array.isArray((raw as { entries?: unknown }).entries)
      ? (raw as { entries: unknown[] }).entries
      : [];
  const found: ImportCandidate[] = [];
  for (const item of entries) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const candidate = readCandidate({
      id: typeof record.id === "string" ? record.id : `resume-${found.length}`,
      kind: record.kind,
      title: record.title,
      organization: record.organization ?? "",
      startedOn: record.startedOn ?? null,
      endedOn: record.endedOn ?? null,
    });
    if (candidate) found.push({ ...candidate, id: `resume-${found.length}` });
  }
  return proposeCertificationSkills(found).slice(0, 80);
}

export async function proposeResumeEntries(input: {
  text: string;
  adult: boolean;
  taskMicros: number;
  monthMicros: number;
  complete: (body: { system: string; user: string }) => Promise<unknown>;
}) {
  const text = input.text.trim();
  if (!text) return { ok: false as const, error: "resume_empty" as const, called: false as const, items: [] as ImportCandidate[], usdMicros: 0 };
  const nextMicros = estimateResumeMicros(text);
  const decision = decideResumeParse({
    adult: input.adult,
    taskMicros: input.taskMicros,
    monthMicros: input.monthMicros,
    nextMicros,
  });
  if (!decision.ok) return { ...decision, items: [] as ImportCandidate[], usdMicros: 0 };
  if (text.length > RESUME_TEXT_MAX) {
    return { ok: false as const, error: "task_cap" as const, called: false as const, items: [] as ImportCandidate[], usdMicros: 0 };
  }
  const raw = await input.complete({ system: RESUME_SYSTEM, user: text });
  return {
    ok: true as const,
    called: true as const,
    items: resumeProposalsFromModel(raw),
    usdMicros: nextMicros,
  };
}
