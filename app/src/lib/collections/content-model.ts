export type TextBlock = { kind: "text"; text: string };

export type BulletsBlock = { kind: "bullets"; items: string[] };

export type QuoteBlock = { kind: "quote"; text: string; at: string };

export type ClipBlock = {
  kind: "clip";
  startSec: number;
  endSec: number;
  label: string;
  why: string;
};

export type AssignmentItem = {
  id: string;
  label: string;
  required: boolean;
  hint?: string;
};

export type AssignmentBlock = {
  kind: "assignment";
  title: string;
  brief: string;
  notesPlaceholder: string;
  items: AssignmentItem[];
};

export type StationBlock = {
  kind: "station";
  station: string;
  kicker: string;
  durationLabel: string;
  summary: string;
};

export type CourseBlock = {
  kind: "course";
  tagline: string;
  kicker: string;
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  passRatio: number;
  examPassRatio: number;
  updatedAt: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: number;
  why: string;
  sourceUnitId: string;
};

export type QuizBlock = { kind: "quiz"; questions: QuizQuestion[] };

export type Block =
  | TextBlock
  | BulletsBlock
  | QuoteBlock
  | ClipBlock
  | AssignmentBlock
  | QuizBlock
  | StationBlock
  | CourseBlock;

export type PublishStatus = "draft" | "published";

export type LessonDraft = {
  orgId: string;
  moduleSlug: string;
  slug: string;
  title: string;
  status: PublishStatus;
  blocks: Block[];
  outcomeIds: string[];
};

export type StationInput = {
  slug: string;
  title: string;
  thesis: string;
  bullets: string[];
  quotes: { text: string; at: string }[];
  clips: { startSec: number; endSec: number; label: string; why: string }[];
  assignment: { title: string; brief: string; items: AssignmentItem[] };
  quiz: {
    id: string;
    prompt: string;
    choices: string[];
    answer: number;
    why: string;
  }[];
};

export type ComposerQuizItem = QuizQuestion;

type Field = { name: string; type: string; required?: boolean };

type Collection = {
  slug: string;
  label: string;
  fields: Field[];
  relations: string[];
  versions: boolean;
  access: { read: string; write: string };
};

const HTML_TAG = /<\/?[a-z][^>]*>/i;

const orgFields: Field[] = [
  { name: "org_id", type: "relationship", required: true },
];

export const CONTENT_COLLECTIONS: readonly Collection[] = [
  {
    slug: "courses",
    label: "Courses",
    fields: [
      ...orgFields,
      { name: "slug", type: "text", required: true },
      { name: "title", type: "text", required: true },
      { name: "_status", type: "select", required: true },
      { name: "example", type: "checkbox" },
    ],
    relations: ["organizations"],
    versions: true,
    access: {
      read: "membership in this org",
      write: "membership in this org, after M5 access lands",
    },
  },
  {
    slug: "modules",
    label: "Modules",
    fields: [
      ...orgFields,
      { name: "course_id", type: "relationship", required: true },
      { name: "slug", type: "text", required: true },
      { name: "title", type: "text", required: true },
      { name: "order", type: "number", required: true },
      { name: "_status", type: "select", required: true },
    ],
    relations: ["courses"],
    versions: false,
    access: {
      read: "same as the course",
      write: "same as the course",
    },
  },
  {
    slug: "lessons",
    label: "Lessons",
    fields: [
      ...orgFields,
      { name: "course_id", type: "relationship", required: true },
      { name: "module_id", type: "relationship", required: true },
      { name: "slug", type: "text", required: true },
      { name: "title", type: "text", required: true },
      { name: "order", type: "number", required: true },
      { name: "_status", type: "select", required: true },
      { name: "blocks", type: "json", required: true },
      { name: "outcome_ids", type: "json", required: true },
    ],
    relations: ["modules", "courses"],
    versions: true,
    access: {
      read: "same as the course",
      write: "same as the course",
    },
  },
  {
    slug: "practice",
    label: "Practice",
    fields: [
      ...orgFields,
      { name: "lesson_id", type: "relationship", required: true },
      { name: "kind", type: "select", required: true },
      { name: "order", type: "number", required: true },
      { name: "block_index", type: "number", required: true },
    ],
    relations: ["lessons"],
    versions: false,
    access: {
      read: "same as the lesson",
      write: "same as the lesson",
    },
  },
  {
    slug: "course_versions",
    label: "Course versions",
    fields: [
      ...orgFields,
      { name: "parent_id", type: "relationship", required: true },
      { name: "version", type: "number", required: true },
      { name: "snapshot", type: "json", required: true },
    ],
    relations: ["courses"],
    versions: false,
    access: {
      read: "same as the course",
      write: "same as the course",
    },
  },
  {
    slug: "lesson_versions",
    label: "Lesson versions",
    fields: [
      ...orgFields,
      { name: "parent_id", type: "relationship", required: true },
      { name: "version", type: "number", required: true },
      { name: "snapshot", type: "json", required: true },
    ],
    relations: ["lessons"],
    versions: false,
    access: {
      read: "same as the lesson",
      write: "same as the lesson",
    },
  },
];

