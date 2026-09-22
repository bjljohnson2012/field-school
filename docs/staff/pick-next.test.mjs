import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {formatPick, pickNext} from "./pick-next.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const state = JSON.parse(readFileSync(join(here, "state.json"), "utf8"));

test("untouched state picks N1 then C2, not N3", () => {
  const chosen = pickNext(state);
  assert.deepEqual(chosen.map((n) => n.id), ["N1", "C2"]);
  assert.match(formatPick(chosen).text, /^PICK N1 C2/m);
  assert.doesNotMatch(formatPick(chosen).text, /\bN3\b/);
});

test("after N1 PASS, pick C2 then FACTORY", () => {
  const next = structuredClone(state);
  next.dev.N1 = {status: "PASS", evidence: "chrome"};
  const chosen = pickNext(next);
  assert.deepEqual(chosen.map((n) => n.id), ["C2", "FACTORY"]);
});

test("N1 in flight blocks N3", () => {
  const next = structuredClone(state);
  next.dev.N1 = {status: "IN_FLIGHT"};
  next.in_flight = ["N1"];
  const ids = pickNext(next).map((n) => n.id);
  assert.ok(!ids.includes("N3"));
  assert.ok(ids.includes("C2"));
});

test("IDLE when nothing is READY", () => {
  const next = structuredClone(state);
  for (const bag of [next.company, next.dev]) {
    for (const id of Object.keys(bag)) bag[id].status = "PASS";
  }
  const {text, pick} = formatPick(pickNext(next));
  assert.deepEqual(pick, []);
  assert.match(text, /^IDLE/m);
});
