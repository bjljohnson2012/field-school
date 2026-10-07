import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const {
  NEEDS_MORE,
  decideLesson,
  decodeLessonBody,
  emptyPlan,
  encodeLessonBody,
  gatePlan,
  knowledgeHasSubstance,
  lessonProse,
  parseTeachPlan,
  planFromModel,
  spineBlocks,
  spineDraft,
  titleFromDrop,
  wizardSuppliedText,
} = await import("./teach-from-knowledge.ts");

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../../..");

const UNIT = {
  id: "unit-open",
  title: "Opening",
  body: "Say the opening line, then wait for their answer before you pitch.",
};

const OUTCOME = "They can open a first call without pitching.";

function readyPlan(overrides = {}) {
  return {
    ready: true,
    how: "Teach the opening line, then have them say it and wait.",
    missing: "",
    outcome: OUTCOME,
    checks: [
      {
        source_unit_id: UNIT.id,
        prompt: "What do you do after the opening line?",
        choices: ["Wait for their answer", "Pitch immediately"],
        answer: 0,
        why: "The unit says to wait for their answer before you pitch.",
      },
    ],
    ...overrides,
  };
}

test("a link or a file name is not enough to teach", () => {
  assert.equal(
    knowledgeHasSubstance([{ body: "https://example.com/notes" }], OUTCOME),
    false,
  );
  assert.equal(knowledgeHasSubstance([{ body: "call-notes.pdf" }], OUTCOME), false);
  const decision = decideLesson(readyPlan(), [
    { id: UNIT.id, title: "Notes", body: "https://example.com/notes" },
  ]);
  assert.equal(decision.status, "needs_more");
  assert.equal(decision.message, NEEDS_MORE);
  assert.equal("quiz" in decision, false);
});

test("a paragraph the system already has can become a lesson with a cited quiz", () => {
  const decision = decideLesson(readyPlan(), [UNIT]);
  assert.equal(decision.status, "ready");
  if (decision.status !== "ready") return;
  assert.equal(decision.quiz.length, 1);
  assert.equal(decision.quiz[0].source_unit_id, UNIT.id);
  assert.match(decision.body, /wait for their answer/);
  assert.doesNotMatch(decision.body, /invented step/);
});

test("a quiz the unit does not contain never generates", () => {
  const invented = readyPlan({
    checks: [
      {
        source_unit_id: UNIT.id,
        prompt: "What should they buy?",
        choices: ["The annual platform", "Nothing yet"],
        answer: 0,
        why: "The lesson expects them to buy the annual platform.",
      },
    ],
  });
  const decision = decideLesson(invented, [UNIT]);
  assert.equal(decision.status, "needs_more");
  assert.equal(decision.message, NEEDS_MORE);
});

test("a check that does not cite a stored unit never generates", () => {
  const plan = readyPlan({
    checks: [
      {
        source_unit_id: "missing-unit",
        prompt: "What next?",
        choices: ["Wait", "Pitch"],
        answer: 0,
        why: "Because the unit says so.",
      },
    ],
  });
  assert.equal(parseTeachPlan(plan, new Set([UNIT.id]), OUTCOME).ready, false);
  const decision = decideLesson(parseTeachPlan(plan, new Set([UNIT.id]), OUTCOME), [UNIT]);
  assert.equal(decision.status, "needs_more");
  assert.equal(decision.message, "needs more information");
});

test("the model cannot mark a thin source ready", () => {
  const thin = [{ id: "file-1", title: "File", body: "call-notes.pdf" }];
  const parsed = planFromModel(JSON.stringify(readyPlan({ checks: [{ ...readyPlan().checks[0], source_unit_id: "file-1" }] })), thin, OUTCOME);
  const gated = gatePlan(parsed, thin);
  assert.equal(gated.ready, false);
  assert.equal(gated.checks.length, 0);
  assert.equal(decideLesson(gated, thin).message, NEEDS_MORE);
});

