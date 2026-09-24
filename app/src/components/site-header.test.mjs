import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const headerPath = join(here, "site-header.tsx");
const appRoot = join(here, "..", "..");
const headerSource = readFileSync(headerPath, "utf8");

const LEADER_STANCES = ["admin", "guardian", "trainer", "teacher"];
const LEADER_LABELS = ["Learn", "People", "Library", "Insights"];
const NEW_DOOR_HREFS = ["/library/video", "/library/wizard", "/settings/ai"];

function findTypescript(start) {
  let dir = start;
  for (;;) {
    const candidate = join(dir, "node_modules/typescript/lib/typescript.js");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error("typescript is required to import site-header.tsx");
    }
    dir = parent;
  }
}

function hookSource(tsPath) {
  const stub = [
    "export function jsx(){return null}",
    "export function jsxs(){return null}",
    "export const Fragment = Symbol.for('react.fragment')",
    "export function useEffect(){}",
    "export function useState(v){return [v, function(){}]}",
    "export function useSyncExternalStore(_s, get, server){return server ? server() : get()}",
    "export function useSession(){return { data: null, status: 'unauthenticated' }}",
    "export function signOut(){return Promise.resolve()}",
    "export function usePathname(){return '/'}",
    "export function useRouter(){return { push(){}, replace(){} }}",
    "export function Moon(){return null}",
    "export function Sun(){return null}",
    "export default function Component(){return null}",
  ].join("\n");
  return `
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const appRoot = ${JSON.stringify(appRoot)};
const ts = createRequire(${JSON.stringify(tsPath)})(${JSON.stringify(tsPath)});
const stubUrl = "data:text/javascript," + encodeURIComponent(${JSON.stringify(stub)});
const BARE = new Set(["react", "react/jsx-runtime", "react/jsx-dev-runtime", "next/link", "next/navigation", "next-auth/react", "lucide-react"]);

function fileFor(specifier) {
  const base = join(appRoot, "src", specifier.slice(2));
  const candidates = [base, base + ".ts", base + ".tsx", base + ".js", base + ".mjs", join(base, "index.ts"), join(base, "index.tsx")];
  return candidates.find((path) => existsSync(path)) || null;
}

export async function resolve(specifier, context, nextResolve) {
  if (BARE.has(specifier)) return { url: stubUrl, shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const found = fileFor(specifier);
    if (!found) throw new Error("alias miss " + specifier);
    return { url: pathToFileURL(found).href, shortCircuit: true };
  }
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

const { navLinks, NEW_DOORS } = await import(pathToFileURL(headerPath).href);

function leaderStanceSet() {
  const match = headerSource.match(/const LEADER_STANCES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(match, "LEADER_STANCES");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

test("leader bar shows Learn, People, Library, Insights, and New for leader stances", () => {
  assert.deepEqual(leaderStanceSet(), LEADER_STANCES);
  assert.match(headerSource, /const leader = LEADER_STANCES\.has\(stance\)/);
  assert.match(headerSource, /const showNew = loggedIn && leader/);
  assert.match(headerSource, /\{showNew \? <NewMenu \/> : null\}/);
  assert.match(headerSource, />\s*New\s*</);
  assert.match(headerSource, /NEW_DOORS\.map\(\(door\)/);

  for (const org of ["sales", "household"]) {
    const links = navLinks({ loggedIn: true, guest: false, leader: true, org });
    assert.deepEqual(
      links.map((link) => link.label),
      LEADER_LABELS,
    );
    assert.equal(
      links.some((link) => link.label === "New"),
      false,
    );
  }

  for (const org of ["sales", "household"]) {
    const links = navLinks({ loggedIn: true, guest: false, leader: false, org });
    assert.deepEqual(
      links.map((link) => link.label),
      ["Learn", "Me"],
    );
  }
  assert.equal(leaderStanceSet().includes("learner"), false);

  assert.deepEqual(navLinks({ loggedIn: false, guest: true, leader: false, org: "" }), []);
  assert.deepEqual(navLinks({ loggedIn: false, guest: true, leader: true, org: "sales" }), []);
  assert.deepEqual(navLinks({ loggedIn: false, guest: false, leader: true, org: "sales" }), []);
});

test("New doors are video, wizard, and connect AI in that order", () => {
  assert.deepEqual(
    NEW_DOORS.map((door) => door.href),
    NEW_DOOR_HREFS,
  );
  assert.equal(NEW_DOORS.length, 3);
});
