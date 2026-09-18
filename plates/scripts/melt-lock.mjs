import { existsSync, readFileSync } from "node:fs";

export const LOCKED_JUST_ID = "27pn9xs0zk8a73g";
export const MIN_MEM_MIB = 3072;
export const CPU_CONCURRENCY = 2;

export const DEFAULT_LOCK_PATHS = [
  process.env.MELT_RENDER_LOCK,
  "/opt/fieldschool-video/render.lock",
  "/opt/field-school/render.lock",
].filter(Boolean);

export function justRefused(id) {
  return String(id || "").trim() === LOCKED_JUST_ID;
}

export function memAvailableMiB(meminfo) {
  const match = String(meminfo).match(/^MemAvailable:\s+(\d+)\s+kB/m);
  if (!match) return 0;
  return Number(match[1]) / 1024;
}

export function lockExists(paths = DEFAULT_LOCK_PATHS) {
  return paths.some((path) => existsSync(path));
}

export function readMemAvailable(file = "/proc/meminfo") {
  try {
    return memAvailableMiB(readFileSync(file, "utf8"));
  } catch {
    return 0;
  }
}

export function shouldWait({ lock, memMiB }) {
  return Boolean(lock) || Number(memMiB) < MIN_MEM_MIB;
}

export function gateRender({
  capId = "",
  lockPaths = DEFAULT_LOCK_PATHS,
  meminfo,
} = {}) {
  if (justRefused(capId)) {
    return { ok: false, error: "just_locked" };
  }
  const lock = lockExists(lockPaths);
  const memMiB =
    meminfo != null ? memAvailableMiB(meminfo) : readMemAvailable();
  if (shouldWait({ lock, memMiB })) {
    return {
      ok: false,
      error: lock ? "melt_lock" : "low_ram",
      lock,
      memMiB,
    };
  }
  return { ok: true, concurrency: CPU_CONCURRENCY, memMiB };
}
