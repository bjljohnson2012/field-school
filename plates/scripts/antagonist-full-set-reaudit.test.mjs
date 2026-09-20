import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");
const full = src("antagonist-full-set.md");

test("full-set reaudit is dated 2026-09-20 PASS with hold_cleaning", () => {
  assert.match(full, /Dated \*\*2026-09-20\*\* reaudit/);
  assert.match(full, /verdict: PASS/);
  assert.match(full, /hold_cleaning: true/);
  assert.match(full, /auto_flip: false/);
  assert.match(full, /LessonSpine: PASS/);
  assert.match(full, /LetterboxDemo: PASS/);
  assert.match(full, /028d16e402e64f445b315b735d1d74f77273d941f9d9b66ea508c2e8ba577e98/);
  assert.match(full, /a5d082844afc1d2f9fbc0644705fad3e3663356638e906d4d9e27876a74c598a/);
  assert.match(full, /ec88d2576bf29adc70d3d66624765aa1547a76db0486b5e4fb93a9039a37e211/);
  assert.match(
    full,
    /Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.doesNotMatch(full, /8\/8 PASS|launch OPEN|HARD_FAIL/);
});

test("per-comp notes carry the 2026-09-20 reaudit pointer", () => {
  for (const name of [
    "antagonist-opener-recap.md",
    "antagonist-definition-quiz-head.md",
    "antagonist-lesson-spine.md",
    "antagonist-captions-lower-third.md",
    "antagonist-letterbox-layer.md",
    "antagonist-soft-polish-vox-s05.md",
    "antagonist-lesson-spine-letterbox-encode.md",
  ]) {
    const body = src(name);
    assert.match(body, /## Reaudit 2026-09-20/, name);
    assert.match(body, /antagonist-full-set\.md/, name);
  }
  assert.match(src("README.md"), /full-set reaudit 2026-09-20/);
});

test("current letterbox dest exists; prior dests untouched", () => {
  const current =
    "/opt/cursor/artifacts/lesson-spine-letterbox-encode/2026-09-20/LessonSpine.mp4";
  const first = "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4";
  const captions =
    "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4";
  assert.equal(existsSync(current), true);
  assert.equal(existsSync(first), true);
  assert.equal(existsSync(captions), true);
  assert.equal(
    existsSync(
      "/opt/cursor/artifacts/remotion-antagonist-full-set-reaudit/2026-09-20/LessonSpine-slate-f330.png",
    ),
    true,
  );
});
