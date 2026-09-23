import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("Remotion preview names the current LessonSpine chapter and caption", () => {
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const html5 = read("src/components/lesson-spine-player.tsx");
  const page = read("src/app/play/lesson-spine/page.tsx");
  assert.match(preview, /data-preview-craft="chapter"/);
  assert.match(preview, /data-chapter-label=\{chapter\.label\}/);
  assert.match(preview, /data-preview-caption=\{chapter\.id\}/);
  assert.match(preview, /data-chapter-rail="lesson-spine"/);
  assert.match(preview, /data-caption=\{label\}/);
  assert.match(preview, /interpolate\(/);
  assert.match(preview, /useCurrentFrame/);
  assert.match(preview, /#EFE7D6/);
  assert.match(preview, /#C4A35A/);
  assert.match(preview, /#1A1A16/);
  assert.match(preview, /Household: the child has no login\. Sales: this desk lists no children\./);
  assert.match(preview, /recordPlay\("sting"\)/);
  assert.match(preview, /data-composition="LessonSpine"/);
  assert.match(preview, /data-login="none"/);
  assert.match(preview, /data-sales-children="0"/);
  for (const label of ["Sting", "Slate", "Objective", "Recap", "Next up"]) {
    assert.match(preview, new RegExp(label));
  }
  assert.match(html5, /<video/);
  assert.doesNotMatch(html5, /@remotion|from "remotion"/);
  assert.match(page, /LessonSpinePlayer/);
  assert.match(page, /LessonSpineRemotionPreview/);
  assert.match(page, /Guests/);
  assert.match(page, /do not write/);
  assert.doesNotMatch(preview + html5 + page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
  assert.doesNotMatch(preview, /@remotion\/cli|@remotion\/renderer|@remotion\/bundler/);
});
