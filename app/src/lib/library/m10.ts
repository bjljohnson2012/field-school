/**
 * M10 library rules. CDM sealed these choices on 2026-10-14, delegated by Ben.
 * Storage stays typed JSON. The block editor is Tiptap. The graph is later.
 */

import {
  parseBlocks,
  publishLesson,
  type AssignmentItem,
  type Block,
  type LessonDraft,
  type QuizQuestion,
} from "../collections/content-model.ts";

export const LIBRARY_SECTIONS = [
  { id: "brain", label: "Brain", href: "/library/brain" },
  { id: "courses", label: "Courses", href: "/library" },
  { id: "sessions", label: "Sessions", href: "/library/sessions" },
  { id: "media", label: "Media", href: "/library/media" },
] as const;

export const NINE_BLOCK_SLOTS = [
  { id: "objective", label: "Objective and outcome", kind: "text", step: "overview" },
  { id: "why", label: "Why it matters", kind: "text", step: "overview" },
  { id: "core", label: "Core idea", kind: "text", step: "core" },
  { id: "example", label: "Worked example", kind: "text", step: "example" },
  { id: "practice", label: "Practice", kind: "quiz", step: "practice" },
  { id: "field", label: "Field work", kind: "assignment", step: "field" },
  { id: "check", label: "Check for understanding", kind: "quiz", step: "check" },
  { id: "reflection", label: "Reflection", kind: "text", step: "reflection" },
  { id: "next", label: "Next step and gap capture", kind: "text", step: "next" },
] as const;

export const LEARNER_STEPS = [
  { id: "overview", label: "Overview", slots: [0, 1] },
  { id: "core", label: "Core idea", slots: [2] },
  { id: "example", label: "Worked example", slots: [3] },
  { id: "practice", label: "Practice", slots: [4] },
  { id: "field", label: "Field work", slots: [5] },
  { id: "check", label: "Check", slots: [6] },
  { id: "reflection", label: "Reflection", slots: [7] },
  { id: "next", label: "Next step", slots: [8] },
] as const;

export type LearnerStepId = (typeof LEARNER_STEPS)[number]["id"];

export type LessonFilm =
  | null
  | { provider: "youtube"; videoId: string }
  | { provider: "lesson-spine" };

export type LibraryLesson = LessonDraft & {
  id: string;
  courseSlug: string;
  film: LessonFilm;
};

export type LibraryViewer = "leader" | "member" | "child";
export type LibrarySurface = "learn" | "library";

export type LibrarySession = {
  id: string;
  orgId: string;
  title: string;
  when: string;
  status: "draft" | "published";
  recap: string;
  nextSteps: string;
};

export type VisibleSession = {
  id: string;
  title: string;
  when: string;
  nextSteps: string;
  recap: string | null;
};

export type BrainPage = { id: string; title: string; body: string };

export type LessonVersion = { version: number; snapshot: LibraryLesson };

export const GUEST_CONTINUITY_COPY = "A guest keeps this step on this browser.";

export const LESSON_VIEWPORT = { width: 1440, innerHeight: 900 } as const;

/** No Yap-cut lesson exists. This stays null until one does. */
export const YAP_CUT_LESSON_ID: string | null = null;

const SLOT_KINDS = ["text", "text", "text", "text", "quiz", "assignment", "quiz", "text", "text"] as const;

const STATIC_REDIRECTS: Record<string, string> = {
  "/play/lesson-spine": "/c/lesson-spine/master",
  "/coaching/files": "/library/media",
  "/coaching/questions": "/library/practice",
  "/knowledge": "/library/brain",
  "/brain": "/library/brain",
  "/networks": "/library/brain",
  "/operator/publish": "/library",
};

export const BRAIN_PAGES: readonly BrainPage[] = [
  {
    id: "welcome",
    title: "Welcome",
    body: "A page for this brain. The list stays here. The graph comes later.",
  },
];

const SESSION_FIXTURE: readonly LibrarySession[] = [
  {
    id: "session-published",
    orgId: "org-1",
    title: "Tuesday session",
    when: "2026-10-14",
    status: "published",
    recap: "RECIPROCAL_RECAP_BODY",
    nextSteps: "Write the next step for the member.",
  },
  {
    id: "session-draft",
    orgId: "org-1",
    title: "Draft session",
    when: "2026-10-13",
    status: "draft",
    recap: "DRAFT_RECAP_BODY",
    nextSteps: "Hidden until published.",
  },
];

export function libraryCatalog(): readonly LibraryLesson[] {
  return [];
}

