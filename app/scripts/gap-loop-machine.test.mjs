import assert from "node:assert/strict";
import test from "node:test";
import { LOOP_EVENTS, LOOP_LIMITS, LOOP_STATES, transition } from "../src/lib/gap-loop/machine.ts";

const ctx = {
  stepsThisRun: 0,
  stepsToday: 0,
  noProgressCycles: 0,
  scoreDelta: 0,
  allMet: false,
};

function move(state, event, extra = {}) {
  return transition(state, event, { ...ctx, ...extra });
}

test("every named state and event exists", () => {
  assert.equal(LOOP_STATES.length, 12);
  assert.equal(LOOP_EVENTS.length, 12);
  assert.equal(LOOP_LIMITS.stepsPerRun, 12);
  assert.equal(LOOP_LIMITS.stepsPerOwnerPerDay, 40);
  assert.equal(LOOP_LIMITS.stallCycles, 3);
  assert.equal(LOOP_LIMITS.minGainPoints, 2);
});

test("the happy path transitions", () => {
  assert.equal(move("draft", "start").state, "decompose");
  assert.equal(move("decompose", "revise").state, "decompose");
  assert.equal(move("decompose", "confirm").state, "analyze");
  assert.equal(move("analyze", "scored").state, "formulate");
  assert.equal(move("analyze", "scored", { allMet: true }).state, "done");
  assert.equal(move("analyze", "scored", { allMet: true }).summary, "This goal is met.");
  assert.equal(move("formulate", "asked").state, "waiting_on_user");
  assert.equal(move("waiting_on_user", "respond").state, "integrate");
  assert.equal(move("waiting_on_user", "decline").state, "rescore");
  assert.equal(move("integrate", "integrated").state, "rescore");
  const again = move("rescore", "rescored", { scoreDelta: 5 });
  assert.equal(again.state, "analyze");
  assert.equal(again.noProgressCycles, 0);
});

test("illegal transitions stay refused", () => {
  assert.equal(move("draft", "confirm").ok, false);
  assert.equal(move("analyze", "start").ok, false);
  assert.equal(move("paused", "scored").ok, false);
  assert.equal(move("done", "pause").ok, false);
  assert.equal(move("cancelled", "resume").ok, false);
  assert.equal(move("draft", "resume").ok, false);
});

test("pause and resume", () => {
  for (const state of ["draft", "decompose", "analyze", "formulate", "waiting_on_user", "integrate", "rescore"]) {
    const paused = move(state, "pause");
    assert.equal(paused.state, "paused", state);
    assert.equal(paused.summary, "Paused. Nothing runs until you resume.");
  }
  const resumed = move("paused", "resume");
  assert.equal(resumed.state, "analyze");
  assert.equal(move("analyze", "cancel").state, "cancelled");
  assert.match(move("analyze", "cancel").summary, /Saved material stays/);
});

test("step cap and day cap stop a system step", () => {
  const runCap = move("analyze", "scored", { stepsThisRun: LOOP_LIMITS.stepsPerRun });
  assert.equal(runCap.state, "capped");
  assert.equal(runCap.summary, "Paused at your limit.");
  const dayCap = move("formulate", "asked", { stepsToday: LOOP_LIMITS.stepsPerOwnerPerDay });
  assert.equal(dayCap.state, "capped");
  assert.equal(move("analyze", "scored", { stepsThisRun: LOOP_LIMITS.stepsPerRun - 1 }).state, "formulate");
  assert.equal(move("analyze", "pause", { stepsThisRun: LOOP_LIMITS.stepsPerRun }).state, "paused");
});

test("stalled after 3 cycles with under 2 points of gain", () => {
  const first = move("rescore", "rescored", { scoreDelta: 1, noProgressCycles: 0 });
  assert.equal(first.state, "analyze");
  assert.equal(first.noProgressCycles, 1);
  const second = move("rescore", "rescored", { scoreDelta: 0, noProgressCycles: 1 });
  assert.equal(second.noProgressCycles, 2);
  const third = move("rescore", "rescored", { scoreDelta: 1, noProgressCycles: 2 });
  assert.equal(third.state, "stalled");
  assert.match(third.summary, /Stuck/);
  const gained = move("rescore", "rescored", { scoreDelta: 2, noProgressCycles: 2 });
  assert.equal(gained.state, "analyze");
  assert.equal(gained.noProgressCycles, 0);
  const met = move("rescore", "rescored", { scoreDelta: 0, noProgressCycles: 2, allMet: true });
  assert.equal(met.state, "done");
});
