import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const savedDatabaseUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") {
    return nextResolve("next/server.js", context);
  }
  const parent = context.parentURL || "";
  const ours = parent.includes("/app/src/") || parent.includes("/app/scripts/");
  if (ours && specifier.startsWith("@/")) {
    return nextResolve(pathToFileURL(src + "/" + specifier.slice(2) + ".ts").href, context);
  }
  if (ours && specifier.startsWith(".") && !/\\.(ts|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const cron = await import(pathToFileURL(join(src, "app/api/cron/coaching/route.ts")).href);

const SECRET = "cron-secret-canary-do-not-echo";
const INVITE = "https://portal.fieldschool.ai/invite/accept?token=raw-invite-token";
const ANSWER = "The answer text must not be logged";

test.after(() => {
  if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = savedDatabaseUrl;
});

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function request(body, authorization) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://portal.fieldschool.ai/api/cron/coaching", {
    method: "POST",
    headers,
    body,
  });
}

function deps(overrides = {}) {
  const calls = { quizzes: 0, briefs: 0 };
  const lines = [];
  return {
    calls,
    lines,
    env: { CRON_SECRET: SECRET },
    requireWrite: () => null,
    runQuizzes: async () => {
      calls.quizzes += 1;
      return 2;
    },
    runBriefs: async () => {
      calls.briefs += 1;
      return 1;
    },
    log: (input) => {
      lines.push(input);
    },
    ...overrides,
  };
}

test("route exports POST only and fails closed", () => {
  const source = read("src/app/api/cron/coaching/route.ts");
  assert.equal(typeof cron.POST, "function");
  assert.equal(cron.GET, undefined);
  assert.match(source, /export async function POST/);
  assert.doesNotMatch(source, /export async function GET/);
  assert.doesNotMatch(source, /export const GET/);
  assert.doesNotMatch(source, /POST\s*=\s*GET/);
  assert.doesNotMatch(source, /if\s*\(\s*expected\s*\)/);
  assert.doesNotMatch(source, /docker-compose|compose profile|COACHING_SHELL|COACHING_IMPORT|AUTH_URL/);
  assert.match(source, /logCoachingCron/);
  assert.match(source, /selectQuizQuestions/);
  assert.match(source, /generateWeeklyBrief/);
  assert.match(source, /hashToken/);
  assert.match(source, /requireCoachingWrite/);
  assert.match(source, /CRON_JOBS = \["quizzes", "briefs", "all"\]/);
  assert.doesNotMatch(source, /console\.(log|info|error|debug|warn)/);
});

test("bearer match fails when the secret is missing or the bearer is wrong", () => {
  assert.equal(cron.bearerMatches("Bearer " + SECRET, undefined), false);
  assert.equal(cron.bearerMatches("Bearer " + SECRET, ""), false);
  assert.equal(cron.bearerMatches("Bearer " + SECRET, "   "), false);
  assert.equal(cron.bearerMatches(null, SECRET), false);
  assert.equal(cron.bearerMatches("Bearer wrong", SECRET), false);
  assert.equal(cron.bearerMatches("bearer " + SECRET, SECRET), false);
  assert.equal(cron.bearerMatches("Bearer " + SECRET + " ", SECRET), false);
  assert.equal(cron.bearerMatches(SECRET, SECRET), false);
  assert.equal(cron.bearerMatches("Bearer " + SECRET, SECRET), true);
});

test("job parser accepts quizzes, briefs, and all, and defaults when job is omitted", () => {
  assert.equal(cron.parseCronJob({}), "missing");
  assert.equal(cron.parseCronJob({ job: null }), "missing");
  assert.equal(cron.parseCronJob({ job: "quizzes" }), "quizzes");
  assert.equal(cron.parseCronJob({ job: "briefs" }), "briefs");
  assert.equal(cron.parseCronJob({ job: "all" }), "all");
  assert.equal(cron.parseCronJob({ job: "Quizzes" }), "invalid");
  assert.equal(cron.parseCronJob({ job: "" }), "invalid");
  assert.equal(cron.parseCronJob([]), "invalid");
  assert.equal(cron.parseCronJob(null), "invalid");
  assert.deepEqual(cron.branchesFor("all"), ["quizzes", "briefs"]);
  assert.deepEqual(cron.branchesFor("quizzes"), ["quizzes"]);
  assert.deepEqual(cron.branchesFor("briefs"), ["briefs"]);
});

