import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  isolation: text("isolation").notNull(),
  host: text("host"),
  features: jsonb("features").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("adult"),
  authUserId: text("auth_user_id"),
  mode: text("mode").notNull().default("none"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    stance: text("stance").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("memberships_org_member").on(t.orgId, t.memberId)],
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("groups_org_slug").on(t.orgId, t.slug)],
);

export const groupMemberships = pgTable(
  "group_memberships",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.membershipId] })],
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    objectType: text("object_type").notNull(),
    objectId: text("object_id").notNull(),
    status: text("status").notNull().default("open"),
    raw: jsonb("raw").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assignments_membership_idx").on(t.orgId, t.membershipId, t.objectId)],
);

export const learningEvents = pgTable(
  "learning_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    actorMembershipId: uuid("actor_membership_id")
      .notNull()
      .references(() => memberships.id),
    actorStance: text("actor_stance").notNull(),
    kind: text("kind").notNull(),
    objectType: text("object_type").notNull(),
    objectId: text("object_id").notNull(),
    skillIds: text("skill_ids").array().notNull().default([]),
    score: numeric("score"),
    raw: jsonb("raw").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("learning_events_membership_idx").on(t.orgId, t.membershipId, t.createdAt),
    index("learning_events_object_idx").on(
      t.orgId,
      t.membershipId,
      t.objectType,
      t.objectId,
    ),
  ],
);

export const instruments = pgTable("instruments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  likertMin: integer("likert_min").notNull().default(1),
  likertMax: integer("likert_max").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const instrumentItems = pgTable(
  "instrument_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instrumentId: uuid("instrument_id")
      .notNull()
      .references(() => instruments.id),
    itemKey: text("item_key").notNull(),
    prompt: text("prompt").notNull(),
    correspondence: text("correspondence").notNull(),
    weights: jsonb("weights").notNull().default({}),
    reverseScored: boolean("reverse_scored").notNull().default(false),
    childSubset: boolean("child_subset").notNull().default(false),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("instrument_items_key").on(t.instrumentId, t.itemKey)],
);

export const wards = pgTable(
  "wards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    guardianMembershipId: uuid("guardian_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("wards_unique").on(t.orgId, t.guardianMembershipId, t.childMembershipId),
  ],
);

export const memberProfiles = pgTable(
  "member_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    instrumentSlug: text("instrument_slug").notNull().default("fp-50-v1"),
    bearingDeg: numeric("bearing_deg").notNull().default("0"),
    bearingPrimary: text("bearing_primary"),
    bearingSecondary: text("bearing_secondary"),
    correspondence: jsonb("correspondence").notNull().default({}),
    narratives: jsonb("narratives").notNull().default({}),
    locked: boolean("locked").notNull().default(false),
    lockedByMembershipId: uuid("locked_by_membership_id").references(
      () => memberships.id,
    ),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    evidenceSummary: text("evidence_summary"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("member_profiles_membership").on(t.orgId, t.membershipId)],
);

export const memberProfileRevisions = pgTable(
  "member_profile_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => memberProfiles.id),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    cause: text("cause").notNull(),
    bearingDeg: numeric("bearing_deg").notNull(),
    correspondence: jsonb("correspondence").notNull(),
    narratives: jsonb("narratives").notNull(),
    raw: jsonb("raw").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("member_profile_revisions_profile_idx").on(t.profileId, t.createdAt)],
);

export const instrumentRuns = pgTable("instrument_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  membershipId: uuid("membership_id")
    .notNull()
    .references(() => memberships.id),
  instrumentSlug: text("instrument_slug").notNull(),
  subset: text("subset").notNull(),
  answers: jsonb("answers").notNull(),
  correspondence: jsonb("correspondence").notNull(),
  bearingDeg: numeric("bearing_deg").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profileArtifacts = pgTable("profile_artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  membershipId: uuid("membership_id")
    .notNull()
    .references(() => memberships.id),
  kind: text("kind").notNull(),
  transcript: text("transcript").notNull().default(""),
  inferred: jsonb("inferred").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    rubric: jsonb("rubric"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("skills_org_slug").on(t.orgId, t.slug)],
);

export const skillObservations = pgTable(
  "skill_observations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    artifactId: uuid("artifact_id").references(() => profileArtifacts.id),
    score: numeric("score"),
    evidence: text("evidence"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("skill_observations_membership_idx").on(t.orgId, t.membershipId, t.skillId),
  ],
);

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull(),
  stance: text("stance").notNull().default("learner"),
  token: text("token").notNull().unique(),
  invitedByMembershipId: uuid("invited_by_membership_id").references(
    () => memberships.id,
  ),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skillStates = pgTable(
  "skill_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id),
    score: numeric("score"),
    raw: jsonb("raw").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("skill_states_unique").on(t.orgId, t.membershipId, t.skillId)],
);

