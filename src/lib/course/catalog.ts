import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { examQuestions, modules, COURSE_NAME, COURSE_TAGLINE } from "./content";
import {
  GROK_BOT_SLUG,
  VIDEO_ID,
  VIDEO_TITLE,
  VIDEO_URL,
  PASS_RATIO,
  EXAM_PASS_RATIO,
  type CourseRecord,
  type CourseSummary,
  type Module,
  type QuizQuestion,
} from "./types";
import { parseYoutubeId, slugify, youtubeWatchUrlFor } from "./youtube";

type ModuleBody = Pick<
  Module,
  "bullets" | "quotes" | "clips" | "assignment" | "quiz"
>;

function grokBotSeed(): CourseRecord {
  return {
    slug: GROK_BOT_SLUG,
    title: COURSE_NAME,
    tagline: COURSE_TAGLINE,
    kicker: "Grok Bot vs OpenClaw and Hermes",
    videoId: VIDEO_ID,
    videoUrl: VIDEO_URL,
    videoTitle: VIDEO_TITLE,
    contextNotes: "",
    published: true,
    createdBy: "system",
    passRatio: PASS_RATIO,
    examPassRatio: EXAM_PASS_RATIO,
    modules,
    examQuestions,
    updatedAt: new Date().toISOString(),
  };
}

function parseBody(raw: string): ModuleBody {
  try {
    const v = JSON.parse(raw) as Partial<ModuleBody>;
    return {
      bullets: Array.isArray(v.bullets) ? v.bullets : [],
      quotes: Array.isArray(v.quotes) ? v.quotes : [],
      clips: Array.isArray(v.clips) ? v.clips : [],
      assignment: v.assignment ?? {
        title: "Field work",
        brief: "",
        items: [],
        notesPlaceholder: "",
      },
      quiz: Array.isArray(v.quiz) ? v.quiz : [],
    };
  } catch {
    return {
      bullets: [],
      quotes: [],
      clips: [],
      assignment: { title: "Field work", brief: "", items: [], notesPlaceholder: "" },
      quiz: [],
    };
  }
}

function parseChoices(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

async function loadCourse(sql: Sql, slug: string): Promise<CourseRecord | null> {
  const rows = await sql<{
    slug: string;
    title: string;
    tagline: string;
    kicker: string;
    video_id: string;
    video_url: string;
    video_title: string;
    context_notes: string;
    published: boolean;
    created_by: string;
    pass_ratio: number;
    exam_pass_ratio: number;
    updated_at: string;
  }>`
    select slug, title, tagline, kicker, video_id, video_url, video_title,
           context_notes, published, created_by, pass_ratio, exam_pass_ratio, updated_at
    from courses where slug = ${slug}
  `;
  const row = rows[0];
  if (!row) return null;
  const mods = await sql<{
    slug: string;
    station: string;
    title: string;
    kicker: string;
    duration_label: string;
    summary: string;
    thesis: string;
    body_json: string;
    sort_order: number;
  }>`
    select slug, station, title, kicker, duration_label, summary, thesis, body_json, sort_order
    from course_modules where course_slug = ${slug} order by sort_order asc
  `;
  const exam = await sql<{
    question_id: string;
    prompt: string;
    choices_json: string;
    answer: number;
    why: string;
  }>`
    select question_id, prompt, choices_json, answer, why
    from course_exam where course_slug = ${slug} order by sort_order asc
  `;
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    kicker: row.kicker,
    videoId: row.video_id,
    videoUrl: row.video_url,
    videoTitle: row.video_title,
    contextNotes: row.context_notes,
    published: Boolean(row.published),
    createdBy: row.created_by,
    passRatio: Number(row.pass_ratio) || PASS_RATIO,
    examPassRatio: Number(row.exam_pass_ratio) || EXAM_PASS_RATIO,
    updatedAt: row.updated_at,
    modules: mods.map((m) => {
      const body = parseBody(m.body_json);
      return {
        slug: m.slug,
        station: m.station,
        title: m.title,
        kicker: m.kicker,
        durationLabel: m.duration_label,
        summary: m.summary,
        thesis: m.thesis,
        ...body,
      };
    }),
    examQuestions: exam.map((q) => ({
      id: q.question_id,
      prompt: q.prompt,
      choices: parseChoices(q.choices_json),
      answer: q.answer,
      why: q.why,
    })),
  };
}