export function sessionCatalog(): readonly LibrarySession[] {
  return SESSION_FIXTURE;
}

export function brainPages(): readonly BrainPage[] {
  return BRAIN_PAGES;
}

function safeSlug(value: string): boolean {
  return value.length > 0 && value !== "." && value !== ".." && !value.includes("/") && !value.includes("\\");
}

/** Permanent library redirects. Wizard and Video stay put: they are New menu destinations. */
export function libraryRedirect(pathname: string): string | null {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/library/wizard" || path === "/library/video") return null;
  if (path.startsWith("/coaching/files/") && !path.split("/").some((part) => part === "." || part === "..")) {
    return "/library/media";
  }
  if (path.startsWith("/coaching/questions/") && !path.split("/").some((part) => part === "." || part === "..")) {
    return "/library/practice";
  }
  const direct = STATIC_REDIRECTS[path];
  if (direct) return direct;
  const lesson = /^\/o\/([^/]+)\/l(?:\/([^/]+))?$/.exec(path);
  if (lesson) {
    const slug = lesson[1] ?? "";
    const lessonId = lesson[2];
    if (!safeSlug(slug)) return null;
    if (!lessonId) return "/library";
    if (!safeSlug(lessonId)) return null;
    return `/library/lessons/${lessonId}`;
  }
  const teach = /^\/o\/([^/]+)\/teach(?:\/([^/]+))?$/.exec(path);
  if (teach) {
    const slug = teach[1] ?? "";
    const lessonId = teach[2];
    if (!safeSlug(slug)) return null;
    if (!lessonId) return "/library";
    if (!safeSlug(lessonId)) return null;
    return `/library/lessons/${lessonId}/edit`;
  }
  return null;
}

export function moveTreeFocus(count: number, index: number, key: string): number {
  if (count <= 0) return 0;
  const current = Math.min(Math.max(index, 0), count - 1);
  if (key === "ArrowDown") return Math.min(count - 1, current + 1);
  if (key === "ArrowUp") return Math.max(0, current - 1);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return current;
}

function emptyText(): Block {
  return { kind: "text", text: "" };
}

function emptyQuiz(): Block {
  return { kind: "quiz", questions: [] };
}

function emptyAssignment(): Block {
  return { kind: "assignment", title: "", brief: "", notesPlaceholder: "", items: [] };
}

export function nineBlockTemplate(input: { orgId: string; id: string; title: string }): LibraryLesson {
  return {
    id: input.id,
    orgId: input.orgId,
    courseSlug: "library",
    moduleSlug: "module",
    slug: input.id,
    title: input.title,
    status: "draft",
    outcomeIds: [],
    film: null,
    blocks: [
      emptyText(),
      emptyText(),
      emptyText(),
      emptyText(),
      emptyQuiz(),
      emptyAssignment(),
      emptyQuiz(),
      emptyText(),
      emptyText(),
    ],
  };
}

export function nineSlotError(blocks: readonly Block[]): string | null {
  if (blocks.length !== NINE_BLOCK_SLOTS.length) return "nine_blocks_required";
  for (let index = 0; index < SLOT_KINDS.length; index += 1) {
    if (blocks[index]?.kind !== SLOT_KINDS[index]) return "nine_block_order";
  }
  return null;
}

export function setTextSlot(lesson: LibraryLesson, index: number, text: string): LibraryLesson {
  const blocks = lesson.blocks.map((block, blockIndex) =>
    blockIndex === index && block.kind === "text" ? { kind: "text" as const, text } : block,
  );
  return { ...lesson, blocks };
}

export function setQuizSlot(lesson: LibraryLesson, index: number, questions: readonly QuizQuestion[]): LibraryLesson {
  const blocks = lesson.blocks.map((block, blockIndex) =>
    blockIndex === index && block.kind === "quiz" ? { kind: "quiz" as const, questions: questions.map((item) => ({ ...item })) } : block,
  );
  return { ...lesson, blocks };
}

export function setAssignmentSlot(
  lesson: LibraryLesson,
  index: number,
  input: { title: string; brief: string; item: string },
): LibraryLesson {
  const items: AssignmentItem[] = [{ id: "field-1", label: input.item, required: true }];
  const blocks = lesson.blocks.map((block, blockIndex) =>
    blockIndex === index && block.kind === "assignment"
      ? { kind: "assignment" as const, title: input.title, brief: input.brief, notesPlaceholder: "", items }
      : block,
  );
  return { ...lesson, blocks };
}

