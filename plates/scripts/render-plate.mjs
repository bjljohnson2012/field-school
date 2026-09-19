#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {CPU_CONCURRENCY, gateRender} from "./render-lock.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  if (i === -1) return "";
  return args[i + 1] || "";
}

const composition = flag("--comp") || args.find((a) => !a.startsWith("-")) || "";
const capId = flag("--cap-id");
const dest = flag("--dest") || flag("--out");
const lockPath = flag("--lock");
const meminfoPath = flag("--meminfo");
const dry = args.includes("--dry-run");

const gated = gateRender({
  capId,
  dest,
  lockPaths: lockPath ? [lockPath] : undefined,
  meminfo: meminfoPath ? readFileSync(meminfoPath, "utf8") : undefined,
});

if (!gated.ok) {
  console.log(JSON.stringify(gated));
  process.exit(gated.error === "locked_dest" ? 2 : 75);
}

if (!composition) {
  console.log(JSON.stringify({ok: false, error: "composition_required"}));
  process.exit(2);
}

if (dry) {
  console.log(
    JSON.stringify({
      ok: true,
      composition,
      concurrency: CPU_CONCURRENCY,
      skipped: "dry_run",
    }),
  );
  process.exit(0);
}

const passthrough = [];
for (let i = 0; i < args.length; i += 1) {
  if (["--comp", "--cap-id", "--dest", "--out", "--lock", "--meminfo"].includes(args[i])) {
    i += 1;
    continue;
  }
  if (args[i] === "--dry-run") continue;
  if (args[i] === composition && !passthrough.includes(composition)) continue;
  passthrough.push(args[i]);
}

const rendered = spawnSync(
  "npx",
  ["remotion", "render", composition, ...passthrough, `--concurrency=${CPU_CONCURRENCY}`],
  {cwd: root, stdio: "inherit"},
);

process.exit(rendered.status ?? 1);
