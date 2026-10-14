/**
 * M7 enrollments and progress_latest are the next-step source of truth.
 * Living-brain tables are a fallback through M14 and retire in M15.
 * Learn and You read enrollments. The Library brain reads nodes and edges.
 */

export const LIVING_BRAIN_FALLBACK_THROUGH = "M14" as const;
export const LIVING_BRAIN_RETIRE_IN = "M15" as const;

export type NextPhase = "M11" | "M14" | "M15";

export type EnrollmentRow = {
  membershipId: string;
  courseSlug: string;
  status: string;
};

export type LatestRow = {
  membershipId: string;
  courseSlug: string;
  stationSlug: string;
  kind: string;
  passed: boolean;
};

export type StationModule = { slug: string; title: string };

const STATION_KINDS = ["watch", "practice", "check"] as const;

export function nextOpenStation(input: {
  membershipId: string;
  enrollments: readonly EnrollmentRow[];
  latest: readonly LatestRow[];
  modules: readonly StationModule[];
}): { title: string; courseSlug: string; stationSlug: string; from: "enrollments" } | null {
  const active = input.enrollments.find(
    (row) => row.membershipId === input.membershipId && row.status !== "completed",
  );
  if (!active || input.modules.length === 0) return null;
  const attempts = input.latest.filter(
    (row) => row.membershipId === input.membershipId && row.courseSlug === active.courseSlug,
  );
  for (const mod of input.modules) {
    const done = STATION_KINDS.every((kind) =>
      attempts.some((row) => row.stationSlug === mod.slug && row.kind === kind && row.passed),
    );
    if (!done) {
      return {
        title: mod.title,
        courseSlug: active.courseSlug,
        stationSlug: mod.slug,
        from: "enrollments",
      };
    }
  }
  const examPassed = attempts.some((row) => row.stationSlug === "exam" && row.kind === "exam" && row.passed);
  if (!examPassed) {
    return { title: "Exam", courseSlug: active.courseSlug, stationSlug: "exam", from: "enrollments" };
  }
  return { title: "Course complete", courseSlug: active.courseSlug, stationSlug: "exam", from: "enrollments" };
}

export function chooseNextStepSource(input: {
  enrollment: { title: string } | null;
  livingTitle: string;
  phase?: NextPhase;
}): { title: string; from: "enrollments" | "living_brain" | "" } {
  if (input.enrollment?.title) return { title: input.enrollment.title, from: "enrollments" };
  if ((input.phase ?? "M11") === LIVING_BRAIN_RETIRE_IN) return { title: "", from: "" };
  const living = input.livingTitle.trim();
  if (!living) return { title: "", from: "" };
  return { title: living, from: "living_brain" };
}

export function livingFallbackTitle(people: readonly { membershipId: string; outcomes: string }[], membershipId: string) {
  const named = people.find((person) => person.membershipId === membershipId);
  const withText = named?.outcomes.trim() ? named : people.find((person) => person.outcomes.trim());
  return withText?.outcomes.trim() || "";
}