export async function writeCourse(sql: Sql, course: CourseRecord) {
  await sql`
    insert into courses (
      slug, title, tagline, kicker, video_id, video_url, video_title, context_notes,
      published, created_by, pass_ratio, exam_pass_ratio, updated_at
    ) values (
      ${course.slug}, ${course.title}, ${course.tagline}, ${course.kicker},
      ${course.videoId}, ${course.videoUrl}, ${course.videoTitle}, ${course.contextNotes},
      ${course.published}, ${course.createdBy}, ${course.passRatio}, ${course.examPassRatio}, now()
    )
    on conflict (slug) do update set
      title = excluded.title,
      tagline = excluded.tagline,
      kicker = excluded.kicker,
      video_id = excluded.video_id,
      video_url = excluded.video_url,
      video_title = excluded.video_title,
      context_notes = excluded.context_notes,
      published = excluded.published,
      pass_ratio = excluded.pass_ratio,
      exam_pass_ratio = excluded.exam_pass_ratio,
      updated_at = now()
  `;
  await sql`delete from course_modules where course_slug = ${course.slug}`;
  await sql`delete from course_exam where course_slug = ${course.slug}`;
  for (let i = 0; i < course.modules.length; i += 1) {
    const m = course.modules[i];
    const body: ModuleBody = {
      bullets: m.bullets,
      quotes: m.quotes,
      clips: m.clips,
      assignment: m.assignment,
      quiz: m.quiz,
    };
    await sql`
      insert into course_modules (
        course_slug, slug, station, title, kicker, duration_label, summary, thesis, body_json, sort_order
      ) values (
        ${course.slug}, ${m.slug}, ${m.station}, ${m.title}, ${m.kicker}, ${m.durationLabel},
        ${m.summary}, ${m.thesis}, ${JSON.stringify(body)}, ${i}
      )
    `;
  }
  for (let i = 0; i < course.examQuestions.length; i += 1) {
    const q = course.examQuestions[i];
    await sql`
      insert into course_exam (
        course_slug, question_id, prompt, choices_json, answer, why, sort_order
      ) values (
        ${course.slug}, ${q.id}, ${q.prompt}, ${JSON.stringify(q.choices)}, ${q.answer}, ${q.why}, ${i}
      )
    `;
  }
}

export async function ensureSeeded(sql: Sql) {
  const rows = await sql<{ slug: string }>`select slug from courses where slug = ${GROK_BOT_SLUG}`;
  if (rows[0]) return;
  await writeCourse(sql, grokBotSeed());
}

const DEFAULT_DEAN_EMAILS = "bjljohnson2012@gmail.com";

function deanEmails(): string[] {
  const raw = process.env.DEAN_EMAILS || process.env.DEAN_EMAIL || DEFAULT_DEAN_EMAILS;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function emailForUser(sql: Sql, userId: string): Promise<string> {
  const rows = await sql<{ email: string }>`
    select email from "user" where id = ${userId}
  `;
  return (rows[0]?.email ?? "").trim().toLowerCase();
}

async function promoteDean(sql: Sql, userId: string) {
  await sql`
    insert into faculty (user_id, role) values (${userId}, ${"dean"})
    on conflict (user_id) do update set role = ${"dean"}
  `;
}

export async function requireFaculty(userId: string) {
  const sql = await getSql();
  await ensureSeeded(sql);
  const email = await emailForUser(sql, userId);
  if (email && deanEmails().includes(email)) {
    await promoteDean(sql, userId);
    return { role: "dean" as const, first: false };
  }
  const me = await sql<{ user_id: string; role: string }>`
    select user_id, role from faculty where user_id = ${userId}
  `;
  if (!me[0]) {
    const err = new Error("Faculty only — sign in with the dean account to edit courses.");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return { role: me[0].role, first: false };
}

export async function isFacultyUser(userId: string) {
  try {
    await requireFaculty(userId);
    return true;
  } catch {
    return false;
  }
}

function toSummary(c: CourseRecord): CourseSummary {
  return {
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    kicker: c.kicker,
    videoId: c.videoId,
    published: c.published,
    stationCount: c.modules.length,
    updatedAt: c.updatedAt,
  };
}

export const listPublishedCourses = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    await ensureSeeded(sql);
    const rows = await sql<{
      slug: string;
      title: string;
      tagline: string;
      kicker: string;
      video_id: string;
      published: boolean;
      updated_at: string;
      station_count: number;
    }>`
      select c.slug, c.title, c.tagline, c.kicker, c.video_id, c.published, c.updated_at,
             (select count(*)::int from course_modules m where m.course_slug = c.slug) as station_count
      from courses c
      where c.published = true
      order by c.updated_at desc
    `;
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      tagline: r.tagline,
      kicker: r.kicker,
      videoId: r.video_id,
      published: Boolean(r.published),
      stationCount: Number(r.station_count) || 0,
      updatedAt: r.updated_at,
    })) satisfies CourseSummary[];
  },
);

