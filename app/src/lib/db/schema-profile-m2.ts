import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { members } from "./schema";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/** 0019. One row per track attempt. `answers` is non-empty only while status is in_progress. */
export const assessmentRuns = pgTable(
  "assessment_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    track: text("track").notNull(),
    status: text("status").notNull().default("in_progress"),
    bankVersion: text("bank_version").notNull(),
    prior: jsonb("prior").notNull(),
    answers: jsonb("answers").notNull().default([]),
    answersHash: text("answers_hash"),
    questionsAsked: integer("questions_asked").notNull().default(0),
    resumeItemKey: text("resume_item_key"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    gateRecordedAt: timestamp("gate_recorded_at", { withTimezone: true }),
  },
  (t) => [index("assessment_runs_member_idx").on(t.memberId, t.track, t.completedAt)],
);

/** 0019. A taxonomy placement is stored once it is locked, or unsettled at the end of a run. */
export const assessmentPlacements = pgTable(
  "assessment_placements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => assessmentRuns.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    track: text("track").notNull(),
    taxonomy: text("taxonomy").notNull(),
    category: text("category").notNull(),
    confidencePct: numeric("confidence_pct", { precision: 4, scale: 1 }).notNull(),
    locked: boolean("locked").notNull(),
    unsettled: boolean("unsettled").notNull(),
    answered: integer("answered").notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("assessment_placements_run_taxonomy").on(t.runId, t.taxonomy),
    index("assessment_placements_member_idx").on(t.memberId, t.track, t.taxonomy),
  ],
);

/** 0020. Campus-stored, metadata-stripped image bytes. `sourceUrl` is provenance only and is never served. */
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerMemberId: uuid("owner_member_id")
      .notNull()
      .references(() => members.id),
    purpose: text("purpose").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sha256: text("sha256").notNull(),
    bytes: bytea("bytes").notNull(),
    sourceKind: text("source_kind").notNull(),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("media_owner").on(t.id, t.ownerMemberId)],
);

/** 0020. One campus skill catalog; `matchKey` is the normalized name every lookup compares. */
export const profileSkills = pgTable("profile_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  matchKey: text("match_key").notNull().unique(),
  aliases: jsonb("aliases").notNull().default([]),
  origin: text("origin").notNull(),
  createdByMemberId: uuid("created_by_member_id").references(() => members.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profileSkillLinks = pgTable(
  "profile_skill_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => profileSkills.id),
    level: text("level"),
    notes: text("notes").notNull().default(""),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    importedAt: timestamp("imported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("profile_skill_links_member_skill").on(t.memberId, t.skillId)],
);

export const profileProjects = pgTable("profile_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  link: text("link").notNull().default(""),
  description: text("description").notNull().default(""),
  createdByMemberId: uuid("created_by_member_id")
    .notNull()
    .references(() => members.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profileProjectLinks = pgTable(
  "profile_project_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => profileProjects.id),
    matchKey: text("match_key").notNull(),
    role: text("role").notNull().default(""),
    startedOn: text("started_on"),
    endedOn: text("ended_on"),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    importedAt: timestamp("imported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("profile_project_links_member_project").on(t.memberId, t.projectId),
    unique("profile_project_links_member_name").on(t.memberId, t.matchKey),
  ],
);

/** 0020. Imported or typed profile lines that are neither a skill nor a project. */
export const profileEntries = pgTable(
  "profile_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    organization: text("organization").notNull().default(""),
    startedOn: text("started_on"),
    endedOn: text("ended_on"),
    matchKey: text("match_key").notNull(),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    importedAt: timestamp("imported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("profile_entries_member_item").on(t.memberId, t.kind, t.matchKey)],
);
