import {existsSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {runTrackBCleaning} from "./track-b-cleaning.mjs";

/**
 * Publish evidence for a cleaned export-ready Track B master.
 * distribute stays false. No public flip. No render. No dest write.
 */
export function runTrackBPublish(input = {}) {
  if (input.distribute === true || input.public === true) {
    return {
      ok: false,
      verdict: "HARD_FAIL",
      publish: "HELD",
      distribute: false,
      public: false,
      dest_flipped: false,
      rendering: "idle",
      gpu: false,
      written: false,
      error: "distribute_held",
      exitCode: 1,
    };
  }
  const cleaning = runTrackBCleaning(input);
  const dest = cleaning.dest || "";
  const passed =
    cleaning.verdict === "PASS" &&
    cleaning.auto_flip === true &&
    cleaning.hold_cleaning === false &&
    cleaning.dest_flipped === false &&
    cleaning.antagonist === "PASS" &&
    (!dest || !existsSync(dest));
  return {
    ok: passed,
    verdict: passed ? "PASS" : "HARD_FAIL",
    publish: passed ? "PASS" : "HELD",
    distribute: false,
    public: false,
    dest_flipped: false,
    rendering: "idle",
    gpu: false,
    written: false,
    error: passed ? "" : cleaning.error || "cleaning",
    compositionId: cleaning.compositionId || "",
    durationInFrames: cleaning.durationInFrames || 0,
    plateOrder: cleaning.plateOrder || [],
    dest,
    cleaning: cleaning.verdict,
    antagonist: cleaning.antagonist || "HARD_FAIL",
    exitCode: passed ? 0 : 1,
  };
}

const invoked = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const args = process.argv.slice(2);
  const refused = args.includes("--distribute") || args.includes("--public") || args.includes("--flip-dest") || args.includes("--render");
  const result = refused ? runTrackBPublish({distribute: true}) : runTrackBPublish();
  if (result.dest && existsSync(result.dest)) {
    process.stderr.write("dest_present\n");
    process.exit(1);
  }
  if (result.distribute !== false) {
    process.stderr.write("distribute_held\n");
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(result.exitCode);
}
