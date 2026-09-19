import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { learningIntents, members, memberships, wards } from "@/lib/db/schema";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import {
  type IntentFields,
  intentHasPlanFields,
  mergeIntentFields,
  parseIntentFields,
} from "./rules";

export class IntentAccessError extends Error {
  constructor(
    public status: 403 | 404,
    public code: string,
  ) {
    super(code);
    this.name = "IntentAccessError";
  }
}

export class IntentFieldsError extends Error {
  constructor() {
    super("intent_fields_required");
    this.name = "IntentFieldsError";
  }
}

export function publicIntent(row: typeof learningIntents.$inferSelect) {
  return {
    id: row.id,
    orgId: row.orgId,
    parentMembershipId: row.parentMembershipId,
    childMembershipId: row.childMembershipId,
    version: row.version,
    goals: asList(row.goals),
    subjects: asList(row.subjects),
    themes: asList(row.themes),
    timeHorizon: row.timeHorizon,
    constraints: asList(row.constraints),
    tags: row.tags ?? {},
    supersedesId: row.supersedesId,
    createdAt: row.createdAt.toISOString(),
  };
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function fieldsFromRow(row: typeof learningIntents.$inferSelect): IntentFields {
  return {
    goals: asList(row.goals),
    subjects: asList(row.subjects),
    themes: asList(row.themes),
    timeHorizon: row.timeHorizon,
    constraints: asList(row.constraints),
    tags: (row.tags ?? {}) as IntentFields["tags"],
  };
}

export async function assertChildInHousehold(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
}) {
  const db = getDb();
  const [child] = await db
    .select({
      membershipId: memberships.id,
      orgId: memberships.orgId,
      kind: members.kind,
    })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(eq(memberships.id, opts.childMembershipId))
    .limit(1);
  if (!child || child.orgId !== opts.actor.orgId || child.kind !== "child") {
    throw new IntentAccessError(403, "not_your_child");
  }
  if (opts.staff) return child;
  const [ward] = await db
    .select({ id: wards.id })
    .from(wards)
    .where(
      and(
        eq(wards.orgId, opts.actor.orgId),
        eq(wards.guardianMembershipId, opts.actor.membershipId),
        eq(wards.childMembershipId, opts.childMembershipId),
      ),
    )
    .limit(1);
  if (!ward) throw new IntentAccessError(403, "not_your_child");
  return child;
}

export async function listIntentVersions(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
}) {
  await assertChildInHousehold(opts);
  const db = getDb();
  const rows = await db
    .select()
    .from(learningIntents)
    .where(
      and(
        eq(learningIntents.orgId, opts.actor.orgId),
        eq(learningIntents.childMembershipId, opts.childMembershipId),
      ),
    )
    .orderBy(desc(learningIntents.version));
  return {
    current: rows[0] ? publicIntent(rows[0]) : null,
    versions: rows.map(publicIntent),
  };
}

export async function writeIntentVersion(opts: {
  actor: LearnerIdentity;
  childMembershipId: string;
  staff: boolean;
  body: Record<string, unknown>;
  merge: boolean;
}) {
  await assertChildInHousehold(opts);
  const incoming = parseIntentFields(opts.body);
  const db = getDb();
  const [latest] = await db
    .select()
    .from(learningIntents)
    .where(
      and(
        eq(learningIntents.orgId, opts.actor.orgId),
        eq(learningIntents.childMembershipId, opts.childMembershipId),
      ),
    )
    .orderBy(desc(learningIntents.version))
    .limit(1);
  const fields =
    opts.merge && latest ? mergeIntentFields(fieldsFromRow(latest), incoming) : incoming;
  if (!intentHasPlanFields(fields)) throw new IntentFieldsError();
  const [row] = await db
    .insert(learningIntents)
    .values({
      orgId: opts.actor.orgId,
      parentMembershipId: opts.actor.membershipId,
      childMembershipId: opts.childMembershipId,
      version: (latest?.version ?? 0) + 1,
      goals: fields.goals,
      subjects: fields.subjects,
      themes: fields.themes,
      timeHorizon: fields.timeHorizon,
      constraints: fields.constraints,
      tags: fields.tags,
      supersedesId: latest?.id ?? null,
    })
    .returning();
  return publicIntent(row);
}
