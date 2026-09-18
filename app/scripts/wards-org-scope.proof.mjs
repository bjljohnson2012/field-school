#!/usr/bin/env node
/**
 * Prove POST /api/pattern/wards / linkWard org scope.
 *
 * FAIL (exit 1) when a household guardian can attach a sales membership.
 * PASS (exit 0) when that POST is rejected and no cross-org wards row exists.
 *
 * Requires a running campus Next process and isolated Postgres with 0001–0004 applied.
 * Does not deploy. Does not flip AUTH_URL. Does not mint a child User.
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import postgres from "postgres";

const BASE = process.env.WARDS_PROOF_LOCAL || "http://127.0.0.1:43181";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://wards_scope:wards_scope@127.0.0.1:5432/wards_scope";
const LIVE = process.env.WARDS_PROOF_LIVE || "https://portal.fieldschool.ai";
const OUT = process.env.WARDS_PROOF_OUT || "/opt/cursor/artifacts/wards-org-scope-proof.json";
const SHA =
  process.env.WARDS_PROOF_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

const ALICE = {
  name: "Alice Guardian",
  email: "alice.wards.scope@household.test",
  password: "WardsScope-alice-9",
};
const BOB = {
  name: "Bob Sales",
  email: "bob.wards.scope@sales.test",
  password: "WardsScope-bob-9",
};
const CARL = {
  name: "Carl Household Child",
  email: "carl.wards.scope@household.test",
  password: "WardsScope-carl-9",
};

function absorb(jar, response) {
  const raw =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const line of raw) {
    const pair = line.split(";", 1)[0];
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function json(url, opts = {}) {
  const response = await fetch(url, opts);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body, response };
}

async function register(account) {
  return json(`${BASE}/api/members/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(account),
  });
}

async function signIn(account) {
  const jar = new Map();
  const csrfHit = await fetch(`${BASE}/api/auth/csrf`);
  absorb(jar, csrfHit);
  const csrf = await csrfHit.json();
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email: account.email,
    password: account.password,
    callbackUrl: `${BASE}/`,
    json: "true",
  });
  const callback = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  absorb(jar, callback);
  if (![200, 302].includes(callback.status)) {
    throw new Error(`credentials callback ${callback.status}`);
  }
  return jar;
}

async function authed(jar, path, opts = {}) {
  const headers = {
    cookie: cookieHeader(jar),
    ...(opts.headers || {}),
  };
  return json(`${BASE}${path}`, { ...opts, headers });
}

async function waitReady(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status) return;
    } catch {
      // still booting
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`not ready: ${url}`);
}

const sql = postgres(DATABASE_URL, { max: 4 });

const report = {
  sha: SHA,
  base: BASE,
  live: LIVE,
  verdict: "FAIL",
  hole: null,
  fail: [],
  liveGuestGrok: false,
  liveEvents401: false,
  localGuestGrok: false,
  localEvents401: false,
  crossOrg: null,
  sameOrg: null,
};

try {
  await waitReady(`${BASE}/api/me`);

  const liveMe = await json(`${LIVE}/api/me`);
  const liveGrok = await fetch(`${LIVE}/c/grok-bot`, { redirect: "manual" });
  const liveEvents = await json(`${LIVE}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "watch", course: "grok-bot", station: "briefing" }),
  });
  report.liveGuestGrok = liveGrok.status === 200;
  report.liveEvents401 =
    liveEvents.status === 401 && liveEvents.body?.error === "sign_in_required";
  if (!report.liveGuestGrok) report.fail.push("live_guest_grok");
  if (!report.liveEvents401) report.fail.push("live_events_401");
  if (liveMe.body?.guest !== true) report.fail.push("live_guest_me");

  const localMe = await json(`${BASE}/api/me`);
  const localGrok = await fetch(`${BASE}/c/grok-bot`, { redirect: "manual" });
  const localEvents = await json(`${BASE}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "watch", course: "grok-bot", station: "briefing" }),
  });
  report.localGuestGrok = localGrok.status === 200;
  report.localEvents401 =
    localEvents.status === 401 && localEvents.body?.error === "sign_in_required";
  if (!report.localGuestGrok) report.fail.push("local_guest_grok");
  if (!report.localEvents401) report.fail.push("local_events_401");
  if (localMe.body?.guest !== true) report.fail.push("local_guest_me");

  for (const account of [ALICE, BOB, CARL]) {
    const created = await register(account);
    if (![200, 400].includes(created.status)) {
      throw new Error(`register ${account.email} ${created.status} ${JSON.stringify(created.body)}`);
    }
  }

  const aliceJar = await signIn(ALICE);
  const bobJar = await signIn(BOB);
  const carlJar = await signIn(CARL);

  // First authenticated hit upserts campus members (may 403 until SQL grant).
  await authed(aliceJar, "/api/me");
  await authed(bobJar, "/api/me");
  await authed(carlJar, "/api/me");

  await sql`
    insert into memberships (org_id, member_id, stance)
    select o.id, m.id, 'guardian'
    from organizations o, members m
    where o.slug = 'household' and m.email = ${ALICE.email}
    on conflict (org_id, member_id) do update set stance = 'guardian'
  `;
  await sql`
    insert into memberships (org_id, member_id, stance)
    select o.id, m.id, 'learner'
    from organizations o, members m
    where o.slug = 'sales' and m.email = ${BOB.email}
    on conflict (org_id, member_id) do update set stance = 'learner'
  `;
  await sql`
    update members set kind = 'child' where email = ${CARL.email}
  `;
  await sql`
    insert into memberships (org_id, member_id, stance)
    select o.id, m.id, 'learner'
    from organizations o, members m
    where o.slug = 'household' and m.email = ${CARL.email}
    on conflict (org_id, member_id) do update set stance = 'learner'
  `;

  const aliceMe = await authed(aliceJar, "/api/me", { headers: { "x-fs-org": "household" } });
  const bobMe = await authed(bobJar, "/api/me", { headers: { "x-fs-org": "sales" } });
  const aliceMid = aliceMe.body?.activeOrg?.membershipId;
  const bobMid = bobMe.body?.activeOrg?.membershipId;
  const [carlRow] = await sql`
    select mem.id as membership_id
    from memberships mem
    join members m on m.id = mem.member_id
    join organizations o on o.id = mem.org_id
    where m.email = ${CARL.email} and o.slug = 'household'
  `;
  const carlMid = carlRow?.membership_id;
  if (!aliceMid || !bobMid || !carlMid) {
    throw new Error(
      `missing memberships alice=${aliceMid} bob=${bobMid} carl=${carlMid} aliceMe=${JSON.stringify(aliceMe.body)}`,
    );
  }
  if (aliceMe.body?.activeOrg?.slug !== "household" || aliceMe.body?.activeOrg?.stance !== "guardian") {
    throw new Error(`alice not household guardian: ${JSON.stringify(aliceMe.body)}`);
  }
  if (bobMe.body?.activeOrg?.slug !== "sales") {
    throw new Error(`bob not sales: ${JSON.stringify(bobMe.body)}`);
  }

  await sql`
    delete from wards
    where guardian_membership_id = ${aliceMid}
      and child_membership_id = ${bobMid}
  `;

  const cross = await authed(aliceJar, "/api/pattern/wards", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-fs-org": "household",
    },
    body: JSON.stringify({ child_membership_id: bobMid }),
  });

  const leak = await sql`
    select w.id, ho.slug as ward_org, co.slug as child_real_org,
           gm.email as guardian_email, cm.email as child_email
    from wards w
    join organizations ho on ho.id = w.org_id
    join memberships gmem on gmem.id = w.guardian_membership_id
    join members gm on gm.id = gmem.member_id
    join memberships cmem on cmem.id = w.child_membership_id
    join members cm on cm.id = cmem.member_id
    join organizations co on co.id = cmem.org_id
    where w.guardian_membership_id = ${aliceMid}
      and w.child_membership_id = ${bobMid}
  `;

  report.crossOrg = {
    status: cross.status,
    body: cross.body,
    leakedRows: leak,
  };

  const holeOpen = cross.status === 200 && leak.length > 0 && leak[0].child_real_org === "sales";
  const holeClosed =
    cross.status === 403 &&
    leak.length === 0 &&
    (cross.body?.error === "child_not_in_org" || cross.body?.error === "cross_org");

  report.hole = holeOpen;
  if (holeOpen) report.fail.push("guardian_linked_other_org_child");
  if (!holeOpen && !holeClosed) {
    report.fail.push(`unexpected_cross_org_status_${cross.status}_${cross.body?.error || "none"}`);
  }

  const same = await authed(aliceJar, "/api/pattern/wards", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-fs-org": "household",
    },
    body: JSON.stringify({ child_membership_id: carlMid }),
  });
  const sameRows = await sql`
    select w.id
    from wards w
    where w.guardian_membership_id = ${aliceMid}
      and w.child_membership_id = ${carlMid}
  `;
  report.sameOrg = { status: same.status, body: same.body, rows: sameRows.length };
  if (same.status !== 200 || sameRows.length < 1) {
    report.fail.push("same_org_child_link_should_succeed");
  }

  report.verdict = report.fail.length === 0 && holeClosed ? "PASS" : "FAIL";
} catch (error) {
  report.fail.push(String(error?.stack || error));
  report.verdict = "FAIL";
} finally {
  await sql.end({ timeout: 2 });
}

writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(report.verdict === "PASS" ? 0 : 1);
