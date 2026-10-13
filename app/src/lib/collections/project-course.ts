import { parseBlocks, type Block, type QuizQuestion } from "./content-model.ts";
import { getCourse } from "../course/catalog.ts";
import type { Module, QuizQuestion as ViewQuestion } from "../course/types.ts";
import { GROK_BOT_SLUG } from "../course/types.ts";

export type StoredLesson = {
  orgId: string;
  slug: string;
  title: string;
  order: number;
  status: "draft" | "published";
  blocks: Block[];
};

export type StoredPractice = {
  lessonSlug: string;
  kind: "assignment" | "quiz";
  order: number;
  blockIndex: number;
};

export type StoredCourse = {
  orgId: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  example: boolean;
  blocks: Block[];
  moduleSlug: string;
  moduleTitle: string;
  lessons: StoredLesson[];
  practice: StoredPractice[];
};

function viewQuestions(questions: readonly QuizQuestion[]): ViewQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    choices: question.choices,
    answer: question.answer,
    why: question.why,
  }));
}

export function blocksFromModule(mod: Module): Block[] {
  const blocks: Block[] = [
    {
      kind: "station",
      station: mod.station,
      kicker: mod.kicker,
      durationLabel: mod.durationLabel,
      summary: mod.summary,
    },
    { kind: "text", text: mod.thesis },
  ];
  if (mod.bullets.length > 0) blocks.push({ kind: "bullets", items: mod.bullets });
  for (const quote of mod.quotes) blocks.push({ kind: "quote", text: quote.text, at: quote.t });
  for (const clip of mod.clips) {
    blocks.push({
      kind: "clip",
      startSec: clip.start,
      endSec: clip.end,
      label: clip.label,
      why: clip.why,
    });
  }
  blocks.push({
    kind: "assignment",
    title: mod.assignment.title,
    brief: mod.assignment.brief,
    notesPlaceholder: mod.assignment.notesPlaceholder,
    items: mod.assignment.items.map((item) => ({
      id: item.id,
      label: item.label,
      required: item.required,
      ...(item.hint ? { hint: item.hint } : {}),
    })),
  });
  if (mod.quiz.length > 0) {
    blocks.push({
      kind: "quiz",
      questions: mod.quiz.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        choices: question.choices,
        answer: question.answer,
        why: question.why,
        sourceUnitId: "",
      })),
    });
  }
  const parsed = parseBlocks(blocks);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.blocks;
}

export function moduleFromBlocks(slug: string, title: string, blocks: readonly Block[]): Module {
  const station = blocks.find((block) => block.kind === "station");
  const text = blocks.find((block) => block.kind === "text");
  const bullets = blocks.find((block) => block.kind === "bullets");
  const assignment = blocks.find((block) => block.kind === "assignment");
  const quiz = blocks.find((block) => block.kind === "quiz");
  return {
    slug,
    station: station && station.kind === "station" ? station.station : "01",
    title,
    kicker: station && station.kind === "station" ? station.kicker : "",
    durationLabel: station && station.kind === "station" ? station.durationLabel : "",
    summary: station && station.kind === "station" ? station.summary : "",
    thesis: text && text.kind === "text" ? text.text : "",
    bullets: bullets && bullets.kind === "bullets" ? bullets.items : [],
    quotes: blocks.flatMap((block) =>
      block.kind === "quote" ? [{ text: block.text, t: block.at }] : [],
    ),
    clips: blocks.flatMap((block) =>
      block.kind === "clip"
        ? [{ start: block.startSec, end: block.endSec, label: block.label, why: block.why }]
        : [],
    ),
    assignment: {
      title: assignment && assignment.kind === "assignment" ? assignment.title : "",
      brief: assignment && assignment.kind === "assignment" ? assignment.brief : "",
      notesPlaceholder:
        assignment && assignment.kind === "assignment" ? assignment.notesPlaceholder : "",
      items:
        assignment && assignment.kind === "assignment"
          ? assignment.items.map((item) => ({
              id: item.id,
              label: item.label,
              required: item.required,
              ...(item.hint ? { hint: item.hint } : {}),
            }))
          : [],
    },
    quiz: quiz && quiz.kind === "quiz" ? viewQuestions(quiz.questions) : [],
  };
}

export function exampleCoursePlan(orgId: string): StoredCourse {
  const course = getCourse(GROK_BOT_SLUG);
  if (!course) throw new Error("missing_grok_bot");
  const exam = parseBlocks([
    {
      kind: "course",
      tagline: course.tagline,
      kicker: course.kicker,
      videoId: course.videoId,
      videoUrl: course.videoUrl,
      videoTitle: course.videoTitle,
      passRatio: course.passRatio,
      examPassRatio: course.examPassRatio,
      updatedAt: course.updatedAt,
    },
    {
      kind: "quiz",
      questions: course.examQuestions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        choices: question.choices,
        answer: question.answer,
        why: question.why,
        sourceUnitId: "",
      })),
    },
  ]);
  if (!exam.ok) throw new Error(exam.error);
  const lessons: StoredLesson[] = course.modules.map((mod, order) => ({
    orgId,
    slug: mod.slug,
    title: mod.title,
    order,
    status: "published",
    blocks: blocksFromModule(mod),
  }));
  const practice: StoredPractice[] = [];
  for (const lesson of lessons) {
    lesson.blocks.forEach((block, blockIndex) => {
      if (block.kind === "assignment" || block.kind === "quiz") {
        practice.push({ lessonSlug: lesson.slug, kind: block.kind, order: practice.length, blockIndex });
      }
    });
  }
  return {
    orgId,
    slug: course.slug,
    title: course.title,
    status: "published",
    example: true,
    blocks: exam.blocks,
    moduleSlug: "the-ladder",
    moduleTitle: "The ladder",
    lessons,
    practice,
  };
}

export function planCounts(plan: StoredCourse) {
  return {
    courses: plan.orgId.trim() ? 1 : 0,
    modules: 1,
    lessons: plan.lessons.length,
    practice: plan.practice.length,
  };
}

export function projectStoredCourse(plan: StoredCourse) {
  const meta = plan.blocks.find((block) => block.kind === "course");
  const exam = plan.blocks.find((block) => block.kind === "quiz");
  const lessons = [...plan.lessons].sort((a, b) => a.order - b.order);
  return {
    slug: plan.slug,
    title: plan.title,
    tagline: meta && meta.kind === "course" ? meta.tagline : "",
    kicker: meta && meta.kind === "course" ? meta.kicker : "",
    videoId: meta && meta.kind === "course" ? meta.videoId : "",
    videoUrl: meta && meta.kind === "course" ? meta.videoUrl : "",
    videoTitle: meta && meta.kind === "course" ? meta.videoTitle : "",
    contextNotes: "",
    published: plan.status === "published",
    createdBy: "field-school",
    passRatio: meta && meta.kind === "course" ? meta.passRatio : 0.75,
    examPassRatio: meta && meta.kind === "course" ? meta.examPassRatio : 0.8,
    modules: lessons
      .filter((lesson) => lesson.status === "published")
      .map((lesson) => moduleFromBlocks(lesson.slug, lesson.title, lesson.blocks)),
    examQuestions: exam && exam.kind === "quiz" ? viewQuestions(exam.questions) : [],
    updatedAt: meta && meta.kind === "course" ? meta.updatedAt : "",
    orgId: plan.orgId,
  };
}
