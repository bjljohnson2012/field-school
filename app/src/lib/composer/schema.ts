import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { memberships, organizations } from "@/lib/db/schema";

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("text"),
    status: text("status").notNull().default("draft"),
    createdByMembershipId: uuid("created_by_membership_id").references(
      () => memberships.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("courses_org_slug").on(t.orgId, t.slug),
    index("courses_org_status_idx").on(t.orgId, t.status),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("draft"),
    createdByMembershipId: uuid("created_by_membership_id").references(
      () => memberships.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("lessons_org_course_slug").on(t.orgId, t.courseId, t.slug),
    index("lessons_org_status_idx").on(t.orgId, t.status),
  ],
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id),
    kind: text("kind").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    url: text("url"),
    bookTitle: text("book_title"),
    fileName: text("file_name"),
    filePath: text("file_path"),
    fileSize: bigint("file_size", { mode: "number" }),
    mime: text("mime"),
    createdByMembershipId: uuid("created_by_membership_id").references(
      () => memberships.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sources_org_idx").on(t.orgId, t.lessonId)],
);

export const knowledgeUnits = pgTable(
  "knowledge_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id),
    lessonId: uuid("lesson_id").references(() => lessons.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("knowledge_units_org_source_idx").on(t.orgId, t.sourceId)],
);

export const quizItems = pgTable(
  "quiz_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    lessonId: uuid("lesson_id").references(() => lessons.id),
    sourceUnitId: uuid("source_unit_id")
      .notNull()
      .references(() => knowledgeUnits.id),
    prompt: text("prompt").notNull(),
    choices: jsonb("choices").notNull().default([]),
    answer: integer("answer").notNull().default(0),
    why: text("why").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quiz_items_org_unit_idx").on(t.orgId, t.sourceUnitId)],
);

export const publishRequests = pgTable(
  "publish_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id),
    requestedByMembershipId: uuid("requested_by_membership_id").references(
      () => memberships.id,
    ),
    status: text("status").notNull().default("approved"),
    decidedByMembershipId: uuid("decided_by_membership_id").references(
      () => memberships.id,
    ),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("publish_requests_org_lesson_idx").on(t.orgId, t.lessonId)],
);
