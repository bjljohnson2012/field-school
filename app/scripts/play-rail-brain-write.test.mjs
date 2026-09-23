import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function person(overrides) {
  return {
    membershipId: "person-1",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "Who they are now",
    outcomes: "Old step",
    ownsOutcomes: false,
    history: [],
    confidence: "",
    ...overrides,
  };
}

function brain(room, people) {
  return {
    orgId: "org-1",
    room,
    facts: "",
    outcome: "Aim",
    people,
  };
}

test("play names the next LessonSpine step", () => {
  assert.equal(playOutcome("sting"), "Continue LessonSpine at Slate");
  assert.equal(playOutcome("slate"), "Continue LessonSpine at Objective");
  assert.equal(playOutcome("objective"), "Continue LessonSpine at Recap");
  assert.equal(playOutcome("recap"), "Continue LessonSpine at Next up");
  assert.equal(playOutcome("next-up"), "Finished LessonSpine");
  assert.equal(playOutcome("nextUp"), "Finished LessonSpine");
  assert.equal(playOutcome("missing"), null);
});

test("play write uses the person already on the desk", () => {
  const home = playWriteBody({
    room: "household",
    brain: brain("household", [person({})]),
    chapterId: "sting",
  });
  assert.deepEqual(home, {
    membershipId: "person-1",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "Who they are now",
    outcomes: "Continue LessonSpine at Slate",
  });

  const sales = playWriteBody({
    room: "sales",
    brain: brain("sales", [
      person({ membershipId: "kid", name: "No", kind: "child", login: "none" }),
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        profile: "On the desk",
      }),
    ]),
    chapterId: "sting",
  });
  assert.equal(sales?.membershipId, "rep-1");
  assert.equal(sales?.kind, "adult");
  assert.equal(sales?.login, "member");
  assert.equal(sales?.outcomes, "Continue LessonSpine at Slate");
});

test("play write skips a guest desk, the wrong room, and an empty desk", () => {
  assert.equal(playWriteBody({ room: "household", brain: null, chapterId: "sting" }), null);
  assert.equal(
    playWriteBody({
      room: "sales",
      brain: brain("household", [person({})]),
      chapterId: "sting",
    }),
    null,
  );
  assert.equal(
    playWriteBody({
      room: "sales",
      brain: brain("sales", [person({ kind: "child", login: "none" })]),
      chapterId: "sting",
    }),
    null,
  );
  assert.equal(
    playWriteBody({
      room: "household",
      brain: brain("household", []),
      chapterId: "sting",
    }),
    null,
  );
});

test("both play rails call the living-brain write once", () => {
  const page = read("src/app/play/lesson-spine/page.tsx");
  const html5 = read("src/components/lesson-spine-player.tsx");
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const hook = read("src/components/lesson-spine-play-write.tsx");
  assert.match(page, /LessonSpinePlayer/);
  assert.match(page, /LessonSpineRemotionPreview/);
  assert.match(html5, /onPlay=\{\(\) => \{/);
  assert.match(html5, /recordPlay\(active\.id\)/);
  assert.match(html5, /data-play-write=\{wrote \? "living-brain" : undefined\}/);
  assert.doesNotMatch(html5, /@remotion|from "remotion"/);
  assert.match(preview, /addEventListener\("play"/);
  assert.match(preview, /recordPlay\("sting"\)/);
  assert.match(preview, /data-play-write=\{wrote \? "living-brain" : undefined\}/);
  assert.match(hook, /fs-lesson-spine-play-write/);
  assert.match(hook, /\/api\/living-brain/);
  assert.match(hook, /status !== "authenticated" \|\| !email/);
  assert.match(hook, /method: "POST"/);
  assert.doesNotMatch(page + html5 + preview + hook, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
