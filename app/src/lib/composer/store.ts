import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { canRead } from "@/lib/tenancy/access";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import {
  lessonFromComposer,
  parseBlocks,
  publishLesson as publishContentLesson,
  replaceTextBlock,
  type Block,
} from "@/lib/collections/content-model";
import { applyContentModelSql } from "@/lib/collections/sql";
import {
  courses,
  knowledgeUnits,
  lessons,
  publishRequests,
  quizItems,
  sources,
} from "./schema";
import { canSeeDrafts, isSourceKind, slugify, type SourceKind } from "./rules";
import { unitsFromSuppliedText } from "./units";
import { assertFileBudget, writeOrgUpload } from "./uploads";

export type LessonRow = typeof lessons.$inferSelect;
export type SourceRow = typeof sources.$inferSelect;
export type UnitRow = typeof knowledgeUnits.$inferSelect;
export type QuizRow = typeof quizItems.$inferSelect;

function uniqueSlug(base: string, n: number) {
  return n === 0 ? base : `${base}-${n}`;
}

export async function orgUploadBytes(orgId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      used: sql<number>`coalesce(sum(${sources.fileSize}), 0)`,
    })
    .from(sources)
    .where(eq(sources.orgId, orgId));
  return Number(row?.used ?? 0);
}

export async function listLessons(identity: LearnerIdentity) {
  const db = getDb();
  const rows = await db
    .select({
      lesson: lessons,
      courseTitle: courses.title,
      courseKind: courses.kind,
    })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(lessons.orgId, identity.orgId));
  const drafts = canSeeDrafts(identity);
  const actor = { orgId: identity.orgId, memberKind: identity.kind };
  return rows
    .filter((row) => canRead(actor, { orgId: row.lesson.orgId }))
    .filter((row) => drafts || row.lesson.status === "published")
    .map((row) => ({
      id: row.lesson.id,
      title: row.lesson.title,
      slug: row.lesson.slug,
      status: row.lesson.status,
      kind: row.courseKind,
      courseTitle: row.courseTitle,
      courseId: row.lesson.courseId,
      updatedAt: row.lesson.updatedAt,
    }));
}

export async function getLessonDetail(identity: LearnerIdentity, lessonId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      lesson: lessons,
      course: courses,
    })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(and(eq(lessons.id, lessonId), eq(lessons.orgId, identity.orgId)))
    .limit(1);
  if (!row) return null;
  if (!canRead({ orgId: identity.orgId, memberKind: identity.kind }, { orgId: row.lesson.orgId })) return null;
  if (row.lesson.status !== "published" && !canSeeDrafts(identity)) return null;
  const sourceRows = await db
    .select()
    .from(sources)
    .where(and(eq(sources.lessonId, lessonId), eq(sources.orgId, identity.orgId)));
  const unitRows = await db
    .select()
    .from(knowledgeUnits)
    .where(and(eq(knowledgeUnits.lessonId, lessonId), eq(knowledgeUnits.orgId, identity.orgId)));
  const quizRows = await db
    .select()
    .from(quizItems)
    .where(and(eq(quizItems.lessonId, lessonId), eq(quizItems.orgId, identity.orgId)));
  return {
    lesson: row.lesson,
    course: row.course,
    sources: sourceRows,
    units: unitRows,
    quiz: quizRows,
  };
}

async function gateStoredLesson(lesson: LessonRow): Promise<
  { ok: true; blocks: Block[] } | { ok: false; error: string }
> {
  const db = getDb();
  const quiz = await db
    .select()
    .from(quizItems)
    .where(and(eq(quizItems.lessonId, lesson.id), eq(quizItems.orgId, lesson.orgId)));
  const parsed = parseBlocks(lesson.blocks);
  let blocks: Block[] = parsed.ok ? parsed.blocks : [];
  if (!blocks.some((block) => block.kind === "text")) {
    blocks = replaceTextBlock(blocks, lesson.body);
  }
  if (!blocks.some((block) => block.kind === "quiz") && quiz.length > 0) {
    blocks = [
      ...blocks,
      {
        kind: "quiz",
        questions: quiz.map((item) => ({
          id: item.id,
          prompt: item.prompt,
          choices: Array.isArray(item.choices)
            ? item.choices.filter((choice): choice is string => typeof choice === "string")
            : [],
          answer: item.answer,
          why: item.why,
          sourceUnitId: item.sourceUnitId,
        })),
      },
    ];
  }
  const checked = parseBlocks(blocks);
  if (!checked.ok) return checked;
  const gated = publishContentLesson({
    orgId: lesson.orgId,
    moduleSlug: "composer",
    slug: lesson.slug,
    title: lesson.title,
    status: "draft",
    blocks: checked.blocks,
    outcomeIds: Array.isArray(lesson.outcomeIds) ? lesson.outcomeIds : [],
  });
  if (!gated.ok) return gated;
  return { ok: true, blocks: gated.lesson.blocks };
}

