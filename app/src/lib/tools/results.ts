import { intelligenceQuestions, scoreIntelligence } from "./intelligence.ts";
import { scoreSkill, skillQuestions } from "./skill.ts";

export const SAVED_TOOLS = ["skill", "intelligence"] as const;
export type SavedToolSlug = (typeof SAVED_TOOLS)[number];

export type ToolAnswers = Readonly<Record<string, number>>;

/**
 * What a browser may send: raw answers plus an attempt id minted at "See results".
 * The server scores it and stamps the time; a browser summary or clock is never stored.
 */
export type ToolSubmission = {
  toolSlug: SavedToolSlug;
  attemptId: string;
  answers: ToolAnswers;
};

export type ToolResult = ToolSubmission & {
  completedAt: string;
  summary: string;
  scores: Record<string, number>;
  labels: Record<string, string>;
};

export type SubmissionError = "not_a_saved_tool" | "bad_attempt_id" | "answers_incomplete";

const QUESTIONS: Record<SavedToolSlug, readonly { id: string; choices: readonly { value: number }[] }[]> = {
  skill: skillQuestions,
  intelligence: intelligenceQuestions,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSavedTool(slug: string): slug is SavedToolSlug {
  return SAVED_TOOLS.some((tool) => tool === slug);
}

function field(raw: object, key: string): unknown {
  return Object.getOwnPropertyDescriptor(raw, key)?.value;
}

function readAnswers(slug: SavedToolSlug, raw: unknown): ToolAnswers | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const questions = QUESTIONS[slug];
  if (Object.keys(raw).length !== questions.length) return null;
  const answers: Record<string, number> = {};
  for (const question of questions) {
    const value = field(raw, question.id);
    if (typeof value !== "number" || !question.choices.some((choice) => choice.value === value)) {
      return null;
    }
    answers[question.id] = value;
  }
  return answers;
}

export function parseToolSubmission(
  body: unknown,
): { ok: true; submission: ToolSubmission } | { ok: false; error: SubmissionError } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "not_a_saved_tool" };
  const tool = field(body, "tool");
  if (typeof tool !== "string" || !isSavedTool(tool)) return { ok: false, error: "not_a_saved_tool" };
  const attemptId = field(body, "attemptId");
  if (typeof attemptId !== "string" || !UUID.test(attemptId)) return { ok: false, error: "bad_attempt_id" };
  const answers = readAnswers(tool, field(body, "answers"));
  if (!answers) return { ok: false, error: "answers_incomplete" };
  return { ok: true, submission: { toolSlug: tool, attemptId: attemptId.toLowerCase(), answers } };
}

/** The wire body for a submission; parseToolSubmission reads exactly this shape back. */
export function submissionBody(submission: ToolSubmission) {
  return { tool: submission.toolSlug, attemptId: submission.attemptId, answers: submission.answers };
}

export type LatestToolResults = Partial<Record<SavedToolSlug, ToolResult>>;

export function latestByTool(results: readonly ToolResult[]): LatestToolResults {
  const latest: LatestToolResults = {};
  for (const result of results) {
    const prior = latest[result.toolSlug];
    if (!prior || Date.parse(prior.completedAt) < Date.parse(result.completedAt)) {
      latest[result.toolSlug] = result;
    }
  }
  return latest;
}

export function scoreSubmission(submission: ToolSubmission, completedAt: Date): ToolResult {
  const at = completedAt.toISOString();
  if (submission.toolSlug === "skill") {
    const scored = scoreSkill(submission.answers);
    return {
      ...submission,
      completedAt: at,
      summary: scored.summary,
      scores: { total: scored.total, max: scored.max },
      labels: { band: scored.label, next: scored.next },
    };
  }
  const scored = scoreIntelligence(submission.answers);
  return {
    ...submission,
    completedAt: at,
    summary: scored.summary,
    scores: { ...scored.axes, total: scored.total, max: scored.max },
    labels: scored.labels,
  };
}