test("POST is 401 when CRON_SECRET is unset or the bearer does not match", async () => {
  for (const env of [{}, { CRON_SECRET: "" }, { CRON_SECRET: "   " }, { CRON_SECRET: SECRET }]) {
    const harness = deps({ env, runQuizzes: async () => {
      throw new Error("runner must not run");
    }, runBriefs: async () => {
      throw new Error("runner must not run");
    } });
    const authorization = env.CRON_SECRET?.trim() ? "Bearer wrong" : "Bearer " + SECRET;
    const response = await cron.handleCoachingCron(request(undefined, authorization), harness);
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.deepEqual(body, { error: "unauthorized" });
    assert.equal(harness.lines.length, 0);
    assert.equal(JSON.stringify(body).includes(SECRET), false);
  }
  const missingHeader = await cron.handleCoachingCron(request(undefined, undefined), deps());
  assert.equal(missingHeader.status, 401);
});

test("writes stay closed before either branch runs", async () => {
  let writes = 0;
  const harness = deps({
    requireWrite: (env) => {
      writes += 1;
      assert.equal(env.CRON_SECRET, SECRET);
      return Response.json({ error: "writes_disabled" }, { status: 403 });
    },
    runQuizzes: async () => {
      throw new Error("quiz runner must not run");
    },
  });
  const response = await cron.handleCoachingCron(
    request(JSON.stringify({ job: "all" }), "Bearer " + SECRET),
    harness,
  );
  assert.equal(writes, 1);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "writes_disabled" });
  assert.equal(harness.calls.quizzes, 0);
  assert.equal(harness.calls.briefs, 0);
});

test("job quizzes, briefs, and all call that branch and log coaching.cron", async () => {
  const quizzes = deps();
  const quizResponse = await cron.handleCoachingCron(
    request(JSON.stringify({ job: "quizzes" }), "Bearer " + SECRET),
    quizzes,
  );
  assert.equal(quizResponse.status, 200);
  assert.deepEqual(await quizResponse.json(), { ok: true, job: "quizzes", rowsChanged: 2 });
  assert.equal(quizzes.calls.quizzes, 1);
  assert.equal(quizzes.calls.briefs, 0);
  assert.deepEqual(quizzes.lines, [{ branch: "quizzes", rowsChanged: 2 }]);

  const briefs = deps();
  const briefResponse = await cron.handleCoachingCron(
    request(JSON.stringify({ job: "briefs" }), "Bearer " + SECRET),
    briefs,
  );
  assert.equal(briefResponse.status, 200);
  assert.deepEqual(await briefResponse.json(), { ok: true, job: "briefs", rowsChanged: 1 });
  assert.equal(briefs.calls.quizzes, 0);
  assert.equal(briefs.calls.briefs, 1);
  assert.deepEqual(briefs.lines, [{ branch: "briefs", rowsChanged: 1 }]);

  const all = deps();
  const allResponse = await cron.handleCoachingCron(
    request(JSON.stringify({ job: "all" }), "Bearer " + SECRET),
    all,
  );
  assert.equal(allResponse.status, 200);
  assert.deepEqual(await allResponse.json(), { ok: true, job: "all", rowsChanged: 3 });
  assert.deepEqual(all.lines, [
    { branch: "quizzes", rowsChanged: 2 },
    { branch: "briefs", rowsChanged: 1 },
  ]);
});

