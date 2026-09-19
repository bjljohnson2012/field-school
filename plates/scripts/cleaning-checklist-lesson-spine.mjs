#!/usr/bin/env node
/**
 * LessonSpine Cleaning checklist. Scores the dated encode.
 * Never flips Cap / Notion / Publish / Distribute.
 * Future auto-flip: call this first; flip only if exit 0 AND ship 1–6 green.
 */
import {createHash} from "node:crypto";
import {existsSync, readFileSync, readdirSync, statSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath, pathToFileURL} from "node:url";
import {destLocked, LOCKED_JUST_ID} from "./render-lock.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const PLATES_ROOT = join(here, "..");
export const DEFAULT_DEST =
  "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4";
export const EXPECTED_SHA256 =
  "a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a";
export const ORDER_LOCK =
  "Opener/sting → TalkingHead/slate → DefinitionBoard/objective → RecapCard → QuizBumper/next-up";

const HARD = [
  "VOX-H01",
  "VOX-H02",
  "VOX-H03",
  "VOX-H04",
  "VOX-H05",
  "VOX-H06",
  "VOX-H07",
  "VOX-H08",
  "VOX-H09",
  "VOX-H10",
  "RM-H01",
  "RM-H02",
  "RM-H03",
  "RM-H04",
  "RM-H05",
  "RM-H06",
  "RM-H07",
  "RM-H08",
  "RM-H09",
  "RM-H10",
  "RM-H11",
  "RM-H12",
  "EDU-H01",
  "EDU-H02",
  "EDU-H03",
  "EDU-H04",
  "EDU-H05",
  "EDU-H06",
  "EDU-H07",
  "EDU-H08",
  "EDU-H09",
  "EDU-H10",
];

function src(root, ...parts) {
  return readFileSync(join(root, ...parts), "utf8");
}

function srcBlob(root) {
  const dir = join(root, "src");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".tsx") || name.endsWith(".ts"))
    .map((name) => src(root, "src", name))
    .join("\n");
}

function probe(dest) {
  const ran = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=width,height,r_frame_rate,codec_name",
      "-of",
      "json",
      dest,
    ],
    {encoding: "utf8"},
  );
  if (ran.status !== 0) return null;
  try {
    return JSON.parse(ran.stdout);
  } catch {
    return null;
  }
}

function sha256File(dest) {
  return createHash("sha256").update(readFileSync(dest)).digest("hex");
}

function gate(ok, note) {
  return {status: ok ? "PASS" : "HARD_FAIL", note};
}

