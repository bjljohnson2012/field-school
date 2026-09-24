import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { coachingNav } from "../src/lib/coaching/nav.ts";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");
const reactStub = `
export function useState(value) { return [value, function () {}]; }
export function useMemo(fn) { return fn(); }
`;
const jsxStub = `
export function jsx() { return null; }
export function jsxs() { return null; }
export const Fragment = "Fragment";
`;

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(${JSON.stringify(join(root, "package.json"))});
const ts = require("typescript");
const reactStub = ${JSON.stringify(reactStub)};
const jsxStub = ${JSON.stringify(jsxStub)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "react") {
    return { url: "data:text/javascript," + encodeURIComponent(reactStub), shortCircuit: true };
  }
  if (specifier === "react/jsx-runtime" || specifier === "react/jsx-dev-runtime") {
    return { url: "data:text/javascript," + encodeURIComponent(jsxStub), shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && (url.endsWith(".tsx") || url.endsWith(".ts"))) {
    const source = readFileSync(new URL(url), "utf8");
    const out = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    return { format: "module", source: out, shortCircuit: true };
  }
  return nextLoad(url, context);
}
`),
  { parentURL: pathToFileURL(new URL(import.meta.url).pathname).href },
);

const { ITEMS, filterHelpItems } = await import(
  pathToFileURL(join(src, "components/help-client.tsx")).href
);

const read = (rel) => readFileSync(join(root, rel), "utf8");
const page = read("src/app/help/page.tsx");
const client = read("src/components/help-client.tsx");
const nav = read("src/lib/coaching/nav.ts");

function titles(viewer) {
  return filterHelpItems(ITEMS, viewer).map((item) => item.title);
}

test("hrefs are the campus paths and orgs has no link", () => {
  const href = (title) => ITEMS.find((item) => item.title === title)?.href;
  assert.equal(href("Intake"), "/intake");
  assert.equal(href("Reviews"), "/coaching/reviews");
  assert.equal(href("Tasks"), "/tasks");
  assert.equal(href("Knowledge"), "/coaching/knowledge");
  assert.equal(href("Products"), "/coaching/products");
  assert.equal(href("Users"), "/coaching/users");
  const orgs = ITEMS.find((item) => item.title === "Organizations");
  assert.equal(orgs?.href, undefined);
  assert.match(orgs?.body ?? "", /org/i);
  const blob = JSON.stringify(ITEMS);
  for (const stale of ["/ae/intake", "/director/reviews", "/director/knowledge", "/director/products", "/admin/users", "/admin/orgs"]) {
    assert.equal(blob.includes(stale), false, stale);
  }
});

test("knowledge, products, and users stay linked when nav disables them", () => {
  const items = coachingNav({ orgKind: "sales", capabilities: ["coach"], platformAdmin: false });
  assert.equal(items.find((item) => item.href === "/coaching/products")?.disabled, true);
  assert.equal(items.find((item) => item.href === "/coaching/knowledge")?.disabled, true);
  assert.equal(ITEMS.find((item) => item.title === "Products")?.href, "/coaching/products");
  assert.equal(ITEMS.find((item) => item.title === "Knowledge")?.href, "/coaching/knowledge");
  assert.equal(ITEMS.find((item) => item.title === "Users")?.href, "/coaching/users");
});

test("filter matches any audience and keeps learner items on the non-elevated path", () => {
  assert.deepEqual(titles({ capabilities: [], platformAdmin: false }), ["Intake", "Tasks"]);
  assert.deepEqual(titles({ capabilities: ["learner"], platformAdmin: false }), ["Intake", "Tasks"]);
  assert.deepEqual(titles({ capabilities: ["coach"], platformAdmin: false }), [
    "Tasks",
    "Reviews",
    "Knowledge",
    "Products",
  ]);
  assert.deepEqual(titles({ capabilities: ["leader"], platformAdmin: false }), [
    "Tasks",
    "Reviews",
    "Knowledge",
    "Team",
  ]);
  assert.deepEqual(titles({ capabilities: ["admin"], platformAdmin: false }), ["Tasks", "Users"]);
  assert.deepEqual(titles({ capabilities: [], platformAdmin: true }), ["Tasks", "Organizations"]);
  assert.deepEqual(titles({ capabilities: ["coach", "admin"], platformAdmin: false }), [
    "Tasks",
    "Reviews",
    "Knowledge",
    "Products",
    "Users",
  ]);

  const both = [
    { title: "Both", body: "shared", tags: [], href: "/tasks", audience: ["learner", "coach"] },
  ];
  assert.equal(filterHelpItems(both, { capabilities: [], platformAdmin: false }).length, 1);
  assert.equal(filterHelpItems(both, { capabilities: ["coach"], platformAdmin: false }).length, 1);
  assert.equal(filterHelpItems(both, { capabilities: ["admin"], platformAdmin: false }).length, 0);
  assert.equal(filterHelpItems(both, { capabilities: [], platformAdmin: true }).length, 0);
  const platformOnly = [{ title: "Orgs", body: "orgs", tags: ["orgs"], audience: ["platformAdmin"] }];
  assert.equal(filterHelpItems(platformOnly, { capabilities: ["platformAdmin"], platformAdmin: false }).length, 0);
  assert.equal(filterHelpItems(platformOnly, { capabilities: [], platformAdmin: true }).length, 1);
});

test("Help is on the sales coach nav and ready, including platform admin on that base", () => {
  for (const capabilities of [["coach"], ["leader"], ["admin"]]) {
    const items = coachingNav({ orgKind: "sales", capabilities, platformAdmin: false });
    const help = items.find((item) => item.label === "Help");
    assert.equal(help?.href, "/help");
    assert.equal(help?.disabled, false);
    assert.equal(items.some((item) => item.label === "Compare" || item.href === "/coaching/compare"), false);
    assert.equal(items.some((item) => item.href === "/tasks" || item.label === "Tasks"), false);
  }
  for (const orgKind of ["sales", "company"]) {
    const items = coachingNav({ orgKind, capabilities: [], platformAdmin: true });
    assert.equal(items.find((item) => item.label === "Help")?.href, "/help");
    assert.equal(items.find((item) => item.label === "Help")?.disabled, false);
  }
});

test("Help stays off learner and household nav", () => {
  const cases = [
    { orgKind: "sales", capabilities: [], platformAdmin: false },
    { orgKind: "sales", capabilities: ["learner"], platformAdmin: false },
    { orgKind: "household", capabilities: ["learner"], platformAdmin: false },
    { orgKind: "homeschool", capabilities: [], platformAdmin: false },
    { orgKind: "household", capabilities: ["teacher"], platformAdmin: false },
    { orgKind: "household", capabilities: ["guardian"], platformAdmin: false },
    { orgKind: "household", capabilities: ["admin"], platformAdmin: false },
    { orgKind: "household", capabilities: [], platformAdmin: true },
    { orgKind: "other", capabilities: [], platformAdmin: true },
  ];
  for (const input of cases) {
    const items = coachingNav(input);
    assert.equal(
      items.some((item) => item.href === "/help" || item.label === "Help"),
      false,
      JSON.stringify(input),
    );
    assert.equal(items.some((item) => item.label === "Compare" || item.href === "/coaching/compare"), false);
  }
});

test("guest redirect requires a signed-in coaching identity and does not import the AI client", () => {
  assert.match(page, /loaded\.status === 401/);
  assert.match(page, /redirect\("\/login\?next=\/help"\)/);
  assert.match(page, /capabilities=\{capabilitiesFor/);
  assert.match(page, /platformAdmin=\{memberHasPlatformAdmin/);
  assert.match(client, /className="card/);
  assert.match(client, /className="input"/);
  assert.match(client, /className="h-page"/);
  assert.match(client, /className="btn-primary"/);
  assert.match(nav, /"\/help"/);
  for (const source of [page, client, nav]) {
    assert.equal(source.includes("lib/ai/client"), false);
    assert.equal(source.includes("enum Role"), false);
  }
});
