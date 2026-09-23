import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard, pickSuggestionKey, suggestionPrompt, suggestForPerson } from "../src/lib/living-brain/model.ts";
import { playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function person(overrides) {
  return {
    membershipId: "person-1",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "Reads at the table.",
    outcomes: "",
    ownsOutcomes: false,
    history: [],
    confidence: "",
    ...overrides,
  };
}

function brain(room, people) {
  return { orgId: "org-1", room, facts: "Desk facts", outcome: "", people };
}

test("AI suggestion context includes LessonSpine progress in both rooms", async () => {
  const homeBrain = brain("household", [person({})]);
  const wrote = playWriteBody({ room: "household", brain: homeBrain, chapterId: "sting" });
  assert.equal(wrote?.login, "none");
  assert.equal(wrote?.outcomes, "Continue LessonSpine at Slate");
  const homePrompt = suggestionPrompt({
    room: "household",
    person: { ...person({ outcomes: wrote.outcomes, history: [{ outcomes: "Continue LessonSpine at Sting" }] }), confidence: "Steady" },
    facts: "Desk facts",
    outcome: "Finish the year",
    context: { nextStep: wrote.outcomes },
  });
  assert.match(homePrompt, /The child has no login/);
  assert.match(homePrompt, /LessonSpine progress: Continue LessonSpine at Slate/);
  assert.match(homePrompt, /How they are doing: Getting there/);
  assert.match(homePrompt, /What this family is aiming for: Finish the year/);
  assert.doesNotMatch(homePrompt, /How they are doing: Steady/);

  const plain = suggestionPrompt({
    room: "household",
    person: person({ outcomes: "Old page", confidence: "Steady at the table", history: [{ outcomes: "Start the page" }] }),
    facts: "Desk facts",
    outcome: "Finish the year",
    context: { nextStep: "Finish the next page" },
  });
  assert.match(plain, /How they are doing: Steady at the table/);
  assert.doesNotMatch(plain, /LessonSpine progress/);

  let fallbackPrompt = "";
  const homeDown = await suggestForPerson({
    room: "household",
    person: person({ outcomes: playOutcome("next-up") }),
    facts: "Desk facts",
    complete: async (prompt) => {
      fallbackPrompt = prompt;
      return null;
    },
  });
  assert.equal(homeDown.ok, true);
  if (!homeDown.ok) return;
  assert.equal(homeDown.source, "fallback");
  assert.match(fallbackPrompt, /LessonSpine progress: Finished LessonSpine/);
  assert.match(fallbackPrompt, /How they are doing: Ready/);
  assert.equal(homeDown.draft.outcomes, "Finished LessonSpine");

  const salesBrain = brain("sales", [
    person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Do not show" }),
    person({
      membershipId: "rep-1",
      name: "Lee",
      kind: "adult",
      login: "member",
      profile: "On the desk",
      outcomes: playOutcome("sting"),
    }),
  ]);
  const board = brainBoard({ room: "sales", brain: salesBrain });
  assert.equal(board.people.length, 1);
  assert.equal(board.people[0].membershipId, "rep-1");
  assert.equal(board.people.some((row) => row.kind === "child"), false);
  const salesPrompt = suggestionPrompt({
    room: "sales",
    person: board.people[0],
    facts: "Desk facts",
    context: { nextStep: board.people[0].outcomes },
  });
  assert.match(salesPrompt, /There are no children/);
  assert.match(salesPrompt, /LessonSpine progress: Continue LessonSpine at Slate/);
  assert.match(salesPrompt, /How they are doing: Getting there/);
  const hidden = await suggestForPerson({
    room: "sales",
    person: salesBrain.people[0],
    facts: "Desk facts",
    complete: async () => JSON.stringify({ profile: "no", outcomes: "no" }),
  });
  assert.equal(hidden.ok, false);
  if (hidden.ok) return;
  assert.equal(hidden.error, "sales_has_no_children");

  assert.equal(pickSuggestionKey("byok", "org-key", "platform-key"), "org-key");
  assert.equal(pickSuggestionKey("byok", "  ", "platform-key"), null);
  assert.equal(pickSuggestionKey("platform", null, "platform-key"), "platform-key");
});

test("Insights shows the LessonSpine suggestion context", () => {
  const charts = read("src/app/insights/charts.tsx");
  assert.match(charts, /data-suggestion-context="living-brain"/);
  assert.match(charts, /Suggestion uses \{spine\}/);
  assert.match(charts, /assistDraft/);
  assert.match(charts, /person\.confidence \?/);
  assert.doesNotMatch(charts, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
