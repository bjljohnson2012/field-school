import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const desks = [
  "src/app/api/progress/brain/route.ts",
  "src/app/api/progress/intent/route.ts",
  "src/app/api/progress/path/route.ts",
  "src/app/api/progress/portion/route.ts",
  "src/app/api/progress/supervised/route.ts",
];

test("hire-path file desks require a signed org url or a session", () => {
  for (const rel of desks) {
    const src = read(rel);
    assert.match(src, /refuseClosedDesk/, rel);
  }
  const events = read("src/app/api/progress/route.ts");
  assert.match(events, /guest: true/);
  assert.doesNotMatch(events, /refuseClosedDesk/);
});
