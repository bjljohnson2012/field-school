import assert from "node:assert/strict";
import {mkdtempSync, readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const script = join(app, "deploy", "overlay-wave3-composer.sh");

test("overlay-wave3-composer pack is composer/teach/l only", () => {
  const out = mkdtempSync(join(tmpdir(), "wave3-pack-"));
  const ran = spawnSync("bash", [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      PACK_ONLY: "1",
      PACK_OUT_DIR: out,
      STAMP: "20260920TTEST",
      MAIN_SHA: "5b05d33595f66b3164e4f6b8e46c2eef8be94dad",
    },
  });
  assert.equal(ran.status, 0, ran.stderr + ran.stdout);
  assert.match(ran.stdout, /sha256=/);
  const tarPath = join(out, "wave3-composer-campus-pack-20260920TTEST.tar.gz");
  const members = spawnSync("tar", ["-tzf", tarPath], {encoding: "utf8"});
  assert.equal(members.status, 0, members.stderr);
  const list = members.stdout;
  assert.match(list, /src\/app\/api\/composer\/catalog\/route\.ts/);
  assert.match(list, /src\/app\/o\/\[slug\]\/teach\/page\.tsx/);
  assert.match(list, /src\/app\/o\/\[slug\]\/l\/page\.tsx/);
  assert.match(list, /src\/lib\/composer\/rules\.ts/);
  assert.match(list, /db\/0005_composer\.sql/);
  assert.doesNotMatch(list, /family-v1-home|children-database|vite\.config|src\/routes\/|remotion/);
  assert.doesNotMatch(list, /src\/app\/o\/\[slug\]\/page\.tsx/);
});

test("overlay script refuses a TanStack root", () => {
  const src = readFileSync(script, "utf8");
  assert.match(src, /vite\.config\.ts/);
  assert.match(src, /src\/routes/);
  assert.match(src, /family-v1-home/);
  assert.match(src, /children-database/);
  assert.match(src, /--no-deps app/);
  assert.match(src, /0005 tables present — skip migrate/);
  assert.match(src, /without a deploy\.sh wipe/);
  assert.match(src, /\$HOME\/\.ssh\/vps_deploy/);
  assert.doesNotMatch(src, /2\.24\.64\.248/);
  assert.doesNotMatch(src, /AUTH_URL=/);
});
