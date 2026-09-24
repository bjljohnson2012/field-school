import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const GUEST = [
  "src/app/campus-home.tsx",
  "src/components/campus-ladder.tsx",
  "src/app/login/login-form.tsx",
  "src/app/login/page.tsx",
  "src/app/signup/signup-form.tsx",
  "src/app/signup/page.tsx",
  "src/app/c/[courseSlug]/page.tsx",
  "src/app/c/[courseSlug]/desk/page.tsx",
  "src/app/c/[courseSlug]/exam/page.tsx",
  "src/app/c/[courseSlug]/certificate/page.tsx",
  "src/app/c/[courseSlug]/s/[slug]/page.tsx",
  "src/components/course-subnav.tsx",
  "src/components/guest-continuity.tsx",
  "src/components/course-feedback.tsx",
  "src/components/quiz-panel.tsx",
  "src/components/assignment-panel.tsx",
  "src/app/play/lesson-spine/page.tsx",
  "src/components/lesson-spine-hire-path.tsx",
  "src/components/youtube-clip.tsx",
];

const AE_PAINT =
  /#0B1F3A|#0b1f3a|#FF6A1A|#ff6a1a|bg-brand-navy|bg-brand-orange|text-brand-orange|text-brand-indigo|border-brand-orange/;

test("guest and course chrome use Field School tokens", () => {
  for (const rel of GUEST) {
    assert.doesNotMatch(read(rel), AE_PAINT, rel);
  }
  const home = read("src/app/campus-home.tsx");
  assert.match(home, /Start Grok Bot/);
  assert.match(home, /bg-\[#1f5eff\]/);
  assert.match(home, /h-page/);
  const login = read("src/app/login/login-form.tsx");
  assert.doesNotMatch(login, /text-brand-orange/);
  assert.match(login, /Field School/);
  const cert = read("src/app/c/[courseSlug]/certificate/page.tsx");
  assert.match(cert, /<main data-plate/);
  assert.match(cert, /rounded-xl border border-border bg-card px-6 py-10 sm:px-12/);
  const spine = read("src/app/play/lesson-spine/page.tsx");
  assert.match(spine, /data-plate/);
  assert.match(spine, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(read("src/components/lesson-spine-player.tsx"), /data-play-rail="living-brain"/);
  assert.match(read("src/components/lesson-spine-remotion-player.tsx"), /data-broll-request="classroom"/);
  assert.match(read("src/components/lesson-spine-remotion-player.tsx"), /data-pexels-credit="live"/);
  assert.match(read("src/app/c/[courseSlug]/exam/page.tsx"), /Pass at 8\/10/);
});
