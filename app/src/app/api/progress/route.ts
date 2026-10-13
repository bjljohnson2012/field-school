import { NextResponse } from "next/server";
import { eventsForCourse, reduceCourseProgress } from "@/lib/campus-runtime/events";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { courseAllowedInOrg } from "@/lib/campus-runtime/org";
import { getCourse } from "@/lib/course/catalog";
import { EXAM_STATION, practicePassed, scoreCheck, scoreExam } from "@/lib/progress/rules";
import { readCourseProgress, recordProgressAttempt } from "@/lib/progress/store";

export const dynamic = "force-dynamic";

const KINDS = new Set(["watch", "practice", "check", "exam"]);

function asAnswers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "number" && Number.isFinite(item)) answers[key] = item;
  }
  return answers;
}

function asAssignment(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const assignment: Record<string, boolean> = {};
  for (const [key, item] of Object.entries(value)) assignment[key] = item === true;
  return assignment;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const course = url.searchParams.get("course")?.trim() || "grok-bot";
  const result = await identityFromRequest(request);
  if (!result.ok) {
    if (result.status === 401) {
      return NextResponse.json({
        authenticated: false,
        guest: true,
        course,
        modules: {},
        exam: null,
        certified: false,
        passed: 0,
        total: 0,
      });
    }
    return NextResponse.json({ authenticated: false, error: result.error }, { status: result.status });
  }

  if (!courseAllowedInOrg(result.identity.orgSlug, course)) {
    return NextResponse.json({
      authenticated: true,
      course,
      org: result.identity.orgSlug,
      membershipId: result.identity.membershipId,
      modules: {},
      exam: null,
      certified: false,
      passed: 0,
      total: 0,
    });
  }

  const snapshot = await readCourseProgress(result.identity, course);
  if (snapshot) return NextResponse.json(snapshot);

  const rows = await eventsForCourse(result.identity, course);
  return NextResponse.json({
    authenticated: true,
    course,
    org: result.identity.orgSlug,
    membershipId: result.identity.membershipId,
    modules: reduceCourseProgress(rows),
    exam: null,
    certified: false,
    passed: 0,
    total: 0,
  });
}

export async function POST(request: Request) {
  const result = await identityFromRequest(request);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, guest: result.status === 401 },
      { status: result.status },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!KINDS.has(kind)) {
    return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 400 });
  }
  const courseSlug = typeof body.course === "string" ? body.course.trim() : "";
  if (!courseSlug || !courseAllowedInOrg(result.identity.orgSlug, courseSlug)) {
    return NextResponse.json({ ok: false, error: "cross_org" }, { status: 403 });
  }
  const course = getCourse(courseSlug);
  if (!course) return NextResponse.json({ ok: false, error: "unknown_course" }, { status: 404 });

  const station = typeof body.station === "string" ? body.station.trim() : "";
  const answers = asAnswers(body.answers);
  const assignment = asAssignment(body.assignment);
  const notes = typeof body.notes === "string" ? body.notes : "";

  if (kind === "exam") {
    const scored = scoreExam(course, answers);
    const progress = await recordProgressAttempt(result.identity, {
      courseSlug,
      stationSlug: EXAM_STATION,
      kind: "exam",
      score: scored.score,
      total: scored.total,
      passed: scored.passed,
      raw: { answers },
    });
    return NextResponse.json({ ok: true, score: scored.score, passed: scored.passed, need: scored.need, progress });
  }

  const mod = course.modules.find((item) => item.slug === station);
  if (!mod) return NextResponse.json({ ok: false, error: "unknown_station" }, { status: 400 });

  if (kind === "check") {
    const scored = scoreCheck(mod, answers);
    const progress = await recordProgressAttempt(result.identity, {
      courseSlug,
      stationSlug: mod.slug,
      kind: "check",
      score: scored.score,
      total: scored.total,
      passed: scored.passed,
      raw: { answers },
    });
    return NextResponse.json({ ok: true, score: scored.score, passed: scored.passed, need: scored.need, progress });
  }

  if (kind === "practice") {
    const passed = practicePassed(mod, assignment);
    const progress = await recordProgressAttempt(result.identity, {
      courseSlug,
      stationSlug: mod.slug,
      kind: "practice",
      score: null,
      total: null,
      passed,
      raw: { assignment, notes },
    });
    return NextResponse.json({ ok: true, passed, progress });
  }

  const progress = await recordProgressAttempt(result.identity, {
    courseSlug,
    stationSlug: mod.slug,
    kind: "watch",
    score: null,
    total: null,
    passed: true,
    raw: {},
  });
  return NextResponse.json({ ok: true, passed: true, progress });
}
