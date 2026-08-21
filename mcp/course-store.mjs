// Database-agnostic course read/write used by the MCP tools. Takes a `sql`
// runner: async (text, params) => rows[]. Mirrors the app's writeCourse/
// loadCourse so MCP-authored courses match exactly what the site renders.
import { courseSchema } from "./course-schema.mjs";

const PASS_RATIO = 0.75;
const EXAM_PASS_RATIO = 0.8;

export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function parseYoutubeId(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const m = raw.match(
    /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : "";
}

function watchUrl(videoId) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
}

export async function listCourses(sql) {
  const rows = await sql(
    `select c.slug, c.title, c.tagline, c.published, c.banner_style, c.updated_at,
            (select count(*)::int from course_modules m where m.course_slug = c.slug) as station_count
     from courses c order by c.updated_at desc`,
  );
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    published: Boolean(r.published),
    bannerStyle: r.banner_style || "video",
    stationCount: Number(r.station_count) || 0,
    updatedAt: r.updated_at,
  }));
}

function parseJson(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getCourse(sql, slug) {
  const rows = await sql(
    `select slug, title, tagline, kicker, video_id, video_url, video_title,
            context_notes, published, created_by, pass_ratio, exam_pass_ratio,
            banner_style, banner_color, updated_at
     from courses where slug = $1`,
    [slug],
  );
  const row = rows[0];
  if (!row) return null;
  const mods = await sql(
    `select slug, station, title, kicker, duration_label, summary, thesis, body_json, sort_order
     from course_modules where course_slug = $1 order by sort_order asc`,
    [slug],
  );
  const exam = await sql(
    `select question_id, prompt, choices_json, answer, why
     from course_exam where course_slug = $1 order by sort_order asc`,
    [slug],
  );
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    kicker: row.kicker,
    videoId: row.video_id,
    videoUrl: row.video_url,
    published: Boolean(row.published),
    bannerStyle: row.banner_style || "video",
    bannerColor: row.banner_color || "",
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    modules: mods.map((m) => {
      const body = parseJson(m.body_json, {});
      return {
        slug: m.slug,
        station: m.station,
        title: m.title,
        kicker: m.kicker,
        durationLabel: m.duration_label,
        summary: m.summary,
        thesis: m.thesis,
        bullets: Array.isArray(body.bullets) ? body.bullets : [],
        quotes: Array.isArray(body.quotes) ? body.quotes : [],
        clips: Array.isArray(body.clips) ? body.clips : [],
        assignment: body.assignment ?? { title: "Field work", brief: "", items: [], notesPlaceholder: "" },
        quiz: Array.isArray(body.quiz) ? body.quiz : [],
      };
    }),
    examQuestions: exam.map((q) => ({
      id: q.question_id,
      prompt: q.prompt,
      choices: parseJson(q.choices_json, []),
      answer: q.answer,
      why: q.why,
    })),
  };
}

export async function upsertCourse(sql, input) {
  const c = courseSchema.parse(input);
  const slug = slugify(c.slug || c.title);
  if (!slug) throw new Error("Course needs a slug or title.");
  const videoId = parseYoutubeId(c.videoUrl);

  const existingRows = await sql(
    `select slug, created_by from courses where slug = $1`,
    [slug],
  );
  const existing = existingRows[0];
  const createdBy = existing?.created_by ?? c.createdBy ?? "mcp";

  await sql(
    `insert into courses (
       slug, title, tagline, kicker, video_id, video_url, video_title, context_notes,
       published, created_by, pass_ratio, exam_pass_ratio, banner_style, banner_color, updated_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
     on conflict (slug) do update set
       title=excluded.title, tagline=excluded.tagline, kicker=excluded.kicker,
       video_id=excluded.video_id, video_url=excluded.video_url, video_title=excluded.video_title,
       published=excluded.published, banner_style=excluded.banner_style,
       banner_color=excluded.banner_color, updated_at=now()`,
    [
      slug,
      c.title,
      c.tagline,
      c.kicker,
      videoId,
      watchUrl(videoId),
      c.title,
      "",
      c.published,
      createdBy,
      PASS_RATIO,
      EXAM_PASS_RATIO,
      c.bannerStyle,
      c.bannerColor,
    ],
  );

  await sql(`delete from course_modules where course_slug = $1`, [slug]);
  await sql(`delete from course_exam where course_slug = $1`, [slug]);

  const seen = new Set();
  for (let i = 0; i < c.modules.length; i += 1) {
    const m = c.modules[i];
    let mslug = slugify(m.slug || m.title) || `station-${i + 1}`;
    while (seen.has(mslug)) mslug = `${mslug}-${i + 1}`;
    seen.add(mslug);
    const body = JSON.stringify({
      bullets: m.bullets,
      quotes: m.quotes,
      clips: m.clips,
      assignment: m.assignment,
      quiz: m.quiz.map((q, qi) => ({ ...q, id: q.id || `q${qi + 1}` })),
    });
    await sql(
      `insert into course_modules (
         course_slug, slug, station, title, kicker, duration_label, summary, thesis, body_json, sort_order
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        slug,
        mslug,
        String(i + 1).padStart(2, "0"),
        m.title,
        m.kicker,
        m.durationLabel,
        m.summary,
        m.thesis,
        body,
        i,
      ],
    );
  }

  for (let i = 0; i < c.examQuestions.length; i += 1) {
    const q = c.examQuestions[i];
    await sql(
      `insert into course_exam (course_slug, question_id, prompt, choices_json, answer, why, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [slug, q.id || `e${i + 1}`, q.prompt, JSON.stringify(q.choices), q.answer, q.why, i],
    );
  }

  return { slug, created: !existing, published: c.published, stations: c.modules.length };
}

export async function setPublished(sql, slug, published) {
  const rows = await sql(
    `update courses set published = $2, updated_at = now() where slug = $1 returning slug`,
    [slug, Boolean(published)],
  );
  if (!rows[0]) throw new Error(`No course with slug '${slug}'.`);
  return { slug, published: Boolean(published) };
}

export async function deleteCourse(sql, slug) {
  await sql(`delete from course_modules where course_slug = $1`, [slug]);
  await sql(`delete from course_exam where course_slug = $1`, [slug]);
  const rows = await sql(`delete from courses where slug = $1 returning slug`, [slug]);
  return { slug, deleted: Boolean(rows[0]) };
}
