import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "scripts/lessons-brain-path-regression.test.mjs",
  "scripts/play-rail-brain-write.test.mjs",
  "scripts/learn-desk-next-step.test.mjs",
  "scripts/people-desk-next-step.test.mjs",
  "scripts/insights-lessons-from-brain.test.mjs",
  "scripts/teach-assign-next-from-brain.test.mjs",
  "scripts/leave-return-lessons-from-brain.test.mjs",
  "scripts/aim-confidence-from-lessons-brain.test.mjs",
  "scripts/ai-suggestions-from-lessons-brain.test.mjs",
  "scripts/history-lessons-from-brain.test.mjs",
  "scripts/profile-lessons-from-brain.test.mjs",
  "scripts/play-rail-align-brain-next.test.mjs",
  "scripts/org-lessons-outcomes-rollup.test.mjs",
  "scripts/remotion-preview-craft.test.mjs",
  "scripts/remotion-play-rail.test.mjs",
  "src/lib/living-brain/model.test.mjs",
];

const result = spawnSync(process.execPath, ["--experimental-strip-types", "--test", ...files], {
  cwd: app,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
