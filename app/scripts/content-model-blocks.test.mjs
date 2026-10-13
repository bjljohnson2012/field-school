import assert from "node:assert/strict";
import test from "node:test";
import {
  collectionField,
  courseOrgRefusal,
  lessonFromComposer,
  lessonFromStation,
  parseBlocks,
  publishLesson,
  upsertLessons,
} from "../src/lib/collections/content-model.ts";

const briefing = {
  slug: "briefing",
  title: "What this actually is",
  thesis: "A teammate you can text.",
  bullets: ["One job."],
  quotes: [{ text: "A staff.", at: "4:27" }],
  clips: [
    {
      startSec: 0,
      endSec: 140,
      label: "Teammates",
      why: "The opening pitch.",
    },
  ],
  assignment: {
    title: "Name the work",
    brief: "List the work.",
    items: [{ id: "list8", label: "Write 8 tasks", required: true }],
  },
  quiz: [
    {
      id: "q1",
      prompt: "How does Ray frame Grok Bot?",
      choices: ["A faster model", "Named teammates"],
      answer: 1,
      why: "Staff of personas.",
    },
  ],
};

function stationLesson() {
  return lessonFromStation({
    orgId: "org-1",
    moduleSlug: "the-ladder",
    station: briefing,
  });
}

test("parseBlocks keeps the briefing quiz answer", () => {
  const made = stationLesson();
  assert.equal(made.ok, true);
  const parsed = parseBlocks(JSON.parse(JSON.stringify(made.lesson.blocks)));
  assert.equal(parsed.ok, true);
  const quiz = parsed.blocks.find((block) => block.kind === "quiz");
  const text = parsed.blocks.find((block) => block.kind === "text");
  assert.equal(text.text, "A teammate you can text.");
  assert.equal(quiz.questions[0].answer, 1);
  assert.equal(quiz.questions[0].prompt, "How does Ray frame Grok Bot?");
  assert.equal(quiz.questions[0].sourceUnitId, "");
});

test("parseBlocks rejects raw HTML and an unknown kind", () => {
  assert.deepEqual(parseBlocks([{ kind: "text", text: "<p>hi</p>" }]), {
    ok: false,
    error: "html_not_allowed",
  });
  assert.deepEqual(parseBlocks([{ kind: "html", html: "<p>x</p>" }]), {
    ok: false,
    error: "unknown_block_kind",
  });
  assert.deepEqual(
    parseBlocks([{ kind: "clip", startSec: 10, endSec: 10, label: "A", why: "B" }]),
    { ok: false, error: "clip_range" },
  );
});

test("publishLesson refuses an empty required text block", () => {
  const draft = {
    orgId: "org-1",
    moduleSlug: "the-ladder",
    slug: "briefing",
    title: "Briefing",
    status: "draft",
    blocks: [{ kind: "text", text: "   " }],
    outcomeIds: [],
  };
  assert.deepEqual(publishLesson(draft), {
    ok: false,
    error: "required_text_block_empty",
  });
  assert.equal(draft.status, "draft");
});

test("publishLesson publishes a lesson that has text and an org", () => {
  const result = publishLesson({
    orgId: "org-1",
    moduleSlug: "the-ladder",
    slug: "briefing",
    title: "Briefing",
    status: "draft",
    blocks: [{ kind: "text", text: "A teammate you can text." }],
    outcomeIds: [],
  });
  assert.equal(result.ok, true);
  assert.equal(result.lesson.status, "published");
  assert.equal(result.lesson.blocks[0].text, "A teammate you can text.");
});

test("publishLesson refuses a missing org and an empty quiz", () => {
  const text = { kind: "text", text: "A teammate you can text." };
  assert.deepEqual(
    publishLesson({
      orgId: " ",
      moduleSlug: "the-ladder",
      slug: "briefing",
      title: "Briefing",
      status: "draft",
      blocks: [text],
      outcomeIds: [],
    }),
    { ok: false, error: "course_org_required" },
  );
  assert.equal(courseOrgRefusal(""), "course_org_required");
  assert.equal(courseOrgRefusal("org-1"), null);
  assert.deepEqual(
    publishLesson({
      orgId: "org-1",
      moduleSlug: "the-ladder",
      slug: "briefing",
      title: "Briefing",
      status: "draft",
      blocks: [text, { kind: "quiz", questions: [] }],
      outcomeIds: [],
    }),
    { ok: false, error: "required_quiz_block_empty" },
  );
});

test("a static station stays draft until the quiz has a source unit", () => {
  const made = stationLesson();
  assert.equal(made.ok, true);
  assert.equal(made.lesson.status, "draft");
  assert.deepEqual(publishLesson(made.lesson), {
    ok: false,
    error: "source_unit_id_required",
  });
});

test("lessonFromComposer stores the body as a draft text block", () => {
  const item = {
    id: "q1",
    prompt: "Which room?",
    choices: ["household", "sales"],
    answer: 0,
    why: "The prompt names the room.",
    sourceUnitId: "unit-1",
  };
  const made = lessonFromComposer({
    orgId: "org-1",
    moduleSlug: "composer",
    slug: "draft-1",
    title: "Draft",
    body: "Lesson body",
    quizItems: [item],
  });
  assert.equal(made.ok, true);
  assert.equal(made.lesson.status, "draft");
  assert.equal(made.lesson.blocks[0].text, "Lesson body");
  assert.equal(made.lesson.blocks[1].kind, "quiz");
  assert.equal(made.lesson.blocks[1].questions[0].answer, 0);
  assert.equal(made.lesson.blocks[1].questions[0].sourceUnitId, "unit-1");
  const published = publishLesson(made.lesson);
  assert.equal(published.ok, true);
  assert.equal(published.lesson.status, "published");
  assert.equal(published.lesson.blocks[1].questions[0].answer, 0);

  const missing = lessonFromComposer({
    orgId: "org-1",
    moduleSlug: "composer",
    slug: "draft-1",
    title: "Draft",
    body: "Lesson body",
    quizItems: [{ ...item, sourceUnitId: "" }],
  });
  assert.deepEqual(missing, { ok: false, error: "source_unit_id_required" });
});

test("upsertLessons keeps one row per slug", () => {
  const first = stationLesson();
  const second = lessonFromStation({
    orgId: "org-1",
    moduleSlug: "the-ladder",
    station: { ...briefing, slug: "two-computers", title: "Two computers" },
  });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  const once = upsertLessons([], [first.lesson, second.lesson]);
  const twice = upsertLessons(once, [first.lesson, second.lesson]);
  assert.deepEqual(
    twice.map((lesson) => lesson.slug),
    ["briefing", "two-computers"],
  );
  assert.equal(twice.length, once.length);
  const renamed = upsertLessons(twice, [{ ...first.lesson, title: "Renamed briefing" }]);
  assert.equal(renamed.length, 2);
  assert.equal(renamed[0].title, "Renamed briefing");
  assert.equal(renamed[1].slug, "two-computers");
});

test("content collections name blocks and org_id on lessons", () => {
  assert.deepEqual(collectionField("lessons", "blocks"), {
    type: "json",
    required: true,
  });
  assert.deepEqual(collectionField("lessons", "org_id"), {
    type: "relationship",
    required: true,
  });
  assert.deepEqual(collectionField("courses", "org_id"), {
    type: "relationship",
    required: true,
  });
  assert.deepEqual(collectionField("practice", "kind"), {
    type: "select",
    required: true,
  });
  assert.equal(collectionField("lessons", "body"), null);
});
