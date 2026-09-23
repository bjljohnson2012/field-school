import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  cleaningAutoFlipReady,
  decidePlate,
  destAllowed,
  plateVisibleTo,
} from "../src/lib/plates/rules.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0012 plate_renders table is approve/reject only, no Cap media", () => {
  const sql = read("db/0012_plate_renders.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS plate_renders/);
  assert.match(sql, /org_id uuid NOT NULL REFERENCES organizations/);
  assert.match(sql, /membership_id uuid NOT NULL REFERENCES memberships/);
  assert.match(sql, /status text NOT NULL DEFAULT 'pending'/);
  assert.match(sql, /hold_cleaning boolean NOT NULL DEFAULT true/);
  assert.doesNotMatch(sql, /cap_id|a_roll|hls_ready/);
  assert.match(sql, /Do not alter 0001-0011/);
});

test("approve/reject and dest lock", () => {
  assert.deepEqual(decidePlate("pending", "approve"), { ok: true, status: "approved" });
  assert.deepEqual(decidePlate("pending", "reject"), { ok: true, status: "rejected" });
  assert.equal(decidePlate("approved", "reject").ok, false);
  assert.equal(destAllowed("/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4"), true);
  assert.equal(destAllowed("/opt/fieldschool-video/hls/27pn9xs0zk8a73g/master.mp4"), false);
  assert.equal(destAllowed("/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4"), false);
  const teacher = { orgId: "household", kind: "adult", stance: "guardian" };
  const child = { orgId: "household", kind: "child", stance: "learner" };
  const sales = { orgId: "sales", kind: "adult", stance: "trainer" };
  assert.equal(plateVisibleTo({ orgId: "household", status: "approved" }, child), true);
  assert.equal(plateVisibleTo({ orgId: "household", status: "rejected" }, child), false);
  assert.equal(plateVisibleTo({ orgId: "household", status: "pending" }, teacher), true);
  assert.equal(plateVisibleTo({ orgId: "household", status: "approved" }, sales), false);
  assert.equal(cleaningAutoFlipReady({ checklistExit: 0, shipGreen: false, holdCleaning: true }), false);
});

test("API is teacher-gated and guests 401", () => {
  const list = read("src/app/api/plates/route.ts");
  const approve = read("src/app/api/plates/approve/route.ts");
  const reject = read("src/app/api/plates/reject/route.ts");
  const access = read("src/lib/composer/access.ts");
  const store = read("src/lib/plates/store.ts");
  assert.match(list, /requireMember/);
  assert.match(list, /requireTeacher/);
  assert.ok(list.indexOf("requireMember") < list.indexOf("listPlates"));
  assert.ok(list.indexOf("requireTeacher") < list.indexOf("registerPlate"));
  assert.match(approve, /requireTeacher/);
  assert.ok(approve.indexOf("requireTeacher") < approve.indexOf("decidePlateRow"));
  assert.match(reject, /requireTeacher/);
  assert.ok(reject.indexOf("requireTeacher") < reject.indexOf("decidePlateRow"));
  assert.match(access, /if \(!auth\.ok\) return \{ ok: false as const, response: deny\(auth\.status, auth\.error\) \}/);
  assert.match(access, /identityFromRequest/);
  assert.match(store, /eq\(plateRenders\.orgId, identity\.orgId\)/);
  assert.doesNotMatch(store, /body\.org_id|input\.orgId/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
});

test("docs hook checklist to future auto-flip; no Remotion in Next; no live flip", () => {
  const readme = readRepo("plates/README.md");
  const campus = readRepo("docs/campus-runtime/PLATE_RENDERS.md");
  const pkg = JSON.parse(read("package.json"));
  assert.match(readme, /0012_plate_renders/);
  assert.match(readme, /auto-flip/);
  assert.match(campus, /cleaning-checklist-lesson-spine/);
  assert.match(campus, /ship 1–6/);
  assert.deepEqual(
    Object.keys(pkg.dependencies).filter((name) => name === "remotion" || name.startsWith("@remotion/")).sort(),
    ["@remotion/player", "remotion"],
  );
  assert.doesNotMatch(read("src/app/api/plates/approve/route.ts"), /notion|Cleaning|Publish/);
  assert.match(read("src/app/api/plates/approve/route.ts"), /auto_flip: false/);
});

test("0012 apply script dry-runs and refuses live VPS", () => {
  const apply = read("scripts/apply-0012.mjs");
  assert.match(apply, /skip apply: refuse live VPS/);
  const ran = spawnSync(process.execPath, [join(root, "scripts", "apply-0012.mjs")], {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: "", PLATE_0012_DRY: "1" },
  });
  assert.equal(ran.status, 0, ran.stderr);
  assert.match(ran.stdout, /ready .*0012_plate_renders\.sql/);
});
