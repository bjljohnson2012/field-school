import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("staff admin lists render an org column", () => {
  for (const rel of [
    "src/app/admin/access-requests/page.tsx",
    "src/app/admin/forms/page.tsx",
    "src/app/admin/users/page.tsx",
    "src/components/admin/assessment-count.tsx",
  ]) {
    assert.match(read(rel), /data-org-column/, rel);
  }
  assert.match(read("src/app/api/admin/access-requests/route.ts"), /withStaffOrgs/);
  assert.match(read("src/app/api/admin/forms/route.ts"), /withStaffOrgs/);
  assert.match(read("src/app/api/admin/members/assessments/route.ts"), /orgsForEmails/);
});