test("omitted job defaults to all", async () => {
  for (const body of [undefined, "", "   ", "{}", JSON.stringify({ job: null })]) {
    const harness = deps();
    const response = await cron.handleCoachingCron(request(body, "Bearer " + SECRET), harness);
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal((await response.json()).job, "all");
    assert.equal(harness.calls.quizzes, 1);
    assert.equal(harness.calls.briefs, 1);
  }
});

test("a bad job is 400 and runs nothing", async () => {
  const harness = deps();
  const response = await cron.handleCoachingCron(
    request(JSON.stringify({ job: "mail" }), "Bearer " + SECRET),
    harness,
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_job" });
  assert.equal(harness.calls.quizzes, 0);
  assert.equal(harness.calls.briefs, 0);
  assert.equal(harness.lines.length, 0);
});

test("coaching.cron lines name the branch and rows, and drop secrets, invites, and answers", async () => {
  const lines = [];
  const original = console.info;
  console.info = (line) => {
    lines.push(String(line));
  };
  try {
    const response = await cron.handleCoachingCron(
      request(
        JSON.stringify({
          job: "quizzes",
          answer: ANSWER,
          inviteUrl: INVITE,
          secret: SECRET,
        }),
        "Bearer " + SECRET,
      ),
      {
        env: { CRON_SECRET: SECRET },
        requireWrite: () => null,
        runQuizzes: async () => 4,
      },
    );
    assert.equal(response.status, 200);
  } finally {
    console.info = original;
  }
  assert.equal(lines.length, 1);
  const line = lines[0];
  assert.equal(line.includes(SECRET), false);
  assert.equal(line.includes(INVITE), false);
  assert.equal(line.includes(ANSWER), false);
  assert.equal(line.includes("Bearer"), false);
  assert.deepEqual(JSON.parse(line), { event: "coaching.cron", branch: "quizzes", rowsChanged: 4 });
});

test("a runner failure does not echo the error text", async () => {
  const harness = deps({
    runQuizzes: async () => {
      throw new Error(`boom ${SECRET} ${INVITE} ${ANSWER}`);
    },
  });
  const response = await cron.handleCoachingCron(
    request(JSON.stringify({ job: "quizzes" }), "Bearer " + SECRET),
    harness,
  );
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.deepEqual(body, { error: "cron_failed" });
  assert.equal(JSON.stringify(body).includes(SECRET), false);
  assert.equal(JSON.stringify(body).includes(INVITE), false);
  assert.equal(JSON.stringify(body).includes(ANSWER), false);
  assert.deepEqual(harness.lines, [{ branch: "quizzes", rowsChanged: 0 }]);
});

test("cadence advance stays on the schedule clock", () => {
  const from = new Date("2026-09-24T15:00:00.000Z");
  assert.equal(cron.nextRunAfter(from, "daily").toISOString(), "2026-09-25T15:00:00.000Z");
  assert.equal(cron.nextRunAfter(from, "WEEKLY").toISOString(), "2026-10-01T15:00:00.000Z");
  assert.equal(cron.nextRunAfter(from, "monthly").toISOString(), "2026-10-24T15:00:00.000Z");
  assert.equal(cron.nextRunAfter(from, "quarterly").toISOString(), "2026-12-24T15:00:00.000Z");
});

test("weekly briefs change no rows when there is no subscriber column", async () => {
  assert.equal(await cron.runDueWeeklyBriefs(), 0);
});

test("POST is the handler and there is no GET insert path", async () => {
  const harness = deps();
  const response = await cron.POST(request(JSON.stringify({ job: "briefs" }), "Bearer " + SECRET));
  assert.equal(response.status, 401);
  const opened = deps();
  const ok = await cron.handleCoachingCron(request(JSON.stringify({ job: "briefs" }), "Bearer " + SECRET), opened);
  assert.equal(ok.status, 200);
  assert.equal(harness.calls.briefs, 0);
  assert.equal(opened.calls.briefs, 1);
});
