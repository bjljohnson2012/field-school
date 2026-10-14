import { redactChildForPrompt } from "../gap-loop/rules.ts";

/** Child-scope brain prompts drop the learner's name before any model call. */
export function brainModelText(input: {
  ownerKind: string;
  text: string;
  childName?: string;
  identifiers?: readonly string[];
}) {
  if (input.ownerKind !== "child") return input.text.trim();
  return redactChildForPrompt(input.text, input.childName || "", input.identifiers || []);
}