export function collectionField(
  slug: string,
  name: string,
): { type: string; required: boolean } | null {
  const collection = CONTENT_COLLECTIONS.find((item) => item.slug === slug);
  if (!collection) return null;
  const field = collection.fields.find((item) => item.name === name);
  if (!field) return null;
  return { type: field.type, required: field.required === true };
}

export function replaceTextBlock(blocks: readonly Block[], text: string): Block[] {
  return [{ kind: "text", text }, ...blocks.filter((block) => block.kind !== "text")];
}

export function courseOrgRefusal(orgId: string): string | null {
  if (orgId.trim().length === 0) return "course_org_required";
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value;
}

function readNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function hasHtml(value: string): boolean {
  return HTML_TAG.test(value);
}

function rejectHtml(value: string): string | null {
  if (hasHtml(value)) return "html_not_allowed";
  return null;
}

function parseStringList(value: unknown): string[] | string {
  if (!Array.isArray(value)) return "string_list_required";
  const items: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return "string_list_required";
    const html = rejectHtml(item);
    if (html) return html;
    items.push(item);
  }
  return items;
}

function parseText(value: Record<string, unknown>): Block | string {
  const text = readString(value.text);
  if (text === null) return "text_required";
  const html = rejectHtml(text);
  if (html) return html;
  return { kind: "text", text };
}

function parseBullets(value: Record<string, unknown>): Block | string {
  const items = parseStringList(value.items);
  if (typeof items === "string") return items;
  return { kind: "bullets", items };
}

function parseQuote(value: Record<string, unknown>): Block | string {
  const text = readString(value.text);
  const at = readString(value.at);
  if (text === null || at === null) return "quote_required";
  const html = rejectHtml(text) ?? rejectHtml(at);
  if (html) return html;
  return { kind: "quote", text, at };
}

function parseClip(value: Record<string, unknown>): Block | string {
  const startSec = readNumber(value.startSec);
  const endSec = readNumber(value.endSec);
  const label = readString(value.label);
  const why = readString(value.why);
  if (startSec === null || endSec === null || label === null || why === null) {
    return "clip_required";
  }
  if (endSec <= startSec) return "clip_range";
  const html = rejectHtml(label) ?? rejectHtml(why);
  if (html) return html;
  return { kind: "clip", startSec, endSec, label, why };
}

function parseAssignmentItem(value: unknown): AssignmentItem | string {
  if (!isRecord(value)) return "assignment_item_required";
  const id = readString(value.id);
  const label = readString(value.label);
  if (id === null || label === null || typeof value.required !== "boolean") {
    return "assignment_item_required";
  }
  const html = rejectHtml(id) ?? rejectHtml(label);
  if (html) return html;
  const hint = readString(value.hint);
  if (value.hint !== undefined && hint === null) return "assignment_item_required";
  if (hint && rejectHtml(hint)) return "html_not_allowed";
  if (hint) return { id, label, required: value.required, hint };
  return { id, label, required: value.required };
}

function parseAssignment(value: Record<string, unknown>): Block | string {
  const title = readString(value.title);
  const brief = readString(value.brief);
  if (title === null || brief === null || !Array.isArray(value.items)) {
    return "assignment_required";
  }
  const notesPlaceholder = readString(value.notesPlaceholder) ?? "";
  if (value.notesPlaceholder !== undefined && readString(value.notesPlaceholder) === null) {
    return "assignment_required";
  }
  const html = rejectHtml(title) ?? rejectHtml(brief) ?? rejectHtml(notesPlaceholder);
  if (html) return html;
  const items: AssignmentItem[] = [];
  for (const item of value.items) {
    const parsed = parseAssignmentItem(item);
    if (typeof parsed === "string") return parsed;
    items.push(parsed);
  }
  return { kind: "assignment", title, brief, notesPlaceholder, items };
}

