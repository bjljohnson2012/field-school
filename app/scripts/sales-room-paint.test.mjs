import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const SALES = [
  "src/app/card/page.tsx",
  "src/app/roster/page.tsx",
  "src/app/tasks/page.tsx",
  "src/app/tasks/tasks-board.tsx",
  "src/app/tasks/retake-section.tsx",
  "src/app/improve/page.tsx",
  "src/app/improve/drill-runner.tsx",
  "src/app/intake/page.tsx",
  "src/app/intake/intake-wizard.tsx",
  "src/app/knowledge/page.tsx",
  "src/app/help/page.tsx",
  "src/components/help-client.tsx",
  "src/app/quiz/[token]/page.tsx",
  "src/app/coaching/compare/page.tsx",
  "src/app/coaching/compare/compare-panel.tsx",
  "src/app/coaching/files/page.tsx",
  "src/app/coaching/files/files-panel.tsx",
  "src/app/coaching/knowledge/page.tsx",
  "src/app/coaching/knowledge/knowledge-editor.tsx",
  "src/app/coaching/products/page.tsx",
  "src/app/coaching/products/products-editor.tsx",
  "src/app/coaching/questions/page.tsx",
  "src/app/coaching/questions/questions-editor.tsx",
  "src/app/coaching/reviews/page.tsx",
  "src/app/coaching/reviews/reviews-panel.tsx",
  "src/app/people/[membershipId]/notes/page.tsx",
  "src/app/people/[membershipId]/notes/notes-panel.tsx",
  "src/app/people/[membershipId]/plan/page.tsx",
  "src/app/people/[membershipId]/plan/plan-panel.tsx",
  "src/app/people/[membershipId]/prep/page.tsx",
  "src/app/people/[membershipId]/prep/prep-panel.tsx",
  "src/components/wizard-step.tsx",
  "src/components/synthesis-status-banner.tsx",
  "src/components/tasks-nav-badge.tsx",
];

const AE_PAINT = /#0B1F3A|#0b1f3a|#FF6A1A|#ff6a1a|bg-brand-navy|bg-brand-orange|text-brand-orange|text-brand-indigo|border-brand-orange/;

test("sales coaching UI uses Field School tokens", () => {
  for (const rel of SALES) {
    const source = read(rel);
    assert.doesNotMatch(source, AE_PAINT, rel);
    assert.doesNotMatch(source, /text-gray-|border-gray-|bg-gray-|bg-orange-/, rel);
  }
  assert.match(read("src/app/card/page.tsx"), /className="h-page"/);
  assert.match(read("src/app/roster/page.tsx"), /className="h-page"/);
  assert.match(read("src/app/intake/page.tsx"), /className="h-page"/);
  assert.match(read("src/components/tasks-nav-badge.tsx"), /text-primary/);
  assert.doesNotMatch(read("src/components/help-client.tsx"), /orange Tasks/);
});

test("0-100 skill meter fill is Field School primary", () => {
  const card = read("src/components/skill-card.tsx");
  const hundred = card.indexOf("hundred ?");
  const meter = card.indexOf('data-meter="1-4"');
  assert.ok(hundred >= 0 && meter > hundred);
  assert.match(card.slice(hundred, meter), /bg-primary/);
  assert.match(card.slice(meter), /bg-primary/);
  assert.match(card.slice(meter), /data-meter="1-4"/);
  assert.doesNotMatch(card, AE_PAINT);
});

test("tasks badge stays on the sales header control", () => {
  const shell = read("src/components/app-shell.tsx");
  const room = shell.indexOf('room === "sales"');
  const mount = shell.indexOf("<TasksNavBadge");
  assert.ok(room >= 0 && mount > room);
  assert.match(shell, /data-tasks="sales"/);
  assert.equal((shell.match(/<TasksNavBadge/g) || []).length, 1);
});
