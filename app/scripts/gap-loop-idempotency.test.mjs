import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runStep } from "../src/lib/gap-loop/step.ts";

function memoryStore() {
  let locked = false;
  let runner = "";
  const events = [];
  const run = {
    id: "run-1",
    state: "draft",
    cycle: 1,
    stepCount: 0,
    noProgressCycles: 0,
    lastScore: 0,
    ownerMembershipId: "mem-1",
    nextSeq: 1,
  };
  return {
    events,
    run,
    async claim(_runId, runnerId) {
      if (locked && runner !== runnerId) return false;
      locked = true;
      runner = runnerId;
      return true;
    },
    async release(_runId, runnerId) {
      if (runner === runnerId) {
        locked = false;
        runner = "";
      }
    },
    async load() {
      return { ...run };
    },
    async stepsToday() {
      return 0;
    },
    async findEvent(key) {
      return events.find((event) => event.idempotencyKey === key) ?? null;
    },
    async commit(input) {
      const found = events.find((event) => event.idempotencyKey === input.idempotencyKey);
      if (found) return { inserted: false, event: found };
      const event = {
        idempotencyKey: input.idempotencyKey,
        seq: input.seq,
        fromState: input.fromState,
        toState: input.toState,
        kind: input.kind,
        summary: input.summary,
        detail: input.detail,
      };
      events.push(event);
      run.state = input.toState;
      run.stepCount = input.stepCount;
      run.noProgressCycles = input.noProgressCycles;
      run.lastScore = input.lastScore;
      run.cycle = input.cycle;
      run.nextSeq += 1;
      return { inserted: true, event };
    },
  };
}

test("the same idempotency key twice writes one event", async () => {
  const store = memoryStore();
  const opts = {
    runId: "run-1",
    idempotencyKey: "run-1:1:draft",
    runnerId: "tab-a",
    act: async () => ({ event: "start", detail: { requirements: 3 } }),
  };
  const first = await runStep(store, opts);
  const second = await runStep(store, opts);
  assert.equal(first.ok, true);
  assert.equal(first.replay, false);
  assert.equal(first.state, "decompose");
  assert.equal(second.ok, true);
  assert.equal(second.replay, true);
  assert.equal(store.events.length, 1);
  assert.equal(second.event.summary, first.event.summary);
});

test("a second concurrent runner gets no lease", async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let locked = false;
  const store = memoryStore();
  const originalClaim = store.claim.bind(store);
  store.claim = async (runId, runnerId) => {
    if (locked) return false;
    locked = true;
    if (runnerId === "tab-a") await gate;
    return originalClaim(runId, runnerId);
  };
  const opts = {
    runId: "run-1",
    idempotencyKey: "run-1:1:draft",
    act: async () => ({ event: "start" }),
  };
  const first = runStep(store, { ...opts, runnerId: "tab-a" });
  await Promise.resolve();
  const second = await runStep(store, { ...opts, runnerId: "tab-b" });
  assert.equal(second.ok, false);
  assert.equal(second.error, "lease_held");
  release();
  const done = await first;
  assert.equal(done.ok, true);
  assert.equal(store.events.length, 1);
});

test("the store lease and idempotent insert are in the SQL path", () => {
  const source = readFileSync(new URL("../src/lib/gap-loop/store.ts", import.meta.url), "utf8");
  assert.match(source, /ON CONFLICT \(idempotency_key\) DO NOTHING/);
  assert.match(source, /FOR UPDATE SKIP LOCKED/);
  assert.match(source, /lease_until/);
});
