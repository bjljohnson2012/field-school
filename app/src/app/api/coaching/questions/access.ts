export const QUESTION_CATEGORIES = [
  "SALES_STYLE",
  "COMMUNICATION",
  "PERSONALITY",
  "ENNEAGRAM",
  "DISC",
  "MBTI",
  "MOTIVATION",
  "RESILIENCE",
  "PRODUCT_KNOWLEDGE",
  "LEADERSHIP",
  "DIRECTOR_MONTHLY_REVIEW",
] as const;

export const QUESTION_TYPES = ["LONG_FORM", "MULTIPLE_CHOICE", "LIKERT", "SLIDER"] as const;

export const ENHANCE_GOALS = ["clearer", "shorter", "more diagnostic", "score-tag review"] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];
export type EnhanceGoal = (typeof ENHANCE_GOALS)[number];

export type QuestionOption = {
  value: string;
  label: string;
  tags: string[];
};

export type QuestionActor = {
  platformAdmin: boolean;
  capabilities: readonly string[];
  orgId: string;
};

export type QuestionAuthor = QuestionActor & {
  membershipId: string;
};

export type QuestionDto = {
  id: string;
  orgId: string | null;
  scope: "platform" | "org";
  productId: string | null;
  category: string;
  questionType: string;
  text: string;
  options: QuestionOption[] | null;
  tags: string[];
  weight: string;
  active: boolean;
  mutable: boolean;
};

export function canAuthorQuestions(actor: QuestionActor) {
  return actor.platformAdmin || actor.capabilities.includes("leader");
}

export function questionVisible(actor: QuestionActor, row: { orgId: string | null }) {
  if (!canAuthorQuestions(actor)) return false;
  return row.orgId == null || row.orgId === actor.orgId;
}

export function canMutateQuestion(actor: QuestionActor, row: { orgId: string | null }) {
  if (!questionVisible(actor, row)) return false;
  if (row.orgId == null) return actor.platformAdmin;
  return true;
}

export function visibleQuestions<T extends { orgId: string | null }>(
  actor: QuestionActor,
  rows: readonly T[],
) {
  return rows.filter((row) => questionVisible(actor, row));
}

/** Platform creates require platform_admin. Any other scope is the active org. */
export function orgIdForCreate(actor: QuestionActor, scope: unknown): string | null | "forbidden" {
  const orgId = scope === "platform" ? null : actor.orgId;
  return canMutateQuestion(actor, { orgId }) ? orgId : "forbidden";
}

export function questionScope(orgId: string | null): "platform" | "org" {
  return orgId == null ? "platform" : "org";
}

export function isQuestionCategory(value: string): value is QuestionCategory {
  return (QUESTION_CATEGORIES as readonly string[]).includes(value);
}

export function isQuestionType(value: string): value is QuestionType {
  return (QUESTION_TYPES as readonly string[]).includes(value);
}

export function questionTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "").map((tag) => tag.trim());
}

export function questionOptions(value: unknown): QuestionOption[] | null {
  if (!Array.isArray(value)) return null;
  const options = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const optionValue = typeof row.value === "string" ? row.value.trim() : "";
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!optionValue && !label) return [];
    return [{ value: optionValue || label, label: label || optionValue, tags: questionTags(row.tags) }];
  });
  return options.length ? options : null;
}

export function weightOf(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return value.trim();
  return "1";
}

export function boundedCount(value: unknown, max = 20) {
  const count = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(count) || count < 1 || count > max) return null;
  return count;
}

export function allowedQuestionTypes(value: unknown): QuestionType[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const types = value.filter((item): item is QuestionType => typeof item === "string" && isQuestionType(item));
  return types.length ? types : undefined;
}

export function enhanceGoal(value: unknown): EnhanceGoal | undefined {
  if (typeof value !== "string") return undefined;
  return (ENHANCE_GOALS as readonly string[]).includes(value) ? (value as EnhanceGoal) : undefined;
}
