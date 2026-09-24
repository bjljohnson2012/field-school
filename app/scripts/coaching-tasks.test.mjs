import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let target = src + "/" + specifier.slice(2);
    if (!/\\.(ts|tsx|js|mjs|cjs|json)$/.test(target)) target += ".ts";
    return nextResolve(pathToFileURL(target).href, context);
  }
  if (specifier.startsWith(".") && !/\\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const { canAssign, canChangeStatus, canListTask, subjectAllowed } = await import(
  pathToFileURL(join(src, "app/api/coaching/tasks/access.ts")).href
);
const { coachingNav } = await import(pathToFileURL(join(src, "lib/coaching/nav.ts")).href);
const { requireCoachingWrite } = await import(pathToFileURL(join(src, "lib/coaching/writes.ts")).href);

const read = (rel) => readFileSync(join(root, rel), "utf8");

const world = {
  memberships: [
    { id: "admin", orgId: "org", memberId: "m-admin", stance: "admin" },
    { id: "leader", orgId: "org", memberId: "m-leader", stance: "leader" },
    { id: "coach", orgId: "org", memberId: "m-coach", stance: "coach" },
    { id: "ae", orgId: "org", memberId: "m-ae", stance: "learner" },
    { id: "other", orgId: "org", memberId: "m-other", stance: "learner" },
    { id: "plat", orgId: "org", memberId: "m-plat", stance: "learner" },
  ],
  capabilities: [{ membershipId: "plat", capability: "platform_admin" }],
  links: [
    { orgId: "org", coachMembershipId: "leader", subjectMembershipId: "coach", kind: "vp" },
    { orgId: "org", coachMembershipId: "coach", subjectMembershipId: "ae", kind: "director" },
  ],
  wards: [],
};

const actor = (membershipId, memberId, stance) => ({ membershipId, memberId, orgId: "org", stance });
const admin = actor("admin", "m-admin", "admin");
const leader = actor("leader", "m-leader", "leader");
const coach = actor("coach", "m-coach", "coach");
const ae = actor("ae", "m-ae", "learner");
const other = actor("other", "m-other", "learner");
const plat = actor("plat", "m-plat", "learner");

function task(assignee, author, status = "open") {
  return {
    orgId: "org",
    assigneeMembershipId: assignee,
    authorMembershipId: author,
    status,
  };
}

test("create follows the reporting chain for leader and coach, and rank for admins", () => {
  assert.equal(canAssign(world, coach, "ae"), true);
  assert.equal(canAssign(world, coach, "coach"), true);
  assert.equal(canAssign(world, coach, "other"), false);
  assert.equal(canAssign(world, leader, "coach"), true);
  assert.equal(canAssign(world, leader, "ae"), true);
  assert.equal(canAssign(world, leader, "other"), false);
  assert.equal(canAssign(world, admin, "other"), true);
  assert.equal(canAssign(world, admin, "ae"), true);
  assert.equal(canAssign(world, admin, "plat"), false);
  assert.equal(canAssign(world, plat, "other"), true);
  assert.equal(canAssign(world, plat, "plat"), true);
  assert.equal(canAssign(world, ae, "ae"), true);
  assert.equal(canAssign(world, ae, "other"), false);
  assert.equal(subjectAllowed(world, "org", null), true);
  assert.equal(subjectAllowed(world, "org", "coach"), true);
  assert.equal(subjectAllowed(world, "org", "missing"), false);
});

test("list is the assignee or an actor whose chain or rank includes the assignee", () => {
  const aeTask = task("ae", "coach");
  const outside = task("other", "admin");
  const platformTask = task("plat", "plat");
  assert.equal(canListTask(world, ae, aeTask), true);
  assert.equal(canListTask(world, coach, aeTask), true);
  assert.equal(canListTask(world, leader, aeTask), true);
  assert.equal(canListTask(world, other, aeTask), false);
  assert.equal(canListTask(world, coach, outside), false);
  assert.equal(canListTask(world, leader, outside), false);
  assert.equal(canListTask(world, admin, outside), true);
  assert.equal(canListTask(world, other, outside), true);
  assert.equal(canListTask(world, admin, platformTask), false);
  assert.equal(canListTask(world, plat, platformTask), true);
  assert.deepEqual(
    [].filter((row) => canListTask(world, coach, row)),
    [],
  );
  assert.equal(canListTask(world, coach, { ...aeTask, orgId: "other-org" }), false);
});

test("status moves open to in_progress to done for assignee or author, and cancel for author or admin", () => {
  const open = task("ae", "coach", "open");
  assert.equal(canChangeStatus(world, ae, open, "in_progress"), true);
  assert.equal(canChangeStatus(world, coach, open, "in_progress"), true);
  assert.equal(canChangeStatus(world, other, open, "in_progress"), false);
  assert.equal(canChangeStatus(world, admin, open, "in_progress"), false);
  assert.equal(canChangeStatus(world, ae, open, "done"), false);
  assert.equal(canChangeStatus(world, ae, open, "cancelled"), false);
  assert.equal(canChangeStatus(world, coach, open, "cancelled"), true);
  assert.equal(canChangeStatus(world, admin, open, "cancelled"), true);
  assert.equal(canChangeStatus(world, plat, open, "cancelled"), true);
  assert.equal(canChangeStatus(world, leader, open, "cancelled"), false);

  const started = task("ae", "coach", "in_progress");
  assert.equal(canChangeStatus(world, ae, started, "done"), true);
  assert.equal(canChangeStatus(world, coach, started, "done"), true);
  assert.equal(canChangeStatus(world, other, started, "done"), false);
  assert.equal(canChangeStatus(world, admin, started, "cancelled"), true);

  const done = task("ae", "coach", "done");
  assert.equal(canChangeStatus(world, coach, done, "cancelled"), false);
  assert.equal(canChangeStatus(world, admin, done, "cancelled"), false);
});

test("requireCoachingWrite is 403 when writes are off and task mutates call it first", async () => {
  const previous = process.env.COACHING_WRITES;
  delete process.env.COACHING_WRITES;
  try {
    const unset = requireCoachingWrite();
    assert.equal(unset.status, 403);
    assert.deepEqual(await unset.json(), { error: "writes_disabled" });
    process.env.COACHING_WRITES = "0";
    const zero = requireCoachingWrite();
    assert.equal(zero.status, 403);
    assert.deepEqual(await zero.json(), { error: "writes_disabled" });
  } finally {
    if (previous === undefined) delete process.env.COACHING_WRITES;
    else process.env.COACHING_WRITES = previous;
  }

  const routes = [
    ["src/app/api/coaching/tasks/route.ts", ["POST"]],
    ["src/app/api/coaching/tasks/[id]/route.ts", ["PATCH"]],
    ["src/app/api/coaching/tasks/generate/route.ts", ["POST"]],
    ["src/app/api/coaching/tasks/describe/route.ts", ["POST"]],
  ];
  for (const [rel, names] of routes) {
    const source = read(rel);
    for (const name of names) {
      const handler = source.indexOf(`export async function ${name}`);
      const gate = source.indexOf("const blocked = requireCoachingWrite()", handler);
      assert.ok(handler >= 0 && gate > handler, `${rel} ${name}`);
      const between = source.slice(handler, gate);
      assert.equal(between.includes("await "), false, rel);
      assert.equal(between.includes("getDb("), false, rel);
    }
    assert.match(source, /if \(blocked\) return blocked/);
  }

  const count = read("src/app/api/coaching/tasks/count/route.ts");
  assert.equal(count.includes("requireCoachingWrite"), false);
  assert.match(count, /countOpenTasks/);
  assert.match(count, /export async function GET/);
});

test("generate persists through generateTasksForAe and description is create-assist only", () => {
  const generate = read("src/app/api/coaching/tasks/generate/route.ts");
  const describe = read("src/app/api/coaching/tasks/describe/route.ts");
  const persist = read("src/app/api/coaching/tasks/persist.ts");
  assert.match(generate, /generateTasksForAe\(/);
  assert.match(generate, /insertGeneratedTasks/);
  assert.doesNotMatch(generate, /generateTaskDescription/);
  assert.match(describe, /generateTaskDescription\(/);
  assert.doesNotMatch(describe, /insertGeneratedTasks|createTask\(/);
  const api = [generate, describe, persist, read("src/app/api/coaching/tasks/route.ts")].join("\n");
  assert.doesNotMatch(api, /lib\/ai\/client/);
  assert.doesNotMatch(api, /profileArtifacts|learnerProfiles/);
  assert.doesNotMatch(api, /COACHING_WRITES\s*=/);
  assert.doesNotMatch(api, /AUTH_URL/);
});

test("badge polls the count route, hides at zero, and mounts only on the orange tasks control", () => {
  const badge = read("src/components/tasks-nav-badge.tsx");
  assert.match(badge, /\/api\/coaching\/tasks\/count/);
  assert.match(badge, /60_000/);
  assert.match(badge, /if \(count <= 0\) return null/);
  assert.match(badge, /fallback = 0/);

  const shell = read("src/components/app-shell.tsx");
  const hrefs = shell.match(/href="\/tasks"/g) || [];
  assert.equal(hrefs.length, 1);
  const link = shell.indexOf('href="/tasks"');
  const mount = shell.indexOf("<TasksNavBadge");
  const avatar = shell.indexOf('aria-haspopup="menu"');
  assert.ok(link >= 0 && mount > link && mount < avatar);
  assert.match(shell, /fallback=\{openTasks\}/);

  for (const sample of [
    { orgKind: "sales", capabilities: ["learner"], platformAdmin: false },
    { orgKind: "sales", capabilities: ["coach"], platformAdmin: false },
    { orgKind: "sales", capabilities: ["admin"], platformAdmin: false },
    { orgKind: "sales", capabilities: [], platformAdmin: true },
  ]) {
    const items = coachingNav(sample);
    assert.equal(
      items.some((item) => item.label === "Tasks" || item.href === "/tasks"),
      false,
    );
  }
});

test("tasks page uses AE tokens and a live Generate control", () => {
  const ui = ["src/app/tasks/page.tsx", "src/app/tasks/tasks-board.tsx"].map(read).join("\n");
  assert.match(ui, /h-page/);
  assert.match(ui, /btn-primary/);
  assert.match(ui, /className="input/);
  assert.match(ui, /className="card/);
  assert.match(ui, /No open tasks/);
  assert.match(ui, /\/api\/coaching\/tasks\/generate/);
  assert.match(ui, /\/api\/coaching\/tasks\/describe/);
  assert.match(ui, /onClick=\{\(\) => void generate\(\)\}/);
  assert.match(ui, />\s*Generate\s*</);
});
