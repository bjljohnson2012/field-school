/**
 * A wizard submit stores knowledge and a teach plan.
 * Generate Lesson reads that plan and the units already stored.
 * It does not invent a lesson when the plan cannot teach from those units.
 */

export const NEEDS_MORE = "needs more information";

export const PLAN_MARK = "\n\n---\nfs-teach-plan\n";

export type KnowledgeUnit = {
  id: string;
  title: string;
  body: string;
};

export type QuizCheck = {
  source_unit_id: string;
  prompt: string;
  choices: string[];
  answer: number;
  why: string;
};

export type TeachPlan = {
  ready: boolean;
  how: string;
  missing: string;
  outcome: string;
  checks: QuizCheck[];
};

export type LessonDecision =
  | { status: "needs_more"; message: typeof NEEDS_MORE }
  | { status: "ready"; how: string; body: string; quiz: QuizCheck[] };

const URL_ONLY = /^https?:\/\/\S+$/i;

export function isThinBody(body: string): boolean {
  const text = body.trim();
  if (!text) return true;
  if (URL_ONLY.test(text)) return true;
  if (!/\s/.test(text) && /\.[a-z0-9]{1,8}$/i.test(text) && text.length < 120) return true;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length < 6 || text.length < 40;
}

/** A real unit, other than the outcome line itself, has to say something teachable. */
export function knowledgeHasSubstance(units: { body: string }[], outcome: string): boolean {
  const aim = outcome.trim();
  if (aim.length < 12) return false;
  return units.some((unit) => {
    const body = unit.body.trim();
    if (!body || body === aim) return false;
    return !isThinBody(body);
  });
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseModelJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

export function emptyPlan(outcome: string): TeachPlan {
  return {
    ready: false,
    how: "",
    missing: NEEDS_MORE,
    outcome: outcome.trim().slice(0, 500),
    checks: [],
  };
}

export function parseTeachPlan(raw: unknown, unitIds: ReadonlySet<string>, outcome: string): TeachPlan {
  const record =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const incoming = Array.isArray(record.checks) ? record.checks : [];
  const checks: QuizCheck[] = [];
  for (const item of incoming.slice(0, 12)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const sourceUnitId = clip(row.source_unit_id ?? row.sourceUnitId, 80);
    if (!unitIds.has(sourceUnitId)) continue;
    const prompt = clip(row.prompt, 500);
    const why = clip(row.why, 500);
    const choices = Array.isArray(row.choices)
      ? row.choices
          .filter((choice): choice is string => typeof choice === "string")
          .map((choice) => choice.trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];
    const answer = typeof row.answer === "number" && Number.isInteger(row.answer) ? row.answer : -1;
    if (!prompt || !why || choices.length < 2 || answer < 0 || answer >= choices.length) continue;
    checks.push({ source_unit_id: sourceUnitId, prompt, choices, answer, why });
  }
  const how = clip(record.how, 4000);
  const ready = record.ready === true && how.length > 0 && checks.length > 0;
  return {
    ready,
    how: ready ? how : "",
    missing: ready ? "" : NEEDS_MORE,
    outcome: outcome.trim().slice(0, 500),
    checks: ready ? checks : [],
  };
}

export function planFromModel(text: string | null, units: KnowledgeUnit[], outcome: string): TeachPlan {
  if (!text?.trim()) return emptyPlan(outcome);
  try {
    return parseTeachPlan(
      parseModelJson(text),
      new Set(units.map((unit) => unit.id)),
      outcome,
    );
  } catch {
    return emptyPlan(outcome);
  }
}

function grounded(check: QuizCheck, body: string): boolean {
  const hay = body.toLowerCase();
  const choice = check.choices[check.answer]?.toLowerCase().trim() ?? "";
  if (choice.length >= 8 && hay.includes(choice)) return true;
  const why = check.why.toLowerCase().replace(/\s+/g, " ").trim();
  return why.length >= 20 && hay.includes(why);
}

export function decideLesson(plan: TeachPlan | null, units: KnowledgeUnit[]): LessonDecision {
  if (!plan?.ready || !plan.how.trim() || plan.checks.length === 0) {
    return { status: "needs_more", message: NEEDS_MORE };
  }
  if (!knowledgeHasSubstance(units, plan.outcome)) {
    return { status: "needs_more", message: NEEDS_MORE };
  }
  const byId = new Map(units.map((unit) => [unit.id, unit.body]));
  const quiz = plan.checks.filter((check) => {
    const body = byId.get(check.source_unit_id);
    return typeof body === "string" && grounded(check, body);
  });
  if (quiz.length === 0) return { status: "needs_more", message: NEEDS_MORE };
  return {
    status: "ready",
    how: plan.how.trim(),
    body: spineDraft({ outcome: plan.outcome, how: plan.how, units }),
    quiz,
  };
}

/** A name from the drop itself. The person does not type a lesson title. */
export function titleFromDrop(input: { text?: string; filename?: string }): string {
  const text = (input.text ?? "").replace(/\s+/g, " ").trim();
  const sentence = text.split(/(?<=[.!?])\s/)[0]?.trim() || text;
  if (sentence.length >= 12) {
    return sentence.length > 72 ? `${sentence.slice(0, 69).trim()}…` : sentence;
  }
  const file = (input.filename ?? "")
    .replace(/\.[a-z0-9]{1,8}$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (file.length >= 3) return file.slice(0, 72);
  if (sentence.length >= 3) return sentence;
  return "New knowledge";
}

/**
 * Draft shape from the lesson spine already in this repo:
 * objective, teach, do, recap. The quiz is stored as items, not invented prose.
 */
export function spineDraft(input: { outcome: string; how: string; units: KnowledgeUnit[] }): string {
  const teachable = input.units.filter((unit) => {
    const body = unit.body.trim();
    return body && body !== input.outcome.trim() && !isThinBody(body);
  });
  const teach = teachable.map((unit) => `${unit.title}\n${unit.body.trim()}`).join("\n\n");
  const practice = teachable[0]?.body.trim().split(/(?<=[.!?])\s/)[0]?.trim() || "";
  const recap = teachable.map((unit) => unit.title.trim()).filter(Boolean).join("\n");
  return [
    "Objective",
    input.outcome.trim() || input.how.trim(),
    "",
    "Teach",
    [input.how.trim(), teach].filter(Boolean).join("\n\n"),
    "",
    "Do",
    practice ? `Practice this line from the knowledge: ${practice}` : input.how.trim(),
    "",
    "Recap",
    recap || input.how.trim(),
  ].join("\n");
}

const SPINE_TITLES = ["Objective", "Teach", "Do", "Recap"] as const;

/** Split a generated draft into the course activities a learner opens one at a time. */
export function spineBlocks(prose: string): { title: string; body: string }[] {
  const blocks: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;
  for (const line of prose.replace(/\r\n/g, "\n").split("\n")) {
    const heading = SPINE_TITLES.find((title) => title === line.trim());
    if (heading) {
      if (current) blocks.push(current);
      current = { title: heading, body: "" };
      continue;
    }
    if (!current) continue;
    current.body = current.body ? `${current.body}\n${line}` : line;
  }
  if (current) blocks.push(current);
  return blocks
    .map((block) => ({ title: block.title, body: block.body.trim() }))
    .filter((block) => block.body);
}

/** Drop a model plan the stored units cannot teach. */
export function gatePlan(plan: TeachPlan, units: KnowledgeUnit[]): TeachPlan {
  const decision = decideLesson(plan, units);
  if (decision.status === "needs_more") return emptyPlan(plan.outcome);
  return { ...plan, ready: true, how: decision.how, missing: "", checks: decision.quiz };
}

export function wizardSourceKind(kind: string): "text" | "link" {
  return kind === "link" ? "link" : "text";
}

export function wizardSuppliedText(input: { kind: string; title: string; detail: string; outcome: string }): string {
  const title = input.title.trim();
  const detail = input.detail.trim();
  const outcome = input.outcome.trim();
  if (input.kind === "text" || input.kind === "idea") {
    return [detail, outcome && !detail.includes(outcome) ? outcome : ""].filter(Boolean).join("\n\n");
  }
  return [title, detail, outcome].filter(Boolean).join("\n\n");
}

export function encodeLessonBody(prose: string, plan: TeachPlan): string {
  return `${prose.trim()}${PLAN_MARK}${JSON.stringify(plan)}`;
}

export function decodeLessonBody(body: string): { prose: string; plan: TeachPlan | null } {
  const index = body.indexOf(PLAN_MARK);
  if (index < 0) return { prose: body.trim(), plan: null };
  const prose = body.slice(0, index).trim();
  try {
    const parsed = JSON.parse(body.slice(index + PLAN_MARK.length).trim()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { prose, plan: null };
    const record = parsed as Record<string, unknown>;
    const ids = new Set<string>();
    if (Array.isArray(record.checks)) {
      for (const item of record.checks) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const id = (item as Record<string, unknown>).source_unit_id;
        if (typeof id === "string" && id.trim()) ids.add(id.trim());
      }
    }
    const outcome = typeof record.outcome === "string" ? record.outcome : "";
    return { prose, plan: parseTeachPlan(parsed, ids, outcome) };
  } catch {
    return { prose, plan: null };
  }
}

export function lessonProse(body: string): string {
  return decodeLessonBody(body).prose;
}
