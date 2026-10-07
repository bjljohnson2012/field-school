import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {formatPick, pickNext, pickOpen} from "./pick-next.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const live = JSON.parse(readFileSync(join(here, "state.json"), "utf8"));

// The picker contract from 22 Sep, before state.json moved those rows to PASS.
const untouched = {
  company: {
    C1: {status: "READY"},
    C2: {status: "READY"},
  },
  dev: {
    N1: {status: "READY"},
    N2: {status: "BLOCKED"},
    N3: {status: "READY"},
    N12: {status: "HELD"},
    N15: {status: "BLOCKED"},
    FACTORY: {status: "READY"},
  },
  in_flight: [],
};

test("untouched MERGE includes N1 and C2, excludes N3", () => {
  const chosen = pickNext(untouched);
  const ids = chosen.map((n) => n.id);
  assert.equal(ids[0], "N1");
  assert.ok(ids.includes("C2"));
  assert.ok(ids.includes("FACTORY"));
  assert.ok(ids.includes("C1"));
  assert.ok(!ids.includes("N3"));
  assert.match(formatPick(chosen).text, /^MERGE N1 /m);
});

test("OPEN lists blocked drafts, not HELD", () => {
  const opened = pickOpen(untouched);
  const ids = opened.map((n) => n.id);
  assert.ok(ids.includes("N2"));
  assert.ok(ids.includes("N15"));
  assert.ok(!ids.includes("N12"));
  assert.ok(!ids.includes("N0"));
});

test("after N1 PASS, N3 may MERGE and N1 is gone", () => {
  const next = structuredClone(untouched);
  next.dev.N1 = {status: "PASS", evidence: "chrome"};
  const ids = pickNext(next).map((n) => n.id);
  assert.ok(!ids.includes("N1"));
  assert.ok(ids.includes("C2"));
  assert.ok(ids.includes("FACTORY"));
  assert.ok(ids.includes("N3"));
});

test("N1 in flight blocks N3", () => {
  const next = structuredClone(untouched);
  next.dev.N1 = {status: "IN_FLIGHT"};
  next.in_flight = ["N1"];
  const ids = pickNext(next).map((n) => n.id);
  assert.ok(!ids.includes("N3"));
  assert.ok(ids.includes("C2"));
});

test("IDLE when nothing is READY", () => {
  const next = structuredClone(untouched);
  for (const bag of [next.company, next.dev]) {
    for (const id of Object.keys(bag)) bag[id].status = "PASS";
  }
  const {text, pick} = formatPick(pickNext(next));
  assert.deepEqual(pick, []);
  assert.match(text, /^IDLE/m);
});

test("live state keeps N12 held and does not reopen PASS nodes", () => {
  assert.equal(live.launch, "CLOSED 0/8");
  assert.equal(live.outcome, false);
  const merge = pickNext(live).map((node) => node.id);
  const open = pickOpen(live).map((node) => node.id);
  assert.ok(!merge.includes("N12"));
  assert.ok(!open.includes("N12"));
  assert.ok(!merge.includes("N1"));
  assert.ok(!open.includes("N1"));
  assert.ok(open.includes("N13"));
  assert.ok(open.includes("N14"));
});
