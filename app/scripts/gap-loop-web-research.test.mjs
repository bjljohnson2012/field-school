import assert from "node:assert/strict";
import test from "node:test";
import {
  allowSpend,
  decideApproval,
  estimateSearchMicros,
  genericWebQuery,
  RESEARCH_CAPS,
  runApprovedSearch,
} from "../src/lib/gap-loop/research.ts";

test("approve with the wrong query text fails and does not search", async () => {
  let calls = 0;
  const decision = decideApproval({
    storedQuery: "fractions overview",
    submittedQuery: "algebra overview",
    identifiers: [],
  });
  assert.equal(decision.ok, false);
  assert.equal(decision.error, "query_mismatch");
  const ran = await runApprovedSearch({
    query: "fractions overview",
    identifiers: [],
    taskSpentMicros: 0,
    monthSpentMicros: 0,
    declined: true,
    search: async () => {
      calls += 1;
      return null;
    },
  });
  assert.equal(ran.called, false);
  assert.equal(calls, 0);
});

test("approve then run creates a cited node with a URL and a retrieved date", async () => {
  const result = await runApprovedSearch({
    query: genericWebQuery("fractions"),
    identifiers: [],
    taskSpentMicros: 0,
    monthSpentMicros: 0,
    search: async () => ({
      url: "https://example.com/fractions",
      title: "Fractions",
      retrievedOn: "2026-10-14",
      usdMicros: 5000,
    }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.called, true);
  assert.equal(result.node.evidence[0].url, "https://example.com/fractions");
  assert.equal(result.node.evidence[0].id, "https://example.com/fractions");
  assert.equal(result.node.evidence[0].retrieved, "2026-10-14");
  assert.equal(result.node.evidence.length >= 1, true);
});

test("decline skips the web call", async () => {
  let calls = 0;
  const result = await runApprovedSearch({
    query: "fractions overview",
    identifiers: [],
    taskSpentMicros: 0,
    monthSpentMicros: 0,
    declined: true,
    search: async () => {
      calls += 1;
      return { url: "https://example.com/x", title: "X", retrievedOn: "2026-10-14", usdMicros: 1 };
    },
  });
  assert.equal(result.error, "declined");
  assert.equal(calls, 0);
});

test("a child-scope query with a display name is blocked and an event is returned", async () => {
  let calls = 0;
  const decision = decideApproval({
    storedQuery: "Robin fractions overview",
    submittedQuery: "Robin fractions overview",
    identifiers: ["Robin"],
  });
  assert.equal(decision.ok, false);
  assert.equal(decision.error, "kid_identifier_blocked");
  assert.equal(decision.event.kind, "kid_query_blocked");
  assert.equal(decision.event.summary, "Search blocked.");
  const ran = await runApprovedSearch({
    query: "Robin fractions overview",
    identifiers: ["Robin", "robin@home.test"],
    taskSpentMicros: 0,
    monthSpentMicros: 0,
    search: async () => {
      calls += 1;
      return null;
    },
  });
  assert.equal(ran.called, false);
  assert.equal(calls, 0);
  assert.equal(ran.event.kind, "kid_query_blocked");
});

test("cost caps hard-stop before a search", async () => {
  let calls = 0;
  const estimate = estimateSearchMicros();
  assert.ok(estimate < RESEARCH_CAPS.perTaskUsdMicros);
  assert.equal(allowSpend(0, RESEARCH_CAPS.perMonthUsdMicros, estimate).ok, false);
  const stopped = await runApprovedSearch({
    query: "fractions overview",
    identifiers: [],
    taskSpentMicros: 0,
    monthSpentMicros: RESEARCH_CAPS.perMonthUsdMicros,
    search: async () => {
      calls += 1;
      return null;
    },
  });
  assert.equal(stopped.error, "month_cap");
  assert.equal(stopped.called, false);
  assert.equal(calls, 0);
  const taskStopped = await runApprovedSearch({
    query: "fractions overview",
    identifiers: [],
    taskSpentMicros: RESEARCH_CAPS.perTaskUsdMicros,
    monthSpentMicros: 0,
    search: async () => {
      calls += 1;
      return null;
    },
  });
  assert.equal(taskStopped.error, "task_cap");
  assert.equal(calls, 0);
});
