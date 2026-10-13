import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { courseAllowedInOrg } from "@/lib/campus-runtime/org";
import { getCourse } from "@/lib/course/catalog";
import { emptyProgress } from "@/lib/course/content";
import type { ModuleProgress, ProgressMap } from "@/lib/course/types";
import type { ExamSnapshot } from "@/lib/progress/rules";
import { importCourseProgress } from "@/lib/progress/store";

export const dynamic = "force-dynamic";

function asProgress(value: unknown): ModuleProgress {
  const blank = emptyProgress();
  if (!value || typeof value !== "object" || Array.isArray(value)) return blank;
  const row = value as Record<string, unknown>;
  const assignment =
    row.assignment && typeof row.assignment === "object" && !Array.isArray(row.assignment)
      ? Object.fromEntries(
          Object.entries(row.assignment as Record<string, unknown>).map(([key, item]) => [key, item === true]),
        )
      : {};
  const quizScore = typeof row.quizScore === "number" && Number.isFinite(row.quizScore) ? row.quizScore : null;
  return {
    watched: row.watched === true,
    assignment,
    notes: typeof row.notes === "string" ? row.notes : "",
    quizScore,
    quizPassed: row.quizPassed === true,
    passed: row.passed === true,
  };
}

function asModules(value: unknown): ProgressMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const modules: ProgressMap = {};
  for (const [slug, progress] of Object.entries(value)) {
    if (!slug.trim()) continue;
    modules[slug] = asProgress(progress);
  }
  return modules;
}

function asExam(value: unknown): ExamSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.score !== "number" || !Number.isFinite(row.score)) return null;
  return {
    score: row.score,
    passed: row.passed === true,
    at: typeof row.at === "string" ? row.at : new Date(0).toISOString(),
  };
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

  const courseSlug = typeof body.course === "string" ? body.course.trim() : "";
  if (!courseSlug || !courseAllowedInOrg(result.identity.orgSlug, courseSlug)) {
    return NextResponse.json({ ok: false, error: "cross_org" }, { status: 403 });
  }
  if (!getCourse(courseSlug)) {
    return NextResponse.json({ ok: false, error: "unknown_course" }, { status: 404 });
  }

  const progress = await importCourseProgress(result.identity, courseSlug, {
    modules: asModules(body.modules),
    exam: asExam(body.exam),
  });
  return NextResponse.json({ ok: true, progress });
}
