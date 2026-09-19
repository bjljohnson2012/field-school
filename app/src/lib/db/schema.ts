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

