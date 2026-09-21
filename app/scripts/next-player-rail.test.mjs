import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");
const MASTER_SHA = "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";
const ANALOGY = "/opt/cursor/artifacts/lesson-spine-analogy-encode/2026-09-21/LessonSpine.mp4";
const ANALOGY_SHA = "a556a0b5a2beaec4b0cc44eadcbf6c092cd152a568282ce3eee06564be01af37";
const EVIDENCE = "/opt/cursor/artifacts/lesson-spine-evidence-encode/2026-09-21/LessonSpine.mp4";
const EVIDENCE_SHA = "5d0499f6cbff19149ce0b5da3c615a1ca0ab26fbbece2d9e26da0e78dd367c4b";
const RUBRIC = "/opt/cursor/artifacts/lesson-spine-rubric-encode/2026-09-21/LessonSpine.mp4";
const RUBRIC_SHA = "4aef4c713218247ebb4cad42b637f4b1331a02d6db4fcc13ac13e2bde156a337";
const THRESHOLD = "/opt/cursor/artifacts/lesson-spine-threshold-encode/2026-09-21/LessonSpine.mp4";
const THRESHOLD_SHA = "955f0256424fdc4ddb5ae5506a04a9ea877cb6a79ccb126ba1bb4884b9943a6f";
const SPECTRUM = "/opt/cursor/artifacts/lesson-spine-spectrum-encode/2026-09-21/LessonSpine.mp4";
const SPECTRUM_SHA = "496f506babd11a6e5247e87c3bbf926117b0de31feae5b6573fa891bdf6c68d0";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("player rail page streams locked LessonSpine master without Remotion npm", () => {
  const page = read("src/app/play/lesson-spine/page.tsx");
  const player = read("src/components/lesson-spine-player.tsx");
  const media = read("src/app/api/media/lesson-spine/route.ts");
  const home = read("src/app/campus-home.tsx");
  const header = read("src/components/site-header.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(page, /LessonSpinePlayer/);
  assert.match(page, /\/play\/lesson-spine|Learn with Ben/);
  assert.match(page, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(player, /<video/);
  assert.match(player, /\/api\/media\/lesson-spine/);
  assert.match(player, /data-player="lesson-spine"/);
  assert.match(player + read("src/lib/player/lesson-spine-meta.ts"), /Sting|Slate|Objective|Recap|Next up/);
  assert.match(media, /resolveLessonSpineDest/);
  assert.match(media, /video\/mp4/);
  assert.doesNotMatch(media, /requireMember|requireTeacher/);
  assert.match(home, /href="\/play\/lesson-spine"/);
  assert.match(header, /href: "\/play\/lesson-spine"/);
  assert.equal(Object.keys(pkg.dependencies).some((name) => name.includes("remotion")), false);
  assert.doesNotMatch(page + player + media, /family-v1-home|children-database|@remotion/);
  assert.match(read("src/lib/player/lesson-spine-meta.ts"), /id: "sting"/);
  assert.match(read("src/lib/player/lesson-spine-meta.ts"), new RegExp(MASTER_SHA));
});

test("locked master is the source; campus copy matches; priors untouched", () => {
  const source = "/opt/cursor/artifacts/lesson-spine-counterexample-encode/2026-09-21/LessonSpine.mp4";
  assert.equal(existsSync(source), true);
  assert.equal(sha256(source), MASTER_SHA);
  const publicCopy = join(root, "public/lessons/LessonSpine.mp4");
  assert.equal(existsSync(publicCopy), true);
  assert.equal(sha256(publicCopy), MASTER_SHA);
  const lib = read("src/lib/player/lesson-spine.ts");
  assert.match(lib, /destAllowed/);
  assert.match(lib, /LESSON_SPINE_MASTER_SHA256/);
  assert.equal(sha256(ANALOGY), ANALOGY_SHA);
  assert.equal(sha256(EVIDENCE), EVIDENCE_SHA);
  assert.equal(sha256(RUBRIC), RUBRIC_SHA);
  assert.equal(sha256(THRESHOLD), THRESHOLD_SHA);
  assert.equal(sha256(SPECTRUM), SPECTRUM_SHA);
});

test("WAVE5 and STATUS cite player rail after PR 185; launch stays CLOSED 0/8", () => {
  const wave5 = readRepo("docs/campus-runtime/WAVE5.md");
  const campus = readRepo("docs/campus-runtime/STATUS.md");
  const rail = readRepo("docs/campus-runtime/PLAYER_RAIL.md");
  assert.match(wave5, /## LessonSpine Next player rail \(PASS\)/);
  assert.match(wave5, /PR 185 merge `b34f303`/);
  assert.match(wave5, /\/play\/lesson-spine/);
  assert.match(wave5, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(wave5, /\*\*Current master dest\.\*\*/);
  assert.match(campus, /LessonSpine Next player rail \*\*PASS\*\*/);
  assert.match(campus, /PR 185 merge `b34f303`/);
  assert.match(campus, /\/play\/lesson-spine/);
  assert.match(campus, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(campus, /Remotion-in-Next held/);
  assert.match(campus, /\*\*CLOSED\*\*, \*\*0\/8\*\*/);
  assert.match(rail, /\/play\/lesson-spine/);
  assert.match(rail, /GET \/api\/media\/lesson-spine/);
  assert.doesNotMatch(wave5, /8\/8 PASS|launch OPEN/i);
  assert.doesNotMatch(campus, /8\/8 PASS|launch OPEN/i);
});
