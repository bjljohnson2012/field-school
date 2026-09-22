import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {buildExportManifest, exportReadyChecklist} from "./track-b-export-ready.mjs";

/**
 * Cleaning for an export-ready Track B master.
 * Auto PASS/FAIL from the fixture checklist. Flips Cleaning only when that checklist passes.
 * Does not render, write master.mp4, flip dest, take a Cap, or touch Just.
 */
export function runTrackBCleaning(input = {}) {
  const manifest = buildExportManifest(input);
  const checklist = manifest.ok ? exportReadyChecklist(manifest) : {verdict: "HARD_FAIL", checks: {}, rendering: "idle", hold_cleaning: true};
  const dest = manifest.dest || input.dest || "";
  const destPresent = Boolean(dest) && existsSync(dest);
  const passed =
    manifest.ok === true &&
    checklist.verdict === "PASS" &&
    manifest.dryRun === true &&
    manifest.gpu === false &&
    manifest.renders === false &&
    manifest.written === false &&
    manifest.antagonist === "PASS" &&
    !destPresent;
  return {
    ok: passed,
    verdict: passed ? "PASS" : "HARD_FAIL",
    hold_cleaning: !passed,
    auto_flip: passed,
    dest_flipped: false,
    distribute: "HELD",
    publish: "HELD",
    rendering: "idle",
    gpu: false,
    error: passed ? "" : manifest.error || (destPresent ? "dest_present" : "checklist"),
    compositionId: manifest.compositionId || "",
    durationInFrames: manifest.durationInFrames || 0,
    plateOrder: manifest.plateOrder || [],
    dest,
    written: false,
    antagonist: manifest.antagonist || "HARD_FAIL",
    checklist: checklist.verdict,
    exitCode: passed ? 0 : 1,
  };
}

const invoked = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const args = process.argv.slice(2);
  const force = args.includes("--render") || args.includes("--gpu") || args.includes("--flip-dest");
  const result = force ? runTrackBCleaning({render: true}) : runTrackBCleaning();
  if (result.dest && existsSync(result.dest)) {
    process.stderr.write("dest_present\n");
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(result.exitCode);
}
