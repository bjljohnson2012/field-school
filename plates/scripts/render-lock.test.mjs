import assert from "node:assert/strict";
import {mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {dirname} from "node:path";
import {
  CPU_CONCURRENCY,
  LOCKED_JUST_ID,
  MIN_MEM_MIB,
  destLocked,
  gateRender,
  justRefused,
  memAvailableMiB,
  shouldWait,
} from "./render-lock.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const renderPlate = join(here, "render-plate.mjs");

test("Just id is refused — do not invent a second id", () => {
  assert.equal(justRefused(LOCKED_JUST_ID), true);
  assert.equal(justRefused("fixture"), false);
  assert.equal(gateRender({capId: LOCKED_JUST_ID}).error, "locked_dest");
});

test("locked dests refuse overwrite", () => {
  assert.equal(destLocked("/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4"), true);
  assert.equal(destLocked(`/opt/fieldschool-video/hls/${LOCKED_JUST_ID}/master.mp4`), true);
  assert.equal(destLocked("/tmp/plates/opener.mp4"), false);
  assert.equal(
    gateRender({
      dest: "/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4",
      lockPaths: [join(tmpdir(), "no-such-render.lock")],
      meminfo: "MemAvailable: 8192000 kB\n",
    }).error,
    "locked_dest",
  );
});

test("melt lock blocks plate job", () => {
  const dir = mkdtempSync(join(tmpdir(), "plates-lock-"));
  const lock = join(dir, "render.lock");
  writeFileSync(lock, "melt");
  const gated = gateRender({
    lockPaths: [lock],
    meminfo: "MemAvailable: 8000000 kB\n",
  });
  assert.equal(gated.ok, false);
  assert.equal(gated.error, "melt_lock");
});

test("low RAM blocks even without lock", () => {
  assert.equal(memAvailableMiB("MemAvailable: 2048000 kB\n") < MIN_MEM_MIB, true);
  assert.equal(shouldWait({lock: false, memMiB: 1024}), true);
  const gated = gateRender({
    lockPaths: [join(tmpdir(), "no-such-render.lock")],
    meminfo: "MemAvailable: 1024000 kB\n",
  });
  assert.equal(gated.error, "low_ram");
});

test("enough RAM and no lock may render", () => {
  const gated = gateRender({
    lockPaths: [join(tmpdir(), "no-such-render.lock")],
    meminfo: "MemAvailable: 8192000 kB\n",
  });
  assert.equal(gated.ok, true);
  assert.equal(gated.concurrency, CPU_CONCURRENCY);
  assert.equal(CPU_CONCURRENCY, 2);
});

test("render-plate dry-run after a clear gate", () => {
  const dir = mkdtempSync(join(tmpdir(), "plates-dry-"));
  const missingLock = join(dir, "absent.render.lock");
  const meminfo = join(dir, "meminfo");
  writeFileSync(meminfo, "MemAvailable: 8192000 kB\n");
  const ran = spawnSync(
    process.execPath,
    [renderPlate, "--comp", "Opener", "--lock", missingLock, "--meminfo", meminfo, "--dry-run"],
    {encoding: "utf8"},
  );
  assert.equal(ran.status, 0, ran.stderr);
  const body = JSON.parse(ran.stdout);
  assert.equal(body.ok, true);
  assert.equal(body.composition, "Opener");
  assert.equal(body.concurrency, 2);
  assert.equal(body.skipped, "dry_run");
});

test("render-plate dry-run refuses melt lock", () => {
  const dir = mkdtempSync(join(tmpdir(), "plates-dry-lock-"));
  const lock = join(dir, "render.lock");
  const meminfo = join(dir, "meminfo");
  writeFileSync(lock, "melt");
  writeFileSync(meminfo, "MemAvailable: 8192000 kB\n");
  const ran = spawnSync(
    process.execPath,
    [renderPlate, "--comp", "RecapCard", "--lock", lock, "--meminfo", meminfo, "--dry-run"],
    {encoding: "utf8"},
  );
  assert.equal(ran.status, 75);
  assert.equal(JSON.parse(ran.stdout).error, "melt_lock");
});

test("render-plate dry-run refuses Just and Aug 30 dest", () => {
  const dir = mkdtempSync(join(tmpdir(), "plates-dry-dest-"));
  const missingLock = join(dir, "absent.render.lock");
  const meminfo = join(dir, "meminfo");
  writeFileSync(meminfo, "MemAvailable: 8192000 kB\n");
  const just = spawnSync(
    process.execPath,
    [
      renderPlate,
      "--comp",
      "Opener",
      "--cap-id",
      LOCKED_JUST_ID,
      "--lock",
      missingLock,
      "--meminfo",
      meminfo,
      "--dry-run",
    ],
    {encoding: "utf8"},
  );
  assert.equal(just.status, 2);
  assert.equal(JSON.parse(just.stdout).error, "locked_dest");
  const aug30 = spawnSync(
    process.execPath,
    [
      renderPlate,
      "--comp",
      "Opener",
      "--dest",
      "/opt/fieldschool-video/hls/j013r823wx9ecaf/vox/everything-made-up.mp4",
      "--lock",
      missingLock,
      "--meminfo",
      meminfo,
      "--dry-run",
    ],
    {encoding: "utf8"},
  );
  assert.equal(aug30.status, 2);
  assert.equal(JSON.parse(aug30.stdout).error, "locked_dest");
});

test("render-plate dry-run refuses low RAM", () => {
  const dir = mkdtempSync(join(tmpdir(), "plates-dry-ram-"));
  const missingLock = join(dir, "absent.render.lock");
  const meminfo = join(dir, "meminfo");
  writeFileSync(meminfo, "MemAvailable: 1024000 kB\n");
  const ran = spawnSync(
    process.execPath,
    [renderPlate, "--comp", "QuizBumper", "--lock", missingLock, "--meminfo", meminfo, "--dry-run"],
    {encoding: "utf8"},
  );
  assert.equal(ran.status, 75);
  const body = JSON.parse(ran.stdout);
  assert.equal(body.error, "low_ram");
  assert.equal(body.memMiB, 1000);
});
