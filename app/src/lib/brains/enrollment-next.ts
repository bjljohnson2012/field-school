import { getSql } from "@/lib/db/client";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { modules } from "@/lib/course/content";
import { applyProgressSql } from "@/lib/progress/sql";
import { chooseNextStepSource, livingFallbackTitle, nextOpenStation, type NextPhase } from "./next-step.ts";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export async function enrollmentNextFor(identity: Pick<LearnerIdentity, "orgId" | "membershipId">) {
  await applyProgressSql();
  const sql = getSql();
  const enrollments = (await sql`
    SELECT membership_id, course_slug, status
    FROM enrollments
    WHERE org_id = ${identity.orgId} AND membership_id = ${identity.membershipId}
  `) as Row[];
  const latest = (await sql`
    SELECT membership_id, course_slug, station_slug, kind, passed
    FROM progress_latest
    WHERE org_id = ${identity.orgId} AND membership_id = ${identity.membershipId}
  `) as Row[];
  return nextOpenStation({
    membershipId: identity.membershipId,
    enrollments: enrollments.map((row) => ({
      membershipId: text(row, "membership_id"),
      courseSlug: text(row, "course_slug"),
      status: text(row, "status"),
    })),
    latest: latest.map((row) => ({
      membershipId: text(row, "membership_id"),
      courseSlug: text(row, "course_slug"),
      stationSlug: text(row, "station_slug"),
      kind: text(row, "kind"),
      passed: row.passed === true,
    })),
    modules: modules.map((mod) => ({ slug: mod.slug, title: mod.title })),
  });
}

export function nextStepPayload(input: {
  enrollment: { title: string; courseSlug?: string; stationSlug?: string } | null;
  people: readonly { membershipId: string; outcomes: string }[];
  membershipId: string;
  phase?: NextPhase;
}) {
  const chosen = chooseNextStepSource({
    enrollment: input.enrollment,
    livingTitle: livingFallbackTitle(input.people, input.membershipId),
    phase: input.phase,
  });
  return {
    title: chosen.title,
    from: chosen.from,
    courseSlug: input.enrollment?.courseSlug || "",
    stationSlug: input.enrollment?.stationSlug || "",
    fallbackThrough: "M14" as const,
    retireIn: "M15" as const,
  };
}
