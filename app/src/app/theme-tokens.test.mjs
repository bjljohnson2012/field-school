import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(join(appRoot, rel), "utf8");

test("portal :root adopts AE surface, indigo primary, and type", () => {
  const css = read("src/app/globals.css");
  const root = css.match(/:root\s*\{([^}]*)\}/);
  assert.ok(root, ":root block");
  const block = root[1];
  assert.match(block, /--background:\s*#f5f7fa/i);
  assert.match(block, /--card:\s*#ffffff/i);
  assert.match(block, /--surface-soft:\s*#f9fafb/i);
  assert.match(block, /--ink:\s*#111827/i);
  assert.match(block, /--ink-slate:\s*#374151/i);
  assert.match(block, /--ink-muted:\s*#6b7280/i);
  assert.match(block, /--ink-line:\s*#d1d5db/i);
  assert.match(block, /--ink-soft-line:\s*#e5e7eb/i);
  assert.match(block, /--primary:\s*#1f3c88/i);
  assert.doesNotMatch(block, /#f6f3ec/i);
  assert.doesNotMatch(block, /#1f5eff/i);
  assert.match(css, /--font-sans:\s*var\(--font-inter\)/);
  assert.match(css, /--font-display:\s*var\(--font-space-grotesk\)/);
  assert.match(css, /--font-mono:\s*var\(--font-ibm-mono\)/);
  assert.match(css, /--ease-brand:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
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
  assert.match(css, /background:\s*#d1d5db/i);
  assert.match(css, /font-family:\s*var\(--font-plate\)/);
});

test("Fraunces stays on the plate variable and ThemeScript cannot add .dark", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /Fraunces\(/);
  assert.match(layout, /variable:\s*"--font-plate"/);
  assert.match(layout, /Inter\(/);
  assert.match(layout, /variable:\s*"--font-inter"/);
  assert.match(layout, /Space_Grotesk\(/);
  assert.match(layout, /variable:\s*"--font-space-grotesk"/);
  assert.match(layout, /IBM_Plex_Mono\(/);

  const theme = read("src/components/theme-script.tsx");
  assert.match(theme, /classList\.remove\(["']dark["']\)/);
  assert.doesNotMatch(theme, /classList\.(toggle|add)\(\s*["']dark["']/);
  assert.doesNotMatch(theme, /prefers-color-scheme/);
  assert.doesNotMatch(theme, /localStorage/);
});
