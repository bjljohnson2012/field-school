import { and, eq } from "drizzle-orm";
import { completeWithConfiguredAi } from "@/lib/living-brain/ai";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { getDb } from "@/lib/db/client";
import { lessons } from "@/lib/composer/schema";
import { addQuizItem, createLesson, getLessonDetail } from "@/lib/composer/store";
import {
  NEEDS_MORE,
  decideLesson,
  decodeLessonBody,
  encodeLessonBody,
  gatePlan,
  planFromModel,
  wizardSourceKind,
  wizardSuppliedText,
  type KnowledgeUnit,
  type TeachPlan,
} from "./teach-from-knowledge";

const TEACH_PROMPT = `You teach only from the knowledge units in this message.
Reply with one JSON object and no markdown.
Do not invent steps, facts, or quiz answers that are not in those units.
If the units do not say what the learner should do, set ready to false and checks to [].
{
  "ready": false,
  "how": "",
  "missing": "needs more information",
  "checks": [
    {
      "source_unit_id": "copy an id from the units",
      "prompt": "a question answered by that unit",
      "choices": ["two to four short choices"],
      "answer": 0,
      "why": "the line in the unit that makes this the answer"
    }
  ]
}`;

export type WizardSubmitInput = {
  title: string;
  outcome: string;
  kind: "file" | "link" | "text" | "idea";
  detail: string;
  mode?: string;
  audience?: string[];
};

async function writeLessonBody(identity: LearnerIdentity, lessonId: string, body: string) {
  const db = getDb();
  const [row] = await db
    .update(lessons)
    .set({ body, updatedAt: new Date() })
    .where(and(eq(lessons.id, lessonId), eq(lessons.orgId, identity.orgId)))
    .returning({ id: lessons.id });
  return row ?? null;
}

function unitsOf(
  rows: { id: string; title: string; body: string }[],
): KnowledgeUnit[] {
  return rows.map((unit) => ({ id: unit.id, title: unit.title, body: unit.body }));
}

export async function submitWizardKnowledge(identity: LearnerIdentity, input: WizardSubmitInput) {
  const text = wizardSuppliedText(input);
  if (!input.title.trim() || !text.trim()) return { error: "supplied_text_required" as const };
  const created = await createLesson(identity, {
    title: input.title.trim(),
    kind: wizardSourceKind(input.kind),
    body: text,
    url: input.kind === "link" ? input.detail.trim() : "",
  });
  const units = unitsOf(created.units);
  const audience = (input.audience ?? []).map((name) => name.trim()).filter(Boolean).slice(0, 20);
  const asked = await completeWithConfiguredAi(
    identity.orgId,
    `${TEACH_PROMPT}\n\n${JSON.stringify({
      title: input.title.trim(),
      outcome: input.outcome.trim(),
      mode: input.mode ?? "",
      audience,
      units,
    })}`,
  );
  const plan = gatePlan(planFromModel(asked, units, input.outcome), units);
  const saved = await writeLessonBody(
    identity,
    created.lesson.id,
    encodeLessonBody(created.lesson.body, plan),
  );
  if (!saved) return { error: "unknown_lesson" as const };
  return {
    ok: true as const,
    lessonId: created.lesson.id,
    status: plan.ready ? ("ready" as const) : ("needs_more" as const),
    message: plan.ready ? plan.how : NEEDS_MORE,
    how: plan.how,
  };
}

export async function generateLessonFromKnowledge(identity: LearnerIdentity, lessonId: string) {
  const detail = await getLessonDetail(identity, lessonId);
  if (!detail) return { error: "unknown_lesson" as const };
  const units = unitsOf(detail.units);
  const stored = decodeLessonBody(detail.lesson.body);
  const plan: TeachPlan | null = stored.plan;
  const decision = decideLesson(plan, units);
  if (decision.status === "needs_more") {
    return { ok: true as const, status: "needs_more" as const, message: NEEDS_MORE, lessonId };
  }
  if (detail.quiz.length > 0) {
    return {
      ok: true as const,
      status: "ready" as const,
      message: "Lesson generated.",
      how: decision.how,
      lessonId,
      already: true,
    };
  }
  for (const check of decision.quiz) {
    const result = await addQuizItem(identity, {
      lessonId,
      sourceUnitId: check.source_unit_id,
      prompt: check.prompt,
      choices: check.choices,
      answer: check.answer,
      why: check.why,
    });
    if ("error" in result) return { error: result.error ?? ("invalid_quiz" as const) };
  }
  const saved = await writeLessonBody(
    identity,
    lessonId,
    encodeLessonBody(decision.body, plan as TeachPlan),
  );
  if (!saved) return { error: "unknown_lesson" as const };
  return {
    ok: true as const,
    status: "ready" as const,
    message: "Lesson generated.",
    how: decision.how,
    lessonId,
    already: false,
  };
}
