import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const motionPath = join(here, "..", "src", "sceneMotionMath.ts");

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

function smoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function glideCard(frame, frames = 24) {
  const t = smoothstep(frame / frames);
  return {x: (1 - t) * -140, opacity: t};
}

function takeoverHead(frame, hold = 12, ease = 18) {
  if (frame < hold) return {opacity: 0, x: 120, cardOwns: true};
  const t = smoothstep((frame - hold) / ease);
  return {opacity: t, x: (1 - t) * 120, cardOwns: false};
}

function lumaVeil(nowSec, sceneIn, sceneOut, duration = 0.5, motion) {
  const into = nowSec - sceneIn;
  const remain = sceneOut - nowSec;
  const inDur = motion === "takeover" || motion === "glide" ? 0 : duration;
  if (inDur > 0 && into >= 0 && into < inDur) return 1 - into / inDur;
  if (remain >= 0 && remain < duration) return 1 - remain / duration;
  return 0;
}

/** Fixture frame assert. No GPU still. No ship render. */
export function trackBFrameAssert() {
  const source = readFileSync(motionPath, "utf8");
  const sourceMatches =
    source.includes("TAKEOVER_HOLD_FRAMES = 12") &&
    source.includes("TAKEOVER_EASE_FRAMES = 18") &&
    source.includes("GLIDE_FRAMES = 24") &&
    source.includes("return {x: (1 - t) * -140, opacity: t}") &&
    source.includes("return {opacity: 0, x: 120, cardOwns: true}") &&
    source.includes("motion === \"takeover\" || motion === \"glide\" ? 0");
  const takeoverOpen = takeoverHead(0);
  const takeoverHeadIn = takeoverHead(12);
  const glideEnter = glideCard(0);
  const glideSettled = glideCard(24);
  const midHold = takeoverHead(21);
  const lumaExit = lumaVeil(9.6, 0, 10, 0.5, "takeover");
  const frames = {
    "takeover open": takeoverOpen.cardOwns === true && takeoverOpen.opacity === 0,
    "takeover head-in": takeoverHeadIn.cardOwns === false && takeoverHeadIn.opacity === 0,
    "glide enter": glideEnter.opacity === 0 && glideEnter.x === -140,
    "mid-hold": midHold.cardOwns === false && midHold.opacity > 0 && midHold.opacity < 1,
    "luma exit": lumaExit > 0 && lumaExit < 1,
    "glide settled": glideSettled.opacity === 1 && glideSettled.x === 0,
  };
  const ok = sourceMatches && Object.values(frames).every(Boolean);
  return {ok, gpu: false, rendering: "idle", written: false, frames};
}

/**
 * Fixture frame budget for the 1050-frame master.
 * This is not npx remotion benchmark and it does not render.
 */
export function trackBFrameLog() {
  const started = process.hrtime.bigint();
  let checksum = 0;
  for (let frame = 0; frame < 1050; frame += 1) {
    checksum += glideCard(frame % 24).opacity + takeoverHead(frame % 30).opacity;
  }
  const elapsedNs = Number(process.hrtime.bigint() - started);
  return {
    ok: checksum > 0,
    dryRun: true,
    gpu: false,
    rendering: "idle",
    written: false,
    frames: 1050,
    fps: 30,
    elapsedNs,
    keyframes: ["takeover open", "takeover head-in", "glide enter", "mid-hold", "luma exit"],
  };
}
