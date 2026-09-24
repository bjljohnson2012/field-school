import { desc, eq, isNull, or } from "drizzle-orm";
import type { GeneratedQuestion } from "@/lib/ai/prompts/questions";
import { getDb } from "@/lib/db/client";
import { auditLogs, organizations, products, questions } from "@/lib/db/schema";
import {
  canMutateQuestion,
  isQuestionCategory,
  isQuestionType,
  questionOptions,
  questionScope,
  questionTags,
  questionVisible,
  type QuestionAuthor,
  type QuestionDto,
  type QuestionOption,
} from "./access";

export class QuestionError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "QuestionError";
    this.code = code;
    this.status = status;
  }
}

type QuestionRow = typeof questions.$inferSelect;

export type QuestionDraft = {
  orgId: string | null;
  productId: string | null;
  category: string;
  questionType: string;
  text: string;
  options: QuestionOption[] | null;
  tags: string[];
  weight: string;
  active: boolean;
};

export type QuestionPatch = {
  category?: string;
  questionType?: string;
  text?: string;
  options?: QuestionOption[] | null;
  tags?: string[];
  weight?: string;
  active?: boolean;
  productId?: string | null;
};

function toDto(actor: QuestionAuthor, row: QuestionRow): QuestionDto {
  return {
    id: row.id,
    orgId: row.orgId,
    scope: questionScope(row.orgId),
    productId: row.productId,
    category: row.category,
    questionType: row.questionType,
    text: row.text,
    options: questionOptions(row.options),
    tags: questionTags(row.tags),
    weight: row.weight == null ? "1" : String(row.weight),
    active: row.active,
    mutable: canMutateQuestion(actor, row),
  };
}

function isForeignKey(error: unknown) {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && (current as { code?: string }).code === "23503") return true;
    current = "cause" in current ? (current as { cause?: unknown }).cause : null;
  }
  return false;
}

async function assertProduct(orgId: string, productId: string | null) {
  if (!productId) return;
  const db = getDb();
  const [product] = await db
    .select({ id: products.id, orgId: products.orgId })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product || product.orgId !== orgId) throw new QuestionError("invalid_product", 400);
}

async function loadRow(id: string) {
  const db = getDb();
  const [row] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return row ?? null;
}

function assertVisibleMutable(actor: QuestionAuthor, row: QuestionRow | null) {
  if (!row || !questionVisible(actor, row)) throw new QuestionError("not_found", 404);
  if (!canMutateQuestion(actor, row)) throw new QuestionError("forbidden", 403);
  return row;
}

export async function listQuestions(actor: QuestionAuthor) {
  const db = getDb();
  const rows = await db
    .select()
    .from(questions)
    .where(or(isNull(questions.orgId), eq(questions.orgId, actor.orgId)))
    .orderBy(desc(questions.createdAt));
  return rows.filter((row) => questionVisible(actor, row)).map((row) => toDto(actor, row));
}

export async function orgAiContext(orgId: string) {
  const db = getDb();
  const [org] = await db
    .select({ features: organizations.features })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const features = (org?.features ?? {}) as {
    aiModel?: string | null;
    salesMethodology?: string | null;
    values?: unknown;
  };
  return {
    aiModel: typeof features.aiModel === "string" ? features.aiModel : null,
    salesMethodology: typeof features.salesMethodology === "string" ? features.salesMethodology : undefined,
    companyValues: questionTags(features.values),
  };
}

export async function existingForCategory(actor: QuestionAuthor, category: string) {
  const db = getDb();
  const rows = await db
    .select({ text: questions.text, tags: questions.tags, category: questions.category, orgId: questions.orgId })
    .from(questions)
    .where(or(isNull(questions.orgId), eq(questions.orgId, actor.orgId)));
  return rows
    .filter((row) => questionVisible(actor, row) && row.category === category)
    .map((row) => ({ text: row.text, tags: questionTags(row.tags) }));
}

async function insertRow(
  actor: QuestionAuthor,
  draft: QuestionDraft,
  tx: Pick<ReturnType<typeof getDb>, "insert">,
) {
  const text = draft.text.trim();
  if (!text) throw new QuestionError("invalid_body", 400);
  if (!isQuestionCategory(draft.category) || !isQuestionType(draft.questionType)) {
    throw new QuestionError("invalid_body", 400);
  }
  if (!canMutateQuestion(actor, { orgId: draft.orgId })) throw new QuestionError("forbidden", 403);
  const [created] = await tx
    .insert(questions)
    .values({
      orgId: draft.orgId,
      productId: draft.productId,
      category: draft.category,
      questionType: draft.questionType,
      text,
      options: draft.options,
      tags: draft.tags,
      weight: draft.weight || "1",
      active: draft.active,
      authorMembershipId: actor.membershipId,
    })
    .returning();
  if (!created) throw new QuestionError("question_unavailable", 500);
  await tx.insert(auditLogs).values({
    orgId: actor.orgId,
    actorMembershipId: actor.membershipId,
    action: "question.create",
    targetType: "question",
    targetId: created.id,
    metadata: { scope: questionScope(created.orgId), category: created.category },
  });
  return toDto(actor, created);
}

