import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { hashSync } from "bcryptjs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { applyCampusSql, assertLocalUrl, localDatabaseUrl, recreateLocalDatabase } from "./tenancy-local.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = localDatabaseUrl("tenancy_http");
const port = 43221;
const base = `http://127.0.0.1:${port}`;
const password = "local-fixture-pass";

const actors = {
  ada: {
    email: "ada.qx7@local.test",
    name: "Ada qx7",
    slug: "family-ada",
    orgName: "Ada home qx7",
    kind: "family",
    stance: "owner",
    child: "Ada child qx7",
    lesson: "Ada lesson qx7",
  },
  bea: {
    email: "bea.qx7@local.test",
    name: "Bea qx7",
    slug: "family-bea",
    orgName: "Bea home qx7",
    kind: "family",
    stance: "owner",
    child: "Bea child qx7",
    lesson: "Bea lesson qx7",
  },
  ann: {
    email: "ann.qx7@local.test",
    name: "Ann qx7",
    slug: "team-ann",
    orgName: "Ann roster qx7",
    kind: "team",
    stance: "owner",
    child: "Ann learner qx7",
    lesson: "Ann lesson qx7",
  },
  bob: {
    email: "bob.qx7@local.test",
    name: "Bob qx7",
    slug: "team-bob",
    orgName: "Bob roster qx7",
    kind: "team",
    stance: "owner",
    child: "Bob learner qx7",
    lesson: "Bob lesson qx7",
  },
};

let server;
const lessonIds = {};

function cookieHeader(setCookies) {
  return setCookies.map((line) => line.split(";")[0]).filter(Boolean).join("; ");
}

async function waitForServer() {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < 120000) {
    try {
      const res = await fetch(`${base}/api/auth/csrf`);
      if (res.ok) return;
      last = `${res.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`next_not_ready:${last}`);
}

async function signIn(email) {
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  assert.equal(csrfRes.status, 200, "csrf");
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];
  const { csrfToken } = await csrfRes.json();
  const posted = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(csrfCookies),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${base}/`,
    }),
  });
  const cookies = cookieHeader([...csrfCookies, ...(posted.headers.getSetCookie?.() ?? [])]);
  assert.match(cookies, /authjs\.session-token/, `${email} ${posted.status} ${cookies}`);
  return cookies;
}

