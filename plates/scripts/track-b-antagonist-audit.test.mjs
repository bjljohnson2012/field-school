import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {auditTrackBPath} from "./track-b-antagonist-audit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dest = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";
const words = JSON.parse(readFileSync(join(root, "fixtures", "track-b-words.json"), "utf8"));
const audio = join(root, "fixtures", "track-b-fixture.wav");

const HARD_IDS = [
  ...Array.from({length: 10}, (_, index) => `VOX-H${String(index + 1).padStart(2, "0")}`),
  ...Array.from({length: 12}, (_, index) => `RM-H${String(index + 1).padStart(2, "0")}`),
  ...Array.from({length: 10}, (_, index) => `EDU-H${String(index + 1).padStart(2, "0")}`),
];

test("full Track B path audit records HARD_FAIL gates and does not ship", () => {
  const audit = auditTrackBPath({capId: "fixture-audio", audio, words, dest});
  assert.equal(audit.bar, "v2");
  assert.equal(audit.verdict, "HARD_FAIL");
  assert.deepEqual(audit.hard_fail, ["RM-H07", "EDU-H01", "EDU-H02", "EDU-H09"]);
  assert.equal(audit.hold_cleaning, true);
  assert.equal(audit.escalate, true);
  assert.equal(audit.rendering, "idle");
  assert.equal(audit.gpu, false);
  assert.equal(audit.written, false);
  assert.equal(audit.distribute, false);
  assert.equal(audit.public, false);
  assert.equal(audit.dest_flipped, false);
  assert.equal(audit.dest_present, false);
  assert.equal(existsSync(dest), false);
  assert.deepEqual(audit.path, {
    plan: "PASS",
    captions: "PASS",
    plates: "PASS",
    master: "PASS",
    "export-ready": "PASS",
    cleaning: "HARD_FAIL",
    publish: "PASS",
  });
  assert.equal(audit.nodes.cleaning.auto_flip, true);
  assert.equal(audit.nodes.cleaning.dest_flipped, false);
  assert.equal(audit.nodes.cleaning.distribute, "HELD");
  assert.equal(audit.nodes.publish.distribute, false);
  assert.equal(audit.nodes.publish.written, false);
  assert.equal(audit.nodes.master.durationInFrames, 1050);
  for (const id of HARD_IDS) {
    assert.ok(audit.gates[id] === "PASS" || audit.gates[id] === "HARD_FAIL", id);
  }
  assert.equal(audit.gates["RM-H01"], "PASS");
  assert.equal(audit.gates["VOX-H10"], "PASS");
  assert.equal(audit.gates["VOX-H06"], "PASS");
  assert.ok(audit.soft_fail.includes("RM-S08"));
  assert.equal(audit.evidence.narrow_audit, "PASS");
  assert.equal(audit.evidence.cleaning_auto_flip, true);

  const report = readFileSync(join(root, "track-b-antagonist-audit.md"), "utf8");
  assert.match(report, /^verdict: HARD_FAIL/m);
  assert.match(report, /bar: v2/);
  assert.doesNotMatch(report, /bar v2\.1 is the score/);
  for (const id of audit.hard_fail) {
    assert.match(report, new RegExp(`${id} \\| HARD_FAIL`));
  }
  assert.match(report, /`distribute` stays false/);
  assert.match(report, /does not write master\.mp4/);

  const pkg = JSON.parse(readFileSync(join(root, "..", "app", "package.json"), "utf8"));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
  assert.equal(names.some((name) => name === "remotion" || name.startsWith("@remotion/")), false);
});

test("the audit script stays a dry run and exits on the hard fail", () => {
  const run = spawnSync(process.execPath, [join(here, "track-b-antagonist-audit.mjs")], {encoding: "utf8"});
  assert.equal(run.status, 1);
  const body = JSON.parse(run.stdout);
  assert.equal(body.verdict, "HARD_FAIL");
  assert.equal(body.distribute, false);
  assert.equal(body.written, false);
  assert.equal(existsSync(body.nodes.publish.dest || dest), false);
  const refused = spawnSync(process.execPath, [join(here, "track-b-antagonist-audit.mjs"), "--render"], {encoding: "utf8"});
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /dry_run_only/);
  assert.equal(existsSync(dest), false);
});
