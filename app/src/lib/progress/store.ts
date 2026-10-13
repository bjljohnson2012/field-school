import { reduceCourseProgress, eventsForCourse } from "@/lib/campus-runtime/events";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { getCourse } from "@/lib/course/catalog";
import { getSql } from "@/lib/db/client";
import {
  EXAM_STATION,
  learningEventForAttempt,
  mergeLegacyProgress,
  planImport,
  type ExamSnapshot,
  type ImportPiece,
  type ProgressAttempt,
  type ProgressKind,
  type ProgressProjection,
} from "@/lib/progress/rules";
import { applyProgressSql } from "@/lib/progress/sql";
import type { ProgressMap } from "@/lib/course/types";

type Actor = Pick<LearnerIdentity, "orgId" | "orgSlug" | "membershipId" | "stance">;

type Sql = ReturnType<typeof getSql>;

export type CourseProgressSnapshot = ProgressProjection & {
  authenticated: true;
  course: string;
  org: string;
  membershipId: string;
  imported: boolean;
};

type AttemptRow = {
  station_slug: string;
  kind: string;
  score: string | number | null;
  total: number | null;
  passed: boolean;
  raw: Record<string, unknown> | null;
  created_at: Date | string;
  learning_event_id: string;
};

function numberOrNull(value: string | number | null) {
  if (value == null || value === "") return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function stamp(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function asKind(value: string): ProgressKind | null {
  if (value === "watch" || value === "practice" || value === "check" || value === "exam") return value;
  return null;
}

function mapAttempt(row: AttemptRow): ProgressAttempt | null {
  const kind = asKind(row.kind);
  if (!kind) return null;
  return {
    stationSlug: row.station_slug,
    kind,
    score: numberOrNull(row.score),
    total: row.total,
    passed: row.passed === true,
    raw: row.raw && typeof row.raw === "object" ? row.raw : {},
    createdAt: stamp(row.created_at),
    learningEventId: row.learning_event_id,
  };
}

async function loadAttempts(sql: Sql, actor: Pick<Actor, "orgId" | "membershipId">, courseSlug: string) {
  const rows = (await sql`
    SELECT station_slug, kind, score, total, passed, raw, created_at, learning_event_id
    FROM progress_latest
    WHERE org_id = ${actor.orgId}
      AND membership_id = ${actor.membershipId}
      AND course_slug = ${courseSlug}
  `) as AttemptRow[];
  return rows.flatMap((row) => {
    const attempt = mapAttempt(row);
    return attempt ? [attempt] : [];
  });
}

async function enrollmentRow(sql: Sql, actor: Pick<Actor, "orgId" | "membershipId">, courseSlug: string) {
  const rows = (await sql`
    SELECT id, imported_at, status
    FROM enrollments
    WHERE org_id = ${actor.orgId}
      AND membership_id = ${actor.membershipId}
      AND course_slug = ${courseSlug}
    LIMIT 1
  `) as { id: string; imported_at: Date | string | null; status: string }[];
  return rows[0] ?? null;
}

export async function readCourseProgress(actor: Actor, courseSlug: string): Promise<CourseProgressSnapshot | null> {
  const course = getCourse(courseSlug);
  if (!course) return null;
  await applyProgressSql();
  const sql = getSql();
  const attempts = await loadAttempts(sql, actor, courseSlug);
  const events = await eventsForCourse(
    {
      orgId: actor.orgId,
      membershipId: actor.membershipId,
    } as LearnerIdentity,
    courseSlug,
  );
  const legacy = reduceCourseProgress(events);
  const projected = mergeLegacyProgress(course, legacy, attempts);
  const enrollment = await enrollmentRow(sql, actor, courseSlug);
  return {
    ...projected,
    authenticated: true,
    course: courseSlug,
    org: actor.orgSlug,
    membershipId: actor.membershipId,
    imported: Boolean(enrollment?.imported_at),
  };
}

async function ensureEnrollment(sql: Sql, actor: Actor, courseSlug: string) {
  const rows = (await sql`
    INSERT INTO enrollments (org_id, membership_id, course_slug)
    VALUES (${actor.orgId}, ${actor.membershipId}, ${courseSlug})
    ON CONFLICT (org_id, membership_id, course_slug)
    DO UPDATE SET updated_at = now()
    RETURNING id, imported_at
  `) as { id: string; imported_at: Date | string | null }[];
  return rows[0];
}

async function insertAttempt(
  sql: Sql,
  actor: Actor,
  courseSlug: string,
  enrollmentId: string,
  piece: ImportPiece,
  imported: boolean,
) {
  const event = learningEventForAttempt({
    courseSlug,
    stationSlug: piece.stationSlug,
    kind: piece.kind,
    score: piece.score,
    passed: piece.passed,
    imported,
  });
  const raw = { ...event.raw, ...piece.raw, passed: piece.passed };
  const events = (await sql`
    INSERT INTO learning_events (
      org_id, membership_id, actor_membership_id, actor_stance,
      kind, object_type, object_id, score, raw
    )
    VALUES (
      ${actor.orgId}, ${actor.membershipId}, ${actor.membershipId}, ${actor.stance},
      ${event.kind}, ${event.objectType}, ${event.objectId}, ${piece.score}, ${sql.json(raw)}
    )
    RETURNING id
  `) as { id: string }[];
  const eventId = events[0]?.id;
  if (!eventId) throw new Error("progress_event_missing");
  await sql`
    INSERT INTO progress_attempts (
      org_id, membership_id, enrollment_id, learning_event_id,
      course_slug, station_slug, kind, score, total, passed, raw
    )
    VALUES (
      ${actor.orgId}, ${actor.membershipId}, ${enrollmentId}, ${eventId},
      ${courseSlug}, ${piece.stationSlug}, ${piece.kind}, ${piece.score}, ${piece.total},
      ${piece.passed}, ${sql.json(raw)}
    )
  `;
  return eventId;
}

async function markEnrollment(sql: Sql, enrollmentId: string, certified: boolean) {
  const status = certified ? "completed" : "active";
  await sql`
    UPDATE enrollments
    SET status = ${status}, updated_at = now()
    WHERE id = ${enrollmentId}
  `;
}

export async function recordProgressAttempt(
  actor: Actor,
  input: {
    courseSlug: string;
    stationSlug: string;
    kind: ProgressKind;
    score: number | null;
    total: number | null;
    passed: boolean;
    raw?: Record<string, unknown>;
  },
) {
  const course = getCourse(input.courseSlug);
  if (!course) return null;
  await applyProgressSql();
  const sql = getSql();
  let enrollmentId = "";
  await sql.begin(async (tx) => {
    const runner = tx as unknown as Sql;
    const enrollment = await ensureEnrollment(runner, actor, input.courseSlug);
    enrollmentId = enrollment.id;
    await insertAttempt(runner, actor, input.courseSlug, enrollment.id, {
      stationSlug: input.stationSlug,
      kind: input.kind,
      score: input.score,
      total: input.total,
      passed: input.passed,
      raw: input.raw ?? {},
    }, false);
  });
  const snapshot = await readCourseProgress(actor, input.courseSlug);
  if (snapshot && enrollmentId) await markEnrollment(sql, enrollmentId, snapshot.certified);
  return snapshot;
}

export async function importCourseProgress(
  actor: Actor,
  courseSlug: string,
  local: { modules: ProgressMap; exam: ExamSnapshot | null },
) {
  const course = getCourse(courseSlug);
  if (!course) return null;
  await applyProgressSql();
  const sql = getSql();
  const existing = await enrollmentRow(sql, actor, courseSlug);
  const attempts = existing ? await loadAttempts(sql, actor, courseSlug) : [];
  const plan = planImport({
    course,
    importedAt: existing?.imported_at ? stamp(existing.imported_at) : null,
    serverKeys: attempts.map((attempt) => `${attempt.stationSlug}:${attempt.kind}`),
    local,
  });
  if (!plan.markImported) return readCourseProgress(actor, courseSlug);

  await sql.begin(async (tx) => {
    const enrollment = await ensureEnrollment(tx as unknown as Sql, actor, courseSlug);
    const won = (await tx`
      UPDATE enrollments
      SET imported_at = now(), updated_at = now()
      WHERE id = ${enrollment.id} AND imported_at IS NULL
      RETURNING id
    `) as { id: string }[];
    if (!won[0]) return;
    for (const piece of plan.pieces) {
      await insertAttempt(tx as unknown as Sql, actor, courseSlug, enrollment.id, piece, true);
    }
  });

  const snapshot = await readCourseProgress(actor, courseSlug);
  const enrollment = await enrollmentRow(sql, actor, courseSlug);
  if (snapshot && enrollment) await markEnrollment(sql, enrollment.id, snapshot.certified);
  return snapshot;
}

export function examStation() {
  return EXAM_STATION;
}