test("markdown fences and a missing model both stay needs more when they are not a plan", () => {
  assert.equal(planFromModel(null, [UNIT], OUTCOME).ready, false);
  assert.equal(planFromModel("not json", [UNIT], OUTCOME).missing, NEEDS_MORE);
  const fenced = planFromModel("```json\n" + JSON.stringify(readyPlan()) + "\n```", [UNIT], OUTCOME);
  assert.equal(fenced.ready, true);
  assert.equal(fenced.checks[0].source_unit_id, UNIT.id);
});

test("a stored plan round-trips and the desk hides the marker", () => {
  const plan = gatePlan(readyPlan(), [UNIT]);
  const encoded = encodeLessonBody("Say the opening line, then wait for their answer before you pitch.", plan);
  const decoded = decodeLessonBody(encoded);
  assert.equal(decoded.plan?.ready, true);
  assert.equal(decoded.plan?.checks[0].source_unit_id, UNIT.id);
  assert.doesNotMatch(lessonProse(encoded), /fs-teach-plan/);
  assert.equal(decideLesson(emptyPlan(OUTCOME), [UNIT]).status, "needs_more");
  assert.equal(decideLesson(null, [UNIT]).message, NEEDS_MORE);
});

test("wizard text keeps the pasted words and a link stays an address", () => {
  const text = wizardSuppliedText({
    kind: "text",
    title: "Opening",
    detail: "Say the opening line, then wait for their answer before you pitch.",
    outcome: OUTCOME,
  });
  assert.match(text, /wait for their answer/);
  assert.match(text, /without pitching/);
  const link = wizardSuppliedText({
    kind: "link",
    title: "Notes",
    detail: "https://example.com/notes",
    outcome: OUTCOME,
  });
  assert.match(link, /https:\/\/example.com\/notes/);
  assert.doesNotMatch(link, /scraped/);
});

test("a drop names itself and the draft follows the lesson spine", () => {
  assert.equal(
    titleFromDrop({ text: "Wait for the answer before you pitch. Then ask." }),
    "Wait for the answer before you pitch.",
  );
  assert.equal(titleFromDrop({ text: "short", filename: "call-notes.pdf" }), "call notes");
  const body = spineDraft({
    outcome: OUTCOME,
    how: "Teach the opening line, then have them say it and wait.",
    units: [UNIT],
  });
  assert.match(body, /^Objective\n/);
  assert.match(body, /\nTeach\n/);
  assert.match(body, /\nDo\n/);
  assert.match(body, /\nRecap\n/);
  assert.match(body, /wait for their answer/);
  const blocks = spineBlocks(body);
  assert.deepEqual(
    blocks.map((block) => block.title),
    ["Objective", "Teach", "Do", "Recap"],
  );
});

test("generate checks the plan before it writes a quiz", () => {
  const route = readFileSync(join(appRoot, "src/app/api/library/generate/route.ts"), "utf8");
  const persist = readFileSync(join(appRoot, "src/lib/library/submit-knowledge.ts"), "utf8");
  const generate = persist.slice(persist.indexOf("export async function generateLessonFromKnowledge"));
  assert.ok(generate.indexOf("decideLesson") < generate.indexOf("addQuizItem"));
  assert.match(persist, /NEEDS_MORE/);
  assert.match(route, /requireTeacher/);
  assert.ok(route.indexOf("requireTeacher") < route.indexOf("generateLessonFromKnowledge"));
  const wizard = readFileSync(join(appRoot, "src/app/library/wizard/wizard-client.tsx"), "utf8");
  assert.match(wizard, />\s*Submit\s*</);
  assert.match(wizard, />\s*Generate Lesson\s*</);
  assert.match(wizard, /\/api\/library\/intake/);
  assert.doesNotMatch(wizard, /Lesson name/);
  const desk = readFileSync(join(appRoot, "src/app/o/[slug]/teach/[lessonId]/page.tsx"), "utf8");
  assert.match(desk, /Generate Lesson/);
  assert.match(desk, /source_unit_id/);
  assert.match(desk, /canTeach === false/);
});
