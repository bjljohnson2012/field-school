#!/usr/bin/env node
/**
 * Narrow play-rail Cleaning auto-flip.
 * Flips hold_cleaning for the locked LessonSpine master on /play/lesson-spine
 * only after checklist PASS + dest sha256 af374d95… + destAllowed.
 * Does not mutate the source dest file.
 * Does not change cleaning-checklist-lesson-spine.mjs --flip (still exit 2).
 * Does not change cleaningAutoFlipReady (still false when shipGreen is false).
 * Does not Distribute.
 */
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {runChecklist} from "./cleaning-checklist-lesson-spine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const PLATES_ROOT = join(here, "..");
export const PLAY_RAIL_LOCKED_DEST =
  "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
export const PLAY_RAIL_LOCKED_SHA256 =
  "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
export const LOCKED_JUST_ID = "27pn9xs0zk8a73g";
export const LOCKED_AUG30 = "vox/everything-made-up.mp4";

export function destAllowed(dest) {
  const value = String(dest || "");
  if (!value.trim()) return false;
  return !value.includes(LOCKED_JUST_ID) && !value.includes(LOCKED_AUG30);
}

export function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function playRailCleaningAutoFlipReady({
  checklistExit,
  destSha256,
  destOk,
  lockedSha256 = PLAY_RAIL_LOCKED_SHA256,
}) {
  return checklistExit === 0 && destOk === true && destSha256 === lockedSha256;
}

export function runPlayRailAutoFlip({
  dest = PLAY_RAIL_LOCKED_DEST,
  platesRoot = PLATES_ROOT,
  checklist,
} = {}) {
  const destOk = destAllowed(dest);
  const destExists = existsSync(dest);
  const digest = destExists ? sha256File(dest) : "";
  const scored =
    checklist ||
    runChecklist({
      dest,
      platesRoot,
    });
  const ready = playRailCleaningAutoFlipReady({
    checklistExit: scored.exitCode,
    destSha256: digest,
    destOk,
  });
  const refuseReason = !destOk
    ? "dest_not_allowed"
    : !destExists
      ? "dest_missing"
      : digest !== PLAY_RAIL_LOCKED_SHA256
        ? "dest_sha_mismatch"
        : scored.verdict !== "PASS" || scored.exitCode !== 0
          ? "checklist_not_pass"
          : null;
  return {
    ok: ready,
    scope: "play-rail",
    hold_cleaning: !ready,
    auto_flip: ready,
    distribute: false,
    launch: "CLOSED 0/8",
    dest,
    sha256: digest,
    expectedSha256: PLAY_RAIL_LOCKED_SHA256,
    destAllowed: destOk,
    checklistExit: scored.exitCode,
    checklistVerdict: scored.verdict,
    source_dest_untouched: true,
    refuseReason,
    note: ready
      ? "play-rail hold_cleaning false after checklist PASS on locked dest af374d95"
      : `play-rail auto-flip refused: ${refuseReason}`,
    exitCode: ready ? 0 : 2,
  };
}

export function renderPlayRailFlipReport(result) {
  return `# LessonSpine play-rail Cleaning auto-flip

Narrow factory caller. Global \`cleaning-checklist-lesson-spine.mjs --flip\` stays refused (exit 2).
\`cleaningAutoFlipReady({checklistExit:0, shipGreen:false, holdCleaning:true})\` stays **false**.

**PASS-only.** dest sha256 must be \`${PLAY_RAIL_LOCKED_SHA256}\`. destAllowed. No Just. No Aug 30. No Distribute.

\`\`\`
ok: ${result.ok}
scope: ${result.scope}
hold_cleaning: ${result.hold_cleaning}
auto_flip: ${result.auto_flip}
distribute: ${result.distribute}
launch: ${result.launch}
dest: ${result.dest}
sha256: ${result.sha256}
checklistVerdict: ${result.checklistVerdict}
refuseReason: ${result.refuseReason || "none"}
source_dest_untouched: ${result.source_dest_untouched}
\`\`\`

${result.note}

Master source dest file is **untouched**. Priors untouched. Launch stays **CLOSED**, **0/8**.
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
  if (args.includes("--distribute")) {
    console.log(JSON.stringify({ok: false, error: "distribute_held", note: "Distribute HELD"}));
    process.exit(2);
  }
  const dest = flag(args, "--dest") || PLAY_RAIL_LOCKED_DEST;
  const reportPath =
    flag(args, "--report") || join(PLATES_ROOT, "cleaning-auto-flip-play-rail.md");
  const jsonPath =
    flag(args, "--json") || join(PLATES_ROOT, "cleaning-auto-flip-play-rail.json");
  const result = runPlayRailAutoFlip({dest});
  if (!args.includes("--no-write")) {
    writeFileSync(reportPath, renderPlayRailFlipReport(result));
    writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  }
  console.log(
    JSON.stringify({
      ok: result.ok,
      scope: result.scope,
      hold_cleaning: result.hold_cleaning,
      auto_flip: result.auto_flip,
      distribute: result.distribute,
      dest: result.dest,
      sha256: result.sha256,
      refuseReason: result.refuseReason,
      report: args.includes("--no-write") ? null : reportPath,
    }),
  );
  process.exit(result.exitCode);
}
