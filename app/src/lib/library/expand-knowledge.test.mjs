import assert from "node:assert/strict";
import test from "node:test";
import { SCOPE_QUESTION, expandFromModel } from "./expand-knowledge.ts";
import { looksLikeCode, publishLabel, readableTitle, sourceLabel } from "./knowledge-labels.ts";

const SOURCE = "Wait for the answer before you pitch. The next line belongs to them.";

test("a thin document and a missing model ask for the scope and write nothing new", () => {
  assert.deepEqual(expandFromModel(null, SOURCE), {
    expansion: "needs more information",
    questions: [SCOPE_QUESTION],
  });
  assert.equal(expandFromModel('{"expansion":"A whole new market.","questions":[]}', "notes.pdf").expansion, "needs more information");
});

test("a real document keeps the reading and still asks for the scope", () => {
  const reading = expandFromModel(
    JSON.stringify({
      expansion: "The next line belongs to them, so you wait.",
      questions: ["Who speaks next?"],
    }),
    SOURCE,
  );
  assert.equal(reading.expansion, "The next line belongs to them, so you wait.");
  assert.equal(reading.questions[0], SCOPE_QUESTION);
  assert.equal(reading.questions[1], "Who speaks next?");
});

test("labels stay in words", () => {
  assert.equal(publishLabel("published"), "Published");
  assert.equal(publishLabel("draft"), "Unpublished");
  assert.equal(sourceLabel("upload"), "File");
  assert.equal(sourceLabel("text"), "Note");
  assert.equal(sourceLabel("mystery"), null);
  assert.equal(looksLikeCode("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(looksLikeCode("call-notes.pdf"), true);
  assert.equal(
    readableTitle("call-notes.pdf", "Wait for the answer before you pitch."),
    "Wait for the answer before you pitch",
  );
  assert.equal(readableTitle("Wait for the answer", ""), "Wait for the answer");
});
