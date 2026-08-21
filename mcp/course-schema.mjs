// The STANDARD course schema an agent uses to create/update courses through the
// MCP server. Mirrors the app's CourseRecord/Module/QuizQuestion types so what
// an agent authors matches exactly what the site renders. Kept in plain ESM so
// the MCP server runs under Node without a build step.
import { z } from "zod";

export const BANNER_STYLES = ["video", "gradient", "none"];

export const clipSchema = z.object({
  start: z.number().int().min(0).default(0),
  end: z.number().int().min(0).default(0),
  label: z.string().default(""),
  why: z.string().default(""),
});

export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string(),
  choices: z.array(z.string()).min(2).max(6),
  answer: z.number().int().min(0).default(0),
  why: z.string().default(""),
});

export const assignmentItemSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  hint: z.string().optional(),
  required: z.boolean().default(true),
});

export const assignmentSchema = z.object({
  title: z.string().default("Field work"),
  brief: z.string().default(""),
  notesPlaceholder: z.string().default(""),
  items: z.array(assignmentItemSchema).default([]),
});

export const quoteSchema = z.object({
  text: z.string(),
  t: z.string().default(""),
});

export const moduleSchema = z.object({
  slug: z.string().optional(),
  title: z.string(),
  kicker: z.string().default(""),
  durationLabel: z.string().default("10 min"),
  summary: z.string().default(""),
  thesis: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  quotes: z.array(quoteSchema).default([]),
  clips: z.array(clipSchema).default([]),
  assignment: assignmentSchema.default({}),
  quiz: z.array(quizQuestionSchema).default([]),
});

export const courseSchema = z.object({
  slug: z.string().optional().describe("Kebab-case id; derived from title if omitted. Required to update an existing course."),
  title: z.string(),
  tagline: z.string().default(""),
  kicker: z.string().default(""),
  videoUrl: z.string().default("").describe("YouTube URL or 11-char video id"),
  published: z.boolean().default(false),
  bannerStyle: z.enum(["video", "gradient", "none"]).default("video"),
  bannerColor: z.string().default(""),
  modules: z.array(moduleSchema).default([]),
  examQuestions: z.array(quizQuestionSchema).default([]),
  createdBy: z.string().optional(),
});

/** A compact JSON description of the schema, for the get_course_schema tool. */
export function courseSchemaDoc() {
  return {
    course: {
      slug: "string (optional; kebab-case; required to target an existing course for update)",
      title: "string (required)",
      tagline: "string",
      kicker: "string",
      videoUrl: "string (YouTube URL or 11-char id)",
      published: "boolean (default false)",
      bannerStyle: "'video' | 'gradient' | 'none' (default 'video')",
      bannerColor: "string (CSS color; used when bannerStyle='gradient')",
      modules: [
        {
          slug: "string (optional; stable id, keep it to preserve student progress)",
          title: "string (required)",
          kicker: "string",
          durationLabel: "string (e.g. '8 min')",
          summary: "string",
          thesis: "string",
          bullets: ["string"],
          quotes: [{ text: "string", t: "string (timecode)" }],
          clips: [{ start: "int seconds", end: "int seconds", label: "string", why: "string" }],
          assignment: {
            title: "string",
            brief: "string",
            notesPlaceholder: "string",
            items: [{ id: "string", label: "string", hint: "string", required: "boolean" }],
          },
          quiz: [{ id: "string", prompt: "string", choices: ["string (2-6)"], answer: "int 0-based", why: "string" }],
        },
      ],
      examQuestions: [{ id: "string", prompt: "string", choices: ["string"], answer: "int 0-based", why: "string" }],
    },
  };
}
