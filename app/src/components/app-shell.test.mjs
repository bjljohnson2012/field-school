import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..", "..");

function read(name) {
  return readFileSync(join(here, name), "utf8");
}

const shell = read("app-shell.tsx");
const header = read("site-header.tsx");
const chrome = read("chrome.tsx");
const palette = read("command-palette.tsx");
const files = [shell, header, chrome, palette].join("\n");
const guest = shell.slice(shell.indexOf("export function GuestChrome"));
const signedIn = shell.slice(0, shell.indexOf("export function GuestChrome"));
const AE_HEX = /#ff6a1a|#0b1f3a|#1f3c88/i;

function findTypescript(start) {
  let dir = start;
  for (;;) {
    const candidate = join(dir, "node_modules/typescript/lib/typescript.js");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error("typescript is required");
    dir = parent;
  }
}

const stub = [
  "export function jsx(){return null}",
  "export function jsxs(){return null}",
  "export const Fragment = Symbol.for('react.fragment')",
  "export function useEffect(){}",
  "export function useState(v){return [v, function(){}]}",
  "export function auth(){return Promise.resolve(null)}",
  "export function AppShell(){return null}",
  "export function GuestChrome(){return null}",
  "export function readOrgLogoUrl(){return ''}",
  "export function loadSession(){return Promise.resolve(null)}",
  "export function memberPlatformAdmin(){return Promise.resolve(false)}",
  "export function ImpersonationBanner(){return null}",
  "export function SiteFooter(){return null}",
  "export function SiteHeader(){return null}",
  "export const COMPANY_NAME = 'Field School'",
  "export default function Component(){return null}",
].join("\n");

function hookSource(tsPath) {
  return `
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ts = createRequire(${JSON.stringify(tsPath)})(${JSON.stringify(tsPath)});
const stubUrl = "data:text/javascript," + encodeURIComponent(${JSON.stringify(stub)});
const BARE = new Set(["react", "react/jsx-runtime", "react/jsx-dev-runtime", "next/link", "next/navigation"]);

export async function resolve(specifier, context, nextResolve) {
  if (BARE.has(specifier) || specifier.startsWith("@/")) return { url: stubUrl, shortCircuit: true };
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("data:")) return nextLoad(url, context);
  if (url.endsWith(".tsx") || url.endsWith(".ts")) {
    const path = fileURLToPath(url);
    const source = readFileSync(path, "utf8");
    const out = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: url.endsWith(".tsx") ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
      },
      fileName: path,
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
`;
}

register("data:text/javascript," + encodeURIComponent(hookSource(findTypescript(appRoot))), {
  parentURL: pathToFileURL(join(appRoot, "package.json")).href,
});

const { paletteItems } = await import(pathToFileURL(join(here, "command-palette.tsx")).href);

test("AppShell is always on", () => {
  assert.match(chrome, /<AppShell/);
  assert.match(chrome, /<GuestChrome/);
  assert.doesNotMatch(chrome, /COACHING_SHELL|coachingShellEnabled|SiteHeader|SiteFooter/);
  assert.doesNotMatch(shell, /COACHING_SHELL|COACHING_WRITES|COACHING_IMPORT|CRON_SECRET/);
});

test("AppShell imports navLinks and NEW_DOORS instead of copying the five words", () => {
  assert.match(shell, /import\s*\{[^}]*\bnavLinks\b[^}]*\}\s*from\s*"@\/components\/site-header"/);
  assert.match(shell, /import\s*\{[^}]*\bNEW_DOORS\b[^}]*\}\s*from\s*"@\/components\/site-header"/);
  assert.match(shell, /NEW_DOORS\.map/);
  assert.equal(shell.includes("/library/video"), false);
  assert.equal(shell.includes("/library/wizard"), false);
  assert.equal(shell.includes("/settings/ai"), false);
  assert.equal(shell.includes('label: "Learn"'), false);
  assert.equal(shell.includes('label: "People"'), false);
  assert.match(header, /export function navLinks/);
  assert.match(header, /export const NEW_DOORS/);
});

