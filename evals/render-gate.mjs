import {spawnSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const tokensPath = join(root, "video-pipeline/remotion/src/brand/tokens.ts");
const master = process.argv[2] ?? "/opt/cursor/artifacts/lesson-flow-60-1080p.mp4";
const stills = {
  "00-03": process.argv[3] ?? "/opt/cursor/artifacts/lesson-flow-60-still-00-03.png",
  "00-15": process.argv[4] ?? "/opt/cursor/artifacts/lesson-flow-60-still-00-15.png",
  "00-30": process.argv[5] ?? "/opt/cursor/artifacts/lesson-flow-60-still-00-30.png",
  "00-45": process.argv[6] ?? "/opt/cursor/artifacts/lesson-flow-60-still-00-45.png",
};

const tokens = readFileSync(tokensPath, "utf8");
function token(name) {
  const match = tokens.match(new RegExp(`export const ${name} = "(#[0-9a-fA-F]{6})"`));
  if (!match) {
    throw new Error(`missing token ${name}`);
  }
  return match[1].toLowerCase();
}

const navy = token("navy");
const paper = token("paper");
const ink = token("ink");
const captionBg = token("captionBg");
const captionFg = token("captionFg");
const captionActive = token("captionActive");

const report = {pass: true, checks: {}};

function fail(name, detail) {
  report.pass = false;
  report.checks[name] = {pass: false, ...detail};
}

function ok(name, detail) {
  report.checks[name] = {pass: true, ...detail};
}

function hex(value) {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function lin(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function lum(rgb) {
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

function contrast(a, b) {
  const L1 = lum(hex(a));
  const L2 = lum(hex(b));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

function run(cmd, args, binary = false) {
  const result = spawnSync(cmd, args, binary ? {maxBuffer: 256 * 1024 * 1024} : {encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
  if (result.status !== 0) {
    const err = binary ? result.stderr?.toString?.() : result.stderr;
    throw new Error(`${cmd} ${args.join(" ")}\n${err}`);
  }
  return binary ? result.stdout : {stdout: result.stdout, stderr: result.stderr};
}

const activeContrast = contrast(captionActive, captionBg);
const idleContrast = contrast(captionFg, captionBg);
if (activeContrast < 4.5 || idleContrast < 4.5) {
  fail("captionContrast", {activeContrast, idleContrast, captionBg, captionFg, captionActive});
} else if (captionActive.toLowerCase() === "#1e4e8c" || captionFg.toLowerCase() === "#1e4e8c") {
  fail("captionContrast", {reason: "blue caption color"});
} else {
  ok("captionContrast", {activeContrast: Number(activeContrast.toFixed(2)), idleContrast: Number(idleContrast.toFixed(2))});
}

const probe = JSON.parse(run("ffprobe", [
  "-v", "error",
  "-show_entries", "stream=codec_type,color_space,color_transfer,color_primaries",
  "-of", "json",
  master,
]).stdout);
const video = (probe.streams ?? []).find((stream) => stream.codec_type === "video");
const bt709 = video && video.color_space === "bt709" && video.color_transfer === "bt709" && video.color_primaries === "bt709";
if (!bt709) {
  fail("bt709", {video});
} else {
  ok("bt709", {color: "bt709"});
}

const ebur = run("ffmpeg", ["-hide_banner", "-nostats", "-i", master, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
const summary = ebur.split("Summary:").pop() ?? "";
const integrated = Number((summary.match(/I:\s+(-?\d+(?:\.\d+)?)/) ?? [])[1]);
const truePeak = Number((summary.match(/Peak:\s+(-?\d+(?:\.\d+)?)/) ?? [])[1]);
if (!Number.isFinite(integrated) || integrated < -17 || integrated > -15 || !Number.isFinite(truePeak) || truePeak > -1) {
  fail("loudness", {integrated, truePeak, target: -16});
} else {
  ok("loudness", {integrated, truePeak});
}

const silence = run("ffmpeg", ["-hide_banner", "-nostats", "-i", master, "-af", "silencedetect=noise=-36dB:d=2.5", "-f", "null", "-"]).stderr;
const gaps = [...silence.matchAll(/silence_duration: ([0-9.]+)/g)].map((match) => Number(match[1]));
if (gaps.some((gap) => gap > 2.5)) {
  fail("deadAir", {gaps});
} else {
  ok("deadAir", {gaps});
}

const frames = run("ffmpeg", [
  "-hide_banner", "-nostats", "-i", master,
  "-vf", "fps=30,scale=48:27,format=gray",
  "-f", "rawvideo", "-pix_fmt", "gray", "-",
], true);
const frameBytes = 48 * 27;
const frameCount = Math.floor(frames.length / frameBytes);
function frameDiff(a, b) {
  let total = 0;
  for (let i = 0; i < frameBytes; i++) {
    total += Math.abs(frames[a * frameBytes + i] - frames[b * frameBytes + i]);
  }
  return total / frameBytes;
}
const flashes = [];
for (let i = 1; i < frameCount - 1; i++) {
  const prev = frameDiff(i, i - 1);
  const next = frameDiff(i, i + 1);
  const span = frameDiff(i - 1, i + 1);
  if (prev > 28 && next > 28 && span < 10) {
    flashes.push(i);
  }
}
if (flashes.length) {
  fail("oneFrameJumps", {flashes: flashes.slice(0, 12), count: flashes.length});
} else {
  ok("oneFrameJumps", {frames: frameCount});
}

function pngRgb(path) {
  return run("ffmpeg", ["-hide_banner", "-nostats", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], true);
}

const banned = [hex("#C4A35A"), hex("#6B7F4F"), hex("#0b1f3a")];
const navyRgb = hex(navy);
const paperRgb = hex(paper);
const inkRgb = hex(ink);

function paletteOf(path) {
  const rgb = pngRgb(path);
  const pixels = rgb.length / 3;
  let navyHits = 0;
  let paperHits = 0;
  let bannedHits = 0;
  let blueHits = 0;
  for (let i = 0; i < rgb.length; i += 3) {
    const px = [rgb[i], rgb[i + 1], rgb[i + 2]];
    if (dist(px, navyRgb) < 38) navyHits++;
    if (dist(px, paperRgb) < 30 || dist(px, inkRgb) < 28) paperHits++;
    if (banned.some((color) => dist(px, color) < 16)) bannedHits++;
    if (dist(px, hex("#1e4e8c")) < 18 && px[2] > px[0] + 30) blueHits++;
  }
  return {
    navyShare: navyHits / pixels,
    brandShare: (navyHits + paperHits) / pixels,
    bannedShare: bannedHits / pixels,
    blueShare: blueHits / pixels,
  };
}

const palette = {};
for (const [id, path] of Object.entries(stills)) {
  palette[id] = paletteOf(path);
}
const paletteBad = ["00-30", "00-45"].some((id) => palette[id].navyShare < 0.35)
  || Object.values(palette).some((item) => item.bannedShare > 0.01);
if (paletteBad) {
  fail("palette", palette);
} else {
  ok("palette", palette);
}

const faceScript = `
import cv2, sys
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
ok = True
for path in sys.argv[1:]:
    img = cv2.imread(path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, 1.08, 4, minSize=(48, 48))
    print(path, len(faces))
    if len(faces) < 1:
        ok = False
sys.exit(0 if ok else 1)
`;
const python = [process.env.FACE_PYTHON, "/tmp/cv/bin/python", "python3"].find((bin) => bin && (bin === "python3" || existsSync(bin)));
const face = spawnSync(python, ["-c", faceScript, stills["00-03"], stills["00-15"]], {encoding: "utf8"});
if (face.status !== 0) {
  fail("face", {stdout: face.stdout, stderr: face.stderr});
} else {
  ok("face", {stdout: face.stdout.trim()});
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