export async function insertQuestion(actor: QuestionAuthor, draft: QuestionDraft) {
  await assertProduct(actor.orgId, draft.productId);
  const db = getDb();
  return db.transaction(async (tx) => insertRow(actor, draft, tx));
}

export async function insertGenerated(
  actor: QuestionAuthor,
  orgId: string | null,
  productId: string | null,
  category: string,
  generated: GeneratedQuestion[],
) {
  if (!isQuestionCategory(category)) throw new QuestionError("invalid_body", 400);
  if (!canMutateQuestion(actor, { orgId })) throw new QuestionError("forbidden", 403);
  await assertProduct(actor.orgId, productId);
  const rows: QuestionDraft[] = [];
  for (const item of generated) {
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!text) continue;
    rows.push({
      orgId,
      productId,
      category,
      questionType: isQuestionType(item.questionType) ? item.questionType : "LONG_FORM",
      text,
      options: questionOptions(item.optionsJson),
      tags: questionTags(item.tagsJson),
      weight: "1",
      active: true,
    });
  }
  if (!rows.length) return [];
  const db = getDb();
  return db.transaction(async (tx) => {
    const created: QuestionDto[] = [];
    for (const draft of rows) created.push(await insertRow(actor, draft, tx));
    return created;
  });
}

export async function updateQuestion(actor: QuestionAuthor, id: string, patch: QuestionPatch) {
  const existing = assertVisibleMutable(actor, await loadRow(id));
  const category = patch.category ?? existing.category;
  const questionType = patch.questionType ?? existing.questionType;
  const text = (patch.text ?? existing.text).trim();
  if (!text || !isQuestionCategory(category) || !isQuestionType(questionType)) {
    throw new QuestionError("invalid_body", 400);
  }
  const productId = patch.productId === undefined ? existing.productId : patch.productId;
  await assertProduct(actor.orgId, productId);
  const db = getDb();
  return db.transaction(async (tx) => {
    const [saved] = await tx
      .update(questions)
      .set({
        category,
        questionType,
        text,
        options: patch.options === undefined ? existing.options : patch.options,
        tags: patch.tags ?? questionTags(existing.tags),
        weight: patch.weight ?? String(existing.weight ?? "1"),
        active: patch.active ?? existing.active,
        productId,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, existing.id))
      .returning();
    if (!saved) throw new QuestionError("not_found", 404);
    await tx.insert(auditLogs).values({
      orgId: actor.orgId,
      actorMembershipId: actor.membershipId,
      action: "question.update",
      targetType: "question",
      targetId: saved.id,
      metadata: { scope: questionScope(saved.orgId), category: saved.category },
    });
    return toDto(actor, saved);
  });
}

export async function deleteQuestion(actor: QuestionAuthor, id: string) {
  const existing = assertVisibleMutable(actor, await loadRow(id));
  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(auditLogs).values({
        orgId: actor.orgId,
        actorMembershipId: actor.membershipId,
        action: "question.delete",
        targetType: "question",
        targetId: existing.id,
        metadata: { scope: questionScope(existing.orgId), category: existing.category },
      });
      await tx.delete(questions).where(eq(questions.id, existing.id));
    });
  } catch (error) {
    if (isForeignKey(error)) throw new QuestionError("question_in_use", 409);
    throw error;
  }
}

export async function loadMutableQuestion(actor: QuestionAuthor, id: string) {
  return assertVisibleMutable(actor, await loadRow(id));
}

export async function saveEnhancedOption(
  actor: QuestionAuthor,
  id: string,
  optionIndex: number,
  next: { label: string; tags: string[] },
) {
  const existing = assertVisibleMutable(actor, await loadRow(id));
  const options = questionOptions(existing.options);
  if (existing.questionType !== "MULTIPLE_CHOICE" || !options || !options[optionIndex]) {
    throw new QuestionError("invalid_body", 400);
  }
  const updated = options.map((option, index) =>
    index === optionIndex ? { ...option, label: next.label.trim() || option.label, tags: next.tags } : option,
  );
  return updateQuestion(actor, id, { options: updated });
}
