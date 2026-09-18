import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  JUST_CAP_ID,
  LONGFORM_DEFAULT,
  LONGFORM_FALLBACK,
  CLEANING_STATUS,
  authorize,
  cleaningOnPass,
  isJustCapId,
  longformEngine,
  runQualityChecklist,
  writeEditSpec,
} from "../../video-pipeline/next-take.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("no campus Cap builder UI", () => {
  assert.equal(existsSync(join(root, "src/app/o/[slug]/record/page.tsx")), false);
  assert.equal(existsSync(join(root, "src/app/o/[slug]/watch/[id]/page.tsx")), false);
  assert.equal(existsSync(join(root, "src/app/api/cap")), false);
  assert.doesNotMatch(read("src/app/o/[slug]/page.tsx"), /\/record/);
  assert.doesNotMatch(read("src/components/site-header.tsx"), /\/record|AI builder/);
  assert.equal(existsSync(join(root, "db/0005_cap_record.sql")), false);
});

test("next real take is Remotion; Just and factory gates stay closed", () => {
  assert.equal(JUST_CAP_ID, "27pn9xs0zk8a73g");
  assert.equal(isJustCapId(JUST_CAP_ID), true);
  assert.equal(longformEngine(JUST_CAP_ID).error, "just_locked");
  const next = longformEngine("take_new_not_just");
  assert.equal(next.ok, true);
  assert.equal(next.engine, LONGFORM_DEFAULT);
  assert.equal(next.engine, "remotion");
  assert.equal(next.fallback, LONGFORM_FALLBACK);
  assert.equal(authorize("ycjdt_proposed_chapters_accept").error, "not_authorized");
  assert.equal(authorize("cleaning_flip").error, "not_authorized_use_cleaning_on_pass");
  assert.equal(authorize("publish_distribute").error, "not_authorized");
  const spec = readRepo("video-pipeline/EDIT_SPEC.md");
  assert.match(spec, /Operator-only/);
  assert.match(spec, /Melt is fallback/);
  assert.match(spec, /proposed_chapters/);
  assert.match(spec, /Auto-flip Notion Asset \*\*Status\*\* to \*\*Cleaning\*\*/);
  assert.doesNotMatch(spec, /2\.24\.64\.248 is in scope/);
});

const passIngest = {
  capId: "take_new_not_just",
  assetId: "asset_new_not_just",
  status: "Review",
  transcript: "Teach the work. Pause on purpose. Then do the next move.",
  duration: 120,
  width: 1920,
  height: 1080,
  mark: "Field School",
  cream: "#EFE7D6",
  ink: "#1A1A16",
  look: "field-school",
  chapters: [
    { title: "Teach the work", start: 0, end: 60 },
    { title: "Do the next move", start: 60, end: 120 },
  ],
};

test("cleaning-on-pass flips Status only when the checklist passes", () => {
  const written = writeEditSpec(passIngest);
  assert.equal(written.ok, true);
  assert.equal(runQualityChecklist(written.spec).pass, true);
  assert.equal(authorize("cleaning_on_pass", { pass: true }).ok, true);

  const applied = [];
  const pass = cleaningOnPass(passIngest, (mutation) => {
    applied.push(mutation);
    return mutation;
  });
  assert.equal(pass.ok, true);
  assert.equal(pass.status, CLEANING_STATUS);
  assert.equal(pass.action, "flip_status");
  assert.equal(pass.softShip, false);
  assert.equal(applied[0].value, "Cleaning");

  const fail = cleaningOnPass({ ...passIngest, width: 1280, height: 720 });
  assert.equal(fail.ok, false);
  assert.equal(fail.action, "stop_take");
  assert.equal(fail.escalate, "chief_decision_maker");
  assert.equal(fail.via, "cto_cursor_gate");
  assert.equal(fail.status, null);
  assert.equal(fail.softShip, false);
  assert.ok(fail.failures.includes("frame_1920x1080"));

  const just = cleaningOnPass({ ...passIngest, capId: JUST_CAP_ID });
  assert.equal(just.error, "just_locked");
  assert.equal(just.status, null);

  const ready = cleaningOnPass({ ...passIngest, status: "HLS Ready" });
  assert.equal(ready.error, "already_hls_ready");
  assert.equal(ready.status, null);

  assert.equal(writeEditSpec({ ...passIngest, capId: JUST_CAP_ID }).error, "just_locked");
  assert.equal(authorize("cleaning_on_pass", { pass: false }).error, "checklist_failed");
});

test("guest Grok Bot and AUTH locks stay", () => {
  const me = read("src/app/api/me/route.ts");
  const events = read("src/app/api/events/route.ts");
  const items = read("src/lib/pattern/items.ts");
  const authEnv = read("src/lib/auth/env.ts");
  assert.match(me, /guest: true/);
  assert.match(events, /guest: result.status === 401/);
  assert.doesNotMatch(items, /MBTI|Enneagram Institute|Gallup|Wiley/);
  assert.doesNotMatch(authEnv, /AUTH_URL\s*=/);
});

test("plates scaffold is blank, pinned, and lists compositions", () => {
  const pkg = JSON.parse(readRepo("plates/package.json"));
  const remotion = pkg.dependencies.remotion;
  assert.equal(remotion.includes("^") || remotion.includes("~"), false);
  for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
    if (name === "remotion" || name.startsWith("@remotion/")) {
      assert.equal(version, remotion, name);
      assert.equal(String(version).includes("^"), false, name);
    }
  }
  const agents = readRepo("plates/AGENTS.md");
  assert.match(agents, /bed/);
  assert.match(agents, /talking-head card/);
  assert.match(agents, /Later siblings sit on top/);
  assert.match(agents, /Melt is fallback/);
  assert.ok(existsSync(join(repo, "plates/.agents/skills/remotion-best-practices/SKILL.md")));
  const rootTsx = readRepo("plates/src/Root.tsx");
  const composition = readRepo("plates/src/Composition.tsx");
  assert.doesNotMatch(rootTsx, /Opener|RecapCard|DefinitionBoard|QuizBumper|TalkingHeadCard/);
  assert.match(composition, /width=\{1920\}/);
  assert.match(composition, /height=\{1080\}/);
  assert.ok(existsSync(join(repo, "plates/node_modules/remotion")));
  const listed = execFileSync("npx", ["remotion", "compositions"], {
    cwd: join(repo, "plates"),
    encoding: "utf8",
  });
  assert.match(listed, /The following compositions are available/i);
});
