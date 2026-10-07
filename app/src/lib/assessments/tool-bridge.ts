import type { Answer } from "./engine.ts";
import { intelligenceQuestions } from "../tools/intelligence.ts";
import { skillQuestions } from "../tools/skill.ts";
import type { AdultGateId } from "../profile/model.ts";
import type { SavedToolSlug, ToolSubmission } from "../tools/results.ts";

const QUESTIONS = {
  skill: skillQuestions,
  intelligence: intelligenceQuestions,
} as const;

/** Official Tools slug for a finished wizard gate. Personality stays on Field Pattern. */
export function toolForGate(gate: AdultGateId): SavedToolSlug | null {
  if (gate === "G-skills") return "skill";
  if (gate === "G-other") return "intelligence";
  return null;
}

/**
 * A tool_results row only when every official Tools item was answered.
 * Adaptive extras are ignored. A short run does not invent the missing answers.
 */
export function toolSubmissionFromRun(
  tool: SavedToolSlug,
  attemptId: string,
  answers: readonly Answer[],
): ToolSubmission | null {
  const byKey = new Map(answers.map((answer) => [answer.key, answer.value]));
  const body: Record<string, number> = {};
  for (const question of QUESTIONS[tool]) {
    const value = byKey.get(question.id);
    if (typeof value !== "number" || !question.choices.some((choice) => choice.value === value)) return null;
    body[question.id] = value;
  }
  return { toolSlug: tool, attemptId, answers: body };
}
