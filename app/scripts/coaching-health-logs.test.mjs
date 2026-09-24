import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

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

const log = await import(pathToFileURL(join(src, "lib/coaching/log.ts")).href);
const alert = await import(pathToFileURL(join(src, "lib/mail/operator-alert.ts")).href);
const health = await import(pathToFileURL(join(src, "app/api/coaching/health/route.ts")).href);

const SECRET = "sk-health-canary-do-not-echo";
const NARRATIVE = "She leads by listening and the profile says she avoids conflict in the room.";
const INVITE = "https://portal.fieldschool.ai/invite/accept?token=raw-invite-token";
const ORG = "11111111-1111-1111-1111-111111111111";
const SUBJECT = "22222222-2222-2222-2222-222222222222";

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function capture(fn) {
  const lines = [];
  const original = console.info;
  console.info = (line) => {
    lines.push(String(line));
  };
  try {
    fn();
  } finally {
    console.info = original;
  }
  return lines;
}

test("health source stays public and returns only ok", () => {
  const source = read("src/app/api/coaching/health/route.ts");
  assert.equal(source.includes("identityFromRequest"), false);
  assert.equal(source.includes("COACHING_SHELL"), false);
  assert.equal(source.includes("COACHING_WRITES"), false);
  assert.equal(source.includes("console."), false);
  assert.match(source, /synthesisStatus, "failed"/);
  assert.match(source, /interval '15 minutes'/);
  assert.match(source, /NextResponse\.json\(\{ ok: body\.ok \}/);
});

test("AI env ready is a boolean and does not return the key", () => {
  assert.equal(health.coachingAiEnvReady({}), false);
  assert.equal(health.coachingAiEnvReady({ GROK_API_KEY: "   " }), false);
  assert.equal(health.coachingAiEnvReady({ XAI_API_KEY: "" }), false);
  assert.equal(health.coachingAiEnvReady({ XAI_API_KEY: SECRET }), true);
  assert.equal(health.coachingAiEnvReady({ GROK_API_KEY: SECRET }), true);
});

test("GET is 200 and the body is only { ok }", async () => {
  health.clearCoachingHealthOverrides();
  health.setCoachingHealthOverrides({
    pingDatabase: async () => true,
    aiEnvReady: () => true,
    loadFailedSyntheses: async () => [],
    now: new Date("2026-09-24T00:00:00.000Z"),
  });
  const logs = [];
  const original = console.info;
  console.info = (line) => logs.push(String(line));
  try {
    const response = await health.GET();
    const text = await response.text();
    const body = JSON.parse(text);
    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
    assert.deepEqual(Object.keys(body), ["ok"]);
    assert.equal(typeof body.ok, "boolean");
    assert.equal(text.includes(SECRET), false);
    assert.equal(text.includes("API_KEY"), false);
    assert.equal(text.includes("DATABASE_URL"), false);
    for (const [name, value] of response.headers) {
      assert.equal(String(name).includes(SECRET), false);
      assert.equal(String(value).includes(SECRET), false);
    }
    assert.equal(logs.join("\n").includes(SECRET), false);
  } finally {
    console.info = original;
    health.clearCoachingHealthOverrides();
  }
});

test("missing AI env or database is { ok: false } with the same shape", async () => {
  health.setCoachingHealthOverrides({
    pingDatabase: async () => true,
    aiEnvReady: () => false,
    loadFailedSyntheses: async () => [],
  });
  const down = await health.GET();
  assert.equal(down.status, 200);
  assert.deepEqual(await down.json(), { ok: false });

  health.setCoachingHealthOverrides({
    pingDatabase: async () => false,
    aiEnvReady: () => true,
    loadFailedSyntheses: async () => {
      throw new Error(`db down ${SECRET} RESEND_API_KEY`);
    },
  });
  const noDb = await health.GET();
  const noDbText = await noDb.text();
  assert.equal(noDb.status, 200);
  assert.deepEqual(JSON.parse(noDbText), { ok: false });
  assert.equal(noDbText.includes(SECRET), false);
  health.clearCoachingHealthOverrides();
});

test("alert failure does not change the { ok } shape", async () => {
  health.setCoachingHealthOverrides({
    pingDatabase: async () => true,
    aiEnvReady: () => true,
    loadFailedSyntheses: async () => {
      throw new Error(`scan failed ${SECRET} SMTP_PASS`);
    },
    sendOperatorAlert: async () => {
      throw new Error(`mail failed ${SECRET}`);
    },
  });
  const logs = [];
  const original = console.info;
  console.info = (line) => logs.push(String(line));
  try {
    const response = await health.GET();
    const text = await response.text();
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(text), { ok: true });
    assert.equal(text.includes(SECRET), false);
    assert.equal(logs.join("\n").includes(SECRET), false);
  } finally {
    console.info = original;
    health.clearCoachingHealthOverrides();
  }
});

