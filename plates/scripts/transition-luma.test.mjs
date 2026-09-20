import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");
const MASTER =
  "/opt/cursor/artifacts/lesson-spine-caption-overlay-encode/2026-09-20/LessonSpine.mp4";
const MASTER_SHA = "5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c";
const STILLS = "/opt/cursor/artifacts/remotion-transition-luma/2026-09-20";
const PRIOR =
  "/opt/cursor/artifacts/lesson-spine-lower-callout-encode/2026-09-20/LessonSpine.mp4";
const PRIOR_SHA = "68b8378a47d9eb57ed4b41f35bc2bf4ed6fd01a0694fca28c0a5ea90101fee92";

const PRIORS = {
  [PRIOR]: PRIOR_SHA,
  "/opt/cursor/artifacts/lesson-spine-progress-chapter-encode/2026-09-20/LessonSpine.mp4":
    "a11e31a38774266b80a8f64e088ff4eb0b59d80bc7b710e9240b6ee076e61ce7",
  "/opt/cursor/artifacts/lesson-spine-typecard-objectiveslate-encode/2026-09-20/LessonSpine.mp4":
    "3f42545633b331c184febe17349c9d3162295c97dabeec5458bebd2007aa95e5",
  "/opt/cursor/artifacts/lesson-spine-slate-encode/2026-09-20/LessonSpine.mp4":
    "d0a09896aa1ea6fc8cf5b5898bc83ddb54faccaa0957c8529a3de0d49a10efc5",
  "/opt/cursor/artifacts/lesson-spine-edu-s02-encode/2026-09-20/LessonSpine.mp4":
    "eaf6f84a5363b23f512c0c07f82f90464f11b8c3b57d69a0fa23af951d9798e8",
  "/opt/cursor/artifacts/lesson-spine-edu-s01-encode/2026-09-20/LessonSpine.mp4":
    "cab8bd9115d1782158bafeba5c36c820039bd05da3f4fc96412efe9932b86ebf",
  "/opt/cursor/artifacts/lesson-spine-typecard-encode/2026-09-20/LessonSpine.mp4":
    "27cc5bf3e37f8496257b4efb0f8b1ef2938af35a287aa1530f00db60d984a9a0",
  "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4":
    "a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a",
  "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4":
    "ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211",
  "/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4":
    "028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98",
  "/opt/cursor/artifacts/lesson-spine-karaoke-gold/2026-09-20/LessonSpine.mp4":
    "9f89f9a9a89670c6bac382d1f97b3d7283c47a8a06e7c2c069314bf59ea2d59f",
};

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("TransitionLuma is a beat-to-beat wipe after callout", () => {
  const layers = src("src", "layers.tsx");
  const demo = src("src", "TransitionLumaDemo.tsx");
  assert.match(layers, /export function TransitionLuma/);
  assert.match(layers, /export const TRANSITION_LUMA_FRAMES/);
  assert.match(layers, /TRANSITION_LUMA_FRAMES = 18/);
  assert.match(layers, /Beat-to-beat wipe/);
  assert.match(layers, /After callout, before audio/);
  assert.match(layers, /useCurrentFrame/);
  assert.match(layers, /interpolate\(frame, \[0, TRANSITION_LUMA_FRAMES\], \[1920, 0\]/);
  assert.match(layers, /backgroundColor: cream/);
  assert.match(layers, /backgroundColor: gold/);
  assert.match(layers, /width: 6/);
  assert.doesNotMatch(layers, /zIndex|z-index/);
  assert.doesNotMatch(layers, /animation:|transition:|animate-/);
  assert.doesNotMatch(layers, /a_roll\.mp4|27pn9xs0zk8a73g/);
  assert.match(demo, /TransitionLumaDemo/);
  assert.match(demo, /name="transition"/);
  assert.match(demo, /<TransitionLuma \/>/);
  assert.match(demo, /Math\.floor\(frame \/ 48\)/);
  assert.doesNotMatch(demo, /a_roll\.mp4|27pn9xs0zk8a73g/);
});

test("TransitionLumaDemo registers after CalloutCardDemo; five spine plates carry wipe between callout and audio", () => {
  const rootTsx = src("src", "Root.tsx");
  const spine = src("src", "LessonSpine.tsx");
  assert.match(rootTsx, /id="TransitionLumaDemo"/);
  assert.match(rootTsx, /id="CalloutCardDemo"/);
  assert.match(rootTsx, /id="LessonSpine"/);
  assert.ok(rootTsx.indexOf('id="CalloutCardDemo"') < rootTsx.indexOf('id="TransitionLumaDemo"'));
  const plates = {
    "Opener.tsx": "sting",
    "TalkingHeadCard.tsx": "slate",
    "DefinitionBoard.tsx": "objective",
    "RecapCard.tsx": "recap",
    "QuizBumper.tsx": "next-up",
  };
  for (const [file, beat] of Object.entries(plates)) {
    const blob = src("src", file);
    const callout = blob.indexOf('name="callout"');
    const wipe = blob.indexOf('name="transition"');
    const audio = blob.indexOf('name="audio"');
    assert.ok(callout >= 0 && wipe > callout && audio > wipe, file);
    assert.match(blob, /<TransitionLuma \/>/);
    assert.match(blob, new RegExp(`<CalloutCard beat="${beat}" />`));
    assert.match(blob, /<AudioBed \/>/);
    assert.doesNotMatch(blob, /zIndex|z-index/);
  }
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
});

test("ORDER LOCK intact; docs seal TransitionLuma PASS with hold_cleaning", () => {
  const note = src("antagonist-transition-luma.md");
  const full = src("antagonist-full-set.md");
  const wave5 = src("..", "docs", "campus-runtime", "WAVE5.md");
  const campus = src("..", "docs", "campus-runtime", "STATUS.md");
  assert.match(note, /EDU-S03: SOFT/);
  assert.match(note, /hold_cleaning: true/);
  assert.match(note, /5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c/);
  assert.match(note, /PR 114 merge `c2a63b7997773147bb0f50bd163a675fc942f25c`/);
  assert.match(
    note,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.match(full, /## TransitionLuma 2026-09-20/);
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(wave5, /## TransitionLuma \(PASS\)/);
  assert.match(wave5, /PR 114 merge `c2a63b7`/);
  assert.match(wave5, /5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /PR 114 merge `c2a63b7`/);
  assert.match(campus, /TransitionLuma \*\*PASS\*\*/);
  assert.match(campus, /5b229fee3254426ba8b6dca0c7af23f2270b485b7b62f296b5ae6a31b4d5c61c/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(src("README.md"), /antagonist-transition-luma\.md/);
  assert.match(src("AGENTS.md"), /TransitionLumaDemo/);
  assert.doesNotMatch(note, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
});

test("stills exist; locked master and priors untouched", () => {
  assert.equal(existsSync(MASTER), true);
  assert.equal(sha256(MASTER), MASTER_SHA);
  for (const [dest, hash] of Object.entries(PRIORS)) {
    assert.equal(existsSync(dest), true, dest);
    assert.equal(sha256(dest), hash, dest);
  }
  for (const name of ["TransitionLumaDemo-f0.png", "TransitionLumaDemo-f60.png", "LessonSpine-sting-f42.png"]) {
    assert.equal(existsSync(join(STILLS, name)), true, name);
  }
});

test("checklist on caption-overlay master holds; --flip refused", () => {
  const checklist = join(here, "cleaning-checklist-lesson-spine.mjs");
  const flip = spawnSync(process.execPath, [checklist, "--dest", MASTER, "--flip", "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(flip.status, 2);
  assert.match(flip.stdout, /flip_refused/);
  const pass = spawnSync(process.execPath, [checklist, "--dest", MASTER, "--no-write"], {
    encoding: "utf8",
  });
  assert.equal(pass.status, 0, pass.stderr);
  const body = JSON.parse(pass.stdout);
  assert.equal(body.verdict, "PASS");
  assert.equal(body.hold_cleaning, true);
  assert.equal(body.auto_flip, false);
  assert.equal(body.sha256, MASTER_SHA);
});
