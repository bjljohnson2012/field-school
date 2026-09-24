import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const PAGES = [
  "src/app/admin/page.tsx",
  "src/app/admin/layout.tsx",
  "src/app/admin/catalog/page.tsx",
  "src/app/admin/tools/page.tsx",
  "src/app/admin/forms/page.tsx",
  "src/app/admin/notifications/page.tsx",
  "src/app/admin/access-requests/page.tsx",
  "src/app/admin/users/page.tsx",
  "src/app/admin/users/[id]/page.tsx",
  "src/app/admin/demo/student-demo-client.tsx",
  "src/components/admin-nav.tsx",
  "src/app/account/page.tsx",
  "src/app/metering/page.tsx",
  "src/components/fr-kb-3-metering.tsx",
  "src/app/docs/api/page.tsx",
  "src/app/cart/cart-client.tsx",
  "src/app/checkout/success/success-client.tsx",
];

const AE_PAINT =
  /#0B1F3A|#0b1f3a|#FF6A1A|#ff6a1a|bg-brand-navy|bg-brand-orange|text-brand-orange|from-brand-indigo|text-brand-red|bg-brand-red|text-gray-|bg-gray-/;

const WRAPPERS = new Set(["src/app/admin/layout.tsx", "src/app/metering/page.tsx"]);

test("admin, account, and commerce use Field School density", () => {
  for (const rel of PAGES) {
    const source = read(rel);
    assert.doesNotMatch(source, AE_PAINT, rel);
    if (!WRAPPERS.has(rel)) {
      assert.match(source, /h-page|h-section|eyebrow|btn-primary|className="card/, rel);
    }
  }
  const cart = read("src/app/cart/cart-client.tsx");
  assert.match(cart, /\$100, \$200, or \$1,000/);
  assert.match(cart, /Pay \{plan\.priceLabel\}/);
  const metering = read("src/app/metering/page.tsx");
  assert.match(metering, /Locked \$100 \/ \$200 \/ \$1,000/);
  const ui = read("src/components/fr-kb-3-metering.tsx");
  assert.match(ui, /\{plan\.name\} · \{plan\.priceLabel\}/);
  assert.match(ui, /data-metering="fr-kb-3"/);
  const account = read("src/app/account/page.tsx");
  assert.match(account, /Change the password for/);
  assert.match(account, /className="btn-primary"/);
  const shell = read("src/components/app-shell.tsx");
  assert.doesNotMatch(shell, /from-brand-indigo/);
  assert.match(shell, /bg-primary text-sm font-medium text-primary-foreground/);
  const chrome = read("src/components/chrome.tsx");
  assert.doesNotMatch(chrome, /COACHING_SHELL|coachingShellEnabled/);
  assert.match(chrome, /<AppShell/);
  const layout = read("src/app/layout.tsx");
  assert.doesNotMatch(layout, /Inter\(|Space_Grotesk\(/);
  assert.match(layout, /data-chrome="coach"/);
});