export async function createLesson(
  identity: LearnerIdentity,
  input: {
    title: string;
    kind: SourceKind;
    body: string;
    url?: string;
    bookTitle?: string;
  },
) {
  await applyContentModelSql();
  const db = getDb();
  const title = input.title.trim() || "Untitled lesson";
  let slug = slugify(title);
  for (let n = 0; n < 8; n += 1) {
    const trySlug = uniqueSlug(slug, n);
    const clash = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.orgId, identity.orgId), eq(courses.slug, trySlug)))
      .limit(1);
    if (!clash[0]) {
      slug = trySlug;
      break;
    }
  }
  const drafted = lessonFromComposer({
    orgId: identity.orgId,
    moduleSlug: "composer",
    slug,
    title,
    body: input.body,
    quizItems: [],
  });
  if (!drafted.ok) return { error: drafted.error };
  const [course] = await db
    .insert(courses)
    .values({
      orgId: identity.orgId,
      slug,
      title,
      kind: input.kind,
      status: "draft",
      statusMarker: "draft",
      blocks: [],
      createdByMembershipId: identity.membershipId,
    })
    .returning();
  const [lesson] = await db
    .insert(lessons)
    .values({
      orgId: identity.orgId,
      courseId: course.id,
      slug,
      title,
      body: input.body,
      status: "draft",
      statusMarker: "draft",
      blocks: drafted.lesson.blocks,
      createdByMembershipId: identity.membershipId,
    })
    .returning();
  const [source] = await db
    .insert(sources)
    .values({
      orgId: identity.orgId,
      lessonId: lesson.id,
      kind: input.kind,
      title,
      body: input.body,
      url: input.kind === "link" ? input.url?.trim() || null : null,
      bookTitle: input.kind === "book" ? input.bookTitle?.trim() || title : null,
      createdByMembershipId: identity.membershipId,
    })
    .returning();
  const units = unitsFromSuppliedText(input.body);
  const insertedUnits =
    units.length === 0
      ? []
      : await db
          .insert(knowledgeUnits)
          .values(
            units.map((unit) => ({
              orgId: identity.orgId,
              sourceId: source.id,
              lessonId: lesson.id,
              title: unit.title,
              body: unit.body,
              sortOrder: unit.sortOrder,
            })),
          )
          .returning();
  return { course, lesson, source, units: insertedUnits };
}

export async function updateLessonCopy(
  identity: LearnerIdentity,
  input: { lessonId: string; title?: string; body?: string; status?: "published" | "draft" },
) {
  await applyContentModelSql();
  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, input.lessonId), eq(lessons.orgId, identity.orgId)))
    .limit(1);
  if (!lesson) return { error: "unknown_lesson" as const };
  const title = input.title?.replace(/\s+/g, " ").trim().slice(0, 180) || lesson.title;
  const body = typeof input.body === "string" ? input.body.slice(0, 20000) : lesson.body;
  const status = input.status === "published" || input.status === "draft" ? input.status : lesson.status;
  const parsed = parseBlocks(lesson.blocks);
  let blocks = replaceTextBlock(parsed.ok ? parsed.blocks : [], body);
  if (status === "published") {
    const gate = await gateStoredLesson({ ...lesson, title, body, blocks });
    if (!gate.ok) return { error: gate.error };
    blocks = gate.blocks;
  }
  const now = new Date();
  const [updated] = await db
    .update(lessons)
    .set({ title, body, status, statusMarker: status, blocks, updatedAt: now })
    .where(and(eq(lessons.id, lesson.id), eq(lessons.orgId, identity.orgId)))
    .returning();
  if (!updated) return { error: "unknown_lesson" as const };
  await db
    .update(courses)
    .set({ title, status, statusMarker: status, updatedAt: now })
    .where(and(eq(courses.id, lesson.courseId), eq(courses.orgId, identity.orgId)));
  return { lesson: updated };
}

export async function updateKnowledgeUnit(
  identity: LearnerIdentity,
  input: { unitId: string; title: string; body: string },
) {
  const title = input.title.replace(/\s+/g, " ").trim().slice(0, 180);
  const body = input.body.trim().slice(0, 8000);
  if (title.length < 2 || body.length < 2) return { error: "needs_more" as const };
  const db = getDb();
  const [updated] = await db
    .update(knowledgeUnits)
    .set({ title, body })
    .where(and(eq(knowledgeUnits.id, input.unitId), eq(knowledgeUnits.orgId, identity.orgId)))
    .returning({ id: knowledgeUnits.id });
  if (!updated) return { error: "unknown_unit" as const };
  return { unit: updated };
}

