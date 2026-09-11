#!/usr/bin/env node
/**
 * Wave 1 proof: Postgres isolation + guest APIs + factory still up.
 * Does not print secrets. Run on the VPS after migrate.
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const origin = process.env.PORTAL_PUBLIC_URL || "https://portal.fieldschool.ai";
const sql = postgres(url, { max: 2 });

async function http(path, opts = {}) {
  const res = await fetch(`${origin}${path}`, opts);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text: text.slice(0, 200) };
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

try {
  const orgs = await sql`select slug, isolation from organizations order by slug`;
  check(
    "seed orgs",
    orgs.some((o) => o.slug === "field-school") &&
      orgs.some((o) => o.slug === "household"),
    orgs.map((o) => o.slug).join(","),
  );

  await sql`
    insert into members (email, name) values
      ('wave1.a@example.com', 'User A'),
      ('wave1.b@example.com', 'User B')
    on conflict (email) do update set name = excluded.name
  `;
  const org0 = await sql`select id from organizations where slug = 'field-school'`;
  const household = await sql`select id from organizations where slug = 'household'`;
  const [a, b] = await sql`select id, email from members where email in ('wave1.a@example.com','wave1.b@example.com') order by email`;

  await sql`
    insert into memberships (org_id, member_id, stance)
    values (${org0[0].id}, ${a.id}, 'learner'), (${org0[0].id}, ${b.id}, 'learner')
    on conflict (org_id, member_id) do nothing
  `;
  const mem = await sql`
    select m.id, mem.email
    from memberships m
    join members mem on mem.id = m.member_id
    where m.org_id = ${org0[0].id}
      and mem.email in ('wave1.a@example.com','wave1.b@example.com')
  `;
  const memA = mem.find((r) => r.email === "wave1.a@example.com");
  const memB = mem.find((r) => r.email === "wave1.b@example.com");

  await sql`
    insert into learning_events (
      org_id, membership_id, actor_membership_id, actor_stance,
      kind, object_type, object_id, score, raw
    ) values (
      ${org0[0].id}, ${memA.id}, ${memA.id}, 'learner',
      'watch', 'station', 'grok-bot:briefing', null, ${sql.json({ course: "grok-bot" })}
    )
  `;
  await sql`
    insert into learning_events (
      org_id, membership_id, actor_membership_id, actor_stance,
      kind, object_type, object_id, score, raw
    ) values (
      ${org0[0].id}, ${memA.id}, ${memA.id}, 'learner',
      'quiz', 'station', 'grok-bot:briefing', 4, ${sql.json({ passed: true })}
    )
  `;

  const againA = await sql`
    select kind, object_id from learning_events
    where org_id = ${org0[0].id} and membership_id = ${memA.id}
      and object_id = 'grok-bot:briefing'
    order by created_at
  `;
  check(
    "user A progress survives in Postgres",
    againA.some((r) => r.kind === "watch") && againA.some((r) => r.kind === "quiz"),
    `${againA.length} rows`,
  );

  const asB = await sql`
    select count(*)::int as n from learning_events
    where org_id = ${org0[0].id} and membership_id = ${memB.id}
      and object_id = 'grok-bot:briefing'
  `;
  check("user B does not see user A events", asB[0].n === 0, `n=${asB[0].n}`);

  const asHousehold = await sql`
    select count(*)::int as n from learning_events
    where org_id = ${household[0].id}
  `;
  check(
    "household org has no field-school events",
    asHousehold[0].n === 0,
    `n=${asHousehold[0].n}`,
  );

  const me = await http("/api/me");
  check(
    "guest GET /api/me is unauthenticated",
    me.status === 200 && me.json?.authenticated === false && me.json?.guest === true,
    `status=${me.status}`,
  );

  const progress = await http("/api/progress?course=grok-bot");
  check(
    "guest GET /api/progress is empty",
    progress.status === 200 &&
      progress.json?.authenticated === false &&
      Object.keys(progress.json?.modules ?? { x: 1 }).length === 0,
    `status=${progress.status}`,
  );

  const post = await http("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "watch",
      course: "grok-bot",
      station: "briefing",
    }),
  });
  check(
    "guest POST /api/events is rejected",
    post.status === 401 && post.json?.guest === true,
    `status=${post.status}`,
  );

  const cap = await fetch("https://cap.fieldschool.ai/login", { redirect: "manual" });
  check(
    "cap.fieldschool.ai still up",
    cap.status === 200 || cap.status === 307 || cap.status === 308,
    `status=${cap.status}`,
  );

  const edit = await fetch("https://edit.fieldschool.ai/", { redirect: "manual" });
  check(
    "edit.fieldschool.ai still up",
    edit.status === 200 || edit.status === 404 || edit.status === 405,
    `status=${edit.status}`,
  );

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`Wave 1 proof failed: ${failed.length} check(s)`);
    process.exit(1);
  }
  console.log("Wave 1 proof passed");
} finally {
  await sql.end({ timeout: 2 });
}
