import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(join(appRoot, rel), "utf8");

test("portal :root keeps Field School brand and AE non-brand tokens", () => {
  const css = read("src/app/globals.css");
  const root = css.match(/:root\s*\{([^}]*)\}/);
  assert.ok(root, ":root block");
  const block = root[1];
  assert.match(block, /--background:\s*#f6f3ec/i);
  assert.match(block, /--foreground:\s*#1a1916/i);
  assert.match(block, /--primary:\s*#1f5eff/i);
  assert.match(block, /--accent:\s*#1f5eff/i);
  assert.match(block, /--ring:\s*#1f5eff/i);
  assert.match(block, /--card:\s*#ffffff/i);
  assert.match(block, /--surface-soft:\s*#efeae1/i);
  assert.match(block, /--ink-line:\s*#d8d2c6/i);
  assert.match(block, /--ink-soft-line:\s*#e5e7eb/i);
  assert.match(block, /--radius:\s*0\.875rem/);
  assert.doesNotMatch(block, /#ff6a1a/i);
  assert.doesNotMatch(block, /#0b1f3a/i);
  assert.doesNotMatch(block, /#1f3c88/i);
  assert.match(css, /--font-sans:\s*var\(--font-ibm-sans\)/);
  assert.match(css, /--font-display:\s*var\(--font-fraunces\)/);
  assert.match(css, /--font-heading:\s*var\(--font-fraunces\)/);
  assert.match(css, /--font-mono:\s*var\(--font-ibm-mono\)/);
  assert.doesNotMatch(css, /--font-inter/);
  assert.doesNotMatch(css, /--font-space-grotesk/);
  assert.match(css, /--duration-fade:\s*200ms/);
  assert.match(css, /--duration-slide-up:\s*220ms/);
  assert.match(css, /--duration-slide-in-right:\s*240ms/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\[data-chrome="coach"\]/);
  assert.match(css, /\.h-page\b/);
  assert.match(css, /\.h-section\b/);
  assert.match(css, /\.h-card\b/);
  assert.match(css, /\.eyebrow\b/);
  assert.match(css, /::-webkit-scrollbar\s*\{[^}]*width:\s*10px/s);
  assert.match(css, /\[data-plate\]\s+\.font-display/);
  assert.match(css, /\[data-remotion-player="lesson-spine"\]\s+\.font-display/);
  assert.doesNotMatch(css, /:has\(\.tracking-/);
});

test("Fraunces and IBM Plex stay the brand faces and ThemeScript stays light", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /Fraunces\(/);
  assert.match(layout, /variable:\s*"--font-fraunces"/);
  assert.match(layout, /IBM_Plex_Sans\(/);
  assert.match(layout, /variable:\s*"--font-ibm-sans"/);
  assert.match(layout, /IBM_Plex_Mono\(/);
  assert.doesNotMatch(layout, /Inter\(/);
  assert.doesNotMatch(layout, /Space_Grotesk\(/);

  const certificate = read("src/app/c/[courseSlug]/certificate/page.tsx");
  const spine = read("src/app/play/lesson-spine/page.tsx");
  assert.match(certificate, /data-plate/);
  assert.match(spine, /data-plate/);

  const theme = read("src/components/theme-script.tsx");
  assert.match(theme, /classList\.remove\(["']dark["']\)/);
  assert.doesNotMatch(theme, /classList\.(toggle|add)\(\s*["']dark["']/);
  assert.doesNotMatch(theme, /prefers-color-scheme/);
  assert.doesNotMatch(theme, /localStorage/);
});
