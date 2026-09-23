import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard } from "../src/lib/living-brain/model.ts";
import { lessonSpineContinue, playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

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

test("play continue lands on the living-brain next LessonSpine step", () => {
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({})],
  };
  const wrote = playWriteBody({ room: "household", brain: home, chapterId: "sting" });
  assert.equal(wrote?.login, "none");
  assert.equal(wrote?.outcomes, "Continue LessonSpine at Slate");
  const next = lessonSpineContinue(wrote.outcomes);
  assert.equal(next?.chapterId, "slate");
  assert.equal(next?.startSec, 10);
  assert.equal(next?.step, "Continue LessonSpine at Slate");
  assert.equal(lessonSpineContinue("Finished LessonSpine")?.chapterId, "next-up");
  assert.equal(lessonSpineContinue("Finished LessonSpine")?.startSec, 34);
  assert.equal(lessonSpineContinue("Old page"), null);
  assert.equal(lessonSpineContinue(playOutcome("recap"))?.label, "Next up");

  const sales = {
    orgId: "org-1",
    room: "sales",
    facts: "",
    outcome: "",
    people: [
      person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Do not show" }),
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        profile: "On the desk.",
        outcomes: playOutcome("next-up"),
      }),
    ],
  };
  const board = brainBoard({ room: "sales", brain: sales });
  assert.equal(board.people.length, 1);
  assert.equal(board.people[0].login, "member");
  assert.equal(lessonSpineContinue(board.people[0].outcomes)?.step, "Finished LessonSpine");
  assert.equal(board.people.some((row) => row.kind === "child"), false);
});

test("both rails label continue and guests still do not write", () => {
  const html5 = read("src/components/lesson-spine-player.tsx");
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const hook = read("src/components/lesson-spine-play-write.tsx");
  const page = read("src/app/play/lesson-spine/page.tsx");
  assert.match(html5, /data-continue-from="outcomes"/);
  assert.match(html5, /recordPlay\(active\.id\)/);
  assert.match(html5, /<video/);
  assert.doesNotMatch(html5, /@remotion|from "remotion"/);
  assert.match(preview, /data-continue-from="outcomes"/);
  assert.match(preview, /seekTo/);
  assert.match(preview, /recordPlay\("sting"\)/);
  assert.match(preview, /data-composition="LessonSpine"/);
  assert.match(preview, /data-login="none"/);
  assert.match(preview, /data-sales-children="0"/);
  assert.match(preview, /#EFE7D6/);
  assert.match(preview, /#C4A35A/);
  assert.match(hook, /status !== "authenticated" \|\| !email/);
  assert.match(hook, /useLessonSpineContinue/);
  assert.match(page, /Guests/);
  assert.match(page, /do not write/);
  assert.match(page, /LessonSpinePlayer/);
  assert.match(page, /LessonSpineRemotionPreview/);
  assert.doesNotMatch(html5 + preview + hook + page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