async function readJson(path, cookies, org) {
  const res = await fetch(`${base}${path}`, {
    headers: { cookie: `${cookies}; fs_org=${org}`, "x-fs-org": org },
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function sendJson(path, cookies, org, method, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      cookie: `${cookies}; fs_org=${org}`,
      "x-fs-org": org,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

function hides(text, secret) {
  assert.equal(text.includes(secret), false, secret);
}

test.before(async () => {
  assertLocalUrl(url);
  assert.equal(new URL(url).hostname, "127.0.0.1");
  await recreateLocalDatabase("tenancy_http");
  await applyCampusSql(url);
  const sql = postgres(url, { max: 1 });
  const hash = hashSync(password, 8);
  try {
    for (const actor of Object.values(actors)) {
      const [org] = await sql`
        INSERT INTO organizations (slug, name, kind, isolation, homeschool_mode)
        VALUES (${actor.slug}, ${actor.orgName}, ${actor.kind}, ${actor.kind === "family" ? "strict" : "platform_plus"}, false)
        RETURNING id
      `;
      const [adult] = await sql`
        INSERT INTO members (email, name, kind)
        VALUES (${actor.email}, ${actor.name}, 'adult')
        RETURNING id
      `;
      const [child] = await sql`
        INSERT INTO members (email, name, kind)
        VALUES (${`${actor.slug}.child@household.local`}, ${actor.child}, 'child')
        RETURNING id
      `;
      const [owner] = await sql`
        INSERT INTO memberships (org_id, member_id, stance)
        VALUES (${org.id}, ${adult.id}, ${actor.stance})
        RETURNING id
      `;
      const [learner] = await sql`
        INSERT INTO memberships (org_id, member_id, stance)
        VALUES (${org.id}, ${child.id}, 'learner')
        RETURNING id
      `;
      await sql`
        INSERT INTO member_credentials (member_id, source, password_hash)
        VALUES (${adult.id}, 'password', ${hash})
      `;
      const [course] = await sql`
        INSERT INTO courses (org_id, slug, title, kind, status, created_by_membership_id)
        VALUES (${org.id}, 'desk', ${actor.lesson}, 'text', 'published', ${owner.id})
        RETURNING id
      `;
      const [lesson] = await sql`
        INSERT INTO lessons (org_id, course_id, slug, title, body, status, created_by_membership_id)
        VALUES (${org.id}, ${course.id}, 'desk', ${actor.lesson}, ${actor.lesson}, 'published', ${owner.id})
        RETURNING id
      `;
      await sql`
        INSERT INTO learning_events (
          org_id, membership_id, actor_membership_id, actor_stance, kind, object_type, object_id
        )
        VALUES (${org.id}, ${learner.id}, ${owner.id}, 'owner', 'view', 'lesson', ${lesson.id})
      `;
      lessonIds[actor.slug] = lesson.id;
    }
  } finally {
    await sql.end({ timeout: 1 });
  }

  server = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      DATABASE_URL: url,
      AUTH_SECRET: "tenancy-http-local-only-secret",
      AUTH_TRUST_HOST: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  server.stdout.on("data", (chunk) => {
    log += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    log += chunk.toString();
  });
  server.log = () => log;
  await waitForServer();
});

test.after(async () => {
  if (server && !server.killed) server.kill("SIGTERM");
});

async function pair(left, right) {
  const own = await signIn(left.email);
  const people = await readJson("/api/org/people", own, left.slug);
  assert.equal(people.status, 200, people.text);
  assert.equal(people.text.includes(left.child), true, "own people");
  hides(people.text, right.child);
  hides(people.text, right.lesson);

  const otherPeople = await readJson("/api/org/people", own, right.slug);
  hides(otherPeople.text, right.child);
  hides(otherPeople.text, right.lesson);
  assert.notEqual(otherPeople.status, 200, otherPeople.text);

  const catalog = await readJson("/api/composer/catalog", own, left.slug);
  assert.equal(catalog.status, 200, catalog.text);
  assert.equal(catalog.text.includes(left.lesson), true, "own library");
  hides(catalog.text, right.lesson);
  hides(catalog.text, right.child);

  const otherCatalog = await readJson("/api/composer/catalog", own, right.slug);
  hides(otherCatalog.text, right.lesson);
  assert.notEqual(otherCatalog.status, 200, otherCatalog.text);

  const insights = await readJson("/insights", own, left.slug);
  assert.equal(insights.status, 200, insights.text.slice(0, 500));
  assert.equal(insights.text.includes(left.orgName), true, insights.text.slice(0, 500));
  assert.equal(insights.text.includes(left.child), true, insights.text.slice(0, 800));
  hides(insights.text, right.orgName);
  hides(insights.text, right.child);
  hides(insights.text, right.lesson);

  const otherInsights = await readJson("/insights", own, right.slug);
  hides(otherInsights.text, right.orgName);
  hides(otherInsights.text, right.child);
  hides(otherInsights.text, right.lesson);

  const candidates = await readJson("/api/library/candidates", own, left.slug);
  assert.equal(candidates.status, 200, candidates.text);
  assert.equal(candidates.text.includes(left.lesson), true, "own candidates");
  hides(candidates.text, right.lesson);

  const otherCandidates = await readJson("/api/library/candidates", own, right.slug);
  hides(otherCandidates.text, right.lesson);
  assert.notEqual(otherCandidates.status, 200, otherCandidates.text);

  const generate = await sendJson("/api/library/generate", own, left.slug, "POST", {
    lesson_id: lessonIds[right.slug],
  });
  assert.equal(generate.status, 404, generate.text);
  hides(generate.text, right.lesson);

  const expand = await sendJson("/api/library/expand", own, left.slug, "POST", {
    lessonId: lessonIds[right.slug],
  });
  assert.equal(expand.status, 404, expand.text);
  hides(expand.text, right.lesson);

  const documents = await sendJson("/api/library/documents", own, left.slug, "PATCH", {
    lessonId: lessonIds[right.slug],
    title: "renamed",
  });
  assert.notEqual(documents.status, 200, documents.text);
  hides(documents.text, right.lesson);

  const intakeTitle = `${left.slug} intake qx7`;
  const intake = await sendJson("/api/library/intake", own, left.slug, "POST", {
    items: [{ text: `${intakeTitle} stays in this org and is long enough.`, kind: "text" }],
  });
  assert.equal(intake.status, 200, intake.text);
  const otherAfterIntake = await readJson("/api/library/candidates", own, right.slug);
  hides(otherAfterIntake.text, intakeTitle);
  const rightSession = await signIn(right.email);
  const rightCatalog = await readJson("/api/composer/catalog", rightSession, right.slug);
  hides(rightCatalog.text, intakeTitle);

  const wizardTitle = `${left.slug} wizard qx7`;
  const wizard = await sendJson("/api/library/wizard/submit", own, left.slug, "POST", {
    kind: "text",
    title: wizardTitle,
    outcome: "The learner can name the org this note belongs to.",
    detail: `${wizardTitle} is supplied text for this org only and is long enough to store.`,
    audience: [],
  });
  assert.equal(wizard.status, 200, wizard.text);
  const rightAfterWizard = await readJson("/api/composer/catalog", rightSession, right.slug);
  hides(rightAfterWizard.text, wizardTitle);
  const rightCandidates = await readJson("/api/library/candidates", rightSession, right.slug);
  hides(rightCandidates.text, wizardTitle);
}

test("two families cannot read each other over HTTP", async () => {
  await pair(actors.ada, actors.bea);
});

test("two teams cannot read each other over HTTP", async () => {
  await pair(actors.ann, actors.bob);
});