function question(id: string): QuizQuestion {
  return {
    id,
    prompt: "What is the point?",
    choices: ["A staff", "A gadget"],
    answer: 0,
    why: "The work has a name.",
    sourceUnitId: `unit-${id}`,
  };
}

export function readyLesson(input: { id: string; orgId: string; title: string; text?: string }): LibraryLesson {
  const text = input.text ?? "A clear line for this block.";
  let lesson = nineBlockTemplate({ orgId: input.orgId, id: input.id, title: input.title });
  for (const index of [0, 1, 2, 3, 7, 8]) lesson = setTextSlot(lesson, index, text);
  lesson = setQuizSlot(lesson, 4, [question("practice")]);
  lesson = setQuizSlot(lesson, 6, [question("check")]);
  lesson = setAssignmentSlot(lesson, 5, { title: "Field work", brief: "Do the work.", item: "Write the step" });
  return lesson;
}

export function lessonSpineMaster(): LibraryLesson {
  const lesson = readyLesson({ id: "lesson-spine", orgId: "field-school", title: "LessonSpine", text: "The locked master plays in this step." });
  return { ...lesson, status: "published", slug: "master", courseSlug: "lesson-spine", film: { provider: "lesson-spine" } };
}

export function lessonHasFilm(lesson: Pick<LibraryLesson, "film">): boolean {
  return lesson.film !== null;
}

export function publishLibraryLesson(
  lesson: LibraryLesson,
): { ok: true; lesson: LibraryLesson } | { ok: false; error: string; lesson: LibraryLesson } {
  const draft: LibraryLesson = { ...lesson, status: "draft" };
  const shape = nineSlotError(lesson.blocks);
  if (shape) return { ok: false, error: shape, lesson: draft };
  const parsed = parseBlocks(lesson.blocks);
  if (!parsed.ok) return { ok: false, error: parsed.error, lesson: draft };
  const published = publishLesson({ ...lesson, blocks: parsed.blocks, status: "draft" });
  if (!published.ok) return { ok: false, error: published.error, lesson: draft };
  return { ok: true, lesson: { ...lesson, status: "published", blocks: published.lesson.blocks } };
}

export function rememberVersion(versions: readonly LessonVersion[], lesson: LibraryLesson): LessonVersion[] {
  return [...versions, { version: versions.length + 1, snapshot: { ...lesson, blocks: lesson.blocks.map((block) => ({ ...block })) } }];
}

export function restoreVersion(versions: readonly LessonVersion[], version: number): LibraryLesson | null {
  const found = versions.find((item) => item.version === version);
  if (!found) return null;
  return { ...found.snapshot, status: "published", blocks: found.snapshot.blocks.map((block) => ({ ...block })) };
}