test("structured coaching logs are one JSON line and drop private text", () => {
  const lines = capture(() => {
    log.logCoachingAccessDeny({
      actorMembershipId: "actor-1",
      subjectMembershipId: SUBJECT,
      orgId: ORG,
      reason: "org_mismatch",
    });
    log.logCoachingScoreWrite({
      slug: "discovery",
      source: "coach_override",
      orgId: ORG,
      note: NARRATIVE,
    });
    log.logCoachingAiJob({
      jobId: "job-1",
      orgId: ORG,
      model: "grok-4.3",
      latencyMs: 42,
      status: "ready",
      usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 },
      answer: "The answer text must not be logged",
      narrative: NARRATIVE,
    });
    log.logCoachingImport({
      table: "coaching_profiles",
      counts: { inserted: 2, updated: 1, skipped: "nope", inviteUrl: INVITE },
      inviteUrl: INVITE,
    });
    log.logCoachingCron({ branch: "quizzes", rowsChanged: 5 });
  });

  assert.equal(lines.length, 5);
  const events = lines.map((line) => {
    assert.equal(line.includes("\n"), false);
    assert.equal(line.includes(NARRATIVE), false);
    assert.equal(line.includes(INVITE), false);
    assert.equal(line.includes(SECRET), false);
    assert.equal(line.includes("answer text"), false);
    return JSON.parse(line);
  });
  assert.deepEqual(
    events.map((event) => event.event),
    [...log.COACHING_LOG_EVENTS],
  );
  assert.equal(events[1].note, undefined);
  assert.deepEqual(events[1], {
    event: "coaching.score.write",
    slug: "discovery",
    source: "coach_override",
    orgId: ORG,
  });
  assert.equal(events[2].answer, undefined);
  assert.deepEqual(events[2].usage, {
    promptTokens: 3,
    completionTokens: 4,
    totalTokens: 7,
  });
  assert.deepEqual(events[3].counts, { inserted: 2, updated: 1 });
  assert.equal(events[3].inviteUrl, undefined);
  assert.deepEqual(events[4], { event: "coaching.cron", branch: "quizzes", rowsChanged: 5 });

  const redacted = log.coachingAccessDenyLine({
    actorMembershipId: SECRET,
    subjectMembershipId: SUBJECT,
    orgId: ORG,
    reason: INVITE,
  });
  assert.equal(redacted.actorMembershipId, null);
  assert.equal(redacted.reason, null);
  assert.equal(JSON.stringify(redacted).includes(SECRET), false);
  assert.equal(JSON.stringify(redacted).includes("token="), false);
});

