import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..", "..", "..");

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

function hookSource(tsPath) {
  return `
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ts = createRequire(${JSON.stringify(tsPath)})(${JSON.stringify(tsPath)});
const src = ${JSON.stringify(join(appRoot, "src"))};

export async function resolve(specifier, context, nextResolve) {
  const parent = context.parentURL || "";
  const ours = parent.includes("/app/src/") || parent.includes("/app/scripts/");
  if (ours && specifier.startsWith("@/")) {
    const bare = specifier.slice(2);
    const base = src + "/" + bare;
    for (const ext of [".ts", ".tsx"]) {
      try {
        return await nextResolve(pathToFileURL(base + ext).href, context);
      } catch {}
    }
  }
  if (ours && specifier.startsWith(".") && !/\\.(tsx|ts|js|mjs|cjs|json)$/.test(specifier)) {
    try {
      return await nextResolve(specifier + ".ts", context);
    } catch {
      return nextResolve(specifier + ".tsx", context);
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
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

const { buttonVariants } = await import(pathToFileURL(join(here, "button.tsx")).href);
const { badgeVariants } = await import(pathToFileURL(join(here, "badge.tsx")).href);
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { EmptyState } = await import(pathToFileURL(join(here, "empty-state.tsx")).href);
const { Card, CardTitle } = await import(pathToFileURL(join(here, "card.tsx")).href);

const files = ["button.tsx", "card.tsx", "input.tsx", "label.tsx", "textarea.tsx", "badge.tsx", "empty-state.tsx"];

test("primitive variants use AE anatomy and Field School color tokens", () => {
  const primary = buttonVariants({ variant: "default" });
  assert.match(primary, /rounded-brand/);
  assert.match(primary, /px-5/);
  assert.match(primary, /py-2\.5/);
  assert.match(primary, /font-semibold/);
  assert.match(primary, /duration-200/);
  assert.match(primary, /ease-brand/);
  assert.match(primary, /focus-visible:\[box-shadow:0_0_0_4px_color-mix\(in_oklab,var\(--ring\)_25%,transparent\)\]/);
  assert.match(primary, /bg-primary/);
  assert.match(primary, /text-primary-foreground/);
  assert.match(primary, /hover:-translate-y-px/);
  assert.doesNotMatch(primary, /brand-orange|#ff6a1a/i);

  const secondary = buttonVariants({ variant: "secondary" });
  assert.match(secondary, /border-primary\/25/);
  assert.match(secondary, /bg-card/);
  assert.match(secondary, /text-primary/);
  assert.match(secondary, /hover:bg-primary\/5/);
  assert.doesNotMatch(secondary, /bg-primary /);

  const ghost = buttonVariants({ variant: "ghost" });
  assert.match(ghost, /text-muted-foreground/);
  assert.match(ghost, /hover:bg-muted/);

  const danger = buttonVariants({ variant: "destructive" });
  assert.match(danger, /bg-destructive/);
  assert.match(danger, /text-primary-foreground/);

  const outline = buttonVariants({ variant: "outline" });
  assert.match(outline, /border-input/);
  assert.match(outline, /bg-card/);

  assert.match(badgeVariants({ variant: "default" }), /rounded-full/);
  assert.match(badgeVariants({ variant: "default" }), /bg-primary\/10/);
  assert.match(badgeVariants({ variant: "default" }), /text-primary/);
  assert.match(badgeVariants({ variant: "default" }), /font-semibold/);
  assert.match(badgeVariants({ variant: "success" }), /bg-pass\/10/);
  assert.match(badgeVariants({ variant: "success" }), /text-pass/);
  assert.match(badgeVariants({ variant: "warning" }), /bg-warn\/15/);
  assert.match(badgeVariants({ variant: "destructive" }), /bg-destructive\/10/);
  assert.match(badgeVariants({ variant: "secondary" }), /bg-muted/);
});

test("empty state is eyebrow, display title, and a secondary action", () => {
  const html = renderToStaticMarkup(
    createElement(EmptyState, {
      eyebrow: "Library",
      title: "No lessons yet",
      description: "Lessons you add show up here.",
      action: { label: "Open the library", href: "/library" },
    }),
  );
  assert.match(html, /data-slot="empty-state"/);
  assert.match(html, /class="eyebrow"/);
  assert.match(html, /Library/);
  assert.match(html, /<h2 class="h-section mt-2">No lessons yet<\/h2>/);
  assert.match(html, /text-muted-foreground/);
  assert.match(html, /border-primary\/25/);
  assert.match(html, /text-primary/);
  assert.match(html, /href="\/library"/);
  assert.match(html, /Open the library/);
  assert.doesNotMatch(html, /bg-primary /);
  assert.doesNotMatch(html, /brand-orange|#ff6a1a/i);
});

test("cards use AE elevation with Field School border and ink", () => {
  const html = renderToStaticMarkup(
    createElement(Card, null, createElement(CardTitle, null, "Session")),
  );
  assert.match(html, /data-slot="card"/);
  assert.match(html, /rounded-card/);
  assert.match(html, /border-border/);
  assert.match(html, /bg-card/);
  assert.match(html, /text-card-foreground/);
  assert.match(html, /shadow-card/);
  assert.match(html, /hover:shadow-card-hover/);
  assert.match(html, /hover:-translate-y-0\.5/);
  assert.match(html, /hover:border-primary\/25/);
  assert.match(html, /class="h-card/);
  assert.doesNotMatch(html, /brand-orange|#ff6a1a|ring-foreground/i);
});

test("primitive sources have no AE orange", () => {
  const blob = files.map((name) => readFileSync(join(here, name), "utf8")).join("\n");
  assert.doesNotMatch(blob, /#ff6a1a/i);
  assert.doesNotMatch(blob, /brand-orange/);
  assert.doesNotMatch(blob, /#0b1f3a/i);
  assert.match(readFileSync(join(here, "input.tsx"), "utf8"), /rounded-brand/);
  assert.match(readFileSync(join(here, "input.tsx"), "utf8"), /border-input/);
  assert.match(readFileSync(join(here, "input.tsx"), "utf8"), /0_0_0_4px_color-mix\(in_oklab,var\(--ring\)_15%,transparent\)/);
  assert.match(readFileSync(join(here, "input.tsx"), "utf8"), /px-4/);
  assert.match(readFileSync(join(here, "input.tsx"), "utf8"), /py-2\.5/);
  assert.match(readFileSync(join(here, "label.tsx"), "utf8"), /font-semibold/);
  assert.match(readFileSync(join(here, "label.tsx"), "utf8"), /text-muted-foreground/);
  assert.match(readFileSync(join(here, "label.tsx"), "utf8"), /mb-1\.5/);
  assert.match(readFileSync(join(here, "textarea.tsx"), "utf8"), /rounded-brand/);
  assert.match(readFileSync(join(here, "textarea.tsx"), "utf8"), /border-input/);
  assert.match(readFileSync(join(here, "textarea.tsx"), "utf8"), /0_0_0_4px_color-mix\(in_oklab,var\(--ring\)_15%,transparent\)/);
});
