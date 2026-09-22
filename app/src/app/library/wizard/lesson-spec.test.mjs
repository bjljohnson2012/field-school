import assert from "node:assert/strict";
import test from "node:test";

const {
  lessonMode,
  substanceError,
  draftUnits,
  peopleOnDesk,
  buildLessonSpec,
  formatLessonSpec,
} = await import("./lesson-spec.ts");

let seq = 0;
function nextId() {
  seq += 1;
  return `id-${seq}`;
}

test("mode is teach, assign, or video", () => {
  assert.equal(lessonMode("teach", false), "teach");
  assert.equal(lessonMode("assign", false), "assign");
  assert.equal(lessonMode("both", false), "teach");
  assert.equal(lessonMode("teach", true), "video");
  assert.equal(lessonMode("assign", true), "video");
  assert.equal(lessonMode("both", true), "video");
});

test("text splits on blank lines and every unit has source_unit_id", () => {
  seq = 0;
  const units = draftUnits({
    kind: "text",
    title: "Opening",
    detail: "First block\n\nSecond block",
    nextId,
  });
  assert.equal(units.length, 2);
  assert.deepEqual(
    units.map((unit) => unit.title),
    ["First block", "Second block"],
  );
  for (const unit of units) {
    assert.ok(unit.source_unit_id);
    assert.notEqual(unit.source_unit_id, unit.id);
  }
});

test("file, link, and idea stay one unit", () => {
  seq = 0;
  const file = draftUnits({
    kind: "file",
    title: "Call notes",
    detail: "call-notes.pdf",
    nextId,
  });
  assert.equal(file.length, 1);
  assert.equal(file[0].title, "call-notes.pdf");
  const link = draftUnits({
    kind: "link",
    title: "Call notes",
    detail: "https://example.com/notes",
    nextId,
  });
  assert.equal(link[0].title, "Call notes");
  const idea = draftUnits({
    kind: "idea",
    title: "Call notes",
    detail: "How we open a first conversation",
    nextId,
  });
  assert.equal(idea[0].title, "Call notes");
});

test("link must be http or https", () => {
  assert.equal(substanceError("link", "Notes", "notes"), "Use an http or https link. This step does not pull the page.");
  assert.equal(substanceError("link", "Notes", "https://example.com/notes"), null);
  assert.equal(substanceError("file", "", "a.pdf"), "Name the lesson.");
});

test("household desk is tracked children only", () => {
  const desk = peopleOnDesk("household", [
    { membershipId: "c1", name: "Ada", kind: "child", org: "household", login: "member" },
    { membershipId: "p1", name: "Parent", kind: "adult", org: "household", login: "member" },
    { membershipId: "s1", name: "Rep", kind: "adult", org: "sales", login: "member" },
  ]);
  assert.equal(desk.room, "household");
  assert.deepEqual(
    desk.people.map((person) => [person.name, person.label, person.login]),
    [["Ada", "Tracked child", "none"]],
  );
});

test("sales desk is login learners only", () => {
  const desk = peopleOnDesk("sales", [
    { membershipId: "s1", name: "Rep", kind: "adult", org: "sales", login: "member" },
    { membershipId: "c1", name: "Ada", kind: "child", org: "sales", login: "none" },
    { membershipId: "h1", name: "Ada", kind: "child", org: "household", login: "none" },
  ]);
  assert.equal(desk.room, "team");
  assert.deepEqual(
    desk.people.map((person) => [person.name, person.label]),
    [["Rep", "Login learner"]],
  );
});

test("a mixed org does not share one desk", () => {
  const desk = peopleOnDesk("other", [
    { membershipId: "c1", name: "Ada", kind: "child", org: "other", login: "none" },
    { membershipId: "s1", name: "Rep", kind: "adult", org: "other", login: "member" },
  ]);
  assert.equal(desk.room, "held");
  assert.deepEqual(desk.people, []);
});

test("spec stays hidden until every unit is approved", () => {
  const units = [
    { id: "u1", title: "Open", source_unit_id: "src-1" },
  ];
  const base = {
    id: "lesson-1",
    org: "sales",
    title: "Opening",
    outcome: "Open a first conversation",
    delivery: "both",
    videoCut: false,
    units,
  };
  assert.equal(buildLessonSpec({ ...base, approvedUnitIds: [] }), null);
  assert.equal(
    buildLessonSpec({
      ...base,
      units: [{ id: "u1", title: "Open", source_unit_id: "  " }],
      approvedUnitIds: ["u1"],
    }),
    null,
  );
  const spec = buildLessonSpec({ ...base, approvedUnitIds: ["u1"] });
  assert.deepEqual(spec, {
    id: "lesson-1",
    org: "sales",
    title: "Opening",
    outcome: "Open a first conversation",
    units: [{ id: "u1", title: "Open", source_unit_id: "src-1" }],
    mode: "teach",
  });
  const parsed = JSON.parse(formatLessonSpec(spec));
  assert.deepEqual(Object.keys(parsed), ["id", "org", "title", "outcome", "units", "mode"]);
  assert.deepEqual(Object.keys(parsed.units[0]), ["id", "title", "source_unit_id"]);
});

test("a video cut sets mode to video", () => {
  const spec = buildLessonSpec({
    id: "lesson-2",
    org: "household",
    title: "Reading hour",
    outcome: "Read the next page aloud",
    delivery: "assign",
    videoCut: true,
    units: [{ id: "u1", title: "Page", source_unit_id: "src-9" }],
    approvedUnitIds: ["u1"],
  });
  assert.equal(spec.mode, "video");
  assert.equal(spec.org, "household");
});
