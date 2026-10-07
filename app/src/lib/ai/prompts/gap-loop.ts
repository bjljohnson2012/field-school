import { completeJson, resolveModelFast } from "../client";
import { clampRequirements, fallbackRequirements, requestForGap, type GapKind, type RequirementDraft } from "../../gap-loop/score.ts";
import { modelUserPayload, redactChildForPrompt } from "../../gap-loop/rules.ts";

type ScopeText = {
  ownerKind: "person" | "child";
  statement: string;
  horizon: string;
  childName?: string;
  identifiers?: readonly string[];
  orgId?: string | null;
};

function scrub(scope: ScopeText, text: string) {
  if (scope.ownerKind !== "child") return text;
  return redactChildForPrompt(text, scope.childName || "", scope.identifiers || []);
}

export async function decomposeOutcome(scope: ScopeText): Promise<{ requirements: RequirementDraft[]; source: "model" | "fallback"; model: string }> {
  const model = resolveModelFast();
  const payload = modelUserPayload(scope);
  try {
    const raw = await completeJson<{ requirements?: RequirementDraft[] }>({
      model,
      system: `Break one learning goal into 3 to 12 requirements. Kinds are knowledge, skill, or demonstration. Weight is 1 to 5. Each requirement needs a done condition. Return JSON {"requirements":[{"label":"","kind":"knowledge","weight":3,"doneCondition":{"evidenceType":"upload","text":""}}]}. Use the learner words you are given. Do not invent a name.`,
      user: payload,
      temperature: 0.2,
      jobId: "gapLoopDecompose",
      orgId: scope.orgId,
    });
    const requirements = clampRequirements(
      (raw.requirements || []).map((row) => ({
        ...row,
        label: scrub(scope, row.label || ""),
        doneCondition: {
          evidenceType: row.doneCondition?.evidenceType || "upload",
          text: scrub(scope, row.doneCondition?.text || ""),
        },
      })),
    );
    return { requirements, source: "model", model };
  } catch {
    return { requirements: fallbackRequirements(payload.statement), source: "fallback", model };
  }
}

export type JudgeCitation = { table: string; id: string; label: string };

export async function judgeCoverage(
  scope: ScopeText,
  requirements: readonly { id: string; label: string }[],
  evidence: readonly { id: string; table: string; label: string; text: string }[],
): Promise<{ matches: { requirementId: string; evidenceIds: string[] }[]; citations: JudgeCitation[]; source: "model" | "fallback"; model: string }> {
  const model = resolveModelFast();
  const known = new Map(evidence.map((row) => [row.id, row]));
  const payload = {
    ...modelUserPayload(scope),
    requirements: requirements.map((row) => ({ id: row.id, label: scrub(scope, row.label) })),
    evidence: evidence
      .filter((row) => row.table !== "kid_profiles")
      .map((row) => ({
        id: row.id,
        table: row.table,
        label: scrub(scope, row.label),
        text: scrub(scope, row.text).slice(0, 280),
      })),
  };
  const citationsOf = (ids: string[]) =>
    ids
      .map((id) => known.get(id))
      .filter((row): row is { id: string; table: string; label: string; text: string } => Boolean(row))
      .map((row) => ({ table: row.table, id: row.id, label: scrub(scope, row.label) || "Evidence" }));
  try {
    const raw = await completeJson<{ matches?: { requirementId?: string; evidenceIds?: string[] }[] }>({
      model,
      system: `Match evidence to requirements. Every match needs citations. Return JSON {"matches":[{"requirementId":"","evidenceIds":["id"]}]}. Use only ids from the evidence list. Cite at least one id on every match. Do not invent a name.`,
      user: payload,
      temperature: 0,
      jobId: "gapLoopJudge",
      orgId: scope.orgId,
    });
    const matches = (raw.matches || [])
      .map((row) => ({
        requirementId: row.requirementId || "",
        evidenceIds: (row.evidenceIds || []).filter((id) => known.has(id)),
      }))
      .filter((row) => row.requirementId && row.evidenceIds.length > 0);
    const citations = citationsOf([...new Set(matches.flatMap((row) => row.evidenceIds))]);
    if (!citations.length) return { matches: [], citations: [], source: "fallback", model };
    return { matches, citations, source: "model", model };
  } catch {
    return { matches: [], citations: [], source: "fallback", model };
  }
}

export async function formulateRequest(
  scope: ScopeText,
  gap: { kind: GapKind; label: string },
  citations: readonly JudgeCitation[],
): Promise<{ question: string; requestCopy: string; channel: "upload" | "answer" | "rating" | "lesson"; citations: JudgeCitation[]; source: "model" | "fallback"; model: string }> {
  const model = resolveModelFast();
  const local = requestForGap(gap.kind, scrub(scope, gap.label), scope.ownerKind);
  const cited = citations.filter((row) => row.table && row.id && row.label);
  try {
    const raw = await completeJson<{ question?: string; requestCopy?: string; channel?: string; citations?: JudgeCitation[] }>({
      model,
      system: `Write one short request that closes a learning gap. Return JSON {"question":"","requestCopy":"","citations":[{"table":"","id":"","label":""}]}. Keep the channel you are given. Do not ask for a web search. Cite the evidence ids you are given. Do not invent a name.`,
      user: {
        ...modelUserPayload(scope),
        channel: local.channel,
        question: local.question,
        requestCopy: local.requestCopy,
        citations: cited.map((row) => ({ ...row, label: scrub(scope, row.label) })),
      },
      temperature: 0.2,
      jobId: "gapLoopFormulate",
      orgId: scope.orgId,
    });
    if (raw.channel === "web") {
      return { ...local, citations: cited, source: "fallback", model };
    }
    const question = scrub(scope, raw.question || local.question);
    const requestCopy = scrub(scope, raw.requestCopy || local.requestCopy);
    const fromModel = (raw.citations || []).filter((row) => cited.some((item) => item.id === row.id));
    return {
      question: question || local.question,
      requestCopy: requestCopy || local.requestCopy,
      channel: local.channel,
      citations: fromModel.length ? fromModel : cited,
      source: "model",
      model,
    };
  } catch {
    return { ...local, citations: cited, source: "fallback", model };
  }
}
