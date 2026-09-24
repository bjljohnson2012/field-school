import { createHash } from "node:crypto";
import { requireCoachingWrite } from "./writes";

const CLOSED = ["completed", "closed"];
const REFUSED = ["expired", "cancelled", "canceled"];

export type PublicQuestion = {
  id: string;
  text: string;
  questionType: string;
  options: unknown;
  category: string;
};

export type QuizRecord = {
  id: string;
  orgId: string;
  subjectMembershipId: string;
  title: string;
  tokenHash: string;
  status: string;
  questionIds: unknown;
  answerSetId: string | null;
};

export type PublicQuizView =
  | null
  | { refused: string }
  | { done: true; title: string; status: string }
  | { done: false; id: string; title: string; status: string; questions: PublicQuestion[] };

export type SubmitAnswer = { questionId: string; value: unknown };

type PersistResult = { answerSetId: string } | "closed";

export type SubmitDeps = {
  requireWrite?: () => Response | null;
  findQuiz: (tokenHash: string) => Promise<QuizRecord | null>;
  questionsFor: (ids: string[]) => Promise<PublicQuestion[]>;
  persist: (
    quiz: QuizRecord,
    orderedIds: string[],
    rows: SubmitAnswer[],
  ) => Promise<PersistResult>;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function questionIdsOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function orderQuestions<T extends { id: string }>(ids: string[], rows: T[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

function statusOf(status: string) {
  return status.trim().toLowerCase();
}

export function quizIsDone(quiz: { status: string; answerSetId?: string | null }) {
  const status = statusOf(quiz.status);
  return CLOSED.includes(status) || Boolean(quiz.answerSetId);
}

export function quizIsRefused(quiz: { status: string; answerSetId?: string | null }) {
  if (quizIsDone(quiz)) return false;
  return REFUSED.includes(statusOf(quiz.status));
}

function presentValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value) && typeof value === "object";
}

export function parseSubmitAnswers(body: unknown, expectedIds: string[]) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false as const };
  const raw = (body as { answers?: unknown }).answers;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) return { ok: false as const };
  const allowed = new Set(expectedIds);
  const byId = new Map<string, unknown>();
  for (const row of raw) {
    if (!row || typeof row !== "object") return { ok: false as const };
    const questionId = (row as { questionId?: unknown }).questionId;
    if (typeof questionId !== "string" || !allowed.has(questionId)) continue;
    const value = (row as { value?: unknown }).value;
    if (!presentValue(value)) continue;
    byId.set(questionId, value);
  }
  if (byId.size < 1) return { ok: false as const };
  return {
    ok: true as const,
    answers: [...byId].map(([questionId, value]) => ({ questionId, value })),
  };
}

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

export async function loadPublicQuizView(token: string): Promise<PublicQuizView> {
  if (!token.trim()) return null;
  const quiz = await findQuizByHash(hashToken(token));
  if (!quiz) return null;
  if (quizIsRefused(quiz)) return { refused: statusOf(quiz.status) };
  if (quizIsDone(quiz)) return { done: true, title: quiz.title, status: "completed" };
  const ids = questionIdsOf(quiz.questionIds);
  const questions = orderQuestions(ids, await questionsForIds(ids));
  return { done: false, id: quiz.id, title: quiz.title, status: quiz.status, questions };
}

export async function handleQuizGet(
  token: string,
  load: (token: string) => Promise<PublicQuizView> = loadPublicQuizView,
) {
  if (!token.trim()) return json({ error: "not_found" }, 404);
  const view = await load(token);
  if (!view) return json({ error: "not_found" }, 404);
  if ("refused" in view) return json({ error: view.refused }, 410);
  if (view.done) {
    return json({ ok: true, done: true, quiz: { title: view.title, status: view.status } }, 200);
  }
  return json(
    {
      ok: true,
      quiz: { id: view.id, title: view.title, status: view.status },
      questions: view.questions,
    },
    200,
  );
}

export async function handleQuizSubmit(token: string, body: unknown, deps: SubmitDeps = realDeps) {
  const blocked = (deps.requireWrite ?? requireCoachingWrite)();
  if (blocked) return blocked;
  if (!token.trim()) return json({ error: "not_found" }, 404);
  const quiz = await deps.findQuiz(hashToken(token));
  if (!quiz) return json({ error: "not_found" }, 404);
  if (quizIsDone(quiz)) return json({ error: "already_completed" }, 409);
  if (quizIsRefused(quiz)) return json({ error: statusOf(quiz.status) }, 410);
  const ids = questionIdsOf(quiz.questionIds);
  const parsed = parseSubmitAnswers(body, ids);
  if (!parsed.ok) return json({ error: "invalid_body" }, 400);
  const known = new Set((await deps.questionsFor(ids)).map((row) => row.id));
  const rows = parsed.answers.filter((row) => known.has(row.questionId));
  if (!rows.length) return json({ error: "invalid_body" }, 400);
  const saved = await deps.persist(quiz, ids, rows);
  if (saved === "closed") return json({ error: "already_completed" }, 409);
  return json({ ok: true, answerSetId: saved.answerSetId }, 200);
}

