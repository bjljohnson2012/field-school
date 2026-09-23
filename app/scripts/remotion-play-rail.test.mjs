import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("campus play rail mounts a LessonSpine Remotion preview beside HTML5", () => {
  const page = read("src/app/play/lesson-spine/page.tsx");
  const html5 = read("src/components/lesson-spine-player.tsx");
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const pkg = JSON.parse(read("package.json"));
  const names = Object.keys(pkg.dependencies);
  assert.match(page, /LessonSpinePlayer/);
  assert.match(page, /LessonSpineRemotionPreview/);
  assert.match(page, /Ready \/ HLS/);
  assert.match(page, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(page, /Launch stays/);
  assert.match(page, /Distribute held/);
  assert.match(html5, /<video/);
  assert.match(html5, /data-player="lesson-spine"/);
  assert.doesNotMatch(html5, /@remotion|from \"remotion\"/);
  assert.match(preview, /from \"@remotion\/player\"/);
  assert.match(preview, /from \"remotion\"/);
  assert.match(preview, /data-composition="LessonSpine"/);
  assert.match(preview, /data-rooms="household,sales"/);
  assert.match(preview, /data-login="none"/);
  assert.match(preview, /data-sales-children="0"/);
  assert.match(preview, /durationInFrames=\{LESSON_SPINE_DURATION_IN_FRAMES\}/);
  assert.match(preview, /useCurrentFrame/);
  assert.doesNotMatch(preview, /@remotion\/cli|@remotion\/renderer|@remotion\/bundler/);
  assert.doesNotMatch(page + preview, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
  assert.deepEqual(
    names.filter((name) => name === "remotion" || name.startsWith("@remotion/")).sort(),
    ["@remotion/player", "remotion"],
  );
});
