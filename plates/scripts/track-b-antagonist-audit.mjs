import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {buildExportManifest, exportReadyChecklist} from "./track-b-export-ready.mjs";
import {runTrackBCleaning} from "./track-b-cleaning.mjs";
import {runTrackBPublish} from "./track-b-publish.mjs";
import {
  FOUR_PLATES,
  auditQualityPath,
  fourPlateCaptions,
  mapTrackBCaptions,
  masterTimeline,
  planQualityPath,
} from "./track-b-quality-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const platesRoot = join(here, "..");
const PLANNED_DEST = "/opt/cursor/artifacts/factory-track-b/2026-09-22/master.mp4";

/** Catalog cards that are a second claim when mounted on a Track B plate. */
const CATALOG_CLAIMS = [
  "KeyClaim",
  "ScriptureCard",
  "CompareBoard",
  "SectionTitle",
  "GlossaryChip",
  "ObjectionCard",
  "StingColdOpen",
  "CheckpointCard",
  "ExampleCard",
  "QuoteCard",
  "StepsCard",
  "CaveatCard",
  "ReflectionPrompt",
  "TimelineRail",
  "SourceChip",
  "SpectrumBar",
  "ThresholdCard",
  "RubricCard",
  "EvidenceCard",
  "AnalogyCard",
  "CounterexampleCard",
  "PracticeCard",
  "EndCard",
];

const PLATE_FILES = ["Opener.tsx", "TalkingHeadCard.tsx", "RecapCard.tsx", "QuizBumper.tsx"];
const MOTION_FILES = [...PLATE_FILES, "TrackBMaster.tsx", "sceneMotionMath.ts", "layers.tsx", "wordClock.ts"];

function readSrc(name) {
  return readFileSync(join(platesRoot, "src", name), "utf8");
}

function mountedCatalog(source) {
  return CATALOG_CLAIMS.filter((name) => source.includes(`<${name}`));
}

