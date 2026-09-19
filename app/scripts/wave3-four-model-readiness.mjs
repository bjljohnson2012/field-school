#!/usr/bin/env node
/**
 * Wave3 four-model readiness (verify/docs). No deploy. No campus package.
 * Standing gate: docs/campus-runtime/FOUR_MODEL.md + store four-model-hotfix-interrogate.md
 *
 * This Product runner records proof commands against the current SHA.
 * It does not spawn Isolation / Item-bank / Factory / Goal workers.
 * Ship/cutover stays blocked until those four independent lenses PASS.
 */
import {spawnSync} from "node:child_process";
import {writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const repo = join(app, "..");

function git(args) {
  const ran = spawnSync("git", ["-C", repo, ...args], {encoding: "utf8"});
  return (ran.stdout || "").trim();
}

async function hit(url, opts = {}) {
  const res = await fetch(url, {redirect: "manual", ...opts});
  const text = await res.text();
  return {
    url,
    status: res.status,
    location: res.headers.get("location"),
    body: text.slice(0, 240),
  };
}

const sha = git(["rev-parse", "HEAD"]);
const suite = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", join(here, "wave3-composer.test.mjs")],
  {encoding: "utf8", cwd: app},
);

const live = {
  me: await hit("https://portal.fieldschool.ai/api/me"),
  grok: await hit("https://portal.fieldschool.ai/c/grok-bot"),
  catalog: await hit("https://portal.fieldschool.ai/api/composer/catalog"),
  lessons: await hit("https://portal.fieldschool.ai/api/composer/lessons"),
  teach: await hit("https://portal.fieldschool.ai/o/household/teach"),
  household: await hit("https://portal.fieldschool.ai/o/household"),
  events: await hit("https://portal.fieldschool.ai/api/events", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: "{}",
  }),
  university: await hit("https://university.benjohnson.ai/"),
  edit: await hit("https://edit.fieldschool.ai/health"),
  cap: await hit("https://cap.fieldschool.ai/login"),
};

const checks = [];
function row(id, ok, detail) {
  checks.push({id, result: ok ? "PASS" : "FAIL", detail});
}

row("W3-SUITE", suite.status === 0, `wave3-composer.test.mjs exit ${suite.status}`);
row("ISO-ME", live.me.status === 200 && live.me.body.includes('"guest":true'), live.me.body);
row("ISO-GROK", live.grok.status === 200, `status ${live.grok.status}`);
row("ISO-EVENTS", live.events.status === 401 && live.events.body.includes("sign_in_required"), live.events.body);
row(
  "ISO-COMPOSER",
  live.catalog.status === 401 &&
    live.lessons.status === 401 &&
    live.catalog.body.includes("sign_in_required"),
  `catalog ${live.catalog.status} lessons ${live.lessons.status}`,
);
row("ISO-TEACH", live.teach.status === 401, `teach ${live.teach.status}`);
row("ISO-HOUSEHOLD", live.household.status === 401, `household ${live.household.status}`);
row("FAC-UNIVERSITY", live.university.status === 301 && live.university.location?.includes("portal.fieldschool.ai"), live.university.location || "");
row("FAC-EDIT", live.edit.status === 200 && live.edit.body.includes("fieldschool-edit"), live.edit.body);
row("FAC-CAP", live.cap.status === 200, `cap ${live.cap.status}`);
row("GOAL-NO-CUTOVER", true, "this runner never calls deploy.sh / overlay / flip-auth-url");
row("SHIP-FARM", false, "Isolation/Item-bank/Factory/Goal workers not spawned (CDM). Standing gate stays FAIL for deploy.");

const readiness = checks.filter((c) => c.id !== "SHIP-FARM").every((c) => c.result === "PASS");
const report = {
  dated: "2026-09-19",
  sha,
  command: "node scripts/wave3-four-model-readiness.mjs",
  readiness: readiness ? "PASS" : "FAIL",
  ship_gate: "FAIL",
  cutover: "not_done",
  checks,
  live,
  suite_tail: (suite.stdout || "").trim().split("\n").slice(-12),
};

const dest = process.env.PROOF_JSON || "/opt/cursor/artifacts/wave3-four-model-readiness-2026-09-19.json";
try {
  writeFileSync(dest, `${JSON.stringify(report, null, 2)}\n`);
} catch {
  writeFileSync("/tmp/wave3-four-model-readiness-2026-09-19.json", `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
process.exit(readiness ? 0 : 1);
