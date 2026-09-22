import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {FOUR_PLATES, auditQualityPath, planQualityPath} from "./track-b-quality-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const platesRoot = join(here, "..");

const PLANNED_DEST = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

function compositionMatches(timeline) {
  const master = readFileSync(join(platesRoot, "src", "TrackBMaster.tsx"), "utf8");
  const root = readFileSync(join(platesRoot, "src", "Root.tsx"), "utf8");
  if (master.includes("DefinitionBoard")) return false;
  let cursor = 0;
  for (const plate of timeline.plates) {
    const marker = `from={${plate.from}} durationInFrames={${plate.frames}} name="${plate.name}"`;
    const at = master.indexOf(marker);
    if (at < cursor) return false;
    cursor = at;
  }
  if ((master.match(/captions=\{TRACK_B_CAPTIONS\}/g) || []).length !== FOUR_PLATES.length) return false;
  const chunk = root.split('id="TrackBMaster"')[1]?.split("/>")[0] || "";
  return (
    chunk.includes("component={TrackBMaster}") &&
    chunk.includes(`durationInFrames={${timeline.durationInFrames}}`) &&
    chunk.includes(`fps={${timeline.fps}}`) &&
    chunk.includes(`width={${timeline.width}}`) &&
    chunk.includes(`height={${timeline.height}}`)
  );
}

/**
 * Dry-run export checklist. Proves TrackBMaster is render-ready from fixtures.
 * Does not render. Does not write master.mp4. Does not take a Cap.
 */
export function buildExportManifest(input = {}) {
  if (input.render === true || input.gpu === true) return {ok: false, error: "dry_run_only"};
  const words = input.words ?? JSON.parse(readFileSync(join(platesRoot, "fixtures", "track-b-words.json"), "utf8"));
  const audio = input.audio ?? join(platesRoot, "fixtures", "track-b-fixture.wav");
  const dest = input.dest ?? PLANNED_DEST;
  const plan = planQualityPath({
    capId: input.capId ?? "fixture-audio",
    audio,
    words,
    plates: input.plates ?? FOUR_PLATES,
    dest,
    target: input.target ?? "plates",
  });
  if (!plan.ok) return plan;
  if (!compositionMatches(plan.timeline)) return {ok: false, error: "composition_mismatch"};
  const audit = auditQualityPath(plan);
  if (audit.verdict !== "PASS") return {ok: false, error: "antagonist", audit};
  return {
    ok: true,
    ready: true,
    dryRun: true,
    gpu: false,
    renders: false,
    written: false,
    compositionId: plan.timeline.id,
    width: plan.width,
    height: plan.height,
    fps: plan.fps,
    durationInFrames: plan.timeline.durationInFrames,
    durationSec: plan.timeline.durationInFrames / plan.fps,
    plateOrder: plan.timeline.plates.map((plate) => plate.name),
    plates: plan.timeline.plates.map((plate) => ({
      name: plate.name,
      component: plate.component,
      from: plate.from,
      frames: plate.frames,
      durationSec: plate.durationSec,
    })),
    captionCount: plan.captions.length,
    audio: plan.audio,
    dest: plan.dest,
    target: plan.target,
    antagonist: audit.verdict,
  };
}

/** Manifest, duration, and plate order. One miss is not export-ready. */
export function exportReadyChecklist(manifest) {
  const checks = {
    manifest:
      manifest?.ok === true &&
      manifest.ready === true &&
      manifest.dryRun === true &&
      manifest.gpu === false &&
      manifest.renders === false &&
      manifest.written === false &&
      manifest.compositionId === "TrackBMaster" &&
      manifest.antagonist === "PASS" &&
      manifest.target === "plates",
    duration:
      manifest?.durationInFrames === 1050 &&
      manifest?.durationSec === 35 &&
      manifest?.fps === 30 &&
      manifest?.width === 1920 &&
      manifest?.height === 1080,
    plateOrder: Array.isArray(manifest?.plateOrder) && manifest.plateOrder.every((name, index) => name === FOUR_PLATES[index]) && manifest.plateOrder.length === FOUR_PLATES.length,
  };
  const hard = Object.values(checks).some((pass) => !pass);
  return {
    verdict: hard ? "HARD_FAIL" : "PASS",
    checks,
    hold_cleaning: true,
    rendering: "idle",
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv.includes("--render") || process.argv.includes("--gpu")) {
    process.stderr.write("dry_run_only\n");
    process.exit(2);
  }
  const manifest = buildExportManifest();
  if (!manifest.ok || existsSync(manifest.dest)) {
    process.stderr.write(`${manifest.error || "dest_written"}\n`);
    process.exit(1);
  }
  const checklist = exportReadyChecklist(manifest);
  process.stdout.write(`${JSON.stringify({manifest, checklist})}\n`);
  process.exit(checklist.verdict === "PASS" ? 0 : 1);
}