export function lessonsForSurface(
  lessons: readonly LibraryLesson[],
  viewer: LibraryViewer,
  surface: LibrarySurface,
): LibraryLesson[] {
  if (viewer === "child") return [];
  if (viewer === "leader" && surface === "library") return [...lessons];
  return lessons.filter((lesson) => lesson.status === "published");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderSurfaceHtml(lessons: readonly LibraryLesson[], viewer: LibraryViewer, surface: LibrarySurface): string {
  const rows = lessonsForSurface(lessons, viewer, surface);
  const items = rows
    .map((lesson) => {
      const texts = lesson.blocks
        .filter((block): block is Extract<Block, { kind: "text" }> => block.kind === "text")
        .map((block) => block.text)
        .join(" ");
      return `<article data-lesson="${escapeText(lesson.id)}" data-status="${lesson.status}">${escapeText(lesson.title)} ${escapeText(texts)}</article>`;
    })
    .join("");
  return `<section data-surface="${surface}" data-viewer="${viewer}">${items}</section>`;
}

export function sessionsForViewer(rows: readonly LibrarySession[], viewer: LibraryViewer): VisibleSession[] {
  const visible: VisibleSession[] = [];
  for (const row of rows) {
    if (viewer !== "leader" && row.status !== "published") continue;
    if (viewer === "child") {
      visible.push({ id: row.id, title: row.title, when: row.when, nextSteps: "", recap: null });
      continue;
    }
    if (viewer === "member") {
      visible.push({ id: row.id, title: row.title, when: row.when, nextSteps: row.nextSteps, recap: null });
      continue;
    }
    visible.push({ id: row.id, title: row.title, when: row.when, nextSteps: row.nextSteps, recap: row.recap });
  }
  return visible;
}

export function renderSessionHtml(rows: readonly LibrarySession[], viewer: LibraryViewer): string {
  const visible = sessionsForViewer(rows, viewer);
  const items = visible
    .map((row) => {
      const recap = row.recap ? `<p data-recap="true">${escapeText(row.recap)}</p>` : "";
      return `<article class="m10-session-row" data-session="${escapeText(row.id)}"><h3>${escapeText(row.title)}</h3><p>${escapeText(row.when)}</p><p>${escapeText(row.nextSteps)}</p>${recap}</article>`;
    })
    .join("");
  return `<section data-sessions="${viewer}">${items}</section>`;
}

export function learnerStep(stepId: string) {
  return LEARNER_STEPS.find((step) => step.id === stepId) ?? LEARNER_STEPS[0];
}

export function measureLessonStep(
  lesson: LibraryLesson,
  stepId: string,
  viewport: { width: number; innerHeight: number } = LESSON_VIEWPORT,
): { scrollHeight: number; limit: number; fits: boolean } {
  const step = learnerStep(stepId);
  const column = Math.min(680, Math.max(280, viewport.width - 480));
  const chars = Math.max(24, Math.floor(column / 8));
  let lines = 6;
  for (const index of step.slots) {
    const block = lesson.blocks[index];
    if (!block) continue;
    if (block.kind === "text") lines += Math.max(1, Math.ceil(block.text.length / chars));
    if (block.kind === "quiz") lines += 2 + block.questions.length * 3;
    if (block.kind === "assignment") lines += 3 + block.items.length;
  }
  let scrollHeight = lines * 28 + 48;
  if (step.id === "example" && lessonHasFilm(lesson)) scrollHeight += 506;
  const limit = viewport.innerHeight * 2;
  return { scrollHeight, limit, fits: scrollHeight <= limit };
}

function primaryLabel(stepId: string, film: boolean): string {
  if (stepId === "field") return "Save";
  if (stepId === "practice" || stepId === "check") return "Submit";
  if (stepId === "example" && film) return "Play";
  return "Next";
}

export function renderLessonStepHtml(input: {
  lesson: LibraryLesson;
  step: string;
  signedIn: boolean;
  viewport?: { width: number; innerHeight: number };
}): string {
  const step = learnerStep(input.step);
  const measure = measureLessonStep(input.lesson, step.id, input.viewport);
  const film = lessonHasFilm(input.lesson);
  const primary = primaryLabel(step.id, film);
  const parts: string[] = [];
  for (const index of step.slots) {
    const block = input.lesson.blocks[index];
    if (!block) continue;
    if (block.kind === "text") parts.push(`<p>${escapeText(block.text)}</p>`);
    if (block.kind === "quiz") {
      parts.push(`<p>Pass at 75%.</p>`);
      for (const questionRow of block.questions) parts.push(`<p>${escapeText(questionRow.prompt)}</p>`);
    }
    if (block.kind === "assignment") parts.push(`<p>${escapeText(block.title)}</p><p>${escapeText(block.brief)}</p>`);
  }
  const player =
    step.id === "example" && film
      ? `<div data-player="one" data-player-count="1" data-film="${input.lesson.film?.provider ?? "none"}"></div>`
      : "";
  const action = step.id === "example" && film ? "" : `<button class="m10-fill" type="button">${primary}</button>`;
  const guest = input.signedIn
    ? ""
    : `<p data-guest-continuity="m10" style="color:#5C5850">${escapeText(GUEST_CONTINUITY_COPY)}</p>`;
  const index = LEARNER_STEPS.findIndex((item) => item.id === step.id);
  const meter = Math.round(((index + 1) / LEARNER_STEPS.length) * 100);
  return `<main data-m10-canvas="true" data-step="${step.id}" data-scroll-height="${measure.scrollHeight}" data-inner-height="${input.viewport?.innerHeight ?? LESSON_VIEWPORT.innerHeight}"><p data-pass-rule="true">Pass at 75%. Exam pass is 8 of 10.</p><div class="m10-meter" style="background:#1E4E8C;height:2px;width:${meter}%"></div>${parts.join("")}${player}${action}${guest}</main>`;
}

const STORE_KEY = "m10-lessons";

export function readStoredLessons(): LibraryLesson[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LibraryLesson => {
      if (typeof item !== "object" || item === null) return false;
      const row = item as LibraryLesson;
      return typeof row.id === "string" && Array.isArray(row.blocks) && (row.status === "draft" || row.status === "published");
    });
  } catch {
    return [];
  }
}

export function writeStoredLessons(lessons: readonly LibraryLesson[]) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORE_KEY, JSON.stringify(lessons));
}
