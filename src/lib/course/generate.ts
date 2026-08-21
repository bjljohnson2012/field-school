import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { requireFaculty, writeCourse } from "./catalog";
import {
  PASS_RATIO,
  EXAM_PASS_RATIO,
  normalizeBannerStyle,
  type CourseRecord,
  type Module,
  type QuizQuestion,
} from "./types";
import { parseYoutubeId, slugify, youtubeWatchUrlFor } from "./youtube";

type Generated = {
  title?: string;
  tagline?: string;
  kicker?: string;
  videoTitle?: string;
  modules?: Module[];
  examQuestions?: QuizQuestion[];
};

function asString(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeModule(raw: unknown, index: number): Module | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const title = asString(m.title).trim();
  if (!title) return null;
  const clipsRaw = Array.isArray(m.clips) ? m.clips : [];
  const quizRaw = Array.isArray(m.quiz) ? m.quiz : [];
  const itemsRaw =
    m.assignment && typeof m.assignment === "object"
      ? Array.isArray((m.assignment as { items?: unknown }).items)
        ? ((m.assignment as { items: unknown[] }).items)
        : []
      : [];
  const assignmentObj =
    m.assignment && typeof m.assignment === "object"
      ? (m.assignment as Record<string, unknown>)
      : {};
  return {
    slug: slugify(asString(m.slug) || title) || `station-${index + 1}`,
    station: String(index + 1).padStart(2, "0"),
    title,
    kicker: asString(m.kicker),
    durationLabel: asString(m.durationLabel) || "10 min",
    summary: asString(m.summary),
    thesis: asString(m.thesis),
    bullets: Array.isArray(m.bullets) ? m.bullets.map(String).slice(0, 8) : [],
    quotes: Array.isArray(m.quotes)
      ? m.quotes
          .map((q) => {
            if (!q || typeof q !== "object") return null;
            const o = q as { text?: unknown; t?: unknown };
            return { text: asString(o.text), t: asString(o.t) };
          })
          .filter((q): q is { text: string; t: string } => Boolean(q?.text))
          .slice(0, 4)
      : [],
    clips: clipsRaw
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const o = c as Record<string, unknown>;
        return {
          start: Math.max(0, Math.floor(asNumber(o.start))),
          end: Math.max(0, Math.floor(asNumber(o.end))),
          label: asString(o.label) || title,
          why: asString(o.why),
        };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c && c.end >= c.start))
      .slice(0, 3),
    assignment: {
      title: asString(assignmentObj.title) || "Field work",
      brief: asString(assignmentObj.brief),
      notesPlaceholder: asString(assignmentObj.notesPlaceholder),
      items: itemsRaw
        .map((it, i) => {
          if (!it || typeof it !== "object") return null;
          const o = it as Record<string, unknown>;
          return {
            id: asString(o.id) || `a${i + 1}`,
            label: asString(o.label),
            hint: asString(o.hint) || undefined,
            required: o.required !== false,
          };
        })
        .filter((it): it is NonNullable<typeof it> => Boolean(it?.label))
        .slice(0, 6),
    },
    quiz: quizRaw
      .map((q, i) => {
        if (!q || typeof q !== "object") return null;
        const o = q as Record<string, unknown>;
        const choices = Array.isArray(o.choices) ? o.choices.map(String).slice(0, 4) : [];
        if (choices.length < 2) return null;
        return {
          id: asString(o.id) || `q${i + 1}`,
          prompt: asString(o.prompt),
          choices,
          answer: Math.min(choices.length - 1, Math.max(0, Math.floor(asNumber(o.answer)))),
          why: asString(o.why),
        };
      })
      .filter((q): q is QuizQuestion => Boolean(q?.prompt))
      .slice(0, 4),
  };
}

