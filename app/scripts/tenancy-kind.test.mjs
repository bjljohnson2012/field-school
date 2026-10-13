import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { coachingNav } from "../src/lib/coaching/nav.ts";
import { isHomeschool, roomOf } from "../src/lib/tenancy/kind.ts";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = join(root, "src");
register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let target = src + "/" + specifier.slice(2);
    if (!/\\.(ts|tsx|js|mjs|cjs|json)$/.test(target)) target += ".ts";
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}
`),
);
const { drillsForOrg } = await import(pathToFileURL(join(src, "app/api/coaching/drills/math.ts")).href);

test("roomOf aliases old kinds and gives the seeded operator kind no room", () => {
  assert.equal(roomOf("homeschool"), "family");
  assert.equal(roomOf("household"), "family");
  assert.equal(roomOf("family"), "family");
  assert.equal(roomOf("company"), "team");
  assert.equal(roomOf("sales"), "team");
  assert.equal(roomOf("team"), "team");
  assert.equal(roomOf("gym"), null);
  assert.equal(roomOf("platform"), null);
  assert.equal(roomOf("  Company "), "team");
});

test("isHomeschool is the mode flag, and the old kind still counts", () => {
  assert.equal(isHomeschool({ kind: "homeschool", homeschoolMode: false }), true);
  assert.equal(isHomeschool({ kind: "family", homeschoolMode: true }), true);
  assert.equal(isHomeschool({ kind: "family", homeschoolMode: false }), false);
  assert.equal(isHomeschool({ kind: "team", homeschoolMode: true }), false);
  assert.equal(isHomeschool({ kind: "company", homeschoolMode: false }), false);
});

test("coaching nav and drills still treat homeschool and company as the old rooms", () => {
  const home = coachingNav({ orgKind: "homeschool", capabilities: ["learner"], platformAdmin: false });
  assert.equal(home.find((item) => item.label === "Home")?.href, "/o/household/welcome");
  const company = coachingNav({ orgKind: "company", capabilities: [], platformAdmin: true });
  assert.equal(company.some((item) => item.label === "Roster"), true);
  assert.equal(drillsForOrg("homeschool"), false);
  assert.equal(drillsForOrg("company"), true);
  assert.equal(drillsForOrg("family"), false);
  assert.equal(drillsForOrg("team"), true);
});
