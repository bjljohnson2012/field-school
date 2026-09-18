import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  CPU_CONCURRENCY,
  LOCKED_JUST_ID,
  MIN_MEM_MIB,
  gateRender,
  justRefused,
  memAvailableMiB,
  shouldWait,
} from "./melt-lock.mjs";

test("Just id is refused", () => {
  assert.equal(justRefused(LOCKED_JUST_ID), true);
  assert.equal(justRefused("new-take"), false);
  assert.equal(gateRender({ capId: LOCKED_JUST_ID }).error, "just_locked");
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
  assert.equal(shouldWait({ lock: false, memMiB: 1024 }), true);
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