test("theme toggle is gone from the portal", () => {
  assert.doesNotMatch(shell, /ThemeToggle|theme-toggle/);
  assert.doesNotMatch(header, /ThemeToggle|theme-toggle/);
  assert.doesNotMatch(chrome, /ThemeToggle|theme-toggle/);
  assert.equal(existsSync(join(here, "theme-toggle.tsx")), false);
});

test("Tasks is sales-only and the palette is signed-in only", () => {
  assert.equal((shell.match(/href="\/tasks"/g) || []).length, 1);
  const link = shell.indexOf('href="/tasks"');
  const mount = shell.indexOf("<TasksNavBadge");
  const avatar = shell.indexOf('aria-haspopup="menu"');
  assert.ok(link >= 0 && mount > link && mount < avatar);
  assert.match(shell, /fallback=\{openTasks\}/);
  assert.match(shell, /room === "sales" \? \(/);
  assert.doesNotMatch(guest, /TasksNavBadge|href="\/tasks"|CommandPalette|paletteItems/);
  assert.match(signedIn, /<CommandPalette/);
  assert.match(palette, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(palette, /key === "k"/);
  assert.doesNotMatch(palette, /fetch\(/);
});

test("household palette has no sales coaching routes", () => {
  const doors = [
    { href: "/library/video", label: "Long-form video" },
    { href: "/library/wizard", label: "Wizard" },
    { href: "/settings/ai", label: "Connect AI" },
  ];
  const nav = [
    { href: "/dashboard", label: "Learn" },
    { href: "/people", label: "People" },
    { href: "/o/household/l", label: "Library" },
    { href: "/insights", label: "Insights" },
  ];
  const coaching = [
    { href: "/card", label: "My Card" },
    { href: "/roster", label: "Roster" },
    { href: "/o/sales/welcome", label: "Course" },
    { href: "/coaching/products", label: "Products" },
  ];
  const household = paletteItems({ room: "household", nav, doors, coaching });
  assert.deepEqual(
    household.map((item) => item.href),
    ["/dashboard", "/people", "/o/household/l", "/insights", "/library/video", "/library/wizard", "/settings/ai"],
  );
  assert.equal(household.some((item) => item.href === "/card" || item.href === "/roster"), false);
  const sales = paletteItems({
    room: "sales",
    nav: [
      { href: "/dashboard", label: "Learn" },
      { href: "/skills", label: "Me" },
    ],
    doors: [],
    coaching,
  });
  assert.equal(sales.some((item) => item.href === "/card"), true);
  assert.equal(sales.some((item) => item.href === "/roster"), true);
  assert.equal(
    paletteItems({ room: "operator", nav, doors: [], coaching }).some((item) => item.href === "/card"),
    false,
  );
});

test("wordmark is Field School in Fraunces on the cream bar", () => {
  assert.match(shell, /COMPANY_NAME/);
  assert.match(shell, /data-wordmark/);
  assert.match(shell, /font-display/);
  assert.match(shell, /font-medium/);
  assert.match(shell, /bg-background\/88/);
  assert.match(shell, /backdrop-blur-md/);
  assert.match(shell, /border-border/);
  assert.match(shell, /isolated-seal-56\.png/);
  assert.match(signedIn, /<Wordmark/);
  assert.match(guest, /<Wordmark/);
  assert.doesNotMatch(shell, /\bCoach\b|Sales Coach AI/);
  assert.doesNotMatch(shell, /orgName/);
  assert.doesNotMatch(files, AE_HEX);
  assert.doesNotMatch(files, /bg-brand-navy|text-brand-orange|bg-brand-orange|font-\[family-name:var\(--font-inter\)\]|space-grotesk|Space Grotesk/);
  assert.match(shell, /bg-primary/);
  assert.match(shell, /border-b-2 border-primary/);
});
