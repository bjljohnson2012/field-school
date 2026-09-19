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

