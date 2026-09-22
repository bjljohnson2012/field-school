import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DEST_SHA256,
  JUST_CAP_ID,
  draftLessonFromPointer,
  renameDraftUnit,
} from "./draft-units.ts";

const dir = dirname(fileURLToPath(import.meta.url));
const take = "k7m2p9qa4bc1def";

function keysOf(value) {
  return Object.keys(value).sort();
}

function assertSpec(spec) {
  assert.deepEqual(keysOf(spec), ["id", "mode", "org", "outcome", "title", "units"]);
  assert.equal(spec.mode, "video");
  assert.ok(spec.units.length >= 1);
  const sourceIds = new Set();
  for (const unit of spec.units) {
    assert.deepEqual(keysOf(unit), ["id", "source_unit_id", "title"]);
    assert.ok(unit.source_unit_id.trim());
    assert.ok(unit.id.trim());
    assert.ok(unit.title.trim());
    sourceIds.add(unit.source_unit_id);
  }
  assert.equal(sourceIds.size, spec.units.length);
}

test("cap take id drafts one unit in the lesson spec shape", () => {
  const result = draftLessonFromPointer({
    org: "sales",
    pointer: take,
    outcome: "Name the next step on a live call.",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assertSpec(result.spec);
  assert.equal(result.pointer.kind, "cap");
  assert.equal(result.spec.org, "sales");
  assert.equal(result.spec.mode, "video");
  assert.equal(result.spec.units.length, 1);
  assert.equal(result.spec.units[0]?.source_unit_id, `src-${result.spec.id}-u1`);
  assert.match(result.spec.title, /Cap take/);
});

test("cap.fieldschool.ai link yields the take id", () => {
  const result = draftLessonFromPointer({
    org: "sales",
    pointer: `https://cap.fieldschool.ai/s/${take}`,
    outcome: "Ask for the next meeting.",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.pointer, { kind: "cap", takeId: take });
  assertSpec(result.spec);
});

test("mp4 file name and mp4 url draft units without opening the file", () => {
  const fromName = draftLessonFromPointer({
    org: "sales",
    pointer: "discovery-call.mp4",
    outcome: "Run the first five minutes.",
  });
  const fromUrl = draftLessonFromPointer({
    org: "sales",
    pointer: "https://files.example.com/calls/discovery-call.mp4",
    title: "Discovery",
    outcome: "Run the first five minutes.",
  });
  assert.equal(fromName.ok, true);
  assert.equal(fromUrl.ok, true);
  if (!fromName.ok || !fromUrl.ok) return;
  assert.deepEqual(fromName.pointer, { kind: "mp4", name: "discovery-call.mp4" });
  assert.equal(fromName.spec.title, "Discovery Call");
  assert.equal(fromUrl.pointer.kind, "mp4");
  if (fromUrl.pointer.kind === "mp4") assert.equal(fromUrl.pointer.name, "discovery-call.mp4");
  assert.equal(fromUrl.spec.title, "Discovery");
  assert.equal(fromUrl.spec.units[0]?.title, "Discovery");
  assertSpec(fromName.spec);
  assertSpec(fromUrl.spec);
});

test("chapter lines become draft units and timestamps are labels only", () => {
  const result = draftLessonFromPointer({
    org: "sales",
    pointer: take,
    outcome: "Leave with one next step.",
    chapters: "00:00 Open\n01:12 The next step\n12:40 Close\n",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(
    result.spec.units.map((unit) => unit.title),
    ["Open", "The next step", "Close"],
  );
  assertSpec(result.spec);
});

test("rename keeps source_unit_id", () => {
  const result = draftLessonFromPointer({
    org: "sales",
    pointer: take,
    outcome: "Leave with one next step.",
    chapters: "Open\nClose",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const renamed = renameDraftUnit(result.spec, 0, "  Opening move  ");
  assert.equal(renamed.units[0]?.title, "Opening move");
  assert.equal(renamed.units[0]?.source_unit_id, result.spec.units[0]?.source_unit_id);
  assert.equal(renamed.units[1]?.title, "Close");
  assert.equal(renameDraftUnit(result.spec, 0, "   ").units[0]?.title, "Open");
});

test("Just and the dest hash are refused and not returned as a spec", () => {
  const just = draftLessonFromPointer({
    org: "sales",
    pointer: JUST_CAP_ID,
    outcome: "Should not draft.",
  });
  const justUrl = draftLessonFromPointer({
    org: "sales",
    pointer: `https://cap.fieldschool.ai/${JUST_CAP_ID}`,
    outcome: "Should not draft.",
  });
  const dest = draftLessonFromPointer({
    org: "sales",
    pointer: `${DEST_SHA256}.mp4`,
    outcome: "Should not draft.",
  });
  const master = draftLessonFromPointer({
    org: "sales",
    pointer: "https://cap.fieldschool.ai/hls/j013r823wx9ecaf/vox/everything-made-up.mp4",
    outcome: "Should not draft.",
  });
  assert.deepEqual(just, { ok: false, error: "just_locked" });
  assert.deepEqual(justUrl, { ok: false, error: "just_locked" });
  assert.deepEqual(dest, { ok: false, error: "dest_locked" });
  assert.deepEqual(master, { ok: false, error: "dest_locked" });
});

test("household, empty outcome, and unknown pointers are refused", () => {
  const household = draftLessonFromPointer({ org: "household", pointer: take, outcome: "A path." });
  const empty = draftLessonFromPointer({ org: "sales", pointer: take, outcome: "   " });
  const unknown = draftLessonFromPointer({ org: "sales", pointer: "notes.txt", outcome: "A path." });
  const missing = draftLessonFromPointer({ org: "sales", pointer: "   ", outcome: "A path." });
  assert.equal(household.ok, false);
  assert.equal(empty.ok, false);
  assert.equal(unknown.ok, false);
  assert.equal(missing.ok, false);
  if (household.ok || empty.ok || unknown.ok || missing.ok) return;
  assert.equal(household.error, "household_org");
  assert.equal(empty.error, "outcome_required");
  assert.equal(unknown.error, "pointer_unrecognized");
  assert.equal(missing.error, "pointer_required");
});

test("a path keeps only the mp4 base name", () => {
  const result = draftLessonFromPointer({
    org: "sales",
    pointer: "folder/sub/discovery-call.mp4",
    outcome: "Run the first five minutes.",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.pointer, { kind: "mp4", name: "discovery-call.mp4" });
});

test("video folder does not render video or ship a shared lesson spec module", () => {
  const files = walk(dir).filter((name) => !name.includes(".test."));
  const blob = files.map((name) => readFileSync(name, "utf8")).join("\n");
  assert.equal(blob.includes("<video"), false);
  assert.equal(/@remotion|from ["']remotion/.test(blob), false);
  assert.equal(blob.includes("createObjectURL"), false);
  assert.equal(blob.includes("\u2014"), false);
  assert.throws(() => readFileSync(join(dir, "../../../lib/lesson-spec.ts"), "utf8"));
});

function walk(root) {
  const found = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) found.push(...walk(path));
    else found.push(path);
  }
  return found;
}
