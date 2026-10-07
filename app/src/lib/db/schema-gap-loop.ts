import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { growthUnits, memberships, organizations } from "./schema";

/** 0021. Shared owner columns. Family, team, and org stay closed in the M1 rules. */
function scope() {
  return {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id),
    growthUnitId: uuid("growth_unit_id")
      .notNull()
      .references(() => growthUnits.id),
    ownerKind: text("owner_kind").notNull(),
    ownerMembershipId: uuid("owner_membership_id")
      .notNull()
      .references(() => memberships.id),
    childMembershipId: uuid("child_membership_id").references(() => memberships.id),
  };
}

const evidenceCheck = (name: string) =>
  check(name, sql`jsonb_typeof(evidence) = 'array' AND jsonb_array_length(evidence) >= 1`);

export const outcomes = pgTable(
  "outcomes",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull().default(""),
    statement: text("statement").notNull(),
    horizon: text("horizon").notNull().default(""),
    doneConditions: jsonb("done_conditions").notNull().default([]),
    status: text("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    supersedesId: uuid("supersedes_id"),
    intentId: uuid("intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("outcomes_owner_idx").on(t.orgId, t.ownerMembershipId, t.createdAt),
    index("outcomes_unit_idx").on(t.growthUnitId),
  ],
);

export const outcomeRequirements = pgTable(
  "outcome_requirements",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    outcomeId: uuid("outcome_id")
      .notNull()
      .references(() => outcomes.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    label: text("label").notNull(),
    kind: text("kind").notNull(),
    weight: integer("weight").notNull().default(1),
    doneCondition: jsonb("done_condition").notNull().default({}),
    coverage: integer("coverage").notNull().default(0),
    systemConfidence: text("system_confidence").notNull().default("Low"),
    status: text("status").notNull().default("open"),
    origin: text("origin").notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("outcome_requirements_order").on(t.outcomeId, t.sortOrder),
    index("outcome_requirements_outcome_idx").on(t.outcomeId, t.sortOrder),
  ],
);

export const knowledgeNodes = pgTable(
  "knowledge_nodes",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    requirementId: uuid("requirement_id").references(() => outcomeRequirements.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    label: text("label").notNull().default(""),
    body: text("body").notNull().default(""),
    sha256: text("sha256"),
    filename: text("filename"),
    refTable: text("ref_table"),
    refId: text("ref_id"),
    evidence: jsonb("evidence").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    evidenceCheck("knowledge_nodes_evidence_len"),
    index("knowledge_nodes_unit_idx").on(t.orgId, t.growthUnitId, t.createdAt),
    index("knowledge_nodes_requirement_idx").on(t.requirementId),
  ],
);

export const knowledgeEdges = pgTable(
  "knowledge_edges",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    fromNode: uuid("from_node")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    toNode: uuid("to_node")
      .notNull()
      .references(() => knowledgeNodes.id, { onDelete: "cascade" }),
    rel: text("rel").notNull(),
    because: text("because").notNull().default(""),
    evidence: jsonb("evidence").notNull(),
    weight: integer("weight").notNull().default(1),
    status: text("status").notNull().default("proposed"),
    origin: text("origin").notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    evidenceCheck("knowledge_edges_evidence_len"),
    index("knowledge_edges_from_idx").on(t.fromNode),
    index("knowledge_edges_to_idx").on(t.toNode),
  ],
);

export const loopRuns = pgTable(
  "loop_runs",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    outcomeId: uuid("outcome_id")
      .notNull()
      .references(() => outcomes.id, { onDelete: "cascade" }),
    state: text("state").notNull().default("draft"),
    cycle: integer("cycle").notNull().default(1),
    stepCount: integer("step_count").notNull().default(0),
    maxSteps: integer("max_steps").notNull().default(12),
    noProgressCycles: integer("no_progress_cycles").notNull().default(0),
    lastScore: integer("last_score").notNull().default(0),
    stopReason: text("stop_reason"),
    leaseOwner: text("lease_owner"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("loop_runs_outcome_idx").on(t.outcomeId)],
);

export const loopEvents = pgTable(
  "loop_events",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => loopRuns.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    fromState: text("from_state").notNull(),
    toState: text("to_state").notNull(),
    kind: text("kind").notNull(),
    summary: text("summary").notNull(),
    detail: jsonb("detail").notNull().default({}),
    model: text("model"),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("loop_events_run_seq").on(t.runId, t.seq),
    unique("loop_events_idempotency").on(t.idempotencyKey),
    index("loop_events_owner_day_idx").on(t.ownerMembershipId, t.createdAt),
  ],
);

export const gapFindings = pgTable(
  "gap_findings",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    outcomeId: uuid("outcome_id")
      .notNull()
      .references(() => outcomes.id, { onDelete: "cascade" }),
    requirementId: uuid("requirement_id")
      .notNull()
      .references(() => outcomeRequirements.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    summary: text("summary").notNull(),
    coverageAtFind: integer("coverage_at_find").notNull().default(0),
    priority: integer("priority").notNull().default(0),
    status: text("status").notNull().default("open"),
    rejectReason: text("reject_reason"),
    evidenceKey: text("evidence_key").notNull().default(""),
    foundInRunId: uuid("found_in_run_id").references(() => loopRuns.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("gap_findings_outcome_idx").on(t.outcomeId, t.status, t.priority)],
);

export const researchTasks = pgTable(
  "research_tasks",
  {
    ...scope(),
    id: uuid("id").primaryKey().defaultRandom(),
    gapId: uuid("gap_id")
      .notNull()
      .references(() => gapFindings.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    channel: text("channel").notNull(),
    requestCopy: text("request_copy").notNull().default(""),
    status: text("status").notNull().default("proposed"),
    queryText: text("query_text"),
    approvedByMembershipId: uuid("approved_by_membership_id"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    response: jsonb("response"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("research_tasks_gap_idx").on(t.gapId, t.status)],
);