test("failed synthesis younger than 15 minutes emails once per subject", async () => {
  alert.resetFailedSynthesisAlerts();
  const now = new Date("2026-09-24T12:00:00.000Z");
  const fresh = new Date(now.getTime() - 14 * 60 * 1000);
  const edge = new Date(now.getTime() - alert.FAILED_SYNTHESIS_WINDOW_MS);
  const old = new Date(now.getTime() - 16 * 60 * 1000);
  const row = {
    orgId: ORG,
    membershipId: SUBJECT,
    synthesisStatus: "failed",
    updatedAt: fresh,
  };
  let sends = 0;
  const send = async () => {
    sends += 1;
    return { emailed: true };
  };

  assert.equal(alert.isUnretriedFailedSynthesis(row, now), true);
  assert.equal(
    alert.isUnretriedFailedSynthesis({ ...row, updatedAt: edge }, now),
    false,
  );
  assert.equal(alert.isUnretriedFailedSynthesis({ ...row, updatedAt: old }, now), false);
  assert.equal(
    alert.isUnretriedFailedSynthesis({ ...row, synthesisStatus: "generating" }, now),
    false,
  );
  assert.equal(
    alert.isUnretriedFailedSynthesis({ ...row, synthesisStatus: "ready" }, now),
    false,
  );

  const first = await alert.alertUnretriedFailedSyntheses(
    [row, { ...row, updatedAt: old }, { ...row, membershipId: "other-subject", updatedAt: fresh }],
    { now, send },
  );
  assert.equal(first.emailed, 2);
  const second = await alert.alertUnretriedFailedSyntheses([row], { now, send });
  assert.equal(second.emailed, 0);
  assert.equal(sends, 2);

  await alert.alertUnretriedFailedSyntheses([], { now, send });
  const retried = await alert.alertUnretriedFailedSyntheses(
    [{ ...row, updatedAt: new Date(now.getTime() - 60 * 1000) }],
    { now, send },
  );
  assert.equal(retried.emailed, 1);
  assert.equal(sends, 3);
  alert.resetFailedSynthesisAlerts();
});

test("a failed alert is not deduped and does not throw", async () => {
  alert.resetFailedSynthesisAlerts();
  const now = new Date("2026-09-24T12:00:00.000Z");
  const row = {
    orgId: ORG,
    membershipId: SUBJECT,
    synthesisStatus: "failed",
    updatedAt: new Date(now.getTime() - 60 * 1000),
  };
  let sends = 0;
  const send = async () => {
    sends += 1;
    if (sends === 1) throw new Error(`smtp ${SECRET}`);
    return { emailed: true };
  };
  const failed = await alert.alertUnretriedFailedSyntheses([row], { now, send });
  assert.equal(failed.emailed, 0);
  const retried = await alert.alertUnretriedFailedSyntheses([row], { now, send });
  assert.equal(retried.emailed, 1);
  assert.equal(sends, 2);
  alert.resetFailedSynthesisAlerts();
});

test("operator mail uses Resend without echoing the key", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFetch = global.fetch;
  process.env.RESEND_API_KEY = SECRET;
  let seenAuth = "";
  let seenBody = "";
  global.fetch = async (_url, init) => {
    seenAuth = String(init?.headers?.Authorization ?? "");
    seenBody = String(init?.body ?? "");
    return new Response("ok", { status: 200 });
  };
  const logs = [];
  const original = console.info;
  console.info = (line) => logs.push(String(line));
  try {
    const result = await alert.sendFailedSynthesisAlert({ orgId: ORG, membershipId: SUBJECT });
    assert.deepEqual(result, { emailed: true });
    assert.equal(seenAuth.includes(SECRET), true);
    assert.equal(seenBody.includes(SECRET), false);
    assert.equal(seenBody.includes(NARRATIVE), false);
    assert.equal(seenBody.includes(SUBJECT), true);
    assert.equal(JSON.stringify(result).includes(SECRET), false);
    assert.equal(logs.join("\n").includes(SECRET), false);
  } finally {
    console.info = original;
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  }
});

test("Resend rejection does not surface the response body", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFetch = global.fetch;
  process.env.RESEND_API_KEY = SECRET;
  global.fetch = async () => new Response(`rejected ${SECRET} SMTP_PASS`, { status: 500 });
  try {
    const result = await alert.sendFailedSynthesisAlert({ orgId: ORG, membershipId: SUBJECT });
    assert.deepEqual(result, { emailed: false });
    assert.equal(JSON.stringify(result).includes(SECRET), false);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  }
});