function parseQuestion(value: unknown): QuizQuestion | string {
  if (!isRecord(value)) return "quiz_question_required";
  const id = readString(value.id);
  const prompt = readString(value.prompt);
  const why = readString(value.why);
  const sourceUnitId = readString(value.sourceUnitId);
  const answer = readNumber(value.answer);
  const choices = parseStringList(value.choices);
  if (
    id === null ||
    prompt === null ||
    why === null ||
    sourceUnitId === null ||
    answer === null ||
    typeof choices === "string"
  ) {
    return "quiz_question_required";
  }
  const html = rejectHtml(id) ?? rejectHtml(prompt) ?? rejectHtml(why) ?? rejectHtml(sourceUnitId);
  if (html) return html;
  if (!Number.isInteger(answer) || answer < 0 || answer >= choices.length) {
    return "quiz_answer_out_of_range";
  }
  return { id, prompt, choices, answer, why, sourceUnitId };
}

function parseQuiz(value: Record<string, unknown>): Block | string {
  if (!Array.isArray(value.questions)) return "quiz_required";
  const questions: QuizQuestion[] = [];
  for (const question of value.questions) {
    const parsed = parseQuestion(question);
    if (typeof parsed === "string") return parsed;
    questions.push(parsed);
  }
  return { kind: "quiz", questions };
}

function parseStation(value: Record<string, unknown>): Block | string {
  const station = readString(value.station);
  const kicker = readString(value.kicker);
  const durationLabel = readString(value.durationLabel);
  const summary = readString(value.summary);
  if (station === null || kicker === null || durationLabel === null || summary === null) {
    return "station_required";
  }
  const html = rejectHtml(station) ?? rejectHtml(kicker) ?? rejectHtml(durationLabel) ?? rejectHtml(summary);
  if (html) return html;
  return { kind: "station", station, kicker, durationLabel, summary };
}

function parseCourse(value: Record<string, unknown>): Block | string {
  const tagline = readString(value.tagline);
  const kicker = readString(value.kicker);
  const videoId = readString(value.videoId);
  const videoUrl = readString(value.videoUrl);
  const videoTitle = readString(value.videoTitle);
  const updatedAt = readString(value.updatedAt);
  const passRatio = readNumber(value.passRatio);
  const examPassRatio = readNumber(value.examPassRatio);
  if (
    tagline === null ||
    kicker === null ||
    videoId === null ||
    videoUrl === null ||
    videoTitle === null ||
    updatedAt === null ||
    passRatio === null ||
    examPassRatio === null
  ) {
    return "course_required";
  }
  const html =
    rejectHtml(tagline) ??
    rejectHtml(kicker) ??
    rejectHtml(videoId) ??
    rejectHtml(videoUrl) ??
    rejectHtml(videoTitle) ??
    rejectHtml(updatedAt);
  if (html) return html;
  return { kind: "course", tagline, kicker, videoId, videoUrl, videoTitle, passRatio, examPassRatio, updatedAt };
}

function parseBlock(value: unknown): Block | string {
  if (!isRecord(value) || typeof value.kind !== "string") return "block_not_object";
  if (value.kind === "text") return parseText(value);
  if (value.kind === "bullets") return parseBullets(value);
  if (value.kind === "quote") return parseQuote(value);
  if (value.kind === "clip") return parseClip(value);
  if (value.kind === "assignment") return parseAssignment(value);
  if (value.kind === "quiz") return parseQuiz(value);
  if (value.kind === "station") return parseStation(value);
  if (value.kind === "course") return parseCourse(value);
  return "unknown_block_kind";
}

export function parseBlocks(
  input: unknown,
): { ok: true; blocks: Block[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "blocks_not_array" };
  const blocks: Block[] = [];
  for (const item of input) {
    const parsed = parseBlock(item);
    if (typeof parsed === "string") return { ok: false, error: parsed };
    blocks.push(parsed);
  }
  return { ok: true, blocks };
}

