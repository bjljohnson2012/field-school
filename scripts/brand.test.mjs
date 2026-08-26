import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const REQUIRED = [
  "marketing-site/brand/mark-color.svg",
  "marketing-site/brand/mark-black.svg",
  "marketing-site/brand/mark-white.svg",
  "marketing-site/brand/icon-color.svg",
  "marketing-site/brand/icon-blue.svg",
  "marketing-site/brand/icon-ink.svg",
  "marketing-site/brand/lockup-wide-color.svg",
  "marketing-site/brand/lockup-wide-black.svg",
  "marketing-site/brand/lockup-wide-white.svg",
  "marketing-site/brand/lockup-stacked-color.svg",
  "marketing-site/brand/wordmark-color.svg",
  "marketing-site/brand/slogan-color.svg",
  "marketing-site/brand/lockup-wide-slogan.svg",
  "marketing-site/brand/social-avatar.svg",
  "marketing-site/brand/png/lockup-wide-color.png",
  "marketing-site/brand/png/lockup-wide-slogan-cream.png",
  "marketing-site/brand/png/lockup-wide-black.png",
  "marketing-site/brand/png/lockup-stacked-color.png",
  "marketing-site/brand/png/social-square-color.png",
  "marketing-site/brand/png/social-avatar-2048.png",
  "marketing-site/brand/png/og-2400x1260.png",
  "marketing-site/brand/png/x-banner-3000x1000.png",
  "marketing-site/brand/png/cover-3840x2160.png",
  "marketing-site/brand/png/email-lockup.png",
  "marketing-site/brand/png/mark-color-4096.png",
  "marketing-site/img/field-school-lockup.png",
  "public/brand/mark-color.svg",
  "public/favicon.svg",
  "public/apple-touch-icon.png",
];

test("Field School logo set exists and never says University", () => {
  for (const rel of REQUIRED) {
    const path = join(root, rel);
    assert.equal(existsSync(path), true, rel);
    assert.equal(statSync(path).size > 200, true, rel);
  }

  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, name.name);
      if (name.isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.(svg|html|py|mjs|tsx|ts|css)$/.test(name.name)) continue;
      const text = readFileSync(path, "utf8");
      assert.doesNotMatch(text, /University/);
    }
  };
  walk(join(root, "marketing-site/brand"));
  walk(join(root, "public/brand"));

  const mark = read("marketing-site/brand/mark-color.svg");
  assert.match(mark, /#1f5eff/);
  assert.doesNotMatch(mark, /University/);
  assert.match(read("marketing-site/index.html"), /brand\/mark-color\.svg/);
  assert.match(read("src/components/site-header.tsx"), /brand\/mark-color\.svg/);
  assert.match(read("src/app/layout.tsx"), /og-1200x630\.png/);
  assert.match(read("src/lib/brand.ts"), /Lead yourself\. Learn yourself\. Do the Work\./);
  assert.match(read("src/app/page.tsx"), /Lead yourself\. Learn yourself\. Do the Work\./);
  assert.match(read("scripts/build-brand.py"), /Lead yourself\. Learn yourself\. Do the Work\./);
  assert.equal(statSync(join(root, "marketing-site/brand/png/lockup-wide-color.png")).size > 20000, true);
  assert.equal(statSync(join(root, "marketing-site/brand/png/og-2400x1260.png")).size > 20000, true);
});