export function runChecklist({
  dest = DEFAULT_DEST,
  platesRoot = PLATES_ROOT,
} = {}) {
  const blob = existsSync(join(platesRoot, "src")) ? srcBlob(platesRoot) : "";
  const rootTsx = existsSync(join(platesRoot, "src", "Root.tsx"))
    ? src(platesRoot, "src", "Root.tsx")
    : "";
  const brand = existsSync(join(platesRoot, "src", "brand.ts"))
    ? src(platesRoot, "src", "brand.ts")
    : "";
  const math = existsSync(join(platesRoot, "src", "sceneMotionMath.ts"))
    ? src(platesRoot, "src", "sceneMotionMath.ts")
    : "";
  const spine = existsSync(join(platesRoot, "src", "lessonSpine.ts"))
    ? src(platesRoot, "src", "lessonSpine.ts")
    : "";
  const readme = existsSync(join(platesRoot, "README.md"))
    ? src(platesRoot, "README.md")
    : "";
  const captions = ["opener", "talking-head", "definition", "recap", "quiz"].every((name) =>
    existsSync(join(platesRoot, "public", "captions", `${name}.json`)),
  );
  const destExists = existsSync(dest);
  const lockedDest = destLocked(dest);
  const probed = destExists ? probe(dest) : null;
  const video = probed?.streams?.find((s) => s.codec_name === "h264" || s.width) || {};
  const duration = Number(probed?.format?.duration || 0);
  const fps = String(video.r_frame_rate || "");
  const sizeOk = destExists ? statSync(dest).size > 1000 : false;
  const digest = destExists ? sha256File(dest) : "";
  const repoRoot = join(platesRoot, "..");
  const campusRemotion = existsSync(join(repoRoot, "app", "package.json"))
    ? /remotion/i.test(src(repoRoot, "app", "package.json"))
    : false;

  const gates = {};
  gates["VOX-H01"] = gate(
    destExists && video.width === 1920 && video.height === 1080 && (fps === "30/1" || fps === "30") && video.codec_name === "h264",
    destExists
      ? `${video.width}x${video.height} ${fps} ${video.codec_name} ${duration}s`
      : `missing dest ${dest}`,
  );
  gates["VOX-H02"] = gate(
    /x:\s*1576/.test(brand) && /y:\s*24/.test(brand) && /w:\s*80/.test(brand) && /h:\s*64/.test(brand) && /You Can Just Do Things/.test(brand + rootTsx),
    "seal lock 1576,24 80×64 + YCJDT title",
  );
  gates["VOX-H03"] = gate(
    /#EFE7D6/.test(brand) && /#1A1A16/.test(brand) && /#C4A35A/.test(brand) && /Fraunces/.test(brand),
    "cream / ink / gold / Fraunces",
  );
  gates["VOX-H04"] = gate(
    /DOCK_PCT = 0\.38/.test(brand) && /HeadDock/.test(blob) && !/full-bleed over type/.test(blob),
    "dock 38%, HeadDock, not full-bleed",
  );
  gates["VOX-H05"] = gate(
    destExists && Math.abs(duration - 41) <= 0.5 && /durationInFrames=\{1230\}/.test(rootTsx) && /id: "sting"/.test(spine),
    `duration ${duration} vs 41s / 1230f`,
  );
  gates["VOX-H06"] = gate(
    !lockedDest && !dest.includes(LOCKED_JUST_ID) && !/vox\/everything-made-up\.mp4/.test(dest),
    destExists ? `dated dest ${dest}` : "dest missing or locked",
  );
  gates["VOX-H07"] = gate(
    !/animation:|transition:|animate-/.test(blob) && !/setTimeout|setInterval/.test(blob),
    "no CapCut / CSS timers",
  );
  gates["VOX-H08"] = gate(
    captions && /Karaoke/.test(blob) && /startMs/.test(rootTsx),
    "karaoke + captions.json path",
  );
  gates["VOX-H09"] = gate(destExists && sizeOk && /render-plate\.mjs/.test(readme), "Remotion dest exists via render-plate");
  gates["VOX-H10"] = gate(!campusRemotion, "no campus Remotion package");

  gates["RM-H01"] = gate(/useCurrentFrame/.test(blob) && !/animation:|transition:|animate-/.test(blob), "R7 useCurrentFrame");
  gates["RM-H02"] = gate(/calculateMetadata/.test(rootTsx) && /spineDurationFrames/.test(rootTsx) && /1230/.test(rootTsx), "LessonSpine calculateMetadata 1230");
  gates["RM-H03"] = gate(/<Img/.test(blob) && /staticFile\("isolated-seal.svg"\)/.test(blob), "Img + staticFile");
  gates["RM-H04"] = gate(/@remotion\/google-fonts\/Fraunces/.test(brand) && /subsets: \["latin"\]/.test(brand), "Fraunces latin");
  gates["RM-H05"] = gate(!/delayRender\(/.test(blob), "no uncleared delayRender");
  gates["RM-H06"] = gate(!/Math\.random\(/.test(blob), "deterministic frames");
  gates["RM-H07"] = gate(!/staticFile\("a_roll/.test(blob), "no Cap A-roll on fixture (clock is captions)");
  gates["RM-H08"] = gate(/id="LessonSpine"/.test(rootTsx) && /width=\{1920\}/.test(rootTsx) && /fps=\{30\}/.test(rootTsx), "LessonSpine registered");
  gates["RM-H09"] = gate(destExists && sizeOk && duration > 0, destExists ? `encoded ${digest.slice(0, 12)}…` : "dest missing");
  gates["RM-H10"] = gate(/function spineMetadata/.test(rootTsx), "calculateMetadata once");
  gates["RM-H11"] = gate(/useMemo/.test(blob) || /Karaoke/.test(blob), "karaoke/layout memo path present");
  gates["RM-H12"] = gate(/subsets: \["latin"\]/.test(brand) && !/weights: \["100"/.test(brand), "font subsets latin");

  gates["EDU-H01"] = gate(/name="sting"/.test(src(platesRoot, "src", "LessonSpine.tsx")) && /name="next-up"/.test(src(platesRoot, "src", "LessonSpine.tsx")), "one plate per beat");
  gates["EDU-H02"] = gate(/TypeCard/.test(blob) && /HeadDock/.test(blob), "type + docked head");
  gates["EDU-H03"] = gate(/#EFE7D6/.test(brand) && /#1A1A16/.test(brand), "ink/cream");
  gates["EDU-H04"] = gate(captions, "captions.json path");
  gates["EDU-H05"] = gate(/captions: \[/.test(rootTsx) && /startMs/.test(rootTsx), "word clock on each beat");
  gates["EDU-H06"] = gate(/durationSec: 10/.test(spine) && /durationSec: 6/.test(spine) && /durationSec: 7/.test(spine), "beats 6–10s");
  gates["EDU-H07"] = gate(!destExists || duration < 360, `${duration}s < 6:00`);
  gates["EDU-H08"] = gate(!destExists || duration < 720, `${duration}s < 12:00`);
  gates["EDU-H09"] = gate(/#C4A35A/.test(brand) && /GLIDE_FRAMES = 24/.test(math), "gold signal + glide/takeover");
  gates["EDU-H10"] = gate(/HeadDock/.test(blob) && /takeover/.test(spine) && /glide/.test(spine), "head + Khan-style motion");

  const hardFail = HARD.filter((id) => gates[id].status === "HARD_FAIL");
  const verdict = hardFail.length ? "HARD_FAIL" : "PASS";
  const ship = {
    1: {status: "HOLD", note: "no Cap take this fixture"},
    2: {status: destExists && Math.abs(duration - 41) <= 0.5 ? "PASS" : "HOLD", note: "spine beats cover 0…41s"},
    3: {status: gates["VOX-H02"].status === "PASS" ? "PASS" : "FAIL", note: "overlay lock"},
    4: {status: gates["VOX-H03"].status === "PASS" && gates["VOX-H04"].status === "PASS" ? "PASS" : "FAIL", note: "cream/ink/Fraunces + head"},
    5: {status: gates["VOX-H05"].status === "PASS" && gates["VOX-H06"].status === "PASS" ? "PASS" : "FAIL", note: "duration + Just locked"},
    6: {status: "HOLD", note: "HLS Ready / Publish held"},
  };
  const shipGreen = Object.values(ship).every((row) => row.status === "PASS");

  return {
    verdict,
    hold_cleaning: true,
    auto_flip: false,
    escalate: verdict === "HARD_FAIL",
    flip_refused: "checklist only — no live Cleaning / Publish / Distribute",
    order: ORDER_LOCK,
    dest,
    sha256: digest,
    expectedSha256: EXPECTED_SHA256,
    duration,
    hardFail,
    gates,
    ship,
    shipGreen,
    future_auto_flip:
      "Caller later: run this script; flip Cleaning only if exit 0 AND ship 1–6 all PASS. This package never flips.",
    exitCode: verdict === "PASS" ? 0 : 1,
  };
}

export function renderReport(result) {
  const gateLines = Object.entries(result.gates)
    .map(([id, row]) => `| \`${id}\` | ${row.status} | ${row.note} |`)
    .join("\n");
  const shipLines = Object.entries(result.ship)
    .map(([id, row]) => `| ${id} | ${row.status} | ${row.note} |`)
    .join("\n");
  return `# LessonSpine Cleaning checklist

Bar: [../docs/remotion-vox-standards.md](../docs/remotion-vox-standards.md). Do not invent a second bar.

**Checklist only. NO live Cleaning flip. NO Publish/Distribute.**

\`\`\`
verdict: ${result.verdict}
hold_cleaning: ${result.hold_cleaning}
auto_flip: ${result.auto_flip}
escalate: ${result.escalate}
rendering: ${result.dest}
sha256: ${result.sha256}
\`\`\`

Locked pedagogical order: ${result.order}

## Future auto-flip hook

\`node scripts/cleaning-checklist-lesson-spine.mjs --dest <dated-LessonSpine.mp4>\`

- exit **0** = antagonist HARD gates PASS
- exit **1** = HARD_FAIL — hold Cleaning
- This script **refuses** \`--flip\`. A later factory caller may flip Cleaning only when exit 0 **and** ship 1–6 are green. Publish/Distribute stays held.

## Ship 1–6

| # | Status | Note |
|---|---|---|
${shipLines}

Ship green: ${result.shipGreen}. Fixture has no Cap take and no HLS Ready, so Cleaning stays held even on antagonist PASS.

## HARD gates

| ID | Status | Note |
|---|---|---|
${gateLines}

## Held

No Cap take. No Just remake. No melt. No live Cleaning flip. No Publish/Distribute. No campus Remotion package. No family chrome. No \`bc-4765f2f0\`.
`;
}

function flag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return "";
  return args[i + 1] || "";
}

const invoked =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const args = process.argv.slice(2);
  if (args.includes("--flip")) {
    console.log(JSON.stringify({ok: false, error: "flip_refused", note: "no live Cleaning flip"}));
    process.exit(2);
  }
  const dest = flag(args, "--dest") || DEFAULT_DEST;
  const reportPath = flag(args, "--report") || join(PLATES_ROOT, "cleaning-checklist-lesson-spine.md");
  const result = runChecklist({dest});
  if (!args.includes("--no-write")) {
    writeFileSync(reportPath, renderReport(result));
  }
  console.log(
    JSON.stringify({
      verdict: result.verdict,
      hold_cleaning: result.hold_cleaning,
      auto_flip: result.auto_flip,
      exitCode: result.exitCode,
      dest: result.dest,
      sha256: result.sha256,
      hardFail: result.hardFail,
      report: args.includes("--no-write") ? null : reportPath,
    }),
  );
  process.exit(result.exitCode);
}