export async function addSource(
  identity: LearnerIdentity,
  input: {
    lessonId: string;
    kind: string;
    title?: string;
    body: string;
    url?: string;
    bookTitle?: string;
    file?: { name: string; type: string; bytes: Uint8Array } | null;
  },
) {
  if (!isSourceKind(input.kind)) return { error: "invalid_kind" as const };
  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, input.lessonId), eq(lessons.orgId, identity.orgId)))
    .limit(1);
  if (!lesson) return { error: "unknown_lesson" as const };
  if (input.kind === "upload" && input.file) {
    const used = await orgUploadBytes(identity.orgId);
    const budget = assertFileBudget(input.file.bytes.byteLength, used);
    if (budget) return { error: budget };
  }
  const [source] = await db
    .insert(sources)
    .values({
      orgId: identity.orgId,
      lessonId: lesson.id,
      kind: input.kind,
      title: input.title?.trim() || lesson.title,
      body: input.body,
      url: input.kind === "link" ? input.url?.trim() || null : null,
      bookTitle: input.kind === "book" ? input.bookTitle?.trim() || null : null,
      fileName: input.file?.name ?? null,
      fileSize: input.file ? input.file.bytes.byteLength : null,
      mime: input.file?.type || null,
      createdByMembershipId: identity.membershipId,
    })
    .returning();
  if (input.file) {
    const path = writeOrgUpload({
      orgId: identity.orgId,
      sourceId: source.id,
      fileName: input.file.name,
      bytes: input.file.bytes,
    });
    await db.update(sources).set({ filePath: path }).where(eq(sources.id, source.id));
    source.filePath = path;
  }
  const units = unitsFromSuppliedText(input.body);
  const insertedUnits =
    units.length === 0
      ? []
      : await db
          .insert(knowledgeUnits)
          .values(
            units.map((unit) => ({
              orgId: identity.orgId,
              sourceId: source.id,
              lessonId: lesson.id,
              title: unit.title,
              body: unit.body,
              sortOrder: unit.sortOrder,
            })),
          )
          .returning();
  return { source, units: insertedUnits };
}

export async function addQuizItem(
  identity: LearnerIdentity,
  input: {
    lessonId: string;
    sourceUnitId?: string;
    prompt: string;
    choices: string[];
    answer: number;
    why?: string;
  },
) {
  const unitId = input.sourceUnitId?.trim() || "";
  if (!unitId) return { error: "source_unit_id_required" as const };
  const db = getDb();
  const [unit] = await db
    .select()
    .from(knowledgeUnits)
    .where(and(eq(knowledgeUnits.id, unitId), eq(knowledgeUnits.orgId, identity.orgId)))
    .limit(1);
  if (!unit) return { error: "unknown_unit" as const };
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, input.lessonId), eq(lessons.orgId, identity.orgId)))
    .limit(1);
  if (!lesson) return { error: "unknown_lesson" as const };
  const [row] = await db
    .insert(quizItems)
    .values({
      orgId: identity.orgId,
      lessonId: lesson.id,
      sourceUnitId: unit.id,
      prompt: input.prompt.trim(),
      choices: input.choices,
      answer: input.answer,
      why: input.why?.trim() || "",
    })
    .returning();
  return { item: row };
}

export async function publishLesson(identity: LearnerIdentity, lessonId: string) {
  await applyContentModelSql();
  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.orgId, identity.orgId)))
    .limit(1);
  if (!lesson) return { error: "unknown_lesson" as const };
  if (!canRead({ orgId: identity.orgId, memberKind: identity.kind }, { orgId: lesson.orgId })) {
    return { error: "unknown_lesson" as const };
  }
  const gate = await gateStoredLesson(lesson);
  if (!gate.ok) return { error: gate.error };
  const now = new Date();
  const [updated] = await db
    .update(lessons)
    .set({ status: "published", statusMarker: "published", blocks: gate.blocks, updatedAt: now })
    .where(and(eq(lessons.id, lesson.id), eq(lessons.orgId, identity.orgId)))
    .returning();
  await db
    .update(courses)
    .set({ status: "published", statusMarker: "published", updatedAt: now })
    .where(and(eq(courses.id, lesson.courseId), eq(courses.orgId, identity.orgId)));
  const [request] = await db
    .insert(publishRequests)
    .values({
      orgId: identity.orgId,
      lessonId: lesson.id,
      requestedByMembershipId: identity.membershipId,
      status: "approved",
      decidedByMembershipId: identity.membershipId,
      decidedAt: now,
    })
    .returning();
  return { lesson: updated, request };
}

export async function getSourceForOrg(orgId: string, sourceId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      source: sources,
      lessonStatus: lessons.status,
    })
    .from(sources)
    .innerJoin(lessons, eq(lessons.id, sources.lessonId))
    .where(and(eq(sources.id, sourceId), eq(sources.orgId, orgId)))
    .limit(1);
  return row ?? null;
}

export async function sourceExistsInOtherOrg(sourceId: string, orgId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: sources.id, orgId: sources.orgId })
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);
  if (!row) return { exists: false, otherOrg: false };
  return { exists: true, otherOrg: row.orgId !== orgId };
}