function requiredBlockRefusal(blocks: readonly Block[]): string | null {
  let sawText = false;
  for (const block of blocks) {
    switch (block.kind) {
      case "text":
        sawText = true;
        if (block.text.trim().length === 0 || hasHtml(block.text)) {
          return "required_text_block_empty";
        }
        break;
      case "bullets":
      case "quote":
      case "clip":
      case "station":
      case "course":
        break;
      case "quiz":
        if (block.questions.length === 0) return "required_quiz_block_empty";
        for (const question of block.questions) {
          if (question.prompt.trim().length === 0 || question.choices.length < 2) {
            return "required_quiz_block_empty";
          }
          if (question.sourceUnitId.trim().length === 0) return "source_unit_id_required";
        }
        break;
      case "assignment":
        if (block.title.trim().length === 0) return "required_assignment_block_empty";
        for (const item of block.items) {
          if (item.required && item.label.trim().length === 0) {
            return "required_assignment_block_empty";
          }
        }
        break;
      default: {
        const _exhaustive: never = block;
        return _exhaustive;
      }
    }
  }
  if (!sawText) return "required_text_block_empty";
  return null;
}

export function publishLesson(
  lesson: LessonDraft,
): { ok: true; lesson: LessonDraft } | { ok: false; error: string } {
  const orgError = courseOrgRefusal(lesson.orgId);
  if (orgError) return { ok: false, error: orgError };
  const blockError = requiredBlockRefusal(lesson.blocks);
  if (blockError) return { ok: false, error: blockError };
  const published: LessonDraft = { ...lesson, status: "published" };
  return { ok: true, lesson: published };
}

export function lessonFromStation(input: {
  orgId: string;
  moduleSlug: string;
  station: StationInput;
}): { ok: true; lesson: LessonDraft } | { ok: false; error: string } {
  const orgError = courseOrgRefusal(input.orgId);
  if (orgError) return { ok: false, error: orgError };
  const station = input.station;
  const blocks: Block[] = [{ kind: "text", text: station.thesis }];
  if (station.bullets.length > 0) blocks.push({ kind: "bullets", items: station.bullets });
  for (const quote of station.quotes) {
    blocks.push({ kind: "quote", text: quote.text, at: quote.at });
  }
  for (const clip of station.clips) {
    blocks.push({
      kind: "clip",
      startSec: clip.startSec,
      endSec: clip.endSec,
      label: clip.label,
      why: clip.why,
    });
  }
  blocks.push({
    kind: "assignment",
    title: station.assignment.title,
    brief: station.assignment.brief,
    notesPlaceholder: "",
    items: station.assignment.items,
  });
  if (station.quiz.length > 0) {
    blocks.push({
      kind: "quiz",
      questions: station.quiz.map((question) => ({
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
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    lesson: {
      orgId: input.orgId,
      moduleSlug: input.moduleSlug,
      slug: station.slug,
      title: station.title,
      status: "draft",
      blocks: parsed.blocks,
      outcomeIds: [],
    },
  };
}

export function lessonFromComposer(input: {
  orgId: string;
  moduleSlug: string;
  slug: string;
  title: string;
  body: string;
  quizItems: readonly ComposerQuizItem[];
}): { ok: true; lesson: LessonDraft } | { ok: false; error: string } {
  const orgError = courseOrgRefusal(input.orgId);
  if (orgError) return { ok: false, error: orgError };
  for (const item of input.quizItems) {
    if (item.sourceUnitId.trim().length === 0) {
      return { ok: false, error: "source_unit_id_required" };
    }
  }
  const blocks: Block[] = [{ kind: "text", text: input.body }];
  if (input.quizItems.length > 0) {
    blocks.push({ kind: "quiz", questions: input.quizItems.map((item) => ({ ...item })) });
  }
  const parsed = parseBlocks(blocks);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    lesson: {
      orgId: input.orgId,
      moduleSlug: input.moduleSlug,
      slug: input.slug,
      title: input.title,
      status: "draft",
      blocks: parsed.blocks,
      outcomeIds: [],
    },
  };
}

export function upsertLessons(
  existing: readonly LessonDraft[],
  incoming: readonly LessonDraft[],
): LessonDraft[] {
  const bySlug = new Map<string, LessonDraft>();
  const order: string[] = [];
  for (const lesson of existing) {
    if (!bySlug.has(lesson.slug)) order.push(lesson.slug);
    bySlug.set(lesson.slug, lesson);
  }
  for (const lesson of incoming) {
    if (!bySlug.has(lesson.slug)) order.push(lesson.slug);
    bySlug.set(lesson.slug, lesson);
  }
  const lessons: LessonDraft[] = [];
  for (const slug of order) {
    const lesson = bySlug.get(slug);
    if (lesson) lessons.push(lesson);
  }
  return lessons;
}