async function coachingDb() {
  const { and, desc, eq, inArray, isNull, notInArray } = await import("drizzle-orm");
  const { getDb } = await import("../db/client");
  const schema = await import("../db/schema");
  return { and, desc, eq, inArray, isNull, notInArray, db: getDb(), ...schema };
}

async function findQuizByHash(tokenHash: string): Promise<QuizRecord | null> {
  const { db, eq, adHocQuizzes } = await coachingDb();
  const [row] = await db
    .select({
      id: adHocQuizzes.id,
      orgId: adHocQuizzes.orgId,
      subjectMembershipId: adHocQuizzes.subjectMembershipId,
      title: adHocQuizzes.title,
      tokenHash: adHocQuizzes.tokenHash,
      status: adHocQuizzes.status,
      questionIds: adHocQuizzes.questionIds,
      answerSetId: adHocQuizzes.answerSetId,
    })
    .from(adHocQuizzes)
    .where(eq(adHocQuizzes.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

async function questionsForIds(ids: string[]): Promise<PublicQuestion[]> {
  if (!ids.length) return [];
  const { db, inArray, questions } = await coachingDb();
  const rows = await db
    .select({
      id: questions.id,
      text: questions.text,
      questionType: questions.questionType,
      options: questions.options,
      category: questions.category,
    })
    .from(questions)
    .where(inArray(questions.id, ids));
  return orderQuestions(ids, rows);
}

class QuizClosed extends Error {
  constructor() {
    super("quiz_closed");
    this.name = "QuizClosed";
  }
}

async function persistQuiz(quiz: QuizRecord, orderedIds: string[], rows: SubmitAnswer[]): Promise<PersistResult> {
  const { and, desc, eq, isNull, notInArray, db, memberships, answerSets, answers, adHocQuizzes, learningEvents } =
    await coachingDb();
  const [member] = await db
    .select({ stance: memberships.stance })
    .from(memberships)
    .where(eq(memberships.id, quiz.subjectMembershipId))
    .limit(1);
  const [last] = await db
    .select({ version: answerSets.version })
    .from(answerSets)
    .where(
      and(
        eq(answerSets.orgId, quiz.orgId),
        eq(answerSets.membershipId, quiz.subjectMembershipId),
        eq(answerSets.kind, "quiz"),
      ),
    )
    .orderBy(desc(answerSets.version))
    .limit(1);
  try {
    return await db.transaction(async (tx) => {
      const [set] = await tx
        .insert(answerSets)
        .values({
          orgId: quiz.orgId,
          membershipId: quiz.subjectMembershipId,
          subjectMembershipId: quiz.subjectMembershipId,
          kind: "quiz",
          status: "completed",
          version: (last?.version ?? 0) + 1,
          resumeIndex: orderedIds.length,
          questionOrder: orderedIds,
        })
        .returning({ id: answerSets.id });
      if (!set) throw new Error("answer_set_missing");
      await tx.insert(answers).values(
        rows.map((row) => ({
          orgId: quiz.orgId,
          answerSetId: set.id,
          questionId: row.questionId,
          value: row.value,
        })),
      );
      const closed = await tx
        .update(adHocQuizzes)
        .set({ status: "completed", answerSetId: set.id })
        .where(
          and(
            eq(adHocQuizzes.id, quiz.id),
            isNull(adHocQuizzes.answerSetId),
            notInArray(adHocQuizzes.status, [...CLOSED, ...REFUSED, "COMPLETED", "CLOSED", "EXPIRED", "CANCELLED"]),
          ),
        )
        .returning({ id: adHocQuizzes.id });
      if (!closed.length) throw new QuizClosed();
      await tx.insert(learningEvents).values({
        orgId: quiz.orgId,
        membershipId: quiz.subjectMembershipId,
        actorMembershipId: quiz.subjectMembershipId,
        actorStance: member?.stance || "learner",
        kind: "diagnostic",
        objectType: "assessment",
        objectId: set.id,
        skillIds: [],
        raw: { kind: "quiz" },
      });
      return { answerSetId: set.id };
    });
  } catch (error) {
    if (error instanceof QuizClosed) return "closed";
    throw error;
  }
}

const realDeps: SubmitDeps = {
  findQuiz: findQuizByHash,
  questionsFor: questionsForIds,
  persist: persistQuiz,
};
