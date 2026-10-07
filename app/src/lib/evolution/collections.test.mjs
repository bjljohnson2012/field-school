import assert from "node:assert/strict";
import test from "node:test";

const { COLLECTIONS, traitsFromDrop } = await import("./collections.ts");

test("a drop relates a family, a profile, a milestone, and media", () => {
  assert.deepEqual(
    COLLECTIONS.map((row) => row.slug),
    ["families", "profiles", "milestones", "media"],
  );
  const traits = traitsFromDrop({
    text: "Wait for the answer before you pitch. Then ask one question.",
    filename: "call-notes.pdf",
    kind: "file",
    orgName: "Family",
  });
  assert.deepEqual(
    traits.map((trait) => trait.collection),
    ["families", "profiles", "milestones", "media"],
  );
  assert.equal(traits[1].relatesTo, "families");
  assert.equal(traits[2].relatesTo, "profiles");
  assert.equal(traits[3].value, "call-notes.pdf");
});

test("a short note does not invent a profile or a milestone", () => {
  const traits = traitsFromDrop({ text: "short", orgName: "Family" });
  assert.deepEqual(
    traits.map((trait) => trait.collection),
    ["families"],
  );
});
