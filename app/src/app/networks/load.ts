import { desc, eq } from "drizzle-orm";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { knowledgeUnits, lessons, quizItems, sources } from "@/lib/composer/schema";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import { publishLabel, readableTitle, sourceLabel } from "@/lib/library/knowledge-labels";
import type { KnowledgePiece, RepositoryModel } from "@/lib/library/knowledge-network";
import { lessonProse } from "@/lib/library/teach-from-knowledge";

const HIRER_STANCES = new Set(["admin", "guardian", "trainer", "teacher"]);

export type NetworksLoad =
  | { ok: true; model: RepositoryModel }
  | { ok: false; status: number; error: string };

function excerptOf(body: string) {
  const prose = lessonProse(body).replace(/\s+/g, " ").trim();
  if (prose.length <= 220) return prose;
  return `${prose.slice(0, 219)}…`;
}

export async function loadNetworks(): Promise<NetworksLoad> {
  try {
    const auth = await identityFromRequest();
    if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };
    if (auth.identity.kind === "child") {
      return { ok: false, status: 403, error: "child_has_no_login" };
    }
    if (!HIRER_STANCES.has(auth.identity.stance)) {
      return { ok: false, status: 403, error: "hirer_only" };
    }

    const orgId = auth.identity.orgId;
    const db = getDb();
    const [org] = await db
      .select({ name: organizations.name, slug: organizations.slug })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);
    if (!org) return { ok: false, status: 404, error: "unknown_org" };

    const lessonRows = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        body: lessons.body,
        status: lessons.status,
        updatedAt: lessons.updatedAt,
      })
      .from(lessons)
      .where(eq(lessons.orgId, orgId))
      .orderBy(desc(lessons.updatedAt));

    const unitRows = await db
      .select({
        id: knowledgeUnits.id,
        lessonId: knowledgeUnits.lessonId,
        title: knowledgeUnits.title,
        body: knowledgeUnits.body,
        sortOrder: knowledgeUnits.sortOrder,
      })
      .from(knowledgeUnits)
      .where(eq(knowledgeUnits.orgId, orgId));

    const sourceRows = await db
      .select({ lessonId: sources.lessonId, kind: sources.kind })
      .from(sources)
      .where(eq(sources.orgId, orgId));

    const quizRows = await db
      .select({ lessonId: quizItems.lessonId, sourceUnitId: quizItems.sourceUnitId })
      .from(quizItems)
      .where(eq(quizItems.orgId, orgId));

    const quizzesByUnit = new Map<string, number>();
    const quizzesByLesson = new Map<string, number>();
    for (const row of quizRows) {
      quizzesByUnit.set(row.sourceUnitId, (quizzesByUnit.get(row.sourceUnitId) ?? 0) + 1);
      if (row.lessonId) quizzesByLesson.set(row.lessonId, (quizzesByLesson.get(row.lessonId) ?? 0) + 1);
    }
    const kindByLesson = new Map<string, string>();
    for (const row of sourceRows) {
      if (!kindByLesson.has(row.lessonId)) kindByLesson.set(row.lessonId, row.kind);
    }

    const unitsByLesson = new Map<string, typeof unitRows>();
    const loose: typeof unitRows = [];
    const lessonIds = new Set(lessonRows.map((row) => row.id));
    for (const unit of unitRows) {
      if (!unit.lessonId || !lessonIds.has(unit.lessonId)) {
        loose.push(unit);
        continue;
      }
      const list = unitsByLesson.get(unit.lessonId) ?? [];
      list.push(unit);
      unitsByLesson.set(unit.lessonId, list);
    }

    const pieces: KnowledgePiece[] = lessonRows.map((lesson) => {
      const excerpt = excerptOf(lesson.body);
      const units = (unitsByLesson.get(lesson.id) ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((unit) => {
          const unitExcerpt = excerptOf(unit.body);
          return {
            id: unit.id,
            title: readableTitle(unit.title, unitExcerpt),
            excerpt: unitExcerpt,
            quizCount: quizzesByUnit.get(unit.id) ?? 0,
          };
        });
      return {
        id: lesson.id,
        title: readableTitle(lesson.title, excerpt),
        excerpt,
        href: `/o/${org.slug}/teach/${lesson.id}`,
        generated: (quizzesByLesson.get(lesson.id) ?? 0) > 0,
        statusLabel: publishLabel(lesson.status),
        sourceLabel: sourceLabel(kindByLesson.get(lesson.id) ?? ""),
        units,
      };
    });

    for (const unit of loose) {
      const quizCount = quizzesByUnit.get(unit.id) ?? 0;
      const excerpt = excerptOf(unit.body);
      const title = readableTitle(unit.title, excerpt);
      pieces.push({
        id: unit.id,
        title,
        excerpt,
        href: null,
        generated: quizCount > 0,
        statusLabel: "Unpublished",
        sourceLabel: "Note",
        units: [{ id: unit.id, title, excerpt, quizCount }],
      });
    }

    return {
      ok: true,
      model: { orgName: org.name, orgSlug: org.slug, pieces },
    };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return { ok: false, status: 503, error: "database_unavailable" };
    }
    throw error;
  }
}
