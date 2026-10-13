import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { lessonFromComposer, publishLesson } from "../src/lib/collections/content-model.ts";
import {
  exampleCoursePlan,
  planCounts,
  projectStoredCourse,
} from "../src/lib/collections/project-course.ts";
import { getCourse } from "../src/lib/course/catalog.ts";

test("grok-bot projects the same 10 lessons and quiz answers from stored blocks", () => {
  const plan = exampleCoursePlan("org-field");
  const again = exampleCoursePlan("org-field");
  const projected = projectStoredCourse(plan);
  const catalog = getCourse("grok-bot");
  assert.equal(plan.orgId, "org-field");
  assert.equal(plan.example, true);
  assert.equal(plan.lessons.every((lesson) => lesson.orgId === "org-field"), true);
  assert.deepEqual(planCounts(plan), planCounts(again));
  assert.equal(planCounts(plan).lessons, 10);
  assert.deepEqual(
    projected.modules.map((mod) => mod.slug),
    catalog.modules.map((mod) => mod.slug),
  );
  assert.deepEqual(
    projected.modules.map((mod) => mod.quiz.map((question) => question.answer)),
    catalog.modules.map((mod) => mod.quiz.map((question) => question.answer)),
  );
  assert.deepEqual(
    projected.examQuestions.map((question) => question.answer),
    catalog.examQuestions.map((question) => question.answer),
  );
  const renamed = {
    ...plan,
    lessons: plan.lessons.map((lesson, index) =>
      index === 0 ? { ...lesson, title: "Renamed briefing" } : lesson,
    ),
  };
  assert.equal(projectStoredCourse(renamed).modules[0].title, "Renamed briefing");
  assert.equal(projectStoredCourse(renamed).modules[0].quiz[0].answer, catalog.modules[0].quiz[0].answer);
});

test("a composer lesson is a draft whose first block is the body", () => {
  const made = lessonFromComposer({
    orgId: "org-field",
    moduleSlug: "composer",
    slug: "draft-1",
    title: "Draft",
    body: "Lesson body",
    quizItems: [],
  });
  assert.equal(made.ok, true);
  assert.equal(made.lesson.status, "draft");
  assert.equal(made.lesson.orgId, "org-field");
  assert.equal(made.lesson.blocks[0].kind, "text");
  assert.equal(made.lesson.blocks[0].text, "Lesson body");
  const published = publishLesson({
    ...made.lesson,
    blocks: [{ kind: "text", text: "   " }],
  });
  assert.deepEqual(published, { ok: false, error: "required_text_block_empty" });
});

test("the content migration leaves profile, wizard, and gap-loop tables alone", () => {
  const sql = readFileSync(new URL("../db/0023_content_model.sql", import.meta.url), "utf8");
  assert.equal(sql.includes("CREATE TABLE IF NOT EXISTS modules"), true);
  assert.equal(sql.includes("user_profiles"), false);
  assert.equal(sql.includes("knowledge_nodes"), false);
  assert.equal(sql.includes("assessments"), false);
});
