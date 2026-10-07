/**
 * A click expands a stored document into a short reading and follow-up questions.
 * The reading stays inside the stored words. A thin document does not grow new facts.
 */

import { isThinBody, NEEDS_MORE, parseModelJson } from "./teach-from-knowledge.ts";

export const SCOPE_QUESTION = "What is the scope or limit of the knowledge?";

export type KnowledgeReading = {
  expansion: string;
  questions: string[];
};

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function questionsFrom(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const questions: string[] = [];
  for (const item of raw) {
    const text = clip(item, 180);
    if (text.length < 8 || !text.includes("?")) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(text.endsWith("?") ? text : `${text}?`);
    if (questions.length === 3) break;
  }
  return questions;
}

/** Always leave the person a scope question when the document does not already ask one. */
export function expandFromModel(raw: string | null, source: string): KnowledgeReading {
  const fallback: KnowledgeReading = { expansion: NEEDS_MORE, questions: [SCOPE_QUESTION] };
  let expansion = NEEDS_MORE;
  let questions: string[] = [];
  if (raw && !isThinBody(source)) {
    try {
      const parsed = parseModelJson(raw);
      const record =
        parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
      const text = clip(record.expansion, 600);
      if (text && text.toLowerCase() !== NEEDS_MORE) expansion = text;
      questions = questionsFrom(record.questions);
    } catch {
      expansion = NEEDS_MORE;
    }
  }
  const asked = questions.some((question) => /scope|limit/i.test(question));
  if (!asked) questions = [SCOPE_QUESTION, ...questions].slice(0, 3);
  if (!questions.length) return fallback;
  return { expansion, questions };
}
