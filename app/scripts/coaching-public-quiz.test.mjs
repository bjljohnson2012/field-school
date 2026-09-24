import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\\.(ts|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const {
  handleQuizGet,
  handleQuizSubmit,
  hashToken,
  orderQuestions,
  parseSubmitAnswers,
  quizIsDone,
  quizIsRefused,
} = await import(pathToFileURL(join(src, "lib/coaching/quiz-token.ts")).href);

const openQuiz = {
  id: "quiz-1",
  orgId: "org-1",
  subjectMembershipId: "subject-1",
  title: "Weekly check-in",
  tokenHash: hashToken("known-token"),
  status: "pending",
  questionIds: ["q2", "q1"],
  answerSetId: null,
};

const questions = [
  { id: "q1", text: "Second", questionType: "LONG_FORM", options: null, category: "DISCOVERY" },
  { id: "q2", text: "First", questionType: "LIKERT", options: null, category: "GENERAL" },
];

function deps(overrides) {
  return {
    findQuiz: async (tokenHash) => (tokenHash === openQuiz.tokenHash ? openQuiz : null),
    questionsFor: async (ids) => orderQuestions(ids, questions),
    persist: async () => {
      throw new Error("persist should not run");
    },
    ...overrides,
  };
}

test("hashToken is SHA-256 hex and does not keep the clear token", () => {
  const clear = "public-quiz-token";
  assert.equal(hashToken(clear), createHash("sha256").update(clear).digest("hex"));
  assert.equal(hashToken(clear).length, 64);
  assert.equal(hashToken(clear).includes(clear), false);
  const lib = read("src/lib/coaching/quiz-token.ts");
  assert.match(lib, /createHash\("sha256"\)/);
  assert.match(lib, /adHocQuizzes\.tokenHash/);
  assert.match(lib, /kind: "quiz",\s*status: "completed"/);
  assert.match(lib, /kind: "diagnostic"/);
  assert.doesNotMatch(lib, /kind: "quiz",\s*objectType/);
  assert.match(lib, /objectType: "assessment"/);
  assert.match(lib, /isNull\(adHocQuizzes\.answerSetId\)/);
  assert.doesNotMatch(lib, /identityFromRequest|\/api\/events|stationObjectId|quiz_schedules|retake_requests|BrandTheme|AiJob/);
});

test("unknown and blank tokens are HTTP 404 on GET and POST", async () => {
  for (const token of ["", "   ", "missing-token"]) {
    const get = await handleQuizGet(token, async () => null);
    assert.equal(get.status, 404, token);
    assert.deepEqual(await get.json(), { error: "not_found" });
    let lookups = 0;
    const post = await handleQuizSubmit(
      token,
      { answers: [{ questionId: "q1", value: "yes" }] },
      deps({
        requireWrite: () => null,
        findQuiz: async () => {
          lookups += 1;
          return null;
        },
      }),
    );
    assert.equal(post.status, 404, token);
    assert.deepEqual(await post.json(), { error: "not_found" });
    if (!token.trim()) assert.equal(lookups, 0);
  }
});

test("a completed quiz is thank-you on GET and POST 409 with no overwrite", async () => {
  const done = await handleQuizGet("known-token", async () => ({
    done: true,
    title: "Weekly check-in",
    status: "completed",
  }));
  assert.equal(done.status, 200);
  const body = await done.json();
  assert.equal(body.done, true);
  assert.equal(body.quiz.title, "Weekly check-in");
  assert.equal(body.questions, undefined);

  assert.equal(quizIsDone({ status: "completed", answerSetId: null }), true);
  assert.equal(quizIsDone({ status: "closed", answerSetId: null }), true);
  assert.equal(quizIsDone({ status: "pending", answerSetId: "set-1" }), true);
  assert.equal(quizIsRefused({ status: "expired", answerSetId: null }), true);
  assert.equal(quizIsRefused({ status: "completed", answerSetId: "set-1" }), false);

  let writes = 0;
  for (const status of ["completed", "closed"]) {
    const post = await handleQuizSubmit(
      "known-token",
      { answers: [{ questionId: "q1", value: "changed" }] },
      deps({
        requireWrite: () => null,
        findQuiz: async () => ({ ...openQuiz, status, answerSetId: "set-1" }),
        persist: async () => {
          writes += 1;
          return { answerSetId: "new" };
        },
      }),
    );
    assert.equal(post.status, 409, status);
    assert.deepEqual(await post.json(), { error: "already_completed" });
  }
  const raced = await handleQuizSubmit(
    "known-token",
    { answers: [{ questionId: "q1", value: "yes" }] },
    deps({
      requireWrite: () => null,
      persist: async () => {
        writes += 1;
        return "closed";
      },
    }),
  );
  assert.equal(raced.status, 409);
  assert.equal(writes, 1);

  const page = read("src/app/quiz/[token]/page.tsx");
  assert.match(page, /notFound\(\)/);
  assert.match(page, /Thank you/);
  assert.match(page, /className="card/);
  assert.match(page, /className="btn-primary"/);
  assert.match(page, /className="input/);
  assert.match(page, /className="h-page"/);
  assert.doesNotMatch(page, /identityFromRequest|redirect\("\/login|quiz_schedules|retake/);
});

test("POST gates writes first and an open quiz can save once", async () => {
  const previous = process.env.COACHING_WRITES;
  delete process.env.COACHING_WRITES;
  try {
    const unset = await handleQuizSubmit("known-token", { answers: [{ questionId: "q1", value: "yes" }] });
    assert.equal(unset.status, 403);
    assert.deepEqual(await unset.json(), { error: "writes_disabled" });
    process.env.COACHING_WRITES = "0";
    const zero = await handleQuizSubmit("known-token", { answers: [{ questionId: "q1", value: "yes" }] });
    assert.equal(zero.status, 403);
  } finally {
    if (previous === undefined) delete process.env.COACHING_WRITES;
    else process.env.COACHING_WRITES = previous;
  }

  const route = read("src/app/api/coaching/quiz/[token]/submit/route.ts");
  const handler = route.indexOf("export async function POST");
  const gate = route.indexOf("const blocked = requireCoachingWrite()", handler);
  assert.ok(handler >= 0 && gate > handler);
  assert.equal(route.slice(handler, gate).includes("await "), false);
  assert.doesNotMatch(route, /identityFromRequest/);
  assert.doesNotMatch(read("src/app/api/coaching/quiz/[token]/route.ts"), /requireCoachingWrite|identityFromRequest/);

  const saved = [];
  const ok = await handleQuizSubmit(
    "known-token",
    { answers: [{ questionId: "q1", value: { text: "hello" } }, { questionId: "other", value: "no" }] },
    deps({
      requireWrite: () => null,
      persist: async (quiz, orderedIds, rows) => {
        saved.push({ quizId: quiz.id, orderedIds, rows });
        return { answerSetId: "set-9" };
      },
    }),
  );
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ok: true, answerSetId: "set-9" });
  assert.deepEqual(saved[0].orderedIds, ["q2", "q1"]);
  assert.deepEqual(saved[0].rows, [{ questionId: "q1", value: { text: "hello" } }]);

  const empty = await handleQuizSubmit("known-token", { answers: [] }, deps({ requireWrite: () => null }));
  assert.equal(empty.status, 400);
  assert.equal(parseSubmitAnswers({ answers: [{ questionId: "q2", value: "  " }] }, ["q2"]).ok, false);
  assert.deepEqual(
    orderQuestions(["q2", "q1", "missing"], questions).map((row) => row.id),
    ["q2", "q1"],
  );
});
