import {existsSync, readFileSync} from "node:fs";

const lock = process.env.MELT_RENDER_LOCK || "/opt/field-school/edit/render.lock";
if (existsSync(lock)) {
  console.error(`refuse: melt render.lock present at ${lock}`);
  process.exit(2);
}

const meminfo = existsSync("/proc/meminfo") ? readFileSync("/proc/meminfo", "utf8") : "";
const avail = Number((/MemAvailable:\s+(\d+)/.exec(meminfo) || [])[1] || 0);
if (avail && avail < 3072 * 1024) {
  console.error(`refuse: MemAvailable ${avail} kB < 3072 MiB`);
  process.exit(3);
}

console.log("render lock clear");