export const skillItems = pgTable("skill_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id),
  prompt: text("prompt").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningIntents = pgTable(
  "learning_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    version: integer("version").notNull(),
    goals: jsonb("goals").notNull().default([]),
    subjects: jsonb("subjects").notNull().default([]),
    themes: jsonb("themes").notNull().default([]),
    timeHorizon: text("time_horizon").notNull().default(""),
    constraints: jsonb("constraints").notNull().default([]),
    tags: jsonb("tags").notNull().default({}),
    supersedesId: uuid("supersedes_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("learning_intents_child_version").on(t.orgId, t.childMembershipId, t.version),
    index("learning_intents_child_idx").on(t.orgId, t.childMembershipId, t.version),
    index("learning_intents_parent_child_idx").on(
      t.orgId,
      t.parentMembershipId,
      t.childMembershipId,
      t.version,
    ),
  ],
);

export const curriculumPaths = pgTable(
  "curriculum_paths",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    intentId: uuid("intent_id").references(() => learningIntents.id),
    version: integer("version").notNull(),
    status: text("status").notNull().default("proposed"),
    prompt: text("prompt").notNull().default(""),
    progress: jsonb("progress").notNull().default({}),
    supersedesId: uuid("supersedes_id"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("curriculum_paths_child_version").on(t.orgId, t.childMembershipId, t.version),
    index("curriculum_paths_child_idx").on(t.orgId, t.childMembershipId, t.version),
    index("curriculum_paths_parent_child_idx").on(
      t.orgId,
      t.parentMembershipId,
      t.childMembershipId,
      t.version,
    ),
  ],
);

export const curriculumPathItems = pgTable(
  "curriculum_path_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    pathId: uuid("path_id")
      .notNull()
      .references(() => curriculumPaths.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    sortOrder: integer("sort_order").notNull(),
    title: text("title").notNull(),
    subject: text("subject").notNull().default(""),
    kind: text("kind").notNull().default("station"),
    reason: text("reason").notNull().default(""),
    source: text("source").notNull().default("intent"),
    composerLessonId: uuid("composer_lesson_id"),
    composerUnitId: uuid("composer_unit_id"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("curriculum_path_items_order").on(t.pathId, t.sortOrder),
    index("curriculum_path_items_child_idx").on(
      t.orgId,
      t.childMembershipId,
      t.pathId,
      t.sortOrder,
    ),
    index("curriculum_path_items_catalog_idx").on(
      t.orgId,
      t.childMembershipId,
      t.composerLessonId,
    ),
  ],
);

export const nextPortions = pgTable(
  "next_portions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    pathId: uuid("path_id").references(() => curriculumPaths.id),
    intentId: uuid("intent_id").references(() => learningIntents.id),
    version: integer("version").notNull(),
    status: text("status").notNull().default("suggested"),
    horizon: text("horizon").notNull().default("week"),
    title: text("title").notNull(),
    reason: text("reason").notNull().default(""),
    remaining: jsonb("remaining").notNull().default({}),
    progress: jsonb("progress").notNull().default({}),
    supersedesId: uuid("supersedes_id"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("next_portions_child_version").on(t.orgId, t.childMembershipId, t.version),
    index("next_portions_child_idx").on(t.orgId, t.childMembershipId, t.version),
    index("next_portions_parent_child_idx").on(
      t.orgId,
      t.parentMembershipId,
      t.childMembershipId,
      t.version,
    ),
  ],
);

export const nextPortionItems = pgTable(
  "next_portion_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    portionId: uuid("portion_id")
      .notNull()
      .references(() => nextPortions.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    pathItemId: uuid("path_item_id"),
    sortOrder: integer("sort_order").notNull(),
    title: text("title").notNull(),
    subject: text("subject").notNull().default(""),
    reason: text("reason").notNull().default(""),
    source: text("source").notNull().default("remaining"),
    composerLessonId: uuid("composer_lesson_id"),
    composerUnitId: uuid("composer_unit_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("next_portion_items_order").on(t.portionId, t.sortOrder),
    index("next_portion_items_child_idx").on(
      t.orgId,
      t.childMembershipId,
      t.portionId,
      t.sortOrder,
    ),
  ],
);

export const progressLedgers = pgTable(
  "progress_ledgers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    pathId: uuid("path_id").references(() => curriculumPaths.id),
    portionId: uuid("portion_id").references(() => nextPortions.id),
    intentId: uuid("intent_id").references(() => learningIntents.id),
    version: integer("version").notNull(),
    status: text("status").notNull().default("current"),
    summary: jsonb("summary").notNull().default({}),
    progress: jsonb("progress").notNull().default({}),
    supersedesId: uuid("supersedes_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("progress_ledgers_child_version").on(t.orgId, t.childMembershipId, t.version),
    index("progress_ledgers_child_idx").on(t.orgId, t.childMembershipId, t.version),
    index("progress_ledgers_parent_child_idx").on(
      t.orgId,
      t.parentMembershipId,
      t.childMembershipId,
      t.version,
    ),
  ],
);

export const progressLedgerUnits = pgTable(
  "progress_ledger_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    ledgerId: uuid("ledger_id")
      .notNull()
      .references(() => progressLedgers.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id")
      .notNull()
      .references(() => memberships.id),
    pathItemId: uuid("path_item_id"),
    portionItemId: uuid("portion_item_id"),
    sortOrder: integer("sort_order").notNull(),
    title: text("title").notNull(),
    subject: text("subject").notNull().default(""),
    status: text("status").notNull().default("recommended"),
    source: text("source").notNull().default("refresh"),
    confidence: text("confidence").notNull().default(""),
    flag: text("flag").notNull().default(""),
    composerLessonId: uuid("composer_lesson_id"),
    composerUnitId: uuid("composer_unit_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("progress_ledger_units_order").on(t.ledgerId, t.sortOrder),
    index("progress_ledger_units_child_idx").on(
      t.orgId,
      t.childMembershipId,
      t.ledgerId,
      t.sortOrder,
    ),
  ],
);

export const growthUnits = pgTable(
  "growth_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    kind: text("kind").notNull(),
    title: text("title").notNull().default(""),
    status: text("status").notNull().default("current"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("growth_units_child_idx").on(t.orgId, t.kind, t.childMembershipId),
    index("growth_units_parent_idx").on(t.orgId, t.parentMembershipId, t.kind),
  ],
);

export const knowledgeBrains = pgTable(
  "knowledge_brains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    growthUnitId: uuid("growth_unit_id")
      .notNull()
      .references(() => growthUnits.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    version: integer("version").notNull(),
    status: text("status").notNull().default("current"),
    intent: jsonb("intent").notNull().default({}),
    paths: jsonb("paths").notNull().default({}),
    progress: jsonb("progress").notNull().default({}),
    summary: jsonb("summary").notNull().default({}),
    supersedesId: uuid("supersedes_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("knowledge_brains_unit_version").on(t.orgId, t.growthUnitId, t.version),
    index("knowledge_brains_unit_idx").on(t.orgId, t.growthUnitId, t.version),
    index("knowledge_brains_child_idx").on(t.orgId, t.childMembershipId, t.version),
  ],
);

export const brainSources = pgTable(
  "brain_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    growthUnitId: uuid("growth_unit_id")
      .notNull()
      .references(() => growthUnits.id),
    brainId: uuid("brain_id")
      .notNull()
      .references(() => knowledgeBrains.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    sortOrder: integer("sort_order").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    uri: text("uri").notNull().default(""),
    composerSourceId: uuid("composer_source_id"),
    composerUnitId: uuid("composer_unit_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("brain_sources_order").on(t.brainId, t.sortOrder),
    index("brain_sources_unit_idx").on(t.orgId, t.growthUnitId, t.brainId, t.sortOrder),
  ],
);

export const brainNotes = pgTable(
  "brain_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    growthUnitId: uuid("growth_unit_id")
      .notNull()
      .references(() => growthUnits.id),
    brainId: uuid("brain_id")
      .notNull()
      .references(() => knowledgeBrains.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    sortOrder: integer("sort_order").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    uri: text("uri").notNull().default(""),
    composerSourceId: uuid("composer_source_id"),
    composerUnitId: uuid("composer_unit_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("brain_notes_order").on(t.brainId, t.sortOrder),
    index("brain_notes_unit_idx").on(t.orgId, t.growthUnitId, t.brainId, t.sortOrder),
  ],
);

export const brainArtifacts = pgTable(
  "brain_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    growthUnitId: uuid("growth_unit_id")
      .notNull()
      .references(() => growthUnits.id),
    brainId: uuid("brain_id")
      .notNull()
      .references(() => knowledgeBrains.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    sortOrder: integer("sort_order").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    uri: text("uri").notNull().default(""),
    composerSourceId: uuid("composer_source_id"),
    composerUnitId: uuid("composer_unit_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("brain_artifacts_order").on(t.brainId, t.sortOrder),
    index("brain_artifacts_unit_idx").on(t.orgId, t.growthUnitId, t.brainId, t.sortOrder),
  ],
);

export const credits = pgTable(
  "credits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    growthUnitId: uuid("growth_unit_id").references(() => growthUnits.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    mode: text("mode").notNull().default("platform"),
    status: text("status").notNull().default("current"),
    units: integer("units").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("credits_parent_idx").on(t.orgId, t.parentMembershipId, t.mode),
  ],
);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    creditId: uuid("credit_id")
      .notNull()
      .references(() => credits.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    growthUnitId: uuid("growth_unit_id").references(() => growthUnits.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    eventName: text("event_name").notNull(),
    direction: text("direction").notNull(),
    units: integer("units").notNull().default(0),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("credit_ledger_account_idx").on(t.orgId, t.creditId, t.createdAt),
    index("credit_ledger_event_idx").on(t.orgId, t.eventName, t.createdAt),
  ],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    creditId: uuid("credit_id")
      .notNull()
      .references(() => credits.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    growthUnitId: uuid("growth_unit_id").references(() => growthUnits.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
    eventName: text("event_name").notNull(),
    units: integer("units").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("usage_events_account_idx").on(t.orgId, t.creditId, t.createdAt),
    index("usage_events_name_idx").on(t.orgId, t.eventName, t.createdAt),
  ],
);

export const customerApiKeys = pgTable(
  "customer_api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => memberships.id),
    creditId: uuid("credit_id").references(() => credits.id),
    provider: text("provider").notNull().default(""),
    status: text("status").notNull().default("active"),
    last4: text("last4").notNull().default(""),
    fingerprint: text("fingerprint").notNull().default(""),
    wrapAlg: text("wrap_alg").notNull().default("aes-256-gcm"),
    wrapKid: text("wrap_kid").notNull().default("v1"),
    wrapIv: text("wrap_iv").notNull().default(""),
    wrapTag: text("wrap_tag").notNull().default(""),
    wrappedCiphertext: text("wrapped_ciphertext").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("customer_api_keys_parent_idx").on(t.orgId, t.parentMembershipId, t.status)],
);

export const livingBrains = pgTable("living_brains", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id),
  room: text("room").notNull(),
  facts: text("facts").notNull().default(""),
  outcome: text("outcome").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const livingProfiles = pgTable(
  "living_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    name: text("name").notNull().default(""),
    kind: text("kind").notNull().default(""),
    login: text("login").notNull(),
    profile: text("profile").notNull().default(""),
    outcomes: text("outcomes").notNull().default(""),
    ownsOutcomes: boolean("owns_outcomes").notNull().default(false),
    history: text("history").notNull().default("[]"),
    confidence: text("confidence").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("living_profiles_org_member").on(t.orgId, t.membershipId),
    index("living_profiles_org_idx").on(t.orgId, t.membershipId),
  ],
);

export const plateRenders = pgTable(
  "plate_renders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    composition: text("composition").notNull(),
    dest: text("dest").notNull(),
    sha256: text("sha256").notNull().default(""),
    status: text("status").notNull().default("pending"),
    checklistVerdict: text("checklist_verdict").notNull().default(""),
    holdCleaning: boolean("hold_cleaning").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [index("plate_renders_org_status_idx").on(t.orgId, t.status, t.createdAt)],
);

export const membershipCapabilities = pgTable(
  "membership_capabilities",
  {
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    capability: text("capability").notNull(),
  },
  (t) => [primaryKey({ columns: [t.membershipId, t.capability] })],
);

export const coachingLinks = pgTable(
  "coaching_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    coachMembershipId: uuid("coach_membership_id")
      .notNull()
      .references(() => memberships.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("coaching_links_edge").on(
      t.orgId,
      t.coachMembershipId,
      t.subjectMembershipId,
      t.kind,
    ),
    index("coaching_links_org_coach_idx").on(t.orgId, t.coachMembershipId),
  ],
);

export const coachingProfiles = pgTable(
  "coaching_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    personalitySummary: text("personality_summary"),
    salesStyleSummary: text("sales_style_summary"),
    communicationSummary: text("communication_summary"),
    leadershipSummary: text("leadership_summary"),
    forecastingSummary: text("forecasting_summary"),
    motivations: jsonb("motivations").notNull().default([]),
    strengths: jsonb("strengths").notNull().default([]),
    weaknesses: jsonb("weaknesses").notNull().default([]),
    enneagramType: text("enneagram_type"),
    discProfile: text("disc_profile"),
    mbtiType: text("mbti_type"),
    coachingHints: jsonb("coaching_hints"),
    reasoningSummary: text("reasoning_summary"),
    synthesisStatus: text("synthesis_status"),
    synthesisError: text("synthesis_error"),
    synthesisStartedAt: timestamp("synthesis_started_at", { withTimezone: true }),
    lastSynthesizedAt: timestamp("last_synthesized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("coaching_profiles_org_member").on(t.orgId, t.membershipId),
    index("coaching_profiles_org_member_idx").on(t.orgId, t.membershipId),
  ],
);

export const memberCredentials = pgTable(
  "member_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id),
    source: text("source").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("member_credentials_member_source").on(t.memberId, t.source)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary"),
    audience: text("audience"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("products_org_slug").on(t.orgId, t.slug),
    index("products_org_created_idx").on(t.orgId, t.createdAt),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    productId: uuid("product_id").references(() => products.id),
    category: text("category").notNull(),
    questionType: text("question_type").notNull(),
    text: text("text").notNull(),
    options: jsonb("options"),
    tags: jsonb("tags").notNull().default([]),
    weight: numeric("weight").notNull().default("1"),
    active: boolean("active").notNull().default(true),
    authorMembershipId: uuid("author_membership_id").references(() => memberships.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("questions_org_created_idx").on(t.orgId, t.createdAt)],
);

export const answerSets = pgTable(
  "answer_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    subjectMembershipId: uuid("subject_membership_id").references(() => memberships.id),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    version: integer("version").notNull().default(1),
    resumeIndex: integer("resume_index").notNull().default(0),
    questionOrder: jsonb("question_order").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("answer_sets_org_member_idx").on(t.orgId, t.membershipId)],
);

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    answerSetId: uuid("answer_set_id")
      .notNull()
      .references(() => answerSets.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    value: jsonb("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("answers_set_question").on(t.answerSetId, t.questionId),
    index("answers_org_created_idx").on(t.orgId, t.createdAt),
  ],
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    source: text("source").notNull(),
    category: text("category").notNull(),
    routeTo: text("route_to").notNull(),
    channel: text("channel").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull(),
    sourceUnitIds: jsonb("source_unit_ids").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("recommendations_org_subject_route_idx").on(
      t.orgId,
      t.subjectMembershipId,
      t.routeTo,
    ),
  ],
);

export const coachingNotes = pgTable(
  "coaching_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    body: text("body").notNull(),
    visibleToLearner: boolean("visible_to_learner").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coaching_notes_org_subject_idx").on(t.orgId, t.subjectMembershipId)],
);

export const coachingPlans = pgTable(
  "coaching_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id),
    generated: jsonb("generated").notNull().default({}),
    modelName: text("model_name"),
    status: text("status").notNull(),
    error: text("error"),
    readBy: jsonb("read_by").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coaching_plans_org_subject_idx").on(t.orgId, t.subjectMembershipId)],
);

export const oneOnOnePreps = pgTable(
  "one_on_one_preps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id),
    prepDocText: text("prep_doc_text").notNull().default(""),
    generated: jsonb("generated").notNull().default({}),
    modelName: text("model_name"),
    status: text("status").notNull(),
    error: text("error"),
    readBy: jsonb("read_by").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("one_on_one_preps_org_subject_idx").on(t.orgId, t.subjectMembershipId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    coachMembershipId: uuid("coach_membership_id")
      .notNull()
      .references(() => memberships.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    monthOf: timestamp("month_of", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("reviews_month").on(t.orgId, t.coachMembershipId, t.subjectMembershipId, t.monthOf),
    index("reviews_org_subject_idx").on(t.orgId, t.subjectMembershipId),
  ],
);

export const reviewAnswers = pgTable(
  "review_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    value: jsonb("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("review_answers_review_question").on(t.reviewId, t.questionId),
    index("review_answers_org_created_idx").on(t.orgId, t.createdAt),
  ],
);

export const workItems = pgTable(
  "work_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    assigneeMembershipId: uuid("assignee_membership_id")
      .notNull()
      .references(() => memberships.id),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id),
    subjectMembershipId: uuid("subject_membership_id").references(() => memberships.id),
    title: text("title").notNull(),
    body: text("body"),
    status: text("status").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    recommendationId: uuid("recommendation_id").references(() => recommendations.id),
    planId: uuid("plan_id").references(() => coachingPlans.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("work_items_org_assignee_idx").on(t.orgId, t.assigneeMembershipId)],
);

export const coachingSources = pgTable(
  "coaching_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    storagePath: text("storage_path"),
    body: text("body").notNull().default(""),
    mime: text("mime"),
    byteSize: integer("byte_size"),
    visibility: text("visibility").notNull(),
    storageStatus: text("storage_status").notNull(),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coaching_sources_org_author_idx").on(t.orgId, t.authorMembershipId)],
);

export const sourceMappings = pgTable(
  "source_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => coachingSources.id),
    kind: text("kind").notNull(),
    intent: text("intent").notNull(),
    visibility: text("visibility").notNull(),
    aiSuggestedKind: text("ai_suggested_kind"),
    aiSuggestedIntent: text("ai_suggested_intent"),
    aiConfidence: numeric("ai_confidence"),
    aiRationale: text("ai_rationale"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("source_mappings_org_created_idx").on(t.orgId, t.createdAt)],
);

export const knowledgeRepos = pgTable(
  "knowledge_repos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    repoKind: text("repo_kind").notNull(),
    name: text("name").notNull(),
    visibility: text("visibility").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("knowledge_repos_org_kind_name").on(t.orgId, t.repoKind, t.name),
    index("knowledge_repos_org_created_idx").on(t.orgId, t.createdAt),
  ],
);

export const coachingKnowledgeUnits = pgTable(
  "coaching_knowledge_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => knowledgeRepos.id),
    sourceId: uuid("source_id").references(() => coachingSources.id),
    productId: uuid("product_id").references(() => products.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    skillSlugs: text("skill_slugs").array().notNull().default([]),
    tags: jsonb("tags").notNull().default([]),
    status: text("status").notNull(),
    visibility: text("visibility").notNull(),
    authorMembershipId: uuid("author_membership_id").references(() => memberships.id),
    approverMembershipId: uuid("approver_membership_id").references(() => memberships.id),
    embedding: jsonb("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coaching_knowledge_units_org_created_idx").on(t.orgId, t.createdAt)],
);

export const adHocQuizzes = pgTable(
  "ad_hoc_quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id),
    title: text("title").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    status: text("status").notNull(),
    questionIds: jsonb("question_ids").notNull().default([]),
    answerSetId: uuid("answer_set_id").references(() => answerSets.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ad_hoc_quizzes_org_subject_idx").on(t.orgId, t.subjectMembershipId)],
);

export const quizSchedules = pgTable(
  "quiz_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    subjectMembershipId: uuid("subject_membership_id")
      .notNull()
      .references(() => memberships.id),
    cadence: text("cadence").notNull(),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quiz_schedules_org_subject_idx").on(t.orgId, t.subjectMembershipId)],
);

export const retakeRequests = pgTable(
  "retake_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    requesterMembershipId: uuid("requester_membership_id")
      .notNull()
      .references(() => memberships.id),
    quizId: uuid("quiz_id").references(() => adHocQuizzes.id),
    answerSetId: uuid("answer_set_id").references(() => answerSets.id),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("retake_requests_org_requester_idx").on(t.orgId, t.requesterMembershipId)],
);

export const drillAttempts = pgTable(
  "drill_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    skillCategory: text("skill_category").notNull(),
    prompt: text("prompt").notNull(),
    userResponse: text("user_response"),
    aiScore: integer("ai_score"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("drill_attempts_org_member_idx").on(t.orgId, t.membershipId)],
);

export const performanceSnapshots = pgTable(
  "performance_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id),
    year: integer("year").notNull(),
    quarter: integer("quarter").notNull(),
    quotaCents: integer("quota_cents"),
    attainedCents: integer("attained_cents"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("performance_snapshots_period").on(t.orgId, t.membershipId, t.year, t.quarter),
    index("performance_snapshots_org_member_idx").on(t.orgId, t.membershipId),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    actorMembershipId: uuid("actor_membership_id")
      .notNull()
      .references(() => memberships.id),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_org_created_idx").on(t.orgId, t.createdAt)],
);

export const legacyIds = pgTable(
  "legacy_ids",
  {
    source: text("source").notNull(),
    legacyId: text("legacy_id").notNull(),
    tableName: text("table_name").notNull(),
    newId: uuid("new_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.source, t.tableName, t.legacyId] })],
);