export const generateCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { youtubeUrl: string; context: string; title?: string; slug?: string }) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Course generation needs the xAI key on this host." };
    }
    const videoId = parseYoutubeId(data.youtubeUrl);
    if (!videoId) {
      return { ok: false as const, error: "Need a YouTube URL or 11-character video id." };
    }
    const contextNotes = data.context.trim().slice(0, 40000);
    if (contextNotes.length < 80) {
      return {
        ok: false as const,
        error: "Paste transcript, outline, or notes — at least a short briefing.",
      };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.3,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You build Field School courses. Return JSON only. Bottom-up ladder: name the work, then tools, then one skill, then a clock, then a staff, then a ship, then a kill switch. Each station has timestamped clips (seconds), required field work a student can do without paid tools, and a short quiz. Pass bar is 75% station / 80% exam.",
          },
          {
            role: "user",
            content: `Build a course from this YouTube video and source context.

Video URL: ${youtubeWatchUrlFor(videoId)}
Video id: ${videoId}
Working title: ${data.title || "(derive from the tape)"}

Source context / transcript / notes:
---
${contextNotes}
---

JSON shape:
{
  "title": "short course name",
  "tagline": "one sentence",
  "kicker": "subtitle",
  "videoTitle": "source tape title",
  "modules": [{
    "slug": "kebab-case",
    "title": "",
    "kicker": "",
    "durationLabel": "8 min",
    "summary": "",
    "thesis": "",
    "bullets": ["..."],
    "quotes": [{"text":"", "t":"12:04"}],
    "clips": [{"start": 0, "end": 90, "label": "", "why": ""}],
    "assignment": {
      "title": "Field work",
      "brief": "",
      "notesPlaceholder": "",
      "items": [{"id":"a1","label":"","hint":"","required": true}]
    },
    "quiz": [{"id":"q1","prompt":"","choices":["a","b","c","d"],"answer":1,"why":""}]
  }],
  "examQuestions": [{"id":"e1","prompt":"","choices":["a","b","c","d"],"answer":1,"why":""}]
}

Rules: 6–10 stations. Clip start/end are integer seconds from the video. Quiz answer is the 0-based index. Exam is 8–10 questions. Do not invent timestamps that contradict the context; if unknown, use 0 and a 90-second window and say so in why.`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `xAI API error ${res.status}` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    let parsed: Generated;
    try {
      parsed = JSON.parse(text) as Generated;
    } catch {
      return { ok: false as const, error: "The model did not return usable JSON. Try a tighter briefing." };
    }
    const mods = (parsed.modules ?? [])
      .map((m, i) => normalizeModule(m, i))
      .filter((m): m is Module => Boolean(m));
    if (mods.length < 3) {
      return { ok: false as const, error: "Need at least three stations. Add more context and retry." };
    }
    const seen = new Set<string>();
    for (const m of mods) {
      let s = m.slug;
      if (seen.has(s)) s = `${s}-${m.station}`;
      seen.add(s);
      m.slug = s;
    }
    const exam = (parsed.examQuestions ?? [])
      .map((q, i) => normalizeModule({ quiz: [q], title: "exam" }, 0)?.quiz[0])
      .filter((q): q is QuizQuestion => Boolean(q))
      .map((q, i) => ({ ...q, id: q.id || `e${i + 1}` }));

    const sql = await getSql();
    let slug = data.slug ? slugify(data.slug) : slugify(parsed.title || data.title || "course");
    if (!data.slug) {
      const clash = await sql<{ slug: string }>`select slug from courses where slug = ${slug}`;
      if (clash[0]) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    // Preserve the admin's chosen banner when rebuilding an existing course.
    const existingBanner = data.slug
      ? (
          await sql<{ banner_style: string; banner_color: string }>`
            select banner_style, banner_color from courses where slug = ${slug}
          `
        )[0]
      : undefined;
    const course: CourseRecord = {
      slug,
      title: asString(parsed.title, data.title || "Untitled course").trim() || "Untitled course",
      tagline: asString(parsed.tagline),
      kicker: asString(parsed.kicker),
      videoId,
      videoUrl: youtubeWatchUrlFor(videoId),
      videoTitle: asString(parsed.videoTitle, data.title || ""),
      contextNotes,
      published: false,
      createdBy: context.userId,
      passRatio: PASS_RATIO,
      examPassRatio: EXAM_PASS_RATIO,
      bannerStyle: normalizeBannerStyle(existingBanner?.banner_style),
      bannerColor: existingBanner?.banner_color ?? "",
      modules: mods,
      examQuestions: exam.slice(0, 12),
      updatedAt: new Date().toISOString(),
    };
    await writeCourse(sql, course);
    return { ok: true as const, course };
  });

/**
 * Draft multiple-choice questions with AI from a title + source text. Used by
 * the "Suggest with AI" buttons in the course editor for station quizzes and the
 * exam. Standardized JSON shape so results drop straight into the editor.
 */
export const suggestQuestions = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: { title: string; context: string; count?: number; kind?: "quiz" | "exam" }) => d,
  )
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Question generation needs the xAI key on this host.",
      };
    }
    const count = Math.min(8, Math.max(1, Math.floor(data.count ?? 3)));
    const title = (data.title || "this topic").trim().slice(0, 300);
    const source = (data.context || "").trim().slice(0, 12000);
    const kind = data.kind === "exam" ? "exam" : "quiz";

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write clear multiple-choice questions for a field-work course. Each question has exactly 4 choices with one correct answer and a one-line explanation. Return JSON only.",
          },
          {
            role: "user",
            content: `Write ${count} ${kind} multiple-choice questions that test real understanding of "${title}".
Base them on this material (do not invent facts that contradict it):
---
${source || "(no extra material — use the title)"}
---
JSON shape:
{"questions":[{"prompt":"","choices":["a","b","c","d"],"answer":0,"why":""}]}
answer is the 0-based index of the correct choice.`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `xAI API error ${res.status}` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    let parsed: { questions?: unknown };
    try {
      parsed = JSON.parse(text) as { questions?: unknown };
    } catch {
      return { ok: false as const, error: "The model did not return usable JSON. Try again." };
    }
    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const questions = (normalizeModule({ title: "q", quiz: rawQuestions }, 0)?.quiz ?? [])
      .slice(0, count)
      .map((q, i) => ({ ...q, id: `ai-${Date.now().toString(36)}-${i}` }));
    if (questions.length === 0) {
      return { ok: false as const, error: "No usable questions came back. Try again." };
    }
    return { ok: true as const, questions };
  });
