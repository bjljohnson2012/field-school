import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { computePassed, passingScore } from "./content";
import { ensureSeeded, loadCourse } from "./catalog";
import { GROK_BOT_SLUG, type ModuleProgress, type StaffDesk } from "./types";

function parseAssignment(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object") return v as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  return {};
}

export const loadProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { courseSlug: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureSeeded(sql);
    const courseSlug = data.courseSlug || GROK_BOT_SLUG;
    const rows = await sql<{
      module_slug: string;
      watched: boolean;
      assignment_json: string;
      notes: string;
      quiz_score: number | null;
      quiz_passed: boolean;
      passed: boolean;
    }>`
      select module_slug, watched, assignment_json, notes, quiz_score, quiz_passed, passed
      from enrollment_progress
      where user_id = ${context.userId} and course_slug = ${courseSlug}
    `;
    const map: Record<string, ModuleProgress> = {};
    for (const row of rows) {
      map[row.module_slug] = {
        watched: Boolean(row.watched),
        assignment: parseAssignment(row.assignment_json),
        notes: row.notes ?? "",
        quizScore: row.quiz_score,
        quizPassed: Boolean(row.quiz_passed),
        passed: Boolean(row.passed),
      };
    }
    const exam = await sql<{ score: number; passed: boolean; created_at: string }>`
      select score, passed, created_at from enrollment_exams
      where user_id = ${context.userId} and course_slug = ${courseSlug}
      order by created_at desc
      limit 1
    `;
    return {
      progress: map,
      exam: exam[0]
        ? {
            score: exam[0].score,
            passed: Boolean(exam[0].passed),
            at: exam[0].created_at,
          }
        : null,
    };
  });

async function upsertModule(
  userId: string,
  courseSlug: string,
  slug: string,
  patch: Partial<ModuleProgress>,
) {
  const sql = await getSql();
  await ensureSeeded(sql);
  const existing = await sql<{
    watched: boolean;
    assignment_json: string;
    notes: string;
    quiz_score: number | null;
    quiz_passed: boolean;
    passed: boolean;
  }>`
    select watched, assignment_json, notes, quiz_score, quiz_passed, passed
    from enrollment_progress
    where user_id = ${userId} and course_slug = ${courseSlug} and module_slug = ${slug}
  `;
  const cur: ModuleProgress = existing[0]
    ? {
        watched: Boolean(existing[0].watched),
        assignment: parseAssignment(existing[0].assignment_json),
        notes: existing[0].notes ?? "",
        quizScore: existing[0].quiz_score,
        quizPassed: Boolean(existing[0].quiz_passed),
        passed: Boolean(existing[0].passed),
      }
    : {
        watched: false,
        assignment: {},
        notes: "",
        quizScore: null,
        quizPassed: false,
        passed: false,
      };
  const next: ModuleProgress = { ...cur, ...patch };
  const course = await loadCourse(sql, courseSlug);
  const mod = course?.modules.find((m) => m.slug === slug);
  if (mod) next.passed = computePassed(mod, next);
  const assignmentJson = JSON.stringify(next.assignment);
  await sql`
    insert into enrollment_progress (
      user_id, course_slug, module_slug, watched, assignment_json, notes, quiz_score, quiz_passed, passed, updated_at
    ) values (
      ${userId}, ${courseSlug}, ${slug}, ${next.watched}, ${assignmentJson}, ${next.notes},
      ${next.quizScore}, ${next.quizPassed}, ${next.passed}, now()
    )
    on conflict (user_id, course_slug, module_slug) do update set
      watched = excluded.watched,
      assignment_json = excluded.assignment_json,
      notes = excluded.notes,
      quiz_score = excluded.quiz_score,
      quiz_passed = excluded.quiz_passed,
      passed = excluded.passed,
      updated_at = now()
  `;
  return next;
}

export const saveWatched = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { courseSlug: string; slug: string }) => d)
  .handler(async ({ context, data }) => {
    return upsertModule(context.userId, data.courseSlug, data.slug, { watched: true });
  });

export const saveAssignment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      courseSlug: string;
      slug: string;
      assignment: Record<string, boolean>;
      notes: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    return upsertModule(context.userId, data.courseSlug, data.slug, {
      assignment: data.assignment,
      notes: data.notes,
    });
  });

export const saveQuiz = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: { courseSlug: string; slug: string; answers: Record<string, number> }) => d,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const course = await loadCourse(sql, data.courseSlug);
    const mod = course?.modules.find((m) => m.slug === data.slug);
    if (!mod) throw new Error("Unknown station");
    let correct = 0;
    for (const q of mod.quiz) {
      if (data.answers[q.id] === q.answer) correct += 1;
    }
    const need = passingScore(mod.quiz.length, course?.passRatio ?? 0.75);
    return upsertModule(context.userId, data.courseSlug, data.slug, {
      quizScore: correct,
      quizPassed: correct >= need,
    });
  });

export const saveExam = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { courseSlug: string; answers: Record<string, number> }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureSeeded(sql);
    const course = await loadCourse(sql, data.courseSlug);
    if (!course) throw new Error("Unknown course");
    let correct = 0;
    for (const q of course.examQuestions) {
      if (data.answers[q.id] === q.answer) correct += 1;
    }
    const need = passingScore(course.examQuestions.length, course.examPassRatio);
    const passed = correct >= need;
    await sql`
      insert into enrollment_exams (user_id, course_slug, score, passed, answers)
      values (${context.userId}, ${data.courseSlug}, ${correct}, ${passed}, ${JSON.stringify(data.answers)})
    `;
    return {
      score: correct,
      total: course.examQuestions.length,
      passed,
      need,
    };
  });

export const loadDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { courseSlug: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string }>`
      select payload from enrollment_desks
      where user_id = ${context.userId} and course_slug = ${data.courseSlug}
    `;
    if (!rows[0]) return null as StaffDesk | null;
    try {
      return JSON.parse(rows[0].payload) as StaffDesk;
    } catch {
      return null;
    }
  });

export const saveDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { courseSlug: string; data: StaffDesk }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const payload = JSON.stringify(data.data);
    await sql`
      insert into enrollment_desks (user_id, course_slug, payload, updated_at)
      values (${context.userId}, ${data.courseSlug}, ${payload}, now())
      on conflict (user_id, course_slug) do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
