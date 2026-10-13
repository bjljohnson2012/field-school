import { and, eq } from "drizzle-orm";
import { organizations } from "@/lib/db/schema";
import {
  courseVersions,
  courses,
  lessonVersions,
  lessons,
  modules,
  practice,
} from "@/lib/composer/schema";
import { getDb } from "@/lib/db/client";
import { GROK_BOT_SLUG } from "@/lib/course/types";
import { applyContentModelSqlIfConfigured } from "@/lib/collections/sql";
import {
  exampleCoursePlan,
  projectStoredCourse,
  type StoredCourse,
  type StoredLesson,
} from "@/lib/collections/project-course";
import { parseBlocks, type Block } from "@/lib/collections/content-model";

function asBlocks(value: unknown): Block[] {
  const parsed = parseBlocks(value);
  return parsed.ok ? parsed.blocks : [];
}

async function readStoredCourse(slug: string): Promise<StoredCourse | null> {
  const db = getDb();
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.example, true)))
    .limit(1);
  if (!course) return null;
  const [moduleRow] = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, course.id))
    .limit(1);
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.courseId, course.id), eq(lessons.orgId, course.orgId)));
  const storedLessons: StoredLesson[] = lessonRows.map((lesson) => ({
    orgId: lesson.orgId,
    slug: lesson.slug,
    title: lesson.title,
    order: lesson.sortOrder,
    status: lesson.status === "published" ? "published" : "draft",
    blocks: asBlocks(lesson.blocks),
  }));
  return {
    orgId: course.orgId,
    slug: course.slug,
    title: course.title,
    status: course.status === "published" ? "published" : "draft",
    example: course.example,
    blocks: asBlocks(course.blocks),
    moduleSlug: moduleRow?.slug ?? "the-ladder",
    moduleTitle: moduleRow?.title ?? "The ladder",
    lessons: storedLessons,
    practice: [],
  };
}

export async function ensureExampleCourse() {
  const db = getDb();
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, "field-school"))
    .limit(1);
  if (!org) return null;
  const plan = exampleCoursePlan(org.id);
  const now = new Date();
  const [course] = await db
    .insert(courses)
    .values({
      orgId: plan.orgId,
      slug: plan.slug,
      title: plan.title,
      kind: "video",
      status: "published",
      statusMarker: "published",
      example: true,
      blocks: plan.blocks,
    })
    .onConflictDoUpdate({
      target: [courses.orgId, courses.slug],
      set: {
        title: plan.title,
        status: "published",
        statusMarker: "published",
        example: true,
        blocks: plan.blocks,
        updatedAt: now,
      },
    })
    .returning();
  const [moduleRow] = await db
    .insert(modules)
    .values({
      orgId: plan.orgId,
      courseId: course.id,
      slug: plan.moduleSlug,
      title: plan.moduleTitle,
      sortOrder: 0,
      statusMarker: "published",
    })
    .onConflictDoUpdate({
      target: [modules.orgId, modules.courseId, modules.slug],
      set: { title: plan.moduleTitle, statusMarker: "published", updatedAt: now },
    })
    .returning();
  await db.insert(courseVersions).values({
    orgId: plan.orgId,
    parentId: course.id,
    version: 1,
    snapshot: plan.blocks,
  }).onConflictDoNothing({ target: [courseVersions.parentId, courseVersions.version] });
  for (const lesson of plan.lessons) {
    const text = lesson.blocks.find((block) => block.kind === "text");
    const [row] = await db
      .insert(lessons)
      .values({
        orgId: lesson.orgId,
        courseId: course.id,
        moduleId: moduleRow.id,
        slug: lesson.slug,
        title: lesson.title,
        body: text && text.kind === "text" ? text.text : "",
        status: "published",
        statusMarker: "published",
        sortOrder: lesson.order,
        blocks: lesson.blocks,
      })
      .onConflictDoUpdate({
        target: [lessons.orgId, lessons.courseId, lessons.slug],
        set: {
          moduleId: moduleRow.id,
          title: lesson.title,
          status: "published",
          statusMarker: "published",
          sortOrder: lesson.order,
          blocks: lesson.blocks,
          updatedAt: now,
        },
      })
      .returning();
    await db.insert(lessonVersions).values({
      orgId: lesson.orgId,
      parentId: row.id,
      version: 1,
      snapshot: lesson.blocks,
    }).onConflictDoNothing({ target: [lessonVersions.parentId, lessonVersions.version] });
    for (const item of plan.practice.filter((entry) => entry.lessonSlug === lesson.slug)) {
      await db
        .insert(practice)
        .values({
          orgId: lesson.orgId,
          lessonId: row.id,
          kind: item.kind,
          sortOrder: item.order,
          blockIndex: item.blockIndex,
        })
        .onConflictDoNothing({ target: [practice.lessonId, practice.kind, practice.blockIndex] });
    }
  }
  return course.id;
}

export async function loadCourseForRender(slug: string) {
  const ready = await applyContentModelSqlIfConfigured();
  if (!ready) return null;
  if (slug === GROK_BOT_SLUG) await ensureExampleCourse();
  const stored = await readStoredCourse(slug);
  if (!stored || !stored.orgId.trim()) return null;
  return projectStoredCourse(stored);
}