export const getPublishedCourse = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureSeeded(sql);
    const course = await loadCourse(sql, data.slug);
    if (!course || !course.published) return null as CourseRecord | null;
    return course;
  });

export const getOfficeState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureSeeded(sql);
    let role: string | null = null;
    try {
      const granted = await requireFaculty(context.userId);
      role = granted.role;
    } catch {
      role = null;
    }
    const rows = await sql<{
      slug: string;
      title: string;
      tagline: string;
      kicker: string;
      video_id: string;
      published: boolean;
      updated_at: string;
      station_count: number;
    }>`
      select c.slug, c.title, c.tagline, c.kicker, c.video_id, c.published, c.updated_at,
             (select count(*)::int from course_modules m where m.course_slug = c.slug) as station_count
      from courses c
      order by c.updated_at desc
    `;
    return {
      open: false,
      isFaculty: Boolean(role),
      role,
      courses: rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        tagline: r.tagline,
        kicker: r.kicker,
        videoId: r.video_id,
        published: Boolean(r.published),
        stationCount: Number(r.station_count) || 0,
        updatedAt: r.updated_at,
      })) satisfies CourseSummary[],
    };
  });

export const claimOffice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return requireFaculty(context.userId);
  });

export const getOfficeCourse = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { slug: string }) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    return loadCourse(sql, data.slug);
  });

export const saveCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: CourseRecord) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    const existing = await loadCourse(sql, data.slug);
    const course: CourseRecord = {
      ...data,
      slug: slugify(data.slug),
      createdBy: existing?.createdBy ?? context.userId,
      modules: data.modules ?? [],
      examQuestions: data.examQuestions ?? [],
    };
    await writeCourse(sql, course);
    return { ok: true as const, slug: course.slug };
  });

export const setPublished = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { slug: string; published: boolean }) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    await sql`
      update courses set published = ${data.published}, updated_at = now()
      where slug = ${data.slug}
    `;
    return { ok: true as const };
  });

export const createBlankCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { title: string; youtubeUrl: string; context: string }) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    const videoId = parseYoutubeId(data.youtubeUrl);
    if (!videoId) throw new Error("Need a YouTube URL or 11-character video id.");
    let slug = slugify(data.title || "new-course");
    const clash = await sql<{ slug: string }>`select slug from courses where slug = ${slug}`;
    if (clash[0]) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const course: CourseRecord = {
      slug,
      title: data.title.trim() || "Untitled course",
      tagline: "",
      kicker: "",
      videoId,
      videoUrl: youtubeWatchUrlFor(videoId),
      videoTitle: data.title.trim() || "Untitled course",
      contextNotes: data.context,
      published: false,
      createdBy: context.userId,
      passRatio: PASS_RATIO,
      examPassRatio: EXAM_PASS_RATIO,
      modules: [],
      examQuestions: [],
      updatedAt: new Date().toISOString(),
    };
    await writeCourse(sql, course);
    return course;
  });

export { grokBotSeed, toSummary, loadCourse };