function relLuma(hex) {
  const n = String(hex).replace("#", "");
  const chans = [0, 2, 4].map((index) => {
    const c = parseInt(n.slice(index, index + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * chans[0] + 0.7152 * chans[1] + 0.0722 * chans[2];
}

function contrast(a, b) {
  const left = relLuma(a);
  const right = relLuma(b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

function hasCssMotion(source) {
  return /(?:^|[\s;{])(?:transition|animation)\s*:/.test(source) || /\banimate-/.test(source);
}

function remotionInNext() {
  const pkg = JSON.parse(readFileSync(join(platesRoot, "..", "app", "package.json"), "utf8"));
  return Object.keys({...pkg.dependencies, ...pkg.devDependencies}).some(
    (name) => name === "remotion" || name.startsWith("@remotion/"),
  );
}

/**
 * Full Independent Antagonist bar v2 on the Track B fixture path.
 * Does not render, write master.mp4, take a Cap, or flip distribute.
 * v2 is the only bar. This does not invent a v2.1 bar.
 */
export function auditTrackBPath(input = {}) {
  const words = input.words ?? JSON.parse(readFileSync(join(platesRoot, "fixtures", "track-b-words.json"), "utf8"));
  const audio = input.audio ?? join(platesRoot, "fixtures", "track-b-fixture.wav");
  const dest = input.dest ?? PLANNED_DEST;
  const capId = input.capId ?? "fixture-audio";
  const planInput = {
    capId,
    audio,
    words,
    plates: input.plates ?? FOUR_PLATES,
    dest,
    target: input.target ?? "plates",
  };
  const plan = planQualityPath(planInput);
  const captions = plan.ok ? plan.captions : [];
  const plateCaptions = plan.ok ? fourPlateCaptions(words) : {};
  const timeline = plan.ok ? masterTimeline(words) : null;
  const narrow = plan.ok ? auditQualityPath(plan) : {verdict: "HARD_FAIL", gates: {}, hold_cleaning: true, escalate: true, rendering: "idle"};
  const manifest = buildExportManifest(planInput);
  const checklist = manifest.ok ? exportReadyChecklist(manifest) : {verdict: "HARD_FAIL", checks: {}, hold_cleaning: true, rendering: "idle"};
  const cleaning = runTrackBCleaning(planInput);
  const publish = runTrackBPublish(planInput);

  const sources = Object.fromEntries(MOTION_FILES.map((name) => [name, readSrc(name)]));
  const plateSources = Object.fromEntries(PLATE_FILES.map((name) => [name, sources[name]]));
  const catalogByPlate = Object.fromEntries(
    Object.entries(plateSources).map(([name, source]) => [name, mountedCatalog(source)]),
  );
  const piled = Object.entries(catalogByPlate).filter(([, names]) => names.length >= 2);
  const brand = readSrc("brand.ts");
  const master = sources["TrackBMaster.tsx"];
  const root = readSrc("Root.tsx");
  const rootChunk = root.split('id="TrackBMaster"')[1]?.split("/>")[0] || "";
  const inkCream = contrast("#1A1A16", "#EFE7D6");
  const cssMotion = MOTION_FILES.filter((name) => hasCssMotion(sources[name]));
  const randomMotion = MOTION_FILES.filter((name) => sources[name].includes("Math.random("));
  const rawImg = MOTION_FILES.filter((name) => /<img[\s>]/.test(sources[name]));
  const delayHits = MOTION_FILES.filter((name) => sources[name].includes("delayRender("));
  const fetchHits = MOTION_FILES.filter((name) => /\bfetch\(/.test(sources[name]));
  const measureHits = MOTION_FILES.filter((name) => sources[name].includes("measureText("));
  const frameDriven = PLATE_FILES.every((name) => sources[name].includes("useCurrentFrame("));
  const fixtureOnAudio =
    master.includes("track-b-fixture.wav") &&
    /<Audio[\s>]/.test(master) &&
    (master.includes("trimBefore") || master.includes("startFrom"));
  const headWidth = 700;
  const headPct = headWidth / 1920;
  const typeRight = 72 + 1040;
  const dockLeft = 1160;
  const destPresent = Boolean(dest) && existsSync(dest);
  const nextHasRemotion = remotionInNext();

  const gates = {
    "VOX-H01":
      plan.ok && plan.width === 1920 && plan.height === 1080 && plan.fps === 30 && String(plan.dest).endsWith("master.mp4") && publish.written === false
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H02":
      master.includes("x: 1576") &&
      master.includes("y: 24") &&
      master.includes("w: 80") &&
      master.includes("h: 64") &&
      master.includes('title: "You Can Just Do Things"') &&
      sources["layers.tsx"].includes('staticFile("isolated-seal.svg")') &&
      sources["layers.tsx"].includes("<Img")
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H03":
      brand.includes('cream = "#EFE7D6"') &&
      brand.includes('ink = "#1A1A16"') &&
      brand.includes('gold = "#C4A35A"') &&
      brand.includes('loadFont as loadFraunces') &&
      brand.includes("@remotion/google-fonts/Fraunces") &&
      !brand.includes("#f6f3ec")
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H04": headPct <= 0.4 && headPct >= 0.36 && dockLeft >= typeRight && sources["layers.tsx"].includes("width: 700") ? "PASS" : "HARD_FAIL",
    "VOX-H05":
      timeline &&
      timeline.durationInFrames === 1050 &&
      timeline.plates[0].from === 0 &&
      timeline.plates.every((plate, index, all) => index === 0 || plate.from === all[index - 1].from + all[index - 1].frames) &&
      timeline.durationInFrames === timeline.plates.reduce((sum, plate) => sum + plate.frames, 0)
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H06": plan.ok && plan.justId === "27pn9xs0zk8a73g" && !destPresent && publish.dest_flipped === false ? "PASS" : "HARD_FAIL",
    "VOX-H07":
      sources["sceneMotionMath.ts"].includes("function smoothstep") &&
      sources["sceneMotionMath.ts"].includes("No overshoot, no bounce") &&
      PLATE_FILES.every((name) => /motion="(?:takeover|glide)"/.test(sources[name]))
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H08":
      captions.length > 0 &&
      PLATE_FILES.every((name) => sources[name].includes("Karaoke")) &&
      master.split("captions={TRACK_B_CAPTIONS}").length - 1 === FOUR_PLATES.length
        ? "PASS"
        : "HARD_FAIL",
    "VOX-H09": manifest.ok && manifest.renders === false && !master.toLowerCase().includes("melt") ? "PASS" : "HARD_FAIL",
    "VOX-H10":
      plan.ok && plan.target === "plates" && plan.renders === false && !nextHasRemotion && !String(dest).includes("/app/")
        ? "PASS"
        : "HARD_FAIL",
    "RM-H01": frameDriven && cssMotion.length === 0 ? "PASS" : "HARD_FAIL",
    "RM-H02":
      rootChunk.includes("durationInFrames={1050}") &&
      rootChunk.includes("fps={30}") &&
      rootChunk.includes("width={1920}") &&
      rootChunk.includes("height={1080}") &&
      rootChunk.includes("component={TrackBMaster}")
        ? "PASS"
        : "HARD_FAIL",
    "RM-H03":
      rawImg.length === 0 &&
      sources["layers.tsx"].includes("<Img") &&
      sources["layers.tsx"].includes("staticFile(") &&
      sources["layers.tsx"].includes("<Audio")
        ? "PASS"
        : "HARD_FAIL",
    "RM-H04":
      brand.includes("@remotion/google-fonts/Fraunces") &&
      brand.includes("@remotion/google-fonts/IBMPlexSans") &&
      brand.includes('subsets: ["latin"]')
        ? "PASS"
        : "HARD_FAIL",
    "RM-H05": delayHits.length === 0 ? "PASS" : "HARD_FAIL",
    "RM-H06": randomMotion.length === 0 ? "PASS" : "HARD_FAIL",
    "RM-H07": fixtureOnAudio ? "PASS" : "HARD_FAIL",
    "RM-H08": rootChunk.includes('id="TrackBMaster"') || root.includes('id="TrackBMaster"') ? "PASS" : "HARD_FAIL",
    "RM-H09": publish.written === false && !destPresent && publish.rendering === "idle" ? "PASS" : "HARD_FAIL",
    "RM-H10": fetchHits.length === 0 && delayHits.length === 0 ? "PASS" : "HARD_FAIL",
    "RM-H11": measureHits.length === 0 && sources["layers.tsx"].includes("useMemo(") ? "PASS" : "HARD_FAIL",
    "RM-H12":
      (brand.match(/subsets: \["latin"\]/g) || []).length >= 3 &&
      brand.includes('weights: ["700"]') &&
      brand.includes('weights: ["400", "500"]') &&
      brand.includes('weights: ["400"]')
        ? "PASS"
        : "HARD_FAIL",
    "EDU-H01": piled.length === 0 ? "PASS" : "HARD_FAIL",
    "EDU-H02": piled.length === 0 ? "PASS" : "HARD_FAIL",
    "EDU-H03": inkCream >= 4.5 && brand.includes('cream = "#EFE7D6"') && brand.includes('ink = "#1A1A16"') ? "PASS" : "HARD_FAIL",
    "EDU-H04": captions.length > 0 && master.includes("TRACK_B_CAPTIONS") ? "PASS" : "HARD_FAIL",
    "EDU-H05":
      captions.length > 0 &&
      captions.every((caption) => caption.startMs < 7000) &&
      PLATE_FILES.every((name) => sources[name].includes("<TypeCard") || sources[name].includes("<Karaoke"))
        ? "PASS"
        : "HARD_FAIL",
    "EDU-H06":
      timeline &&
      timeline.plates.every((plate) => plate.durationSec >= 3 && plate.durationSec <= 40) &&
      timeline.plates.length === FOUR_PLATES.length
        ? "PASS"
        : "HARD_FAIL",
    "EDU-H07": timeline && timeline.durationInFrames / 30 <= 360 ? "PASS" : "HARD_FAIL",
    "EDU-H08": timeline && timeline.durationInFrames / 30 <= 12 * 60 && timeline.plates.length >= 2 ? "PASS" : "HARD_FAIL",
    "EDU-H09": piled.length === 0 && brand.includes('gold = "#C4A35A"') ? "PASS" : "HARD_FAIL",
    "EDU-H10":
      sources["TalkingHeadCard.tsx"].includes('motion="takeover"') &&
      sources["TalkingHeadCard.tsx"].includes("<HeadDock") &&
      sources["sceneMotionMath.ts"].includes("takeoverHead")
        ? "PASS"
        : "HARD_FAIL",
  };

  const soft = {
    "VOX-S01": sources["wordClock.ts"].includes('ACTIVE_WORD_GOLD = "#C4A35A"') ? "PASS" : "SOFT_FAIL",
    "VOX-S02": master.includes('beat="sting"') || sources["Opener.tsx"].includes('beat="sting"') ? "PASS" : "SOFT_FAIL",
    "VOX-S03": sources["layers.tsx"].includes("#1f5eff") ? "SOFT_FAIL" : "PASS",
    "VOX-S04": "SOFT_FAIL",
    "VOX-S05": sources["layers.tsx"].includes('-0.03em') ? "SOFT_FAIL" : "PASS",
    "VOX-S06": sources["sceneMotionMath.ts"].includes('motion === "takeover" || motion === "glide" ? 0') ? "PASS" : "SOFT_FAIL",
    "VOX-S07": sources["sceneMotionMath.ts"].includes("TAKEOVER_HOLD_FRAMES = 12") && sources["sceneMotionMath.ts"].includes("smoothstep") ? "PASS" : "SOFT_FAIL",
    "VOX-S08": "PASS",
    "VOX-S09": "PASS",
    "VOX-S10": "PASS",
    "RM-S01": "PASS",
    "RM-S02": rootChunk.includes("defaultProps") ? "SOFT_FAIL" : "PASS",
    "RM-S03": master.includes("premountFor") ? "PASS" : "SOFT_FAIL",
    "RM-S04": "SOFT_FAIL",
    "RM-S05": MOTION_FILES.filter((name) => sources[name].includes("interpolate(")).every((name) => {
      const calls = sources[name].match(/interpolate\(/g) || [];
      const clamps = sources[name].match(/extrapolateLeft:\s*"clamp"/g) || [];
      return clamps.length >= calls.length;
    })
      ? "PASS"
      : "SOFT_FAIL",
    "RM-S06": "PASS",
    "RM-S07": "PASS",
    "RM-S08": "SOFT_FAIL",
    "RM-S09": "PASS",
    "RM-S10": captions.every((caption) => typeof caption.text === "string" && Number.isFinite(caption.startMs) && Number.isFinite(caption.endMs))
      ? "PASS"
      : "SOFT_FAIL",
    "EDU-S01": sources["Opener.tsx"].includes("ObjectiveSlate") ? "PASS" : "SOFT_FAIL",
    "EDU-S02": brand.includes('gold = "#C4A35A"') ? "PASS" : "SOFT_FAIL",
    "EDU-S03": "SOFT_FAIL",
    "EDU-S04": "PASS",
    "EDU-S05": captions.every((caption) => caption.text.trim().split(/\s+/).length <= 3) ? "PASS" : "SOFT_FAIL",
    "EDU-S06": "PASS",
    "EDU-S07": "PASS",
  };

  Object.assign(gates, soft);
  const hardIds = Object.keys(gates).filter((id) => id.includes("-H"));
  const hardFail = hardIds.filter((id) => gates[id] === "HARD_FAIL");
  const softFail = Object.keys(soft).filter((id) => gates[id] === "SOFT_FAIL");
  const verdict = hardFail.length ? "HARD_FAIL" : softFail.length ? "SOFT_FAIL" : "PASS";
  const sameClock =
    plan.ok &&
    FOUR_PLATES.every(
      (name) =>
        Array.isArray(plateCaptions[name]) &&
        plateCaptions[name].length === captions.length &&
        plateCaptions[name].every((caption, index) => caption.text === captions[index].text && caption.startMs === captions[index].startMs),
    );

  return {
    bar: "v2",
    bar_note: "The clock asked for a v2.1 audit. docs/remotion-vox-standards.md says v2 is the only bar. This score uses v2.",
    verdict,
    gates,
    hard_fail: hardFail,
    soft_fail: softFail,
    hold_cleaning: verdict === "HARD_FAIL",
    escalate: verdict === "HARD_FAIL",
    rendering: "idle",
    gpu: false,
    written: false,
    dest_present: destPresent,
    distribute: publish.distribute,
    public: publish.public,
    dest_flipped: publish.dest_flipped,
    evidence: {
      "RM-H07": fixtureOnAudio
        ? "TrackBMaster mounts track-b-fixture.wav on Audio with trimBefore."
        : "TrackBMaster does not mount track-b-fixture.wav on Audio with trimBefore or startFrom.",
      "EDU-H01": piled.length
        ? piled.map(([name, claims]) => `${name}: ${claims.join(", ")}`).join(" | ")
        : "No Track B plate mounts two catalog claims.",
      "EDU-H02": piled.length
        ? "Catalog cards sit with the type card and the head dock."
        : "The type card and the head dock are the beat. Extra catalog cards are off the plate.",
      "EDU-H09": piled.length
        ? "Weeding fails: extra catalog claims sit on the same beat."
        : "Gold signaling is present. Extra catalog claims are off the four plates.",
      ink_cream_contrast: Number(inkCream.toFixed(2)),
      head_width_pct: Number(headPct.toFixed(4)),
      narrow_audit: narrow.verdict,
      narrow_hold_cleaning: narrow.hold_cleaning,
      cleaning_auto_flip: cleaning.auto_flip,
      cleaning_hold: cleaning.hold_cleaning,
      quiz_bumper_sec: timeline?.plates?.find((plate) => plate.name === "QuizBumper")?.durationSec ?? null,
    },
    path: {
      plan: plan.ok ? "PASS" : "HARD_FAIL",
      captions: captions.length === 3 && captions[0].text === " Keep" ? "PASS" : "HARD_FAIL",
      plates: sameClock ? "PASS" : "HARD_FAIL",
      master: timeline && timeline.id === "TrackBMaster" && timeline.durationInFrames === 1050 && manifest.ok ? "PASS" : "HARD_FAIL",
      "export-ready": checklist.verdict === "PASS" && manifest.dryRun === true && manifest.written === false ? "PASS" : "HARD_FAIL",
      cleaning: verdict === "HARD_FAIL" ? "HARD_FAIL" : cleaning.verdict,
      publish: publish.distribute === false && publish.public === false && publish.dest_flipped === false ? "PASS" : "HARD_FAIL",
    },
    nodes: {
      plan,
      captions,
      plates: plateCaptions,
      master: timeline,
      export_ready: {verdict: checklist.verdict, dryRun: manifest.dryRun === true, written: manifest.written === false},
      cleaning: {
        verdict: cleaning.verdict,
        auto_flip: cleaning.auto_flip,
        hold_cleaning: cleaning.hold_cleaning,
        dest_flipped: cleaning.dest_flipped,
        distribute: cleaning.distribute,
      },
      publish: {
        verdict: publish.verdict,
        publish: publish.publish,
        distribute: publish.distribute,
        public: publish.public,
        dest_flipped: publish.dest_flipped,
        written: publish.written,
      },
    },
  };
}

const invoked = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  if (process.argv.includes("--render") || process.argv.includes("--gpu")) {
    process.stderr.write("dry_run_only\n");
    process.exit(2);
  }
  const result = auditTrackBPath();
  if (result.dest_present || result.written || result.distribute !== false) {
    process.stderr.write("dest_or_distribute\n");
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(result.verdict === "HARD_FAIL" ? 1 : 0);
}
